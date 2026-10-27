/** Distinguish database bootstrap/connection failures from application bugs. */
export function databaseSchemaMissing(error:unknown):boolean {
 return Boolean(error&&typeof error==="object"&&"code" in error&&(error as {code?:unknown}).code==="P2021");
}
export function databaseUnavailable(error:unknown):boolean {
 if(!error||typeof error!=="object")return false;
 const e=error as {code?:unknown;name?:unknown};
 if(["P1000","P1001","P1003","P1012","P1017","P2021","P2022"].includes(String(e.code??"")))return true;
 return ["PrismaClientInitializationError","PrismaClientRustPanicError"].includes(String(e.name??""));
}
