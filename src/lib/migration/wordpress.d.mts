export interface WordPressEntry {
 sourceId:string;sourceType:'page'|'post';title:string;slug:string;originalPath:string;status:string;excerpt:string;blocks:Array<{type:string;data:Record<string,unknown>}>;seoTitle:string;seoDesc:string;categories:string[];tags:string[];
}
export interface MigrationInput {site:string;source:'rest'|'wxr';items:WordPressEntry[];warnings:string[]}
export const MAX_WXR_BYTES:number;
export const MAX_IMPORT_ITEMS:number;
export function toPlainText(html:unknown):string;
export function convertHtml(html:string):WordPressEntry['blocks'];
export function parseWxr(xml:string,site?:string):MigrationInput;
export function validateWordPressOrigin(origin:string):Promise<string>;
export function fetchWordPressRest(args:{url:string;user?:string;applicationPassword?:string;includePages?:boolean;includePosts?:boolean}):Promise<MigrationInput>;
