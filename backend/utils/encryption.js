const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env. ENCRYPTION_KEY; // Debe ser de 32 bytes (caracteres)
const ALGORITHM = 'aes-256-cbc';

/**
 * Encriptar texto plano
 * @param {string} text 
 * @returns {string} iv:encryptedText
 */
exports.encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Error al encriptar:", error);
        return null;
    }
};

/**
 * Desencriptar texto cifrado
 * @param {string} text Formato iv:encryptedText
 * @returns {string} Texto plano
 */
exports.decrypt = (text) => {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Error al desencriptar credenciales SMTP");
        return null;
    }
};
