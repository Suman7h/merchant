/*
  Warnings:

  - Made the column `amount` on table `cards` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cards" ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0.00;
