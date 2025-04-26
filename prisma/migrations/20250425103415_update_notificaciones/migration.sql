/*
  Warnings:

  - You are about to drop the column `leida` on the `notificacion` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `Notificacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notificacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notificacion` DROP COLUMN `leida`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `enlaceId` INTEGER NULL,
    ADD COLUMN `enlaceTipo` VARCHAR(191) NULL,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN `tipo` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `mensaje` TEXT NOT NULL;
