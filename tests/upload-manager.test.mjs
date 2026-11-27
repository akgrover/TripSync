import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createUploadManager, emptyProgress } from '../src/lib/studio/upload-manager.ts';

const target = { tripId: 'trip-a', tripName: 'Wedding', folderId: 'folder-a', folderName: 'Ceremony' };
const files = (count) => Array.from({ length: count }, (_, i) => new File([`photo-${i}`], `${i}.jpg`, { type: 'image/jpeg' }));
const tick = () => new Promise(resolve => setImmediate(resolve));
const progress = (total, fields = {}) => ({ ...emptyProgress(), total, ...fields });
function harness() {
  const calls = [];
  const manager = createUploadManager((tripId, selected, handlers) => new Promise((resolve, reject) => {
    calls.push({ tripId, files: selected, handlers, resolve, reject });
  }));
  return { manager, calls };
}
function finish(call, fields = {}, retry = []) {
  call.resolve({ progress: progress(call.files.length, { done: call.files.length - retry.length, retryableFailed: retry.length, ...fields }), retry });
}

test('6000-file upload survives route subscribers unmounting and keeps its destination', async () => {
  const { manager, calls } = harness();
  const selected = files(6000);
  const destination = { ...target };
  let notifications = 0;
  const unsubscribe = manager.subscribe(() => notifications++);
  const id = manager.enqueue(destination, selected);
  destination.folderId = 'another-folder';
  selected.pop();
  unsubscribe(); // The group route unmounts; no route owns the active upload.
  calls[0].handlers.onProgress(progress(6000, { done: 762, retryableFailed: 3 }));
  const mountedAgain = manager.getSnapshot().jobs[0];
  assert.equal(mountedAgain.id, id);
  assert.equal(mountedAgain.totalFiles, 6000);
  assert.equal(mountedAgain.progress.done, 762);
  assert.equal(mountedAgain.folderId, 'folder-a');
  assert.equal(calls[0].files.length, 6000);
  assert.equal(calls[0].handlers.folderId, 'folder-a');
  const failed = calls[0].files.slice(-3);
  finish(calls[0], {}, failed);
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].retryCount, 3);
  assert.ok(notifications > 0);
  manager.retry(id);
  assert.deepEqual(calls[1].files, failed);
  assert.equal(calls[1].tripId, 'trip-a');
  assert.equal(calls[1].handlers.folderId, 'folder-a');
  finish(calls[1]);
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].progress.done, 6000);
});

test('one active runner across groups and double retry cannot start duplicate work', async () => {
  const { manager, calls } = harness();
  const first = manager.enqueue(target, files(3));
  manager.enqueue({ tripId: 'trip-b', tripName: 'Reception' }, files(2));
  assert.equal(calls.length, 1);
  manager.dismiss(first);
  assert.equal(manager.getSnapshot().jobs.length, 2);
  const retry = calls[0].files.slice(-1);
  finish(calls[0], {}, retry);
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].tripId, 'trip-b');
  manager.retry(first);
  manager.retry(first);
  assert.equal(calls.length, 2);
  finish(calls[1]);
  await tick();
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2].files, retry);
  finish(calls[2]);
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].progress.done, 3);
});

test('retry preserves successes, duplicates, skipped and terminal counts across attempts', async () => {
  const { manager, calls } = harness();
  const id = manager.enqueue(target, files(8));
  const retry = calls[0].files.slice(-3);
  finish(calls[0], { total: 7, done: 2, duplicate: 1, terminalFailed: 1, skipped: 1 }, retry);
  await tick();
  manager.dismiss(id); // Failed files cannot silently lose their recovery controls.
  assert.equal(manager.getSnapshot().jobs.length, 1);
  manager.retry(id);
  calls[1].handlers.onProgress(progress(3, { done: 1 }));
  assert.equal(manager.getSnapshot().jobs[0].progress.done, 3);
  finish(calls[1], { done: 1, duplicate: 1 }, [retry[2]]);
  await tick();
  manager.retry(id);
  finish(calls[2]);
  await tick();
  const job = manager.getSnapshot().jobs[0];
  assert.equal(job.totalFiles, 8);
  assert.equal(job.progress.total, 7);
  assert.equal(job.progress.done, 4);
  assert.equal(job.progress.duplicate, 2);
  assert.equal(job.progress.terminalFailed, 1);
  assert.equal(job.progress.skipped, 1);
  assert.equal(job.retryCount, 0);
  assert.equal(manager.getSnapshot().revisions['trip-a'], 3);
  manager.dismiss(id);
  assert.equal(manager.getSnapshot().jobs.length, 0);
  assert.equal(manager.getSnapshot().revisions['trip-a'], 3);
});

