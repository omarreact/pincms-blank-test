import {NextResponse} from "next/server";
import {hasRole,denied} from "@/lib/security";
export async function POST(){if(!await hasRole("ADMIN"))return denied();const configured=Boolean(process.env.CLOUDINARY_CLOUD_NAME&&process.env.CLOUDINARY_API_KEY&&process.env.CLOUDINARY_API_SECRET);return NextResponse.json({configured,provider:configured?"cloudinary":"local"})}
