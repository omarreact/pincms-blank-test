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
 for(const term of ["<BuilderCanvas","onSelect={setSelected}","<BlockInspector","moveNode(","Update"]){
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
 assert.match(file("src/lib/validators.ts"),/Duplicate widget ID/);
 assert.match(file("src/lib/validators.ts"),/Nested layout exceeds 12 levels/);
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

test("Studio nested layout renderer, registry, media picker, and builder controls are wired",()=>{
 const tree=file("src/lib/builder-tree.ts");
 const editor=file("src/components/editor/PageEditor.tsx");
 const canvas=file("src/components/editor/BuilderCanvas.tsx");
 const renderer=file("src/components/blocks/BlockRenderer.tsx");
 const labels=file("src/lib/extra-widgets.ts");
 for(const fn of ["findNode","insertNode","removeNode","moveNode","cloneNode"])assert.match(tree,new RegExp("function "+fn));
 for(const type of ["container","row","column","grid"])assert.ok(labels.includes(type+":"));
 for(const term of ["onDropNode","onDuplicate","onDelete","onMove"])assert.ok(canvas.includes(term));
 assert.match(editor,/countNodes\(doc\.blocks\)/);
 assert.match(renderer,/childrenOf\(b\)/);
 assert.ok(file("src/components/editor/MediaPicker.tsx").includes("/api/media"));
 assert.ok(file("src/components/blocks/ExtraWidgetRenderer.tsx").includes("integrationWidgets"));
 assert.ok(file("src/app/api/public/content/route.ts").includes('status:"PUBLISHED"'));
});
