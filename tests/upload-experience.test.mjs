import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capacityProblem } from '../src/lib/studio/upload-capacity.ts';
import { createUploadManager, emptyProgress } from '../src/lib/studio/upload-manager.ts';
import { refreshGallery, mergePhotos } from '../src/lib/studio/live-gallery.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const file = (bytes = 10, name = 'a.jpg') => new File([new Uint8Array(bytes)], name);
const target = { tripId: 'event', tripName: 'Event' };
const photo = (id, extra = {}) => ({ id: String(id).padStart(5, '0'), uri: 'original', aspectRatio: 1, uploadedBy: 'host', ...extra });

test('capacity handles exact fit, unlimited, bytes/count independently and unsupported files', () => {
  const files = [file(10), file(20), file(100, 'a.mov')];
  assert.equal(capacityProblem({ policy: 'hard', remainingBytes: 30, remainingPhotos: 2 }, files), undefined);
  assert.match(capacityProblem({ policy: 'hard', remainingBytes: 30, remainingPhotos: 1 }, files), /room for 1 more/);
  assert.match(capacityProblem({ policy: 'hard', remainingBytes: 29, remainingPhotos: 2 }, files), /MB available/);
  assert.equal(capacityProblem({ policy: 'hard', remainingBytes: null, remainingPhotos: null }, files), undefined);
  assert.equal(capacityProblem({ policy: 'grace', remainingBytes: 0, remainingPhotos: 0 }, files), undefined);
  assert.equal(capacityProblem({ policy: 'hard', remainingBytes: 0, remainingPhotos: 0 }, [file(100, 'a.mov')]), undefined);
});

test('6000-file preflight blocks before runner and can be rechecked after capacity increases', async () => {
  let capacity = 1000, checks = 0, runs = 0;
  const manager = createUploadManager(async (_, files) => {
    runs++;
    return { progress: { ...emptyProgress(), total: files.length, done: files.length }, retry: [] };
  }, async (_, files) => {
    checks++;
    return capacityProblem({ policy: 'hard', remainingPhotos: capacity, remainingBytes: null }, files);
  });
  const id = manager.enqueue(target, Array.from({ length: 6000 }, () => file()));
  assert.equal(manager.getSnapshot().jobs[0].checkingCapacity, true);
  await tick();
  assert.equal(runs, 0);
  assert.match(manager.getSnapshot().jobs[0].capacityIssue, /6,000 selected photos/);
  assert.equal(manager.getSnapshot().jobs[0].retryCount, 6000);
  capacity = 6000;
  manager.retry(id);
  await tick();
  assert.equal(checks, 2);
  assert.equal(runs, 1);
  assert.equal(manager.getSnapshot().jobs[0].progress.done, 6000);
});

test('preflight failure fails closed, permits removal, and does not strand other queued jobs', async () => {
  let runs = 0;
  const manager = createUploadManager(async (_, files) => {
    runs++;
    return { progress: { ...emptyProgress(), done: files.length }, retry: [] };
  }, async (id) => { if (id === 'event') throw new Error('Offline'); });
  const id = manager.enqueue(target, [file()]);
  manager.enqueue({ tripId: 'other', tripName: 'Other' }, [file()]);
  await tick();
  assert.equal(runs, 1);
  assert.match(manager.getSnapshot().jobs[0].capacityIssue, /Offline/);
  manager.removeBlocked(id);
  assert.equal(manager.getSnapshot().jobs.length, 1);
});

test('logout during capacity check aborts and ignores late approval', async () => {
  let resolve, signal, runs = 0;
  const manager = createUploadManager(async () => { runs++; }, (_, __, s) => {
    signal = s;
    return new Promise(r => { resolve = r; });
  });
  manager.enqueue(target, [file()]);
  manager.reset();
  resolve();
  await tick();
  assert.equal(signal.aborted, true);
  assert.equal(runs, 0);
  assert.equal(manager.getSnapshot().jobs.length, 0);
});

test('gallery revisions are throttled during upload and always published on completion', async () => {
  let now = 0, handlers, resolve;
  const manager = createUploadManager((_, __, h) => {
    handlers = h;
    return new Promise(r => { resolve = r; });
  }, undefined, () => now);
  manager.enqueue(target, [file(), file()]);
  now = 1000;
  handlers.onProgress({ ...emptyProgress(), done: 1 });
  assert.equal(manager.getSnapshot().revisions.event, undefined);
  now = 5000;
  handlers.onProgress({ ...emptyProgress(), done: 1 });
  assert.equal(manager.getSnapshot().revisions.event, 1);
  now = 10000;
  handlers.onProgress({ ...emptyProgress(), done: 1 });
  assert.equal(manager.getSnapshot().revisions.event, 1);
  resolve({ progress: { ...emptyProgress(), done: 2 }, retry: [] });
  await tick();
  assert.equal(manager.getSnapshot().revisions.event, 2);
});

