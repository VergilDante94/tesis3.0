-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: gestion_servicios
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('280f34c2-4d6b-4883-a4ed-cb78689aacf7','4c236071ffa65a28d49fa68f273d150e79dbd646b29a8ca077552395aba264cb','2025-04-25 10:34:12.205','20250313080722_add_tipo_servicio',NULL,NULL,'2025-04-25 10:34:12.169',1),('38a2dc97-5e05-4c65-8dbb-02b75442e58c','ffa5dabf05f35a77d2092e1fa1f493f708ca4fcd9d8403ad21e925820991589f','2025-04-25 10:34:12.380','20250320100122_add_active_flag_to_users',NULL,NULL,'2025-04-25 10:34:12.315',1),('5e381e01-9ec6-493d-8808-42e9fce21b37','03e0317be9a26d04d94d9a7772625ee900180607cdd851c5cc76e4c0591c4827','2025-04-25 10:34:12.584','20250402113701_add_fecha_programada',NULL,NULL,'2025-04-25 10:34:12.545',1),('6b6fc087-bb09-496b-b808-053e92edebde','43700b7d8c658ad25e71a939da7f20bd7f4d2cc74c108a09a1e485ed842cbb0a','2025-04-25 10:34:12.128','20250308090040_init',NULL,NULL,'2025-04-25 10:34:11.637',1),('82054fec-ff0e-41db-b16e-67d1da03acb8','bdd02f476dff4447c1fb26ccad0314ef945d342d767ee117bfaeb6d8452fc40e','2025-04-25 10:34:12.873','20250404104742_add_store_models',NULL,NULL,'2025-04-25 10:34:12.587',1),('8adaebc2-4069-42ea-9e57-ad2917925ce8','4df648ef41135bf6fa40eb52e8d5e8ae56c17557b7fc4c309112290010905aba','2025-04-25 10:34:12.505','20250326115417_add_impuestos_to_factura',NULL,NULL,'2025-04-25 10:34:12.385',1),('93b60a5c-22f4-4a72-b34f-c48e493b6e3f','4daabe5edc6054c02c1f51f65baa0cfeaea32de86f49eb923d7dcf83509a80f2','2025-04-25 10:34:12.313','20250318110917_add_direccion_telefono_to_usuario',NULL,NULL,'2025-04-25 10:34:12.266',1),('b18fa7f7-159c-4128-9ec2-add8e19d40a9','08d332a8b262d39ca69c5f9f80123638eae6e053e15215ff8083771ef3d91609','2025-04-25 10:34:15.588','20250425103415_update_notificaciones',NULL,NULL,'2025-04-25 10:34:15.542',1),('b72b06c4-fd40-4bd7-914b-6afa49379ba4','911d57fd931aea377898270c4105b4659fd319032290d89913cee062f87ad177','2025-04-25 10:34:12.977','20250404110209_add_order_type_and_venta_relation',NULL,NULL,'2025-04-25 10:34:12.875',1),('bb3eeeb2-0293-43bb-a1ca-bef413c46707','538978cc3ce5d9179a391eadb568c6439af4133a651af3bd70cb14f84ded02f2','2025-04-25 10:34:12.221','20250313080752_',NULL,NULL,'2025-04-25 10:34:12.208',1),('d3bf331a-8ec5-43e7-a321-11cd86e2adf7','708318cf0c0cfb032ef787041332d0b478508f685c494bac6b3292e0d042bd77','2025-04-25 10:34:12.264','20250313081841_remove_duracion_horas',NULL,NULL,'2025-04-25 10:34:12.223',1),('d50822f6-3452-4718-a6e6-92b17fb44462','4d17d55476b7eba0749cdc2e72bcc9b238f08c2875672cdf6578332d5a1d72fc','2025-04-25 10:34:12.543','20250326120055_remove_impuestos_from_factura',NULL,NULL,'2025-04-25 10:34:12.508',1),('d7672ba6-ed06-4782-9388-667b93e78839','e9d3560ab541445fab68dc111cc55f08100e5a773bcb90bb8154d4ba32d9fa20','2025-04-25 10:34:12.167','20250308102449_add_duracion_horas_to_servicio',NULL,NULL,'2025-04-25 10:34:12.131',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'Almacenamiento','Discos Duros','2025-04-25 11:01:50.936','2025-04-25 11:01:50.936'),(2,'Perifericos','Teclados\n','2025-04-25 11:02:01.639','2025-04-25 11:02:01.639');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuarioId` int NOT NULL,
  `direccion` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Cliente_usuarioId_key` (`usuarioId`),
  CONSTRAINT `Cliente_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (1,3,'delegacion','762882');
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalleventa`
--

