const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const runSetup = async () => {
    console.log("\n================================================");
    console.log("🛠️  Iniciando Instalador de BD - Mindpath Neuro");
    console.log("================================================\n");

    let connection;
    try {
        // 1. Conectamos a MySQL sin especificar base de datos (para poder crearla si no existe)
        connection = await mysql.createConnection({
            host:     process.env.DB_HOST     || 'localhost',
            user:     process.env.DB_USER     || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // CRUCIAL: permite ejecutar múltiples comandos SQL a la vez
        });

        console.log("✅ Conexión establecida con MySQL.");

        // 2. Crear la DB si no existe (para que no falle en instalación limpia)
        const dbName = process.env.DB_NAME || 'mindpath_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);
        console.log(`🗄️  Base de datos '${dbName}' seleccionada.`);

        // 3. Leer el archivo SQL maestro (está en /docs/ relativo al proyecto)
        const schemaPath = path.join(__dirname, '..', 'docs', 'db_mindpath.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error(`❌ No se encontró el archivo en: ${schemaPath}`);
            console.log("💡 TIP: Asegúrate de que 'db_mindpath.sql' esté dentro de la carpeta /docs/\n");
            process.exit(1);
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📜 db_mindpath.sql cargado (${(sql.length / 1024).toFixed(1)} KB). Construyendo arquitectura...`);

        // 4. Ejecutar el volcado completo
        await connection.query(sql);

        // 5. Sembrar Usuario de Prueba Administrador (admin@admin.com / admin123)
        const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@admin.com']);
        if (existing.length === 0) {
            console.log("👤 Creando usuario administrador por defecto...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await connection.query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['Administrador Principal', 'admin@admin.com', hashedPassword, 'admin']
            );
            console.log("✨ Usuario Admin (admin@admin.com) creado exitosamente.");
        } else {
            console.log("ℹ️  El usuario administrador ya existe. Saltando...");
        }

        console.log("✨ Tablas, columnas, índices y catálogos creados con éxito.");
        console.log("\n🎉 ¡ÉXITO! La Base de Datos está lista para producción.");
        console.log("👉 Ya puedes iniciar el servidor normalmente con: npm run dev\n");

        process.exit(0);

    } catch (error) {
        console.error("\n❌ ERROR FATAL durante la instalación de la BD:");
        console.error(error.message);
        console.log("\n💡 TIPs de diagnóstico:");
        console.log("   • Verifica que MySQL esté corriendo (XAMPP/WAMP encendido).");
        console.log("   • Revisa las credenciales en tu archivo backend/.env");
        console.log("   • Si persiste, abre db_mindpath.sql y verifica que no tenga errores de sintaxis.\n");
        process.exit(1);

    } finally {
        if (connection) await connection.end();
    }
};

runSetup();
