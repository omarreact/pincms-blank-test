/** Bounded, no-execution WordPress migration reader shared by admin and CLI. */
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

export const MAX_WXR_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ITEMS = 250;
const decode = (value) => String(value ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#(x[\da-f]+|\d+);/gi, (_, v) => {
  const code = v.toLowerCase().startsWith('x') ? parseInt(v.slice(1), 16) : parseInt(v, 10);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
}).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, v) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[v.toLowerCase()]));
function tag(xml, name) {
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<${safe}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safe}\\s*>`, 'i'));
  return match ? decode(match[1]).trim() : '';
}
const cleanSlug = (value) => decode(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 130);
export const toPlainText = (html) => decode(String(html ?? ''))
  .replace(/<\s*(script|style|iframe|object|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  .replace(/<\s*br\s*\/?\s*>/gi, '\n')
  .replace(/<\/(?:p|div|li|h[1-6]|blockquote)\s*>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .replace(/\n{3,}/g, '\n\n').trim();
function httpImage(value) { try {const u = new URL(value);return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.toString() : '';} catch{return '';} }
export function convertHtml(html) {
  const source=String(html || '').slice(0, 300_000);
  const content=source.replace(/<!--[\s\S]*?-->/g,'').replace(/<\s*(script|style|iframe|object|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  const blocks=[];
  const pattern=/<(h[1-6]|p|blockquote|ul|ol|figure|img)\b([^>]*)>([\s\S]*?)<\/\1\s*>|<img\b([^>]*?)\/?\s*>/gi;
  let cursor=0, found;
  const emit=(type,data)=>{if(blocks.length<120)blocks.push({type,data});};
  function between(raw){const text=toPlainText(raw);if(text)emit('text',{content:text});}
  while((found=pattern.exec(content)) && blocks.length<120) {
    between(content.slice(cursor,found.index));
    const kind=(found[1]||'img').toLowerCase();const fragment=kind==='img'?found[4]:found[2];const inner=kind==='img'?'':found[3];
    if(kind==='img'||kind==='figure') {
      const attrs=(kind==='figure'?inner.match(/<img\b([^>]*)>/i)?.[1]:fragment)||'';
      const match=attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const src=httpImage(decode(match?.[1]||match?.[2]||''));
      if(src)emit('image',{src,alt:toPlainText((attrs.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i)||[])[1]||''),caption:''});
      else between(inner);
    }else if(kind.startsWith('h')){const text=toPlainText(inner);if(text)emit('heading',{text});}
    else between(inner);
    cursor=pattern.lastIndex;
  }
  between(content.slice(cursor));
  if(!blocks.length && toPlainText(content))emit('text',{content:toPlainText(content)});
  return blocks;
}
function postMeta(item) {
 const data={};for(const part of item.match(/<wp:postmeta(?:\s[^>]*)?>[\s\S]*?<\/wp:postmeta\s*>/gi)||[]) {
   const key=tag(part,'wp:meta_key'); if(key && ['_yoast_wpseo_title','_yoast_wpseo_metadesc','rank_math_title','rank_math_description','rank_math_focus_keyword'].includes(key))data[key]=tag(part,'wp:meta_value');
 }return data;
}
export function parseWxr(xml,site='') {
 if(typeof xml!=='string'||Buffer.byteLength(xml,'utf8')>MAX_WXR_BYTES)throw Error('WXR export must be 5 MB or less');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('DTD and XML entities are not accepted');
 if(!/<\s*(rss|\?xml)\b/i.test(xml) || !/<wp:wxr_version\b/i.test(xml))throw Error('Invalid WordPress WXR export');
 const items=xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item\s*>/gi)||[];
 if(items.length>MAX_IMPORT_ITEMS)throw Error(`Export contains ${items.length} entries. Split your export into groups of ${MAX_IMPORT_ITEMS} or fewer.`);
 const out=[],warnings=[];
 for(const item of items){const type=tag(item,'wp:post_type');if(!['post','page'].includes(type))continue;
  const id=tag(item,'wp:post_id');if(!/^\d+$/.test(id)){warnings.push('Skipped an entry without a valid WordPress post ID');continue;}
  const title=toPlainText(tag(item,'title'))||`WordPress ${type} ${id}`;
  const link=tag(item,'link');let originalPath='';try{originalPath=new URL(link).pathname;}catch{}
  const slug=cleanSlug(tag(item,'wp:post_name')||title)||`wp-${id}`;
  const metadata=postMeta(item);
  const categories=[],tags=[];for(const v of item.match(/<category\b[^>]*>[\s\S]*?<\/category>/gi)||[]) {
   const domain=v.match(/\bdomain\s*=\s*["']([^"']+)["']/i)?.[1];const value=toPlainText(v.replace(/^<category\b[^>]*>/i,'').replace(/<\/category>$/i,''));
   if(value && domain==='category')categories.push(value.slice(0,100));if(value && domain==='post_tag')tags.push(value.slice(0,100));
  }
  out.push({sourceType:type,sourceId:id,title:title.slice(0,200),slug,originalPath,
   status:tag(item,'wp:status'),excerpt:toPlainText(tag(item,'excerpt:encoded')).slice(0,2000),
   blocks:convertHtml(tag(item,'content:encoded')),seoTitle:(metadata._yoast_wpseo_title||metadata.rank_math_title||'').slice(0,200),
   seoDesc:(metadata._yoast_wpseo_metadesc||metadata.rank_math_description||'').slice(0,500),categories,tags});
 }
 return {site:site || tag(xml,'wp:base_site_url') || tag(xml,'wp:base_blog_url') || (()=>{try{return new URL(tag(items[0]||'','link')).origin}catch{return 'wordpress-wxr-export'}})(),items:out,warnings,source:'wxr'};
}
function privateAddress(ip) {
 if(isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a>=224||a===192&&b===0||a===198&&[18,19].includes(b);}
 const lower=ip.toLowerCase();return lower==='::1'||lower==='::'||lower.startsWith('fc')||lower.startsWith('fd')||lower.startsWith('fe8')||lower.startsWith('fe9')||lower.startsWith('fea')||lower.startsWith('feb')||lower.startsWith('ff')||lower.startsWith('::ffff:')||lower.startsWith('2001:db8:');
}
export async function validateWordPressOrigin(origin) {
 let url;try{url=new URL(origin);}catch{throw Error('Enter a valid HTTPS WordPress URL');}
 if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||url.search||url.hash)throw Error('WordPress REST migration requires a public HTTPS origin without query, credentials or custom ports');
 const host=url.hostname.toLowerCase();if(host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||isIP(host))throw Error('Private/internal hosts are not allowed');
 const ips=await lookup(host,{all:true,verbatim:true});if(!ips.length||ips.some(v=>privateAddress(v.address)))throw Error('WordPress hostname resolves to a private or unsafe address');
 return url.origin;
}
const requestJSON=async (url,auth)=>{
 const res=await fetch(url,{headers:{Accept:'application/json', ...(auth?{Authorization:`Basic ${Buffer.from(auth).toString('base64')}`}:{})},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error(`WordPress REST returned HTTP ${res.status} at ${new URL(url).pathname}`);
 const body=await res.text();if(body.length>2_000_000)throw Error('WordPress REST response exceeds 2 MB');return {data:JSON.parse(body),pages:Math.max(1,Number(res.headers.get('x-wp-totalpages'))||1)};
};
export async function fetchWordPressRest({url,user='',applicationPassword='',includePages=true,includePosts=true}) {
 const origin=await validateWordPressOrigin(url);
 const auth=user&&applicationPassword?`${user}:${applicationPassword}`:'';
 const result={site:origin,source:'rest',items:[],warnings:[]};
 const taxonomies={categories:new Map(),tags:new Map()};
 for(const t of ['categories','tags']){
  try{const {data}=await requestJSON(`${origin}/wp-json/wp/v2/${t}?per_page=100`,auth);for(const item of data){taxonomies[t].set(item.id,String(item.name||'').slice(0,100));}}
  catch{result.warnings.push(`Could not read WordPress ${t}; classification may require review`);}
 }
 for(const [type,enabled] of [['pages',includePages],['posts',includePosts]]) {if(!enabled)continue;
  let page=1,maxPages=1;
  do{const r=await requestJSON(`${origin}/wp-json/wp/v2/${type}?per_page=50&page=${page}&_fields=id,title,slug,status,excerpt,content,link,yoast_head_json,meta,categories,tags`,auth);
   if(!Array.isArray(r.data))throw Error('Unexpected WordPress REST response');maxPages=Math.min(r.pages,5);if(r.pages>5 && page===1)result.warnings.push(`Only the first five pages of WordPress ${type} were read; split larger imports.`);
   for(const entry of r.data){if(result.items.length>=MAX_IMPORT_ITEMS)throw Error(`Import limit is ${MAX_IMPORT_ITEMS} items per run`);
    const sourceType=type==='pages'?'page':'post';const title=toPlainText(entry.title?.rendered||'')||`WordPress ${sourceType} ${entry.id}`;
    const meta=entry.meta||{};let path='';try{path=new URL(entry.link).pathname}catch{}
    result.items.push({sourceId:String(entry.id),sourceType,title:title.slice(0,200),slug:cleanSlug(entry.slug||title)||`wp-${entry.id}`,
     originalPath:path,status:entry.status,excerpt:toPlainText(entry.excerpt?.rendered||'').slice(0,2000),blocks:convertHtml(entry.content?.rendered||''),
     seoTitle:String(entry.yoast_head_json?.title||meta.rank_math_title||'').slice(0,200),seoDesc:String(entry.yoast_head_json?.description||meta.rank_math_description||'').slice(0,500),
     categories:(entry.categories||[]).map(id=>taxonomies.categories.get(id)).filter(Boolean),tags:(entry.tags||[]).map(id=>taxonomies.tags.get(id)).filter(Boolean)});
   }
   page++;}while(page<=maxPages);
 }
 return result;
}
