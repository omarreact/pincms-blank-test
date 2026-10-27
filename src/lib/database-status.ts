/** Only Prisma P2021 means a database table has not been created yet. */
export function databaseSchemaMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as {code?: unknown}).code === "P2021";
}
