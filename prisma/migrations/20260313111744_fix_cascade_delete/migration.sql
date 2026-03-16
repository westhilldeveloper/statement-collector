-- DropForeignKey
ALTER TABLE "public"."Reminder" DROP CONSTRAINT "Reminder_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Statement" DROP CONSTRAINT "Statement_customerId_fkey";

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
