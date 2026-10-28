import { z } from "zod";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const blockSchema = z.object({ id:z.string().max(80).optional(), type:z.string().min(1).max(60), data:z.record(z.unknown()).default({}), order:z.number().int().min(0).optional() });
export const pageSchema = z.object({
  title:z.string().trim().min(1).max(200), slug:z.string().trim().regex(SLUG_PATTERN),
  status:z.enum(["DRAFT","PUBLISHED","SCHEDULED","ARCHIVED"]).default("DRAFT"),
  excerpt:z.string().max(2000).optional().nullable(),seoTitle:z.string().max(200).optional().nullable(),
  seoDesc:z.string().max(500).optional().nullable(),ogImage:z.string().max(2000).optional().nullable(),
  parentId:z.string().optional().nullable(),
  publishedAt:z.string().datetime().optional().nullable(), blocks:z.array(blockSchema).max(120).superRefine((blocks,ctx)=>{
   const ids=new Set<string>();
   let count=0;
   const visit=(nodes:unknown[],depth:number,path:(string|number)[])=>{
    if(depth>12){ctx.addIssue({code:"custom",path,message:"Nested layout exceeds 12 levels"});return}
    for(let i=0;i<nodes.length;i++){
     count++;
     if(count>120){ctx.addIssue({code:"custom",path,message:"Maximum 120 total widgets"});return}
     const parsed=blockSchema.safeParse(nodes[i]);
     if(!parsed.success){ctx.addIssue({code:"custom",path:[...path,i],message:"Invalid nested widget"});continue}
     const node=parsed.data;
     if(node.id&&ids.has(node.id))ctx.addIssue({code:"custom",path:[...path,i,"id"],message:"Duplicate widget ID"});
     if(node.id)ids.add(node.id);
     const children=node.data.children;
     if(children!==undefined){
      if(!["container","row","column","grid"].includes(node.type)||!Array.isArray(children)){
       ctx.addIssue({code:"custom",path:[...path,i,"data","children"],message:"Only layouts can contain child widgets"});
      }else visit(children,depth+1,[...path,i,"data","children"]);
     }
    }
   };
   visit(blocks,0,[]);
  }).default([]),
});
export const postSchema = pageSchema.omit({parentId:true});
export const cloudinaryCredentialsSchema=z.object({
 cloudName:z.string().trim().regex(/^[a-z0-9_-]{2,80}$/i),
 apiKey:z.string().trim().regex(/^[0-9]{6,32}$/),
 apiSecret:z.string().trim().min(12).max(180)
}).strict();
export const mediaOptionSchema=z.discriminatedUnion("mode",[
 z.object({mode:z.literal("local")}).strict(),
 z.object({mode:z.literal("later")}).strict(),
 z.object({mode:z.literal("existing")}).strict(),
 z.object({mode:z.literal("cloudinary"),credentials:cloudinaryCredentialsSchema}).strict()
]);
export const setupSchema = z.object({ token:z.string().default(""),siteName:z.string().trim().min(2).max(100),
  name:z.string().trim().min(2).max(100), email:z.string().email().max(200),
  password:z.string().min(12).max(128), theme:z.enum(["default","night"]).default("default"),
  media:mediaOptionSchema.default({mode:"later"}),
});
export const themeSchema = z.object({
  name:z.string().min(1).max(100), version:z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/).default("1.0.0"),
  description:z.string().max(500).optional(),
  styles:z.object({
    colors:z.record(z.string().regex(/^#[\da-fA-F]{3}(?:[\da-fA-F]{3})?$/)).default({}),
    fonts:z.object({heading:z.string().max(100).default("system-ui"),body:z.string().max(100).default("system-ui")}).default({heading:"system-ui",body:"system-ui"}),
    spacing:z.record(z.string().max(60)).optional(),
  }),
  layouts:z.object({header:z.string().max(60).default("default-header"),footer:z.string().max(60).default("default-footer")}).default({header:"default-header",footer:"default-footer"}),
  templates:z.record(z.string().max(60)).default({}), availableBlocks:z.array(z.string().max(60)).max(100).default([]),
  settings:z.record(z.unknown()).optional(),
}).passthrough();
export function problem(error: unknown) {
  if (error instanceof z.ZodError) return {error:"Invalid request",details:error.flatten()};
  return {error:"Request could not be completed"};
}
