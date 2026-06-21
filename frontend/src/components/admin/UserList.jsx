import { ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';

const ROLE_LABEL = {
    admin: { label: 'Admin', color: 'text-mindpath-primary bg-mindpath-light' },
    supervisor: { label: 'Supervisor', color: 'text-blue-700 bg-blue-100' },
    doctor: { label: 'Especialista / Doctor', color: 'text-green-700 bg-green-100' },
    patient: { label: 'Paciente', color: 'text-gray-700 bg-gray-100' },
};

const UserList = ({ 
    users, 
    currentUser, 
    onToggleActive, 
    onChangeRole, 
    onUserClick, // Nuevo prop
    roleDropdown, 
    setRoleDropdown, 
    changingRole 
}) => {
    
    const isAdmin = currentUser?.role === 'admin';
    const isSupervisor = currentUser?.role === 'supervisor';

    // Regla de negocio del CTO: 
    // Admin puede editar a todos. 
    // Supervisor solo puede editar a Doctores y Pacientes.
    const canEdit = (targetRole) => {
        if (isAdmin) return true;
        if (isSupervisor) {
            return targetRole === 'doctor' || targetRole === 'patient';
        }
        return false;
    };

    return (
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
            {users.map((u, i) => {
                const roleInfo = ROLE_LABEL[u.role] || { label: u.role, color: 'text-gray-600 bg-gray-100' };
                const isSelf = u.id === currentUser?.id;
                const hasPermission = !isSelf && canEdit(u.role);

                return (
                    <div 
                        key={u.id} 
                        onClick={() => onUserClick?.(u)}
                        className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-all ${i !== 0 ? 'border-t border-gray-50 dark:border-[var(--border-color)]' : ''} ${!u.is_active ? 'opacity-60' : ''}`}
                    >
                        <div className="h-10 w-10 rounded-full bg-mindpath-light flex items-center justify-center text-mindpath-primary font-bold text-sm shrink-0">
                            {u.full_name?.charAt(0) || '?'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{u.full_name}</p>
                                {isSelf && <span className="text-[10px] text-gray-400 font-black">(Tú)</span>}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                                {!u.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspendido</span>}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            {isAdmin && !isSelf && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setRoleDropdown(prev => prev === u.id ? null : u.id); }}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-mindpath-primary text-gray-600 dark:text-slate-300 transition-colors"
                                    >
                                        {changingRole === u.id ? '…' : 'Rol'} <ChevronDown size={12}/>
                                    </button>
                                    {roleDropdown === u.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-30 overflow-hidden">
                                            {Object.entries(ROLE_LABEL).filter(([r]) => r !== u.role).map(([r, info]) => (
                                                <button key={r} onClick={(e) => { e.stopPropagation(); onChangeRole(u.id, r); }}
                                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors">
                                                    {info.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isSelf && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); hasPermission && onToggleActive(u.id, u.is_active); }}
                                    title={u.is_active ? 'Suspender cuenta' : 'Reactivar cuenta'}
                                    disabled={!hasPermission}
                                    className={`p-2 rounded-xl transition-colors ${
                                        !hasPermission 
                                        ? 'text-gray-200 cursor-not-allowed' 
                                        : u.is_active 
                                            ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                            : 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                >
                                    {u.is_active ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default UserList;
