import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ClipboardList, User as UserIcon, Calendar } from 'lucide-react';

const PatientFile = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/doctors/patient/${id}`);
                setData(res.data);
            } catch (e) {
                console.error('Error cargando expediente', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="p-20 text-center">Cargando expediente...</div>;
    if (!data) return <div className="p-20 text-center text-red-500">No se pudo cargar el expediente.</div>;

    const initials = data.info?.full_name ? data.info.full_name[0] : '?';

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center shadow-sm">
                    <div className="w-24 h-24 bg-mindpath-light rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-mindpath-primary">
                        {initials}
                    </div>
                    <h2 className="text-xl font-black">{data.info?.full_name}</h2>
                    <p className="text-gray-400 text-sm mb-6">{data.info?.email}</p>
                    <div className="text-left space-y-3 pt-6 border-t border-dashed">
                        <p className="text-xs font-bold text-gray-400 uppercase">Datos Generales</p>
                        <p className="text-sm font-medium">📱 {data.info?.phone || 'N/D'}</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-black flex items-center"><ClipboardList className="mr-2 text-mindpath-primary"/> Historial de Consultas</h3>
                <div className="space-y-4">
                    {data.history?.length > 0 ? data.history.map(h => (
                        <div key={h.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black bg-purple-50 text-purple-600 px-3 py-1 rounded-full">{h.type}</span>
                                <span className="text-gray-400 text-xs font-bold flex items-center"><Calendar size={14} className="mr-1" />{new Date(h.appointment_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 italic">
                                {h.report_summary || 'No hay informe clínico disponible para esta sesión.'}
                            </p>
                        </div>
                    )) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 font-bold">
                            Aún no hay historial disponible.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default PatientFile;
