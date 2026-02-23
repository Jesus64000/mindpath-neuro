import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { User, Search, ChevronRight } from 'lucide-react';

const PatientsList = () => {
    const [patients, setPatients] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/doctors/my-patients');
                setPatients(res.data);
                setFiltered(res.data);
            } catch (e) {
                console.error('Error cargando pacientes', e);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const q = query.toLowerCase();
        const next = patients.filter(p => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
        setFiltered(next);
    }, [query, patients]);

    const formatDate = (value) => {
        if (!value) return 'Sin visitas';
        const d = new Date(value);
        return isNaN(d.getTime()) ? 'Sin visitas' : d.toLocaleDateString();
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-3xl font-black">Mis Pacientes</h1>
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por nombre o email"
                        className="outline-none text-sm"
                    />
                </div>
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-5 font-bold text-gray-400 text-xs uppercase">Paciente</th>
                            <th className="p-5 font-bold text-gray-400 text-xs uppercase">Contacto</th>
                            <th className="p-5 font-bold text-gray-400 text-xs uppercase">Última Visita</th>
                            <th className="p-5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                <td className="p-5 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                        {p.full_name ? p.full_name[0] : <User size={16} />}
                                    </div>
                                    <span className="font-bold">{p.full_name}</span>
                                </td>
                                <td className="p-5 text-gray-500 text-sm">{p.email}</td>
                                <td className="p-5 text-sm font-medium">{formatDate(p.last_visit)}</td>
                                <td className="p-5 text-right"><ChevronRight size={20} className="text-gray-300 inline"/></td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400 font-bold">Sin pacientes aún</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default PatientsList;
