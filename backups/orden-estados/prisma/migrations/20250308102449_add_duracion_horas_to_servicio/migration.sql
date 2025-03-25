/*
  Warnings:

  - Added the required column `duracionHoras` to the `Servicio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `servicio` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `duracionHoras` INTEGER NOT NULL,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'ACTIVO',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
