import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import {createUploadManager,emptyProgress,uploadSummary} from '../src/lib/studio/upload-manager.ts';

const directory = await mkdtemp(join(tmpdir(), 'tripsync-controls-test-'));
await writeFile(join(directory,'package.json'),'{"type":"module"}');
for(const name of ['upload','upload-capacity','api','auth','config']){
 const source=await readFile(new URL(`../src/lib/studio/${name}.ts`,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from "\.\/([\w-]+)"/g,'from "./$1.js"');
 await writeFile(join(directory,`${name}.js`),compiled);
}
const {runUpload,uploadDeadline}=await import(pathToFileURL(join(directory,'upload.js')));
const {setTokens}=await import(pathToFileURL(join(directory,'auth.js')));
const original={fetch:globalThis.fetch,window:globalThis.window,bitmap:globalThis.createImageBitmap,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
after(async()=>{globalThis.fetch=original.fetch;globalThis.window=original.window;globalThis.createImageBitmap=original.bitmap;if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);await rm(directory,{recursive:true,force:true});});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<300;i++){if(predicate())return;await tick();}assert.fail('condition did not settle');}
const files=n=>Array.from({length:n},(_,i)=>new File([`image-${i}`],`${i}.jpg`,{type:'image/jpeg'}));
const target={tripId:'event',tripName:'Event',folderId:'folder'};
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
let calls,hold,held;
beforeEach(()=>{
 const values=new Map();globalThis.window=new EventTarget();window.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
 globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 setTokens({accessToken:'qa.eyJzdWIiOiJ0ZXN0In0.qa'});
 calls=[];held=[];hold=undefined;
 globalThis.fetch=async(url,options)=>{
  const stage=options.method==='PUT'?'put':url.endsWith('/photos/init')?'init':url.endsWith('/photos/complete')?'complete':'batch';
  const body=typeof options.body==='string'?JSON.parse(options.body):{};
  calls.push({stage,body,signal:options.signal});
  const result=stage==='batch'?{batch:{id:'batch'}}:stage==='init'?{uploadUrl:'https://storage.test/'+body.fileName,objectKey:body.fileName}:stage==='complete'?{photo:{id:body.objectKey}}:{};
  if(stage===hold)return new Promise((resolve,reject)=>{
    const abort=()=>reject(options.signal.reason);
    options.signal.addEventListener('abort',abort,{once:true});
    held.push(()=>{options.signal.removeEventListener('abort',abort);resolve(response(result));});
  });
  return response(result);
 };
});

test('pause drains active files, survives subscriber unmount, and resume sends only remaining files',async()=>{
 hold='put';const manager=createUploadManager(runUpload);const id=manager.enqueue(target,files(12));
 await until(()=>held.length===5);manager.pause(id);
 assert.equal(manager.getSnapshot().jobs[0].status,'pausing');
 manager.subscribe(()=>{})();
 hold=undefined;held.forEach(release=>release());
 await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 assert.equal(manager.getSnapshot().jobs[0].progress.done,5);
 assert.equal(manager.getSnapshot().jobs[0].retryCount,7);
 assert.equal(calls.filter(c=>c.stage==='init').length,5);
 manager.resume(id);manager.resume(id);
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 assert.equal(calls.filter(c=>c.stage==='init').length,12);
 assert.equal(manager.getSnapshot().jobs[0].progress.done,12);
 assert.equal(uploadSummary(manager.getSnapshot().jobs[0]).remaining,0);
});

test('cancel aborts active transfers, never retries, retains confirmed successes and accounts for skipped files',async()=>{
 let manager,id;
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
   if(url.endsWith('/photos/complete'))hold='put';
   return originalFetch(url,options);
 };
 manager=createUploadManager((trip,selected,handlers)=>runUpload(trip,selected,{...handlers,concurrency:1}));
 id=manager.enqueue(target,[...files(8),new File(['video'],'a.mov')]);
 await until(()=>held.length===1);manager.cancel(id);
 await new Promise(resolve=>setTimeout(resolve,600));
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 const job=manager.getSnapshot().jobs[0];
 assert.equal(job.cancelled,true);
 assert.deepEqual(uploadSummary(job),{uploaded:1,duplicates:0,failed:0,skipped:1,cancelled:7,unconfirmed:0,remaining:0});
 assert.ok(calls.filter(c=>c.stage==='put').at(-1).signal.aborted);
 const count=calls.length;manager.retry(id);manager.resume(id);await tick();assert.equal(calls.length,count);
});

