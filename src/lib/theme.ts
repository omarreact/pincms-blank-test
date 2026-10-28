import { prisma } from "@/lib/db";
import {databaseUnavailable} from "@/lib/database-status";
import { themeSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export type ThemeConfig = z.infer<typeof themeSchema>;
export const DEFAULT_THEME: ThemeConfig = {
  name:"PinCMS Standalone",version:"1.0.0",description:"A bright, spacious editorial theme",
  styles:{colors:{primary:"#4657e8",secondary:"#101828",background:"#ffffff",foreground:"#142038",muted:"#f1f5ff",accent:"#21cda4"},fonts:{heading:"system-ui",body:"system-ui"}},
  layouts:{header:"default-header",footer:"default-footer"},templates:{home:"home",page:"default",post:"single"},
  availableBlocks:["hero","text","heading","image","gallery","video","cta","columns","features","testimonials","pricing","faq","spacer","divider","button","stats","html","form","starRating","progressBar","alert","iconList","socialIcons","contactButtons","tabs","countdown","imageCarousel"],settings:{containerWidth:"1200px",borderRadius:"14px"}
};
export const NIGHT_THEME: ThemeConfig = {
  ...DEFAULT_THEME,name:"PinCMS Midnight",description:"A contemporary dark theme",styles:{...DEFAULT_THEME.styles, colors:{primary:"#7c90ff",secondary:"#f6f8ff",background:"#0d1426",foreground:"#f0f4ff",muted:"#202b46",accent:"#34e8c0"}}
};
export async function getActiveTheme(): Promise<ThemeConfig> {
  try {
    const theme=await prisma.theme.findFirst({where:{isActive:true}});
    if(!theme)return DEFAULT_THEME;
    const parsed=themeSchema.safeParse(JSON.parse(theme.config)); return parsed.success?parsed.data:DEFAULT_THEME;
  } catch(error) {
    if(databaseUnavailable(error))return DEFAULT_THEME;
    throw error;
  }
}
export async function importThemeFromJson(json: string) {
  if(json.length>100_000) throw new Error("Theme file too large");
  const config=themeSchema.parse(JSON.parse(json));
  const slug=config.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
  return prisma.theme.upsert({where:{slug},create:{name:config.name,slug,version:config.version,description:config.description,config:JSON.stringify(config)},update:{version:config.version,config:JSON.stringify(config),description:config.description}});
}
export async function activateTheme(id:string) {
  const existing=await prisma.theme.findUnique({where:{id}});if(!existing)throw new Error("Theme not found");
  await prisma.$transaction([prisma.theme.updateMany({data:{isActive:false}}),prisma.theme.update({where:{id},data:{isActive:true}})]);
  revalidatePath("/", "layout");
}
