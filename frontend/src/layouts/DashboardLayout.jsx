import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, Calendar, Users, Settings, LogOut, BrainCircuit } from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();

    // Menú dinámico según el rol
    const menuItems = user?.role === 'doctor' ? [
        { name: 'Panel', path: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Pacientes', path: '/doctor/patients', icon: Users },
        { name: 'Agenda', path: '/doctor/schedule', icon: Calendar },
        { name: 'Perfil', path: '/doctor/profile-settings', icon: Settings },
    ] : [
        { name: 'Inicio', path: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'Mis Citas', path: '/patient/appointments', icon: Calendar },
        { name: 'Doctores', path: '/patient/doctors', icon: Users },
        { name: 'Mi Perfil', path: '/patient/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login'; // Forzamos recarga para limpiar memoria
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <BrainCircuit className="text-mindpath-primary mr-2" size={28} />
                    <span className="text-xl font-bold text-mindpath-dark tracking-wide">Mindpath</span>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                                    isActive 
                                    ? 'bg-mindpath-light text-mindpath-primary font-semibold' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-mindpath-primary'
                                }`}
                            >
                                <item.icon size={20} className="mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                        <LogOut size={20} className="mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar Pequeño */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {menuItems.find(i => location.pathname.includes(i.path))?.name || 'Dashboard'}
                    </h2>
                    <div className="flex items-center">
                        <div className="flex flex-col items-end mr-3">
                            <span className="text-sm font-bold text-gray-800">{user?.full_name}</span>
                            <span className="text-xs text-mindpath-primary capitalize">{user?.role}</span>
                        </div>
                        <div className="h-10 w-10 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary font-bold border border-violet-100">
                            {user?.full_name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Área de inyección de pantallas */}
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
