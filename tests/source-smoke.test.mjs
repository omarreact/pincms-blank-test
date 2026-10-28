import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('original seed cannot create known insecure default login',()=>{
 const seed=read('prisma/seed.ts');assert.doesNotMatch(seed,/admin123|admin@example\.com/);assert.match(seed,/No demo users/);
});
test('installer requires setup token and does not allow second admin',()=>{
 const s=read('src/app/api/setup/route.ts');assert.match(s,/installationGuard/);const guard=read('src/lib/setup-guard.ts');assert.match(guard,/timingSafeEqual/);assert.match(guard,/PINCMS_SETUP_TOKEN/);assert.match(s,/tx\.user\.count\(\)/);
});
test('mutation endpoints always authorize roles',()=>{
 for(const route of ['src/app/api/pages/route.ts','src/app/api/pages/[id]/route.ts','src/app/api/posts/route.ts','src/app/api/posts/[id]/route.ts','src/app/api/media/route.ts','src/app/api/themes/route.ts','src/app/api/settings/route.ts','src/app/api/users/route.ts'])assert.match(read(route),/hasRole\(/,route);
});
test('themes have valid JSON files and required colors',()=>{
 for(const f of ['themes/standalone.json','themes/midnight.json']){const data=JSON.parse(read(f));assert.ok(data.name);assert.match(data.styles.colors.primary,/^#[0-9a-fA-F]{6}$/);}
});
test('all app pages contain source',()=>{
 const required=['src/app/page.tsx','src/app/[slug]/page.tsx','src/app/admin/setup/page.tsx','src/app/admin/login/page.tsx','src/app/admin/(console)/page.tsx','src/app/admin/(console)/pages/new/page.tsx','src/app/admin/(console)/pages/[id]/page.tsx'];for(const f of required)assert.ok(read(f).length>40);
});
test('CLI help works',()=>{
 const result=spawnSync(process.execPath,[path.join(root,'bin/pincms.mjs'),'help'],{encoding:'utf8'});assert.equal(result.status,0);assert.match(result.stdout,/init.*setup.*db/);
});
