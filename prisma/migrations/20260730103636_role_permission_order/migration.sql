/*
  Warnings:

  - Added the required column `seq` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `role_permissions` ADD COLUMN `seq` INTEGER NOT NULL;
