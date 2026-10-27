import type {CSSProperties} from "react";

/** User-authored design values must never be copied directly into CSS. */
export const breakpoints = ["desktop", "tablet", "mobile"] as const;
export type Breakpoint = typeof breakpoints[number];
export const styleLabels = {
  color: "Text color", backgroundColor: "Background color", fontSize: "Font size",
  fontWeight: "Font weight", textAlign: "Text alignment", padding: "Padding",
  margin: "Margin", borderRadius: "Corner radius", borderColor: "Border color",
  borderWidth: "Border width", lineHeight: "Line height", maxWidth: "Maximum width"
} as const;
export type StyleField = keyof typeof styleLabels;
export type BlockStyles = Partial<Record<Breakpoint, Partial<Record<StyleField,string>>>>;

const colors = new Set<StyleField>(["color", "backgroundColor", "borderColor"]);
const dimensions = new Set<StyleField>(["fontSize", "borderRadius", "borderWidth", "maxWidth"]);
const boxes = new Set<StyleField>(["padding", "margin"]);
const alignments = new Set(["left", "center", "right", "justify"]);
const weights = new Set(["300","400","500","600","700","800","900","normal","bold"]);
const cssLength = /^(?:0|\d{1,4}(?:\.\d{1,2})?(?:px|rem|em|%|vh|vw))$/;
const palette = /^#[a-fA-F0-9]{6}$/;

/** Empty input removes an override; invalid CSS is rejected instead of rendered. */
export function validatedStyle(field:StyleField, value:unknown):string {
  if(typeof value !== "string") return "";
  const v=value.trim();
  if(!v) return "";
  if(colors.has(field))return palette.test(v)?v:"";
  if(dimensions.has(field))return cssLength.test(v)?v:"";
  if(boxes.has(field))return v.split(/\s+/).length<=4&&v.split(/\s+/).every(token=>cssLength.test(token))?v:"";
  if(field==="textAlign")return alignments.has(v)?v:"";
  if(field==="fontWeight")return weights.has(v)?v:"";
  if(field==="lineHeight")return /^(?:[1-3](?:\.\d{1,2})?|\d{1,3}(?:px|%))$/.test(v)?v:"";
  return "";
}
const cssProps:Record<StyleField,string>={
  color:"color",backgroundColor:"background",fontSize:"font-size",fontWeight:"font-weight",
  textAlign:"text-align",padding:"padding",margin:"margin",borderRadius:"radius",
  borderColor:"border-color",borderWidth:"border-width",lineHeight:"line-height",maxWidth:"max-width"
};
export function frameStyleVariables(input:unknown):CSSProperties {
 const styles=(input&&typeof input==="object"&&!Array.isArray(input))?input as Record<string,unknown>:{};
 const variables:Record<string,string>={};
 for(const bp of breakpoints){
  const group=styles[bp];
  if(!group||typeof group!=="object"||Array.isArray(group))continue;
  for(const field of Object.keys(styleLabels) as StyleField[]){
   const value=validatedStyle(field,(group as Record<string,unknown>)[field]);
   if(value)variables["--pc-"+bp+"-"+cssProps[field]]=value;
  }
 }
 return variables as CSSProperties;
}
