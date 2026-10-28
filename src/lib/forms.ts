import {z} from "zod";

/** Form definitions are declarative JSON; never accept HTML, JavaScript or arbitrary actions. */
export const formFieldSchema=z.object({
 id:z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
 label:z.string().trim().min(1).max(100),
 type:z.enum(["text","email","tel","textarea","select","checkbox"]),
 placeholder:z.string().max(150).default(""),
 required:z.boolean().default(false),
 options:z.array(z.string().trim().min(1).max(120)).max(30).default([])
}).strict();
export const formDefinitionSchema=z.object({
 name:z.string().trim().min(2).max(100),
 slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
 fields:z.array(formFieldSchema).min(1).max(30).superRefine((fields,ctx)=>{
  const names=new Set<string>();
  for(const [index,f] of fields.entries()){
   if(names.has(f.id))ctx.addIssue({code:"custom",path:[index,"id"],message:"Field keys must be unique"});
   names.add(f.id);
   if(f.type==="select"&&!f.options.length)ctx.addIssue({code:"custom",path:[index,"options"],message:"A dropdown needs options"});
  }
 }),
 settings:z.object({
  buttonLabel:z.string().trim().min(1).max(80).default("Submit"),
  successMessage:z.string().trim().min(1).max(300).default("Thank you. Your message has been received."),
  enabled:z.boolean().default(true)
 }).strict()
}).strict();
export type FormDefinition=z.infer<typeof formDefinitionSchema>;
export type FormField=z.infer<typeof formFieldSchema>;
export const starterForm:FormDefinition={
 name:"Contact form",slug:"contact",
 fields:[
  {id:"name",label:"Your name",type:"text",placeholder:"Enter your name",required:true,options:[]},
  {id:"email",label:"Email address",type:"email",placeholder:"you@example.com",required:true,options:[]},
  {id:"message",label:"Message",type:"textarea",placeholder:"How can we help?",required:true,options:[]}
 ],
 settings:{buttonLabel:"Send message",successMessage:"Thank you! Your message has been received.",enabled:true}
};
/** Reject unknown keys and untrusted content: only defined fields are persisted. */
export function validateFormValues(fields:FormField[],input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))return {error:"Invalid form data"} as const;
 const record=input as Record<string,unknown>;
 const values:Record<string,string>={};
 for(const f of fields){
  const raw=record[f.id];
  if(raw!==undefined&&typeof raw!=="string")return {error:"Invalid value for "+f.label} as const;
  const value=(raw||"").trim();
  if(value.length>3000)return {error:f.label+" is too long"} as const;
  if(f.required&&!value)return {error:f.label+" is required"} as const;
  if(f.type==="email"&&value&&!z.string().email().max(254).safeParse(value).success)
   return {error:"Enter a valid email address for "+f.label} as const;
  if(f.type==="select"&&value&&!f.options.includes(value))return {error:"Invalid selection for "+f.label} as const;
  if(f.type==="checkbox"&&value!=="true"&&value!=="")return {error:"Invalid checkbox for "+f.label} as const;
  values[f.id]=value;
 }
 return {values} as const;
}
