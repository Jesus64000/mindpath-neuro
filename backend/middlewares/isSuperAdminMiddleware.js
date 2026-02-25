// Middleware: SOLO admin puede acceder (métricas, theming, crear supervisores)
module.exports = function isSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de Super Admin.' });
    }
    next();
};
