/*
  Warnings:

  - You are about to drop the `factura` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `factura` DROP FOREIGN KEY `Factura_ordenId_fkey`;

-- DropTable
DROP TABLE `factura`;

-- CreateTable
CREATE TABLE `facturas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordenId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `impuestos` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `fechaEmision` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    `archivoPath` VARCHAR(191) NULL,
    `firmaCliente` VARCHAR(191) NULL,
    `firmaAdmin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `facturas_ordenId_key`(`ordenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_ordenId_fkey` FOREIGN KEY (`ordenId`) REFERENCES `Orden`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
