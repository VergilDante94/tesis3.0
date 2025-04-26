/**
 * Script para crear un respaldo de la base de datos
 * Ejecutar con: node scripts/db-dump.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Crear interfaz para leer desde consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuración básica de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  database: 'gestion_servicios',
  port: 3306
};

// Directorio de respaldos
const backupDir = path.join(__dirname, '..', 'database-backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Nombre del archivo de respaldo
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = path.join(backupDir, `backup-${timestamp}.sql`);

// Solicitar contraseña al usuario
console.log('Respaldo de la base de datos MySQL');
console.log(`Base de datos: ${dbConfig.database}`);
console.log(`Archivo de respaldo: ${filename}`);

rl.question('Ingrese la contraseña para MySQL (dejar en blanco si no tiene): ', (password) => {
  // Comando para hacer el respaldo
  const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user}${password ? ` -p${password}` : ''} ${dbConfig.database} > "${filename}"`;
  
  console.log('Creando respaldo...');
  
  // Ejecutar el comando
  exec(mysqldumpCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al crear el respaldo: ${error.message}`);
      rl.close();
      return;
    }
    
    if (stderr && !stderr.includes('Warning')) {
      console.error(`Error: ${stderr}`);
      rl.close();
      return;
    }
    
    console.log('Respaldo creado exitosamente.');
    console.log(`Tamaño del archivo: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
    console.log('\nPasos para subir al repositorio:');
    console.log('1. git add database-backups/');
    console.log('2. git commit -m "Añadido respaldo de la base de datos"');
    console.log(`3. git push tesis3.0 <rama>`);
    
    rl.close();
  });
}); 