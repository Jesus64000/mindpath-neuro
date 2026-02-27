import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { User, Search, ChevronRight, Users } from 'lucide-react';

const PatientsList = () => {
    const [patients, setPatients] = useState([]);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/doctors/my-patients');
                setPatients(res.data);
            } catch (e) {
                console.error('Error cargando pacientes', e);
            }
        };
        load();
    }, []);

    const q = query.toLowerCase();
    const filtered = patients.filter(p => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));

    const formatDate = (value) => {
        if (!value) return 'Sin visitas';
        const d = new Date(value);
        return isNaN(d.getTime()) ? 'Sin visitas' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-mindpath-light dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-mindpath-primary">
                        <Users size={22} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mis Pacientes</h1>
                </div>

                {/* Buscador */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-sm w-full sm:w-auto gap-2">
                    <Search size={18} className="text-gray-400 dark:text-slate-500 shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por nombre o email"
                        className="outline-none text-sm bg-transparent text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 w-full sm:w-56"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-white/10">
                        <tr>
                            <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Paciente</th>
                            <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Contacto</th>
                            <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Última Visita</th>
                            <th className="p-5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr
                                key={p.id}
                                className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/doctor/patient/${p.id}`)}
                            >
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-mindpath-light dark:bg-purple-900/40 rounded-full flex items-center justify-center text-mindpath-primary font-bold shrink-0">
                                            {p.full_name ? p.full_name[0].toUpperCase() : <User size={16} />}
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white">{p.full_name}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-gray-500 dark:text-slate-400 text-sm hidden md:table-cell">{p.email}</td>
                                <td className="p-5 text-sm font-medium text-gray-600 dark:text-slate-300 hidden sm:table-cell">{formatDate(p.last_visit)}</td>
                                <td className="p-5 text-right">
                                    <ChevronRight size={20} className="text-gray-300 dark:text-slate-600 inline group-hover:text-mindpath-primary" />
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-12 text-center text-gray-400 dark:text-slate-500 font-bold">
                                    <User size={36} className="mx-auto mb-3 opacity-30" />
                                    Sin pacientes aún
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {filtered.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-right">
                    {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};

export default PatientsList;