test('quota halt and its remaining files stay recoverable across navigation', async () => {
  const { manager, calls } = harness();
  const id = manager.enqueue(target, files(6));
  const remaining = calls[0].files.slice(2);
  const halted = { code: 'PHOTO_LIMIT_REACHED', message: 'Photo limit reached.' };
  finish(calls[0], { done: 2, halted }, remaining);
  await tick();
  assert.deepEqual(manager.getSnapshot().jobs[0].progress.halted, halted);
  manager.subscribe(() => {})();
  assert.equal(manager.getSnapshot().jobs[0].retryCount, 4);
  manager.retry(id);
  assert.equal(manager.getSnapshot().jobs[0].progress.halted, undefined);
  finish(calls[1]);
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].progress.done, 6);
});

test('session reset aborts the runner, clears files/queue and ignores late results', async () => {
  const { manager, calls } = harness();
  const id = manager.enqueue(target, files(2));
  manager.enqueue(target, files(1));
  manager.reset();
  assert.equal(calls[0].handlers.signal.aborted, true);
  assert.deepEqual(manager.getSnapshot(), { jobs: [], revisions: {} });
  manager.retry(id);
  manager.enqueue({ tripId: 'other-account-trip', tripName: 'New account' }, files(1));
  calls[0].handlers.onProgress(progress(2, { done: 2 }));
  finish(calls[0]);
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(manager.getSnapshot().jobs.length, 1);
  assert.equal(manager.getSnapshot().jobs[0].tripId, 'other-account-trip');
  finish(calls[1]);
  await tick();
  assert.deepEqual(manager.getSnapshot().revisions, { 'other-account-trip': 1 });
});

test('unexpected runner rejection remains retryable and does not strand the queue', async () => {
  const { manager, calls } = harness();
  const id = manager.enqueue(target, files(2));
  manager.enqueue({ tripId: 'trip-b', tripName: 'Other' }, files(1));
  calls[0].handlers.onProgress(progress(2, { done: 1 }));
  calls[0].reject(new Error('Unexpected interruption'));
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].retryCount, 2);
  assert.equal(manager.getSnapshot().jobs[0].progress.errors[0].reason, 'Unexpected interruption');
  finish(calls[1]);
  await tick();
  manager.retry(id);
  // The first photo already reached the server before the unexpected rejection.
  finish(calls[2], { done: 1, duplicate: 1 });
  await tick();
  const p = manager.getSnapshot().jobs[0].progress;
  assert.equal(p.done + p.duplicate, 2);
});

test('offline and automatic-retry states stay visible and snapshots are stable', async () => {
  const { manager, calls } = harness();
  const initial = manager.getSnapshot();
  assert.equal(manager.getSnapshot(), initial);
  assert.equal(manager.getServerSnapshot(), initial);
  manager.enqueue(target, files(1));
  calls[0].handlers.onProgress(progress(1, { paused: true }));
  assert.equal(manager.getSnapshot().jobs[0].progress.paused, true);
  calls[0].handlers.onProgress(progress(1, { paused: false, retrying: true }));
  assert.equal(manager.getSnapshot().jobs[0].progress.retrying, true);
  assert.equal(initial.jobs.length, 0);
  finish(calls[0]);
  await tick();
  assert.equal(manager.getSnapshot().jobs[0].status, 'finished');
});

test('empty selection is ignored and dismissed successes cannot be retried', async () => {
  const { manager, calls } = harness();
  assert.equal(manager.enqueue(target, []), undefined);
  assert.equal(calls.length, 0);
  const id = manager.enqueue(target, files(1));
  finish(calls[0]);
  await tick();
  manager.dismiss(id);
  manager.retry(id);
  assert.equal(calls.length, 1);
  assert.equal(manager.getSnapshot().jobs.length, 0);
});
