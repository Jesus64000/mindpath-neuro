// backend/import_to_railway.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDb() {
    console.log('🔄 Iniciando la importación de base de datos a Railway...');
    
    // Configuración de la conexión usando las credenciales públicas de Railway
    const connection = await mysql.createConnection({
        host: 'shuttle.proxy.rlwy.net',
        port: 19047,
        user: 'root',
        password: 'DBijDhPRpOZFXSvIUMssoZscPipgNYFn',
        database: 'railway',
        multipleStatements: true // Requerido para ejecutar todo el dump de un solo golpe
    });
    
    console.log('✅ Conectado exitosamente a Railway MySQL!');
    
    // Leemos el archivo exportado en F:\
    const filePath = 'F:\\mindpath_export.sql';
    console.log(`📖 Leyendo el archivo SQL desde: ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`No se encontró el archivo en la ruta: ${filePath}`);
    }
    
    const buffer = fs.readFileSync(filePath);
    let sql = '';
    
    // Detección automática y robusta de la codificación del archivo
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
        console.log('💡 Codificación UTF-16 LE (por redirección de PowerShell) detectada. Decodificando correctamente...');
        sql = buffer.toString('utf16le');
        
        // 🔥 IMPORTANTE: Eliminamos el carácter BOM UTF-16 LE (\uFEFF) al inicio del string
        // Si no se elimina, MySQL lo ve como caracteres extraños al inicio (ej. '-') y da error de sintaxis.
        if (sql.startsWith('\uFEFF')) {
            sql = sql.slice(1);
        }
    } else if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
        console.log('💡 Codificación UTF-8 con BOM detectada. Decodificando...');
        sql = buffer.toString('utf8').slice(1);
    } else {
        console.log('💡 Codificación UTF-8 estándar detectada. Decodificando...');
        sql = buffer.toString('utf8');
    }
    
    console.log('⚡ Ejecutando sentencias SQL en Railway... (esto puede tardar unos segundos)');
    await connection.query(sql);
    
    console.log('🎉 ¡Base de datos importada en Railway con éxito y sin errores!');
    await connection.end();
}

importDb().catch(err => {
    console.error('❌ Error fatal al importar la base de datos:', err.message);
});