test('live refresh catches a multi-page burst while preserving all loaded older photos', async () => {
  const existing = Array.from({ length: 96 }, (_, i) => photo(96 - i));
  const server = Array.from({ length: 210 }, (_, i) => photo(210 - i));
  const cursors = [];
  const result = await refreshGallery(existing, async ({ cursor, ids }) => {
    if (ids) return { photos: server.filter(p => ids.includes(p.id)), total: 210, nextCursor: null };
    cursors.push(cursor);
    const start = cursor ? server.findIndex(p => p.id === cursor) + 1 : 0;
    const photos = server.slice(start, start + 48);
    return { photos, total: 210, nextCursor: start + 48 < 210 ? photos.at(-1).id : null };
  });
  assert.equal(cursors.length, 3);
  assert.equal(result.arrivals.length, 114);
  assert.equal(result.existing.length, 96);
  const merged = mergePhotos(result.arrivals, result.existing);
  assert.equal(merged.length, 210);
  assert.deepEqual(merged.map(p => p.id), server.map(p => p.id));
});

test('thumbnail refresh is bounded, rotates pending IDs, and removes no-longer-visible photos', async () => {
  const existing = Array.from({ length: 100 }, (_, i) => photo(100 - i, { thumbStatus: 'pending' }));
  let checked;
  const result = await refreshGallery(existing, async ({ ids }) => {
    if (!ids) return { photos: existing.slice(0, 48), total: 99, nextCursor: existing[47].id };
    checked = ids;
    return { photos: ids.slice(1).map(id => ({ ...existing.find(p => p.id === id), thumbUri: 'preview', thumbStatus: 'ready' })), total: 99, nextCursor: null };
  }, 60);
  assert.equal(checked.length, 60);
  assert.equal(checked[0], existing[60].id);
  assert.equal(result.existing.length, 99);
  assert.equal(result.existing.filter(p => p.thumbUri).length, 59);
  assert.equal(result.arrivals.length, 0);
});

test('invalid capacity responses fail closed and unsupported image MIME types are skipped', () => {
  for (const invalid of [{}, null, {policy:'hard',remainingPhotos:-1,remainingBytes:null}, {policy:'hard',remainingPhotos:1}]) {
    assert.throws(() => capacityProblem(invalid, [file()]), /invalid capacity response/);
  }
  const raw = new File(['raw'], 'a.tiff', { type: 'image/tiff' });
  assert.equal(capacityProblem({ policy: 'hard', remainingBytes: 0, remainingPhotos: 0 }, [raw]), undefined);
});

test('an empty gallery acquires a cursor when more than one page arrives', async () => {
  const arrivals = Array.from({length:48}, (_, i) => photo(100-i));
  const result = await refreshGallery([], async () => ({ photos: arrivals, total:100, nextCursor:arrivals.at(-1).id }));
  assert.equal(result.replaceCursor, true);
  assert.equal(result.nextCursor, arrivals.at(-1).id);
});

test('manual refresh reconciles deletions and expired URLs across every loaded page', async () => {
  const existing = Array.from({length:150}, (_, i) => photo(150-i, {thumbUri:'expired'}));
  const visible = existing.filter(p => !['00100','00001'].includes(p.id)).map(p => ({...p, thumbUri:'renewed'}));
  const sizes = [];
  const result = await refreshGallery(existing, async ({ids}) => {
    if (ids) sizes.push(ids.length);
    return {photos: ids ? visible.filter(p => ids.includes(p.id)) : visible.slice(0,48), total:148, nextCursor:ids ? null : visible[47].id};
  }, 72, true);
  assert.deepEqual(sizes, [60,60,30]);
  assert.equal(result.existing.length, 148);
  assert.ok(result.existing.every(p => p.thumbUri === 'renewed'));
  assert.equal(result.replaceCursor, false);
});

test('queued jobs recheck capacity after earlier uploads consume the remaining slots', async () => {
  let remaining = 3;
  let runs = 0;
  const manager = createUploadManager(async (_, files) => {
    runs++;
    remaining -= files.length;
    return { progress: {...emptyProgress(),done:files.length}, retry:[] };
  }, async (_, files) => capacityProblem({policy:'hard',remainingPhotos:remaining,remainingBytes:null},files));
  manager.enqueue(target,[file(),file()]);
  manager.enqueue(target,[file(),file()]);
  await tick();
  assert.equal(runs,1);
  assert.match(manager.getSnapshot().jobs[1].capacityIssue,/room for 1 more/);
});
