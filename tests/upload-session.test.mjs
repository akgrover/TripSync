import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile the real API/auth modules without the Next runtime; all network calls below are stubbed.
const directory = await mkdtemp(join(tmpdir(), 'tripsync-session-test-'));
await writeFile(join(directory,'package.json'), '{"type":"module"}');
for (const name of ['api','auth','config']) {
  const source = await readFile(new URL(`../src/lib/studio/${name}.ts`,import.meta.url),'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from "\.\/(\w+)"/g,'from "./$1.js"');
  await writeFile(join(directory,`${name}.js`),compiled);
}
const {studioApi} = await import(pathToFileURL(join(directory,'api.js')));
const {setTokens,clearTokens,getSessionAccountId} = await import(pathToFileURL(join(directory,'auth.js')));
const originalFetch=globalThis.fetch;
const originalWindow=globalThis.window;
after(async()=>{globalThis.fetch=originalFetch;globalThis.window=originalWindow;await rm(directory,{recursive:true,force:true});});
beforeEach(()=>{
  const values = new Map();
  globalThis.window = new EventTarget();
  window.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
});
const token=(sub,exp=0)=>`qa.${Buffer.from(JSON.stringify({sub,exp})).toString('base64url')}.qa`;
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('logout during token refresh cannot restore the old account or start its request',async()=>{
  let finish,requests=0;
  setTokens({accessToken:token('old'),refreshToken:'old-refresh'});
  globalThis.fetch=async()=>{requests++;return new Promise(resolve=>{finish=resolve;});};
  const request=studioApi.getUploadCapacity('event');
  const rejected=assert.rejects(request,{name:'AbortError'});
  await tick();clearTokens();
  finish(response({accessToken:token('old',9e9),refreshToken:'rotated'}));
  await rejected;
  assert.equal(getSessionAccountId(),null);
  assert.equal(requests,1);
});

test('a new account does not join an old refresh or get cleared by its late rejection',async()=>{
  let finishOld;
  setTokens({accessToken:token('old'),refreshToken:'old-refresh'});
  globalThis.fetch=async(url,options)=>{
    if(url.endsWith('/auth/refresh')) {
      const refresh=JSON.parse(options.body).refreshToken;
      if(refresh==='old-refresh') return new Promise(resolve=>{finishOld=resolve;});
      return response({accessToken:token('new',9e9),refreshToken:'new-rotated'});
    }
    return response({policy:'hard',remainingPhotos:99,remainingBytes:100});
  };
  const old=assert.rejects(studioApi.getUploadCapacity('old-event'),{name:'AbortError'});
  await tick();
  setTokens({accessToken:token('new'),refreshToken:'new-refresh'});
  assert.equal((await studioApi.getUploadCapacity('new-event')).remainingPhotos,99);
  finishOld(response({},401));await old;
  assert.equal(getSessionAccountId(),'new');
});

test('concurrent requests share one refresh and continue in the same account',async()=>{
  let refreshes=0;
  setTokens({accessToken:token('same'),refreshToken:'refresh'});
  globalThis.fetch=async(url)=>{
    if(url.endsWith('/auth/refresh')){refreshes++;await tick();return response({accessToken:token('same',9e9),refreshToken:'rotated'});}
    return response({policy:'hard',remainingPhotos:9,remainingBytes:null});
  };
  const results=await Promise.all([studioApi.getUploadCapacity('a'),studioApi.getUploadCapacity('b')]);
  assert.equal(refreshes,1);
  assert.equal(results.length,2);
  assert.equal(getSessionAccountId(),'same');
});

test('transient refresh outages keep the session and surface a retryable error',async()=>{
  setTokens({accessToken:token('same',9e9),refreshToken:'refresh'});
  let refreshes=0;
  globalThis.fetch=async(url)=>{
    if(url.endsWith('/auth/refresh')){refreshes++;return response({},503);}
    return response({},401);
  };
  await assert.rejects(studioApi.getUploadCapacity('event'),error=>error.status===503);
  assert.equal(refreshes,3);
  assert.equal(getSessionAccountId(),'same');
});

test('definitive refresh rejection clears the current session and cancels the request',async()=>{
  setTokens({accessToken:token('same'),refreshToken:'expired'});
  globalThis.fetch=async()=>response({},401);
  await assert.rejects(studioApi.getUploadCapacity('event'),{name:'AbortError'});
  assert.equal(getSessionAccountId(),null);
});
