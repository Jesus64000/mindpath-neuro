import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import UserList from '../UserList';
import UserDetailModal from '../shared/UserDetailModal';

const UsersTab = ({ 
    users, 
    loading, 
    userSearch, 
    setUserSearch, 
    userRoleFilter, 
    setUserRoleFilter, 
    onSearch, 
    currentUser, 
    onToggleActive, 
    onChangeRole, 
    roleDropdown, 
    setRoleDropdown, 
    changingRole 
}) => {
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h2 className="font-bold text-gray-800 dark:text-white">
                    Gestión de Usuarios
                    {!loading && <span className="ml-2 text-xs font-normal text-gray-400">({users.length} resultados)</span>}
                </h2>
                
                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onSearch()}
                            placeholder="Buscar nombre o email..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-[var(--border-color)] rounded-xl focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:text-white w-52"
                        />
                    </div>
                    
                    <select
                        value={userRoleFilter}
                        onChange={e => setUserRoleFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-[var(--border-color)] rounded-xl focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:text-white"
                    >
                        <option value="">Todos los roles</option>
                        <option value="admin">Admin</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Paciente</option>
                    </select>

                    <button 
                        onClick={onSearch} 
                        className="px-4 py-2 bg-mindpath-primary text-white text-sm font-bold rounded-xl hover:bg-mindpath-primaryHover transition-colors"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-400 animate-pulse p-6">Cargando usuarios...</p>
            ) : users.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                    <Users size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400">No se encontraron usuarios.</p>
                </div>
            ) : (
                <UserList 
                    users={users} 
                    currentUser={currentUser}
                    onUserClick={setSelectedUser}
                    onToggleActive={onToggleActive}
                    onChangeRole={onChangeRole}
                    roleDropdown={roleDropdown}
                    setRoleDropdown={setRoleDropdown}
                    changingRole={changingRole}
                />
            )}

            {selectedUser && (
                <UserDetailModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                />
            )}
        </div>
    );
};

export default UsersTab;