test('cancel during server commit reports unconfirmed saves separately from cancelled files',async()=>{
 hold='complete';const manager=createUploadManager(runUpload);const id=manager.enqueue(target,files(8));
 await until(()=>held.length===5);manager.cancel(id);
 await new Promise(resolve=>setTimeout(resolve,600));
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 const job=manager.getSnapshot().jobs[0];
 assert.equal(job.progress.unconfirmed,5);assert.equal(job.progress.cancelled,3);
 assert.equal(job.unconfirmedNames.length,5);assert.equal(uploadSummary(job).remaining,0);
 held.forEach(release=>release());await tick();assert.equal(manager.getSnapshot().jobs[0].progress.done,0);
});

test('offline pause and cancel settle without waiting for an online event',async()=>{
 navigator.onLine=false;const manager=createUploadManager(runUpload);const id=manager.enqueue(target,files(3));
 await until(()=>manager.getSnapshot().jobs[0].progress.paused);manager.pause(id);
 await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 assert.equal(calls.length,0);manager.resume(id);
 await until(()=>manager.getSnapshot().jobs[0].progress.paused);manager.cancel(id);
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 assert.equal(manager.getSnapshot().jobs[0].progress.cancelled,3);
});

test('queued jobs can pause/cancel independently and a paused run releases the active slot',async()=>{
 hold='put';const manager=createUploadManager(runUpload);const first=manager.enqueue(target,files(7));
 const second=manager.enqueue({...target,tripId:'other'},files(2));const third=manager.enqueue(target,files(1));
 manager.pause(second);manager.cancel(third);await until(()=>held.length===5);manager.pause(first);
 hold=undefined;held.forEach(release=>release());await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 assert.equal(manager.getSnapshot().jobs[1].status,'paused');manager.resume(second);
 await until(()=>manager.getSnapshot().jobs[1].status==='finished');
 assert.equal(manager.getSnapshot().jobs[2].progress.cancelled,1);
 manager.cancel(first);
 assert.equal(manager.getSnapshot().jobs[0].progress.cancelled,2);
});

test('pause/cancel during capacity check ignore late approval and never start transfers',async()=>{
 let release;const manager=createUploadManager(runUpload,()=>new Promise(resolve=>{release=resolve;}));
 const id=manager.enqueue(target,files(3));manager.pause(id);await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 release();await tick();assert.equal(calls.length,0);
 manager.resume(id);manager.cancel(id);await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 release();await tick();assert.equal(calls.length,0);assert.equal(manager.getSnapshot().jobs[0].progress.cancelled,3);
});

test('stall watchdog ignores paused/offline jobs and clears after real progress',()=>{
 let now=0,handlers;const manager=createUploadManager((_,__,h)=>{handlers=h;return new Promise(()=>{});},undefined,()=>now);
 const id=manager.enqueue(target,files(3));now=61000;manager.checkStalls();assert.equal(manager.getSnapshot().jobs[0].stalled,true);
 handlers.onProgress({...emptyProgress(),total:3,done:1});assert.equal(manager.getSnapshot().jobs[0].stalled,false);
 handlers.onProgress({...emptyProgress(),total:3,done:1,paused:true});now+=61000;manager.checkStalls();assert.equal(manager.getSnapshot().jobs[0].stalled,false);
 manager.cancel(id);manager.checkStalls();assert.equal(manager.getSnapshot().jobs[0].stalled,false);manager.reset();
});

test('request deadline aborts hung operations and ignores late success',async()=>{
 let signal,release;
 await assert.rejects(uploadDeadline(s=>{signal=s;return new Promise(resolve=>{release=resolve;});},undefined,10),/timed out/);
 assert.equal(signal.aborted,true);release('late success');await tick();
});

test('cancelling a paused job preserves uncertain saves from an earlier attempt',async()=>{
 const selected=files(4);
 const manager=createUploadManager(async()=>({progress:{...emptyProgress(),total:4,done:1,unconfirmed:1},retry:selected.slice(1),paused:true,unconfirmedFiles:[selected[1]]}));
 const id=manager.enqueue(target,selected);
 await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 manager.cancel(id);
 const job=manager.getSnapshot().jobs[0];
 assert.deepEqual(uploadSummary(job),{uploaded:1,duplicates:0,failed:0,skipped:0,cancelled:2,unconfirmed:1,remaining:0});
 assert.deepEqual(job.unconfirmedNames,[selected[1].name]);
 assert.equal(job.retryCount,0);
});

