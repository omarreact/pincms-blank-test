import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const types=["starRating","progressBar","alert","iconList","socialIcons","contactButtons","tabs","countdown","imageCarousel"];
test("nine new widgets are registered, rendered and have editing controls",()=>{
 const blocks=read("src/lib/blocks.ts"),renderer=read("src/components/blocks/BlockRenderer.tsx");
 const inspect=read("src/components/editor/BlockInspector.tsx");
 for(const type of types){
  assert.ok(blocks.includes(type+":"),type+": missing registration");
  assert.ok(renderer.includes('case "'+type+'"'),type+": missing renderer");
  assert.ok(inspect.includes(type+":"),type+": missing inspector");
 }
});
test("widgets have responsive, interactive, accessible and safe link behavior",()=>{
 const renderer=read("src/components/blocks/BlockRenderer.tsx");
 const interactive=read("src/components/blocks/InteractiveWidgets.tsx");
 assert.match(renderer,/aria-valuenow=\{value\}/);
 assert.match(interactive,/role="tablist"/);
 assert.match(interactive,/useId/);
 assert.match(interactive,/role="timer"/);
 assert.match(interactive,/safeHref\(item\.url\)/);
 assert.match(interactive,/safeImage\(i\.src\)/);
 assert.match(renderer,/d\.floating===true\|\|d\.floating==="true"/);
});
test("standalone PinCMS starter contains the same widgets",()=>{
 const paths=["src/lib/blocks.ts","src/components/blocks/BlockRenderer.tsx","src/components/blocks/InteractiveWidgets.tsx","src/components/editor/BlockInspector.tsx"];
 for(const path of paths)assert.equal(read(path),read("packages/create-pincms/template/"+path),path);
});
