const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * Guarda un archivo cargado en la base de datos como Base64 para persistencia a largo plazo
 * a prueba de reinicios de servidores/contenedores efímeros (como Railway).
 */
const persistFile = async (relativeUrl, absolutePath, mimetype) => {
    try {
        if (!fs.existsSync(absolutePath)) {
            console.warn(`⚠️ persistFile: El archivo no existe en el disco en ${absolutePath}`);
            return;
        }
        const base64Data = fs.readFileSync(absolutePath, { encoding: 'base64' });
        await db.query(`
            INSERT INTO stored_files (file_path, file_data, mimetype)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE file_data = VALUES(file_data), mimetype = VALUES(mimetype)
        `, [relativeUrl, base64Data, mimetype]);
        console.log(`💾 Persistido de manera permanente en BD: ${relativeUrl}`);
    } catch (err) {
        console.error(`❌ Error al persistir archivo ${relativeUrl} en BD:`, err.message);
    }
};

/**
 * Middleware para Express que intercepta las peticiones de archivos estáticos en /uploads.
 * Si el archivo no existe en el disco físico, lo busca en la base de datos, lo regenera en el
 * disco en caliente, y permite que continúe el flujo normal.
 */
const restoreFileMiddleware = async (req, res, next) => {
    try {
        // req.path contiene la ruta relativa desde el punto de montaje (ej: /logos/logo-123.png o /avatar-123.jpg)
        const relativeUrl = '/uploads' + req.path;
        const publicDir = path.join(__dirname, '..', 'public');
        const absolutePath = path.join(publicDir, 'uploads', req.path);

        // Si ya existe físicamente en el disco, express.static lo servirá de inmediato
        if (fs.existsSync(absolutePath)) {
            return next();
        }

        // Si no existe físicamente, lo recuperamos de la base de datos y lo servimos directo (ideal para Vercel Serverless)
        const [rows] = await db.query('SELECT file_data, mimetype FROM stored_files WHERE file_path = ?', [relativeUrl]);
        if (rows && rows.length > 0) {
            const base64Data = rows[0].file_data;
            const buffer = Buffer.from(base64Data, 'base64');
            res.setHeader('Content-Type', rows[0].mimetype);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(buffer);
        }
        next();
    } catch (err) {
        console.error(`❌ Error en restoreFileMiddleware para ${req.path}:`, err.message);
        next();
    }
};

module.exports = {
    persistFile,
    restoreFileMiddleware
};
