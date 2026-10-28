import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
const root=resolve(import.meta.dirname,"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
test("form schema validates IDs, data, email and dropdown choices",()=>{
 const code=[
  'import {formDefinitionSchema,validateFormValues,starterForm} from "./src/lib/forms.ts";',
  'import assert from "node:assert/strict";',
  'assert.equal(formDefinitionSchema.safeParse(starterForm).success,true);',
  'const valid=validateFormValues(starterForm.fields,{name:"Alice",email:"alice@example.com",message:"Hello",role:"forged"});',
  'assert.equal(valid.error,undefined);assert.equal(valid.values.role,undefined);',
  'assert.equal(validateFormValues(starterForm.fields,{name:"Alice",email:"bad",message:"Hi"}).error?.includes("valid email"),true);',
  'assert.equal(validateFormValues(starterForm.fields,{name:"",email:"alice@example.com",message:"Hello"}).error?.includes("required"),true);',
  'assert.equal(validateFormValues([{id:"choice",label:"Choice",type:"select",options:["yes"],required:true,placeholder:""}],{choice:"no"}).error?.includes("selection"),true);',
  'const copied=structuredClone(starterForm);copied.fields.push({...copied.fields[0]});',
  'assert.equal(formDefinitionSchema.safeParse(copied).success,false);'
 ].join("");
 const check=spawnSync(process.execPath,["--import","tsx","--input-type=module","-e",code],{cwd:root,encoding:"utf8"});
 assert.equal(check.status,0,check.stderr||check.stdout);
});
test("admin-only forms, submission inbox and public protection are wired",()=>{
 for(const path of [
  "src/app/api/forms/route.ts",
  "src/app/api/forms/[id]/route.ts",
  "src/app/api/forms/[id]/submissions/route.ts"
 ])assert.match(read(path),/hasRole\("EDITOR"\)/,path);
 const publicRoute=read("src/app/api/forms/public/[slug]/route.ts");
 for(const snippet of ["validateFormValues","x-forwarded-for","createHmac","origin!==req.nextUrl.origin","formSubmission.create","recent>=5","payload.website"]){
  assert.ok(publicRoute.includes(snippet),snippet);
 }
});
test("standalone installation includes complete forms implementation",()=>{
 const paths=[
  "src/lib/forms.ts","src/lib/blocks.ts","src/lib/theme.ts",
  "src/components/forms/FormWidget.tsx","src/components/forms/FormStudio.tsx",
  "src/components/blocks/BlockRenderer.tsx","src/components/editor/BlockInspector.tsx",
  "src/app/admin/(console)/forms/page.tsx",
  "src/app/api/forms/route.ts","src/app/api/forms/[id]/route.ts",
  "src/app/api/forms/[id]/submissions/route.ts","src/app/api/forms/public/[slug]/route.ts"
 ];
 for(const path of paths)assert.ok(read(path).length>40,"Missing standalone implementation: "+path);
 assert.match(read("src/app/admin/(console)/layout.tsx"),/href:"\/admin\/forms"/);
 assert.match(read("src/components/blocks/BlockRenderer.tsx"),/case "form"/);
 assert.match(read("src/components/editor/BlockInspector.tsx"),/form:\[\{key:"slug"/);
 assert.match(read("src/components/forms/FormWidget.tsx"),/formElement\.reset\(\)/);
});
