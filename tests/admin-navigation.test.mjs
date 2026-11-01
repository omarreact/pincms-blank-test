import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const projectRoot=fileURLToPath(new URL("../",import.meta.url));
const script=`
  import {adminNavigationFor,canCreateContent} from "./src/lib/admin-navigation.ts";
  const roles=["CONTRIBUTOR","AUTHOR","EDITOR","ADMIN","SUPER_ADMIN"];
  console.log(JSON.stringify(Object.fromEntries(roles.map(role=>[role,{
    items:adminNavigationFor(role),canCreate:canCreateContent(role)
  }]))));
`;
const out=execFileSync(process.execPath,["--import","tsx","--input-type=module","-e",script],{
  cwd:projectRoot,encoding:"utf8",timeout:15000
});
const state=JSON.parse(out.trim());
const hrefs=(role)=>state[role].items.map(item=>item.href);

test("admin navigation never displays privileged routes to content-only users",()=>{
  for(const role of ["AUTHOR","CONTRIBUTOR"]){
    assert.equal(hrefs(role).includes("/admin/users"),false);
    assert.equal(hrefs(role).includes("/admin/settings"),false);
    assert.equal(hrefs(role).includes("/admin/themes"),false);
    assert.equal(hrefs(role).includes("/admin/forms"),false);
  }
});
test("editors can manage submissions but cannot administer users",()=>{
  assert.ok(hrefs("EDITOR").includes("/admin/forms"));
  assert.ok(!hrefs("EDITOR").includes("/admin/users"));
});
test("administrators see complete current CMS navigation",()=>{
  for(const route of ["/admin","/admin/pages","/admin/posts","/admin/forms","/admin/media","/admin/themes","/admin/migration","/admin/users","/admin/settings","/admin/system"]){
    assert.ok(hrefs("ADMIN").includes(route),route);
    assert.ok(hrefs("SUPER_ADMIN").includes(route),route);
  }
});
test("creation shortcuts are restricted to author-level roles",()=>{
  assert.equal(state.CONTRIBUTOR.canCreate,false);
  for(const role of ["AUTHOR","EDITOR","ADMIN","SUPER_ADMIN"])assert.equal(state[role].canCreate,true);
});
test("menu contains unique routes and no dead shortcuts",()=>{
  for(const role of Object.keys(state)){
    const items=state[role].items;
    assert.equal(new Set(items.map(item=>item.href)).size,items.length);
    for(const item of items){
      assert.ok(item.href.startsWith("/admin"));
      assert.ok(["Workspace","Content","Appearance","Tools"].includes(item.section));
      assert.equal("access" in item,false);
    }
  }
});
