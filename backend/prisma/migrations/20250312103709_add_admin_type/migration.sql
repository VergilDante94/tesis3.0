-- AlterTable
ALTER TABLE `usuario` MODIFY `tipoUsuario` ENUM('ADMIN', 'CLIENTE', 'TRABAJADOR') NOT NULL;
