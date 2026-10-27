/** Pure browser-safe helpers for rendering untrusted CMS block values. */
export function safeHref(value:unknown,fallback="#"):string {
 if(typeof value!=="string")return fallback;
 const trimmed=value.trim();
 if(trimmed.startsWith("/")&&!trimmed.startsWith("//"))return trimmed;
 if(trimmed.startsWith("#"))return trimmed;
 try{const url=new URL(trimmed);return ["https:","http:","mailto:","tel:"].includes(url.protocol)?trimmed:fallback;}catch{return fallback;}
}
export function safeImage(value:unknown):string {
 const url=safeHref(value,"");
 return (url.startsWith("/")||url.startsWith("https://")||url.startsWith("http://"))&&!/[<>"'()\\]/.test(url)?url:"";
}
export function plainText(value:unknown):string {
 return String(value??"").replace(/<\s*br\s*\/?\s*>/gi,"\n").replace(/<\/(p|div|h[1-6]|li)>/gi,"\n").replace(/<[^>]*>/g,"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
}