DROP TABLE IF EXISTS `detalleventa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalleventa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ventaId` int NOT NULL,
  `productoId` int NOT NULL,
  `cantidad` int NOT NULL,
  `precioUnitario` double NOT NULL,
  `subtotal` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `DetalleVenta_ventaId_fkey` (`ventaId`),
  KEY `DetalleVenta_productoId_fkey` (`productoId`),
  CONSTRAINT `DetalleVenta_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `producto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DetalleVenta_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `venta` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalleventa`
--

LOCK TABLES `detalleventa` WRITE;
/*!40000 ALTER TABLE `detalleventa` DISABLE KEYS */;
INSERT INTO `detalleventa` VALUES (1,1,1,4,25,100,'2025-04-25 11:49:41.850','2025-04-25 11:49:41.850'),(2,2,1,1,25,25,'2025-04-25 16:15:45.285','2025-04-25 16:15:45.285'),(3,2,2,2,100,200,'2025-04-25 16:15:45.285','2025-04-25 16:15:45.285'),(4,3,2,2,100,200,'2025-04-26 11:13:41.093','2025-04-26 11:13:41.093');
/*!40000 ALTER TABLE `detalleventa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordenId` int NOT NULL,
  `subtotal` double NOT NULL,
  `total` double NOT NULL,
  `fechaEmision` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `archivoPath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firmaCliente` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firmaAdmin` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `facturas_ordenId_key` (`ordenId`),
  CONSTRAINT `facturas_ordenId_fkey` FOREIGN KEY (`ordenId`) REFERENCES `orden` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (1,6,50,50,'2025-04-25 11:48:31.279','PENDIENTE','/facturas/factura_6_1745581711279.pdf',NULL,NULL,'2025-04-25 11:48:31.281','2025-04-25 11:48:31.281'),(2,9,150,150,'2025-04-26 11:13:12.761','PENDIENTE','/facturas/factura_9_1745665992761.pdf',NULL,NULL,'2025-04-26 11:13:12.763','2025-04-26 11:13:12.763'),(3,11,50,50,'2025-04-26 13:05:32.431','PENDIENTE','/facturas/factura_11_1745672732431.pdf',NULL,NULL,'2025-04-26 13:05:32.432','2025-04-26 13:05:32.432');
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuarioId` int NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `enlaceId` int DEFAULT NULL,
  `enlaceTipo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `tipo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Notificacion_usuarioId_fkey` (`usuarioId`),
  CONSTRAINT `Notificacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
INSERT INTO `notificacion` VALUES (1,3,'La orden #5 ha sido cancelada','2025-04-25 11:47:26.326','2025-04-25 11:47:26.326',5,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(2,3,'Nueva orden creada #6','2025-04-25 11:48:31.227','2025-04-25 11:48:31.227',6,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(3,3,'Nueva orden creada #9','2025-04-26 11:13:12.696','2025-04-26 11:13:12.696',9,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(4,3,'La orden #10 ha sido cancelada','2025-04-26 11:14:15.361','2025-04-26 11:14:15.361',10,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(5,3,'La orden #9 ha sido cancelada','2025-04-26 11:14:20.400','2025-04-26 11:14:20.400',9,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(6,3,'Esta es una notificación de prueba para verificar que el sistema funciona correctamente','2025-04-26 12:31:39.557','2025-04-26 12:31:39.557',NULL,NULL,'LEIDA','SISTEMA','2025-04-26 13:15:52.583'),(7,3,'Nueva orden creada #11','2025-04-26 13:05:32.379','2025-04-26 13:05:32.379',11,'ORDEN','LEIDA','ORDEN','2025-04-26 13:15:52.583'),(8,3,'Se ha generado la factura #3 para tu orden #11','2025-04-26 13:05:32.441','2025-04-26 13:05:32.441',3,'FACTURA','LEIDA','FACTURA','2025-04-26 13:15:52.583');
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden`
--

