const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1]; // Formato: Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token provisto.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Inyectamos los datos del usuario en la request
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token inválido o expirado.' });
    }
};
