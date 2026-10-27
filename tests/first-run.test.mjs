import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(root,'bin','pincms.mjs');

function projectFixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pincms-install-test-'));
 fs.mkdirSync(path.join(dir,'prisma'),{recursive:true});
 fs.mkdirSync(path.join(dir,'node_modules','.bin'),{recursive:true});
 fs.mkdirSync(path.join(dir,'fakebin'),{recursive:true});
 fs.copyFileSync(path.join(root,'.env.example'),path.join(dir,'.env.example'));
 fs.writeFileSync(path.join(dir,'prisma','schema.prisma'),'datasource db { provider = "sqlite"; url = env("DATABASE_URL") }\n');
 fs.writeFileSync(path.join(dir,'node_modules','.bin','prisma'), 'local prisma fixture\n');
 const capture=path.join(dir,'capture.txt');
 // Fake npx proves the correct DB URL and Prisma arguments reach the child process.
 const mock=path.join(dir,'fakebin','npx');
 fs.writeFileSync(mock,'#!/bin/sh\nprintf "%s\\n" "$DATABASE_URL" "$@" >> "$CAPTURE"\n');
 fs.chmodSync(mock,0o755);
 const env={...process.env,PATH:dir+'/fakebin:'+process.env.PATH,CAPTURE:capture};
 delete env.DATABASE_URL;
 const run=(argv)=>spawnSync(process.execPath,[cli,...argv],{cwd:dir,env,encoding:'utf8'});
 return {dir,run,capture};
}

test('setup automatically creates local SQLite schema using the .env.local URL', {skip:process.platform==='win32'},t=>{
 const f=projectFixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 const first=f.run(['setup']);
 assert.equal(first.status,0,first.stderr);
 assert.match(first.stdout,/Local database is ready/);
 const captured=fs.readFileSync(f.capture,'utf8').trim().split('\n');
 assert.deepEqual(captured,['file:./dev.db','--no-install','prisma','db','push']);
 const configured=fs.readFileSync(path.join(f.dir,'.env.local'),'utf8');
 assert.match(configured,/PINCMS_SETUP_TOKEN="[a-f0-9]{64}"/);
 assert.match(configured,/NEXTAUTH_SECRET="[a-f0-9]{64}"/);
 const token1=configured.match(/PINCMS_SETUP_TOKEN="([^"]+)"/)[1];
 const secret=configured.match(/NEXTAUTH_SECRET="([^"]+)"/)[1];
 const rotated=f.run(['setup','--rotate-token']);
 assert.equal(rotated.status,0,rotated.stderr);
 const after=fs.readFileSync(path.join(f.dir,'.env.local'),'utf8');
 assert.notEqual(after.match(/PINCMS_SETUP_TOKEN="([^"]+)"/)[1],token1);
 assert.equal(after.match(/NEXTAUTH_SECRET="([^"]+)"/)[1],secret);
 const manual=f.run(['db','push']);
 assert.equal(manual.status,0,manual.stderr);
 assert.match(fs.readFileSync(f.capture,'utf8'),/file:\.\/dev\.db/);
});

test('setup does not automatically modify non-local databases', {skip:process.platform==='win32'},t=>{
 const f=projectFixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(f.dir,'.env.local'),'DATABASE_URL="postgresql://example.invalid/db"\n');
 const result=f.run(['setup']);
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/Run npm run db:push against your configured database/);
 assert.equal(fs.existsSync(f.capture),false);
});
