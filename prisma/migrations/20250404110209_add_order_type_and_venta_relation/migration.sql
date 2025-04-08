/*
  Warnings:

  - A unique constraint covering the columns `[ventaId]` on the table `Orden` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `orden` ADD COLUMN `tipo` ENUM('SERVICIO', 'COMPRA') NOT NULL DEFAULT 'SERVICIO',
    ADD COLUMN `ventaId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Orden_ventaId_key` ON `Orden`(`ventaId`);

-- AddForeignKey
ALTER TABLE `Orden` ADD CONSTRAINT `Orden_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
