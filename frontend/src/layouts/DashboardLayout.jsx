import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import useSettingsStore from '../store/useSettingsStore';
import {
    LayoutDashboard, Calendar, Users, Settings, LogOut,
    BrainCircuit, Sun, Moon, ShieldCheck, FileText
} from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const { clinicName, logoUrl } = useSettingsStore();
    const location = useLocation();

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
            { name: 'Panel',     path: '/doctor/dashboard',        icon: LayoutDashboard },
            { name: 'Pacientes', path: '/doctor/patients',          icon: Users },
            { name: 'Agenda',    path: '/doctor/schedule',          icon: Calendar },
            { name: 'Perfil',    path: '/doctor/profile-settings',  icon: Settings },
        ],
        patient: [
            { name: 'Inicio',    path: '/patient/dashboard',    icon: LayoutDashboard },
            { name: 'Mis Citas', path: '/patient/appointments', icon: Calendar },
            { name: 'Doctores',  path: '/patient/doctors',      icon: Users },
            { name: 'Historial', path: '/patient/history',      icon: FileText },
            { name: 'Mi Perfil', path: '/patient/settings',     icon: Settings },
        ],
        admin: [
            { name: 'Admin Panel', path: '/admin/dashboard', icon: ShieldCheck },
        ],
        supervisor: [
            { name: 'Panel Admin', path: '/admin/dashboard', icon: ShieldCheck },
        ],
    };

    const menuItems = menuByRole[user?.role] || [];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isDarkClass = isDark
        ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]'
        : 'bg-white border-gray-200';

    const mainBg = isDark ? 'bg-[var(--bg-main)]' : 'bg-gray-50';

    return (
        <div className={`flex h-screen font-sans ${mainBg}`}>
            {/* Sidebar */}
            <aside className={`w-64 border-r flex flex-col hidden md:flex ${isDarkClass}`}>

                {/* Logo */}
                <div className={`h-16 flex items-center px-5 border-b ${isDark ? 'border-[var(--border-color)]' : 'border-gray-100'}`}>
                    {logoUrl ? (
                        <img src={logoUrl.startsWith('http') ? logoUrl : `http://localhost:3000${logoUrl}`}
                            alt="Logo" className="h-8 w-auto object-contain mr-2" />
                    ) : (
                        <BrainCircuit className="text-mindpath-primary mr-2 shrink-0" size={26} />
                    )}
                    <span className={`text-lg font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-mindpath-dark'}`}>
                        {clinicName}
                    </span>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-3 py-5 space-y-1">
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
                        className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
                    >
                        <LogOut size={18} className="mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className={`h-16 border-b flex items-center justify-between px-8 z-10 ${isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-white border-gray-200'}`}>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {menuItems.find(i => location.pathname.startsWith(i.path))?.name || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {user?.full_name}
                            </span>
                            <span className="text-xs text-mindpath-primary capitalize">{user?.role}</span>
                        </div>
                        <div className="h-9 w-9 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary font-bold border border-violet-100">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Área de pantallas */}
                <div className={`flex-1 overflow-auto p-8 ${isDark ? 'bg-[var(--bg-main)]' : 'bg-gray-50'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
