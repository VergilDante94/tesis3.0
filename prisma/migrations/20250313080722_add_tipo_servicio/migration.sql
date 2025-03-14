/*
  Warnings:

  - Added the required column `tipo` to the `Servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Servicio` ADD COLUMN `tipo` ENUM('POR_HORA', 'POR_CANTIDAD') NOT NULL DEFAULT 'POR_HORA',
    MODIFY `duracionHoras` INTEGER NOT NULL DEFAULT 1;

-- UpdateData
UPDATE `Servicio` SET `tipo` = 'POR_HORA' WHERE nombre IN ('Limpieza General', 'Limpieza Post-Construcción', 'Desinfección COVID-19', 'Limpieza de Cocina Profunda', 'Servicio de Planchado');
UPDATE `Servicio` SET `tipo` = 'POR_CANTIDAD' WHERE nombre IN ('Limpieza de Ventanas', 'Limpieza de Alfombras', 'Limpieza de Baños');
