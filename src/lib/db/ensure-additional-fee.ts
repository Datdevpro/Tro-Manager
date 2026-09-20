import { prisma } from "@/lib/db/prisma";

let isReady = false;

export async function ensureAdditionalFeeTable() {
  if (isReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdditionalFee" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roomId" TEXT NOT NULL,
        "month" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdditionalFee_roomId_idx" ON "AdditionalFee"("roomId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdditionalFee_month_idx" ON "AdditionalFee"("month");`);

    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'AdditionalFee_roomId_fkey'
          ) THEN
            ALTER TABLE "AdditionalFee" ADD CONSTRAINT "AdditionalFee_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } catch {
      // Ignore if constraint exists
    }

    isReady = true;
  } catch (err) {
    console.error("[AUTO-MIGRATION] ensureAdditionalFeeTable:", err);
  }
}
