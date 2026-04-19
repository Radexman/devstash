/*
  Warnings:

  - You are about to drop the column `fileName` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl";