DROP TABLE IF EXISTS `orden`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clienteId` int NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fechaProgramada` datetime(3) DEFAULT NULL,
  `tipo` enum('SERVICIO','COMPRA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SERVICIO',
  `ventaId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Orden_ventaId_key` (`ventaId`),
  KEY `Orden_clienteId_fkey` (`clienteId`),
  CONSTRAINT `Orden_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `cliente` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Orden_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `venta` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden`
--

LOCK TABLES `orden` WRITE;
/*!40000 ALTER TABLE `orden` DISABLE KEYS */;
INSERT INTO `orden` VALUES (6,1,'2025-04-25 11:48:31.216','PENDIENTE','','2025-04-29 11:48:00.000','SERVICIO',NULL),(7,1,'2025-04-25 11:49:41.854','PENDIENTE','Compra de productos: 4x Teclado retroiluminado de impresión grande, teclado de computadora con cable USB',NULL,'COMPRA',1),(8,1,'2025-04-25 16:15:45.313','PENDIENTE','Compra de productos: 1x Teclado retroiluminado de impresión grande, teclado de computadora con cable USB, 2x Disco Duro Seagate',NULL,'COMPRA',2),(9,1,'2025-04-26 11:13:12.677','CANCELADA','','2025-04-29 11:13:00.000','SERVICIO',NULL),(10,1,'2025-04-26 11:13:41.096','CANCELADA','Compra de productos: 2x Disco Duro Seagate',NULL,'COMPRA',3),(11,1,'2025-04-26 13:05:32.366','PENDIENTE','','2025-04-30 16:00:00.000','SERVICIO',NULL);
/*!40000 ALTER TABLE `orden` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenservicio`
--

DROP TABLE IF EXISTS `ordenservicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenservicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordenId` int NOT NULL,
  `servicioId` int NOT NULL,
  `cantidad` int NOT NULL,
  `precioUnitario` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrdenServicio_ordenId_fkey` (`ordenId`),
  KEY `OrdenServicio_servicioId_fkey` (`servicioId`),
  CONSTRAINT `OrdenServicio_ordenId_fkey` FOREIGN KEY (`ordenId`) REFERENCES `orden` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OrdenServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenservicio`
--

LOCK TABLES `ordenservicio` WRITE;
/*!40000 ALTER TABLE `ordenservicio` DISABLE KEYS */;
INSERT INTO `ordenservicio` VALUES (6,6,1,1,50),(7,9,1,3,50),(8,11,1,1,50);
/*!40000 ALTER TABLE `ordenservicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto`
--

DROP TABLE IF EXISTS `producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio` double NOT NULL,
  `imagen` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoriaId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `Producto_categoriaId_fkey` (`categoriaId`),
  CONSTRAINT `Producto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categoria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto`
--

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (1,'Teclado retroiluminado de impresión grande, teclado de computadora con cable USB','Teclado',25,'1745579420110-786543993.jpg',2,'2025-04-25 11:10:20.138','2025-04-25 11:49:21.251',1),(2,'Disco Duro Seagate','Disco Duro Seagate',100,'1745597542248-942112735.jpg',1,'2025-04-25 16:12:22.271','2025-04-25 16:12:32.831',1);
/*!40000 ALTER TABLE `producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio`
--

DROP TABLE IF EXISTS `servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precioBase` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `updatedAt` datetime(3) NOT NULL,
  `tipo` enum('POR_HORA','POR_CANTIDAD') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio`
--

LOCK TABLES `servicio` WRITE;
/*!40000 ALTER TABLE `servicio` DISABLE KEYS */;
INSERT INTO `servicio` VALUES (1,'Mantenimiento Preventivo','Mantenimiento',50,'2025-04-25 11:10:42.463','ACTIVO','2025-04-25 11:10:42.463','POR_HORA');
/*!40000 ALTER TABLE `servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productoId` int NOT NULL,
  `cantidad` int NOT NULL,
  `minimo` int NOT NULL DEFAULT '5',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Stock_productoId_key` (`productoId`),
  CONSTRAINT `Stock_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `producto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (1,1,45,5,'2025-04-25 11:10:20.144','2025-04-25 16:15:45.314'),(2,2,21,5,'2025-04-25 16:12:22.277','2025-04-26 11:13:41.098');
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trabajador`
--

DROP TABLE IF EXISTS `trabajador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trabajador` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuarioId` int NOT NULL,
  `posicion` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Trabajador_usuarioId_key` (`usuarioId`),
  CONSTRAINT `Trabajador_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trabajador`
--

LOCK TABLES `trabajador` WRITE;
/*!40000 ALTER TABLE `trabajador` DISABLE KEYS */;
/*!40000 ALTER TABLE `trabajador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('ADMIN','CLIENTE','TRABAJADOR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` int DEFAULT NULL,
  `direccion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Usuario_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Nuevo Administrador','nuevoadmin@sistema.com','$2b$10$zREmfCCNjvohZ95lLUUMvOzQ.p96R.vdnUat669xF0r8QQPXQotLO','ADMIN','2025-04-25 10:58:59.982','2025-04-25 11:10:58.189',NULL,NULL,NULL,0),(2,'Nuevo Administrador','admin@example.com','$2b$10$gy0FRLoSvNN6KrYTZnssFe7rfGjAOv2FTd92OL/I0PVCz4LhJW5xC','ADMIN','2025-04-25 11:00:43.980','2025-04-25 11:00:43.980',NULL,NULL,NULL,1),(3,'Cliente','cliente@example.com','$2b$10$3JdFoFcS1woO0o5kl6zYr.LoCMHnWI8ve9J0Ku.iRtESJ6ArkMXgu','CLIENTE','2025-04-25 11:11:16.913','2025-04-25 11:11:16.913',2,'delegacion','762882',1);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta`
--

DROP TABLE IF EXISTS `venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clienteId` int NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `total` double NOT NULL,
  `estado` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Venta_clienteId_fkey` (`clienteId`),
  CONSTRAINT `Venta_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `cliente` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta`
--

LOCK TABLES `venta` WRITE;
/*!40000 ALTER TABLE `venta` DISABLE KEYS */;
INSERT INTO `venta` VALUES (1,1,'2025-04-25 11:49:41.850',100,'PENDIENTE','2025-04-25 11:49:41.850','2025-04-25 11:49:41.850'),(2,1,'2025-04-25 16:15:45.285',225,'PENDIENTE','2025-04-25 16:15:45.285','2025-04-25 16:15:45.285'),(3,1,'2025-04-26 11:13:41.093',200,'PENDIENTE','2025-04-26 11:13:41.093','2025-04-26 11:13:41.093');
/*!40000 ALTER TABLE `venta` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-26  6:56:32
