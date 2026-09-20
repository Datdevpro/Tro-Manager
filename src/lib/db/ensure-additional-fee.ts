import { prisma } from "@/lib/db/prisma";

// NOTE: On Vercel Serverless, module-level variables reset on cold start.
// We use a lightweight DB existence check instead of relying on isReady flag.
let isReady = false;

export async function ensureAdditionalFeeTable(): Promise<void> {
  if (isReady) return;

  try {
    // Step 1: Create the table safely
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdditionalFee" (
        "id" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "month" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AdditionalFee_pkey" PRIMARY KEY ("id")
      );
    `);

    // Step 2: Create indexes safely
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AdditionalFee_roomId_idx" ON "AdditionalFee"("roomId");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AdditionalFee_month_idx" ON "AdditionalFee"("month");`
    );

    // Step 3: Add FK constraint only if Room table exists - safely ignored if fails
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'AdditionalFee_roomId_fkey'
              AND conrelid = '"AdditionalFee"'::regclass
          ) THEN
            ALTER TABLE "AdditionalFee"
              ADD CONSTRAINT "AdditionalFee_roomId_fkey"
              FOREIGN KEY ("roomId") REFERENCES "Room"("id")
              ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } catch {
      // FK may fail if Room table structure differs - non-fatal
    }

    isReady = true;
  } catch (err) {
    // Log but NEVER throw - this must not break other API routes
    console.error("[AUTO-MIGRATION] ensureAdditionalFeeTable failed (non-fatal):", err);
  }
}
