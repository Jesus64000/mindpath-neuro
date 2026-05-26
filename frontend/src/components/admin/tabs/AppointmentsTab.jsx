import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Filter, Video, Users, RefreshCw, Search } from 'lucide-react';
import api from '../../../api/axiosConfig';
import CustomSelect from '../shared/CustomSelect';
import Pagination from '../shared/Pagination';

const AppointmentsTab = () => {
    const [appointments, setAppointments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (searchTerm) params.set('search', searchTerm);
            params.set('page', page);
            params.set('limit', 10);
            
            const res = await api.get(`/admin/appointments?${params.toString()}`);
            setAppointments(res.data.data);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Error cargando citas globales", error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchTerm, page]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleStatusChange = (val) => {
        setStatusFilter(val);
        setPage(1); // Reset to first page
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPage(1);
            fetchAppointments();
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: 'bg-green-500/10 text-green-500 border border-green-500/20',
            cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20',
            scheduled: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
            confirmed: 'bg-mindpath-primary/10 text-mindpath-primary border border-mindpath-primary/20',
            pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
        };
        const statusMap = {
            completed: 'Completada',
            cancelled: 'Cancelada',
            scheduled: 'Programada',
            confirmed: 'Confirmada',
            pending: 'Pendiente'
        };
        const label = statusMap[status] || status;
        const style = badges[status] || 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
        return <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${style}`}>{label}</span>;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Cabecera y Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[var(--bg-card)] p-5 rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon size={20} className="text-mindpath-primary" />
                        Registro Global de Citas
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-tight">Supervisión administrativa de consultas</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* BUSCADOR */}
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mindpath-primary transition-colors" />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Buscar paciente o Dr."
                            className="pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:border-mindpath-primary w-48 transition-all"
                        />
                    </div>

                    <button 
                        onClick={() => { setPage(1); fetchAppointments(); }}
                        className="p-2.5 text-gray-400 hover:text-mindpath-primary transition-colors bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <CustomSelect 
                        className="w-44"
                        value={statusFilter}
                        onChange={handleStatusChange}
                        options={[
                            { value: '', label: 'Cualquier estado' },
                            { value: 'scheduled', label: 'Programadas' },
                            { value: 'confirmed', label: 'Confirmadas' },
                            { value: 'completed', label: 'Completadas' },
                            { value: 'cancelled', label: 'Canceladas' }
                        ]}
                    />
                </div>
            </div>

            {/* Tabla de Datos */}
            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] overflow-hidden shadow-sm">
                {loading && !appointments.length ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 dark:border-slate-800 border-t-mindpath-primary"></div>
                        <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Sincronizando registros...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarIcon size={48} className="text-gray-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 font-bold">No se encontraron citas registradas.</p>
                        <p className="text-xs text-gray-400 mt-1">Prueba a cambiar los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Fecha y Hora</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Paciente</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Doctor Especialista</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Modalidad</th>
                                    <th className="p-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {appointments.map((appt) => (
                                    <tr key={appt.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="p-5">
                                            <p className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-tight">
                                                {new Date(appt.appointment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold mt-1">
                                                {appt.start_time.substring(0, 5)} hrs
                                            </p>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-mindpath-primary transition-colors">{appt.patient_name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Expediente General</p>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">Dr. {appt.doctor_name}</p>
                                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest mt-1">{appt.specialty}</p>
                                        </td>
                                        <td className="p-5 whitespace-nowrap">
                                            {appt.type === 'virtual' ? (
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full w-fit border border-blue-100 dark:border-blue-800/30">
                                                    <Video size={12}/> Virtual
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full w-fit border border-emerald-100 dark:border-emerald-800/30">
                                                    <Users size={12}/> Presencial
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Paginación */}
            <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
    );
};

export default AppointmentsTab;
