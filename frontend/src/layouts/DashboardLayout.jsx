import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import useSettingsStore from '../store/useSettingsStore';
import {
    LayoutDashboard, Calendar, Users, Settings, LogOut,
    BrainCircuit, Sun, Moon, ShieldCheck, FileText, BarChart3,
    Menu, X
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import api from '../api/axiosConfig';
import { BACKEND_URL } from '../api/constants';

const DashboardLayout = () => {
    const { user, logout, updateUser } = useAuthStore();
    const { clinicName, logoUrl } = useSettingsStore();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Sincronizar foto de perfil (por si el token quedó desactualizado en caché)
    useEffect(() => {
        if (!user || !updateUser) return;
        if (user.role === 'patient') {
            api.get('/patients/profile').then(res => {
                if (res.data.profile_picture && res.data.profile_picture !== user.profile_picture) {
                    updateUser({ profile_picture: res.data.profile_picture });
                }
            }).catch(() => {});
        } else if (user.role === 'doctor') {
            api.get('/doctors/profile/settings').then(res => {
                if (res.data.profile_picture && res.data.profile_picture !== user.profile_picture) {
                    updateUser({ profile_picture: res.data.profile_picture });
                }
            }).catch(() => {});
        }
    }, [user?.id, user?.role]);

    // Cerrar menú móvil al cambiar de ruta
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    // ── Dark Mode ──────────────────────────────────────────────────────────────
    const [isDark, setIsDark] = useState(
        () => localStorage.getItem('mindpath_theme') === 'dark'
    );

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('mindpath_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('mindpath_theme', 'light');
        }
    };

    // ── Menú dinámico por rol ──────────────────────────────────────────────────
    const menuByRole = {
        doctor: [
            { name: 'Panel',          path: '/doctor/dashboard',        icon: LayoutDashboard },
            { name: 'Pacientes',      path: '/doctor/patients',          icon: Users },
            { name: 'Agenda',         path: '/doctor/schedule',          icon: Calendar },
            { name: 'Estadísticas',   path: '/doctor/stats',             icon: BarChart3 },
            { name: 'Perfil',         path: '/doctor/profile-settings',  icon: Settings },
        ],

        patient: [
            { name: 'Inicio',    path: '/patient/dashboard',    icon: LayoutDashboard },
            { name: 'Mis Citas', path: '/patient/appointments', icon: Calendar },
            { name: 'Doctores',  path: '/patient/doctors',      icon: Users },
            { name: 'Historial', path: '/patient/history',      icon: FileText },
            { name: 'Mi Perfil', path: '/patient/settings',     icon: Settings },
        ],
        admin: [
            { name: 'Administración', path: '/admin/dashboard', icon: ShieldCheck },
        ],
        supervisor: [
            { name: 'Administración', path: '/admin/dashboard', icon: ShieldCheck },
        ],
    };

    const menuItems = menuByRole[user?.role] || [];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isDarkClass = isDark
        ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)] text-white'
        : 'bg-white border-gray-200 text-gray-800';

    const mainBg = isDark ? 'bg-[var(--bg-main)]' : 'bg-gray-50';

    // Sidebar Sidebar content reutilizable
    const renderSidebarContent = () => (
        <>
            {/* Logo */}
            <div className={`h-16 flex items-center justify-between px-5 border-b ${isDark ? 'border-[var(--border-color)]' : 'border-gray-100'}`}>
                <div className="flex items-center truncate">
                {logoUrl ? (
                        <img src={logoUrl.startsWith('http') ? logoUrl : `${BACKEND_URL}${logoUrl}`}
                            alt="Logo" className={`h-9 w-auto object-contain mr-2 shrink-0 rounded-md ${isDark ? 'brightness-[2] saturate-150' : 'mix-blend-multiply'}`} />
                    ) : (
                        <img src="/logo.png" alt="MindPath Logo"
                            className={`h-9 w-auto object-contain mr-2 shrink-0 rounded-md ${isDark ? 'brightness-[2] saturate-150' : 'mix-blend-multiply'}`} />
                    )}
                    <span className={`text-lg font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {clinicName}
                    </span>
                </div>
                {/* Botón de cerrar para el sidebar móvil */}
                <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                                isActive
                                    ? 'bg-mindpath-light text-mindpath-primary font-semibold shadow-sm'
                                    : isDark
                                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-mindpath-primary'
                            }`}
                        >
                            <item.icon size={19} className="mr-3 shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer del sidebar */}
            <div className={`p-3 border-t space-y-1 ${isDark ? 'border-[var(--border-color)]' : 'border-gray-100'}`}>
                {/* Toggle Dark Mode */}
                <button
                    onClick={toggleDark}
                    className={`flex items-center w-full px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        isDark
                            ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                    {isDark
                        ? <><Sun size={18} className="mr-3" /> Modo Claro</>
                        : <><Moon size={18} className="mr-3" /> Modo Oscuro</>
                    }
                </button>

                {/* Cerrar sesión */}
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all text-sm font-medium"
                >
                    <LogOut size={18} className="mr-3" />
                    Cerrar Sesión
                </button>
            </div>
        </>
    );

    return (
        <div className={`flex h-screen font-sans ${mainBg}`}>
            {/* Sidebar de Escritorio */}
            <aside className={`w-64 border-r flex flex-col hidden md:flex ${isDarkClass}`}>
                {renderSidebarContent()}
            </aside>

            {/* Menú Lateral Móvil (Drawer) */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop oscuro con fade en difuminado */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsMobileOpen(false)}
                    />
                    
                    {/* Contenido del Sidebar deslizable */}
                    <aside className={`relative w-72 max-w-xs h-full flex flex-col z-10 shadow-2xl transition-transform duration-300 transform translate-x-0 ${isDarkClass}`}>
                        {renderSidebarContent()}
                    </aside>
                </div>
            )}

            {/* Contenido Principal */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar Responsivo */}
                <header className={`h-16 border-b flex items-center justify-between px-4 md:px-8 z-10 ${isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        {/* Botón hamburguesa sólo en móvil */}
                        <button 
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 md:hidden rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        
                        <h2 className={`text-base md:text-lg font-black italic tracking-wide ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {menuItems.find(i => location.pathname.startsWith(i.path))?.name || 'Panel'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex flex-col items-end">
                            <span className={`text-xs md:text-sm font-black tracking-tight truncate max-w-[120px] md:max-w-[200px] ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {user?.full_name}
                            </span>
                            <span className="text-[9px] md:text-[10px] font-bold text-mindpath-primary uppercase tracking-widest bg-mindpath-light/50 px-2 py-0.5 rounded-full mt-0.5">
                                {{ patient: 'Paciente', doctor: 'Especialista', admin: 'Administrador', supervisor: 'Supervisor' }[user?.role] || user?.role}
                            </span>
                        </div>
                        <div className="shrink-0">
                            <Avatar fullName={user?.full_name} profilePictureUrl={user?.profile_picture} size="9 md:size-12" />
                        </div>
                    </div>
                </header>

                {/* Área de pantallas responsiva (p-4 en móvil, p-8 en escritorio) */}
                <div className={`flex-1 overflow-auto p-4 md:p-8 ${isDark ? 'bg-[var(--bg-main)]' : 'bg-gray-50'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
