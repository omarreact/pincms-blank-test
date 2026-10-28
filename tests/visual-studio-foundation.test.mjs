import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(import.meta.dirname,"..");
const file=path=>readFileSync(resolve(root,path),"utf8");
test("visual editor implementation is present in the independent standalone app",()=>{
 for(const path of ["src/components/editor/BlockInspector.tsx","src/components/editor/PageEditor.tsx","src/lib/block-style.ts","src/lib/content.ts","src/lib/validators.ts","src/lib/blocks.ts"]){
  assert.ok(file(path).length>100,path+" is missing");
 }
 for(const term of ["selectedId={selected||undefined}","onSelect={setSelected}","<BlockInspector","Duplicate block","Update published"]){
  assert.ok(file("src/components/editor/PageEditor.tsx").includes(term),term);
 }
});
test("pages and posts update stable IDs instead of recreating all blocks",()=>{
 const content=file("src/lib/content.ts");
 const post=file("src/app/api/posts/[id]/route.ts");
 assert.match(content,/upsert:next\.map/);
 assert.match(content,/notIn:next\.map/);
 assert.ok(content.includes("old?.publishedAt??new Date()"));
 assert.ok(post.includes("blocks:updatedBlocks(d.blocks)"));
 assert.doesNotMatch(content,/deleteMany:\{\},create:normalizedBlocks/);
 assert.doesNotMatch(post,/deleteMany:\{\},create:normalizedBlocks/);
 assert.match(file("src/lib/validators.ts"),/Duplicate block ID/);
});
test("style engine filters values, renders CSS variables and new widget types",()=>{
 const style=file("src/lib/block-style.ts");
 const renderer=file("src/components/blocks/BlockRenderer.tsx");
 assert.match(style,/validatedStyle/);
 assert.match(style,/palette\.test/);
 assert.match(style,/cssLength\.test/);
 assert.match(renderer,/frameStyleVariables\(d\.styles\)/);
 assert.ok(file("src/app/globals.css").includes("container-type:inline-size"));
 for(const type of ["dualHeading","iconBox"]){
  assert.ok(file("src/lib/blocks.ts").includes(type));
  assert.ok(renderer.includes('case "'+type+'"'));
 }
 assert.ok(renderer.includes("plainText(d.content)"));
});