test('resume reconciles uncertain saves as duplicates without counting them twice',async()=>{
 const selected=files(3);let attempt=0;
 const manager=createUploadManager(async(_,remaining,handlers)=>{
  if(++attempt===1)return {progress:{...emptyProgress(),total:3,done:1,unconfirmed:1},retry:selected.slice(1),paused:true,unconfirmedFiles:[selected[1]]};
  assert.deepEqual(remaining,selected.slice(1));assert.deepEqual(handlers.unconfirmedFiles,[selected[1]]);
  return {progress:{...emptyProgress(),total:2,done:1,duplicate:1},retry:[]};
 });
 const id=manager.enqueue(target,selected);await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 manager.resume(id);await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 assert.deepEqual(uploadSummary(manager.getSnapshot().jobs[0]),{uploaded:2,duplicates:1,failed:0,skipped:0,cancelled:0,unconfirmed:0,remaining:0});
});

test('lost save responses never automatically start a fresh upload of uncertain files',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  const result=await originalFetch(url,options);
  if(url.endsWith('/photos/complete'))return response({error:{message:'Response lost after save'}},503);
  return result;
 };
 const manager=createUploadManager(runUpload);
 manager.enqueue(target,files(1));
 await new Promise(resolve=>setTimeout(resolve,3300));
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 const job=manager.getSnapshot().jobs[0];
 assert.equal(calls.filter(call=>call.stage==='init').length,1);
 assert.equal(calls.filter(call=>call.stage==='put').length,1);
 assert.equal(job.progress.unconfirmed,1);
 assert.equal(job.progress.retryableFailed,0);
 assert.equal(job.retryCount,1);
 assert.deepEqual(job.unconfirmedNames,['0.jpg']);
});

test('unexpected runner failure shows uncertainty and cancelling does not erase it',async()=>{
 const manager=createUploadManager(async(_,selected,handlers)=>{
  handlers.onProgress({...emptyProgress(),total:selected.length,done:1});
  throw new Error('Unexpected runner failure');
 });
 const id=manager.enqueue(target,files(3));
 await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 assert.deepEqual(uploadSummary(manager.getSnapshot().jobs[0]),{uploaded:0,duplicates:0,failed:0,skipped:0,cancelled:0,unconfirmed:3,remaining:0});
 manager.cancel(id);
 const job=manager.getSnapshot().jobs[0];
 assert.equal(job.progress.unconfirmed,3);assert.equal(job.progress.cancelled,0);
 assert.deepEqual(job.unconfirmedNames,['0.jpg','1.jpg','2.jpg']);
});

test('a large original can finish a slow transfer beyond the normal request deadline',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const [file]=files(1);
 Object.defineProperty(file,'size',{value:50*1024*1024});
 hold='put';const manager=createUploadManager(runUpload);manager.enqueue(target,[file]);
 await until(()=>held.length===1);
 t.mock.timers.tick(300_000);await tick();
 assert.equal(calls.find(call=>call.stage==='put').signal.aborted,false);
 hold=undefined;held[0]();await until(()=>manager.getSnapshot().jobs[0].status==='finished');
 assert.equal(manager.getSnapshot().jobs[0].progress.done,1);
 assert.equal(calls.filter(call=>call.stage==='put').length,1);
});

test('6000-file runner resumes across a batch boundary without re-uploading completed files',async()=>{
 let manager,id,batches=0;
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  if(url.endsWith('/upload-batches')&&++batches===2)manager.pause(id);
  return originalFetch(url,options);
 };
 manager=createUploadManager(runUpload);id=manager.enqueue(target,files(6000));
 await until(()=>manager.getSnapshot().jobs[0].status==='paused');
 assert.equal(manager.getSnapshot().jobs[0].progress.done,100);
 assert.equal(manager.getSnapshot().jobs[0].retryCount,5900);
 manager.resume(id);
 // Hashing is asynchronous; yield until all sixty batches have drained.
 for(let i=0;i<10000&&manager.getSnapshot().jobs[0].status!=='finished';i++)await tick();
 const job=manager.getSnapshot().jobs[0];
 assert.equal(job.status,'finished');assert.equal(job.progress.done,6000);
 assert.equal(calls.filter(call=>call.stage==='init').length,6000);
 assert.ok(calls.filter(call=>call.stage==='batch').every(call=>call.body.totalCount<=100&&call.body.folderId===target.folderId));
 assert.equal(uploadSummary(job).remaining,0);
});
