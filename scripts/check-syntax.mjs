import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
let files=0;const errors=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,ent.name);if(ent.isDirectory())walk(f);else if(/\.(tsx?|mts)$/.test(f)&&!f.endsWith('.d.ts')){files++;const res=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}});for(const d of res.diagnostics??[]){if(d.category===ts.DiagnosticCategory.Error)errors.push(`${f}: TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)}}}}
walk('src');walk('prisma');console.log(`Checked ${files} TypeScript files; ${errors.length} syntax errors.`);for(const e of errors)console.error(e);if(errors.length)process.exitCode=1;
