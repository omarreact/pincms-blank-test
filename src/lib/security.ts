import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "CONTRIBUTOR";
const privileges: Record<Role, number> = { SUPER_ADMIN: 5, ADMIN: 4, EDITOR: 3, AUTHOR: 2, CONTRIBUTOR: 1 };

export async function currentUser() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true } });
}
export async function hasRole(minimum: Role = "CONTRIBUTOR") {
  const user = await currentUser();
  return user && privileges[user.role] >= privileges[minimum] ? user : null;
}
export function denied() { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
export function forbidden() { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

// Validate URL protocols: never turn CMS data into javascript: links.
export function safeHref(value: unknown, fallback = "#") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  try { const url = new URL(trimmed); return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? trimmed : fallback; }
  catch { return fallback; }
}
export function safeImage(value: unknown) {
  const url = safeHref(value, "");
  return (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) && !/[<>"'()\\]/.test(url) ? url : "";
}
// Renders legacy HTML as readable text, without injecting unsanitized markup into the site.
export function plainText(value: unknown) {
  return String(value ?? "").replace(/<\s*br\s*\/?\s*>/gi,"\n").replace(/<\/(p|div|h[1-6]|li)>/gi,"\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
}
