// Middleware: admin O supervisor (staff) pueden acceder
module.exports = function isStaff(req, res, next) {
    if (!req.user || !['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de staff.' });
    }
    next();
};
