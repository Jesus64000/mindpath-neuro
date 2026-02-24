// Middleware que garantiza que solo usuarios con rol 'admin' accedan a las rutas protegidas
module.exports = function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};
