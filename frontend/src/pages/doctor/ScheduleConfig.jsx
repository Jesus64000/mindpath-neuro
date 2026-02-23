import { useState } from 'react';
import api from '../../api/axiosConfig';
import { Clock, Save } from 'lucide-react';

const ScheduleConfig = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const [schedule, setSchedule] = useState(days.map(d => ({ day: d, start: '08:00', end: '16:00' })));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/doctors/update-schedule', { schedules: schedule });
            alert('¡Horarios guardados con éxito!');
        } catch (e) {
            alert('Error al guardar horarios');
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const updateTime = (idx, field, value) => {
        const next = [...schedule];
        next[idx][field] = value;
        setSchedule(next);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-black mb-2 flex items-center"><Clock className="mr-4 text-mindpath-primary" size={36}/> Configuración de Agenda</h1>
            <p className="text-gray-500">Define tus bloques de atención por día. Se guardarán y reemplazarán tus horarios anteriores.</p>
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
                {schedule.map((s, idx) => (
                    <div key={s.day} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl gap-4">
                        <span className="font-black text-gray-700 w-32">{s.day}</span>
                        <div className="flex items-center gap-4">
                            <input 
                                type="time" value={s.start}
                                onChange={(e) => updateTime(idx, 'start', e.target.value)}
                                className="p-2 rounded-xl border-none font-bold bg-white shadow-inner"
                            />
                            <span className="text-gray-400">a</span>
                            <input 
                                type="time" value={s.end}
                                onChange={(e) => updateTime(idx, 'end', e.target.value)}
                                className="p-2 rounded-xl border-none font-bold bg-white shadow-inner"
                            />
                        </div>
                    </div>
                ))}
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-mindpath-primary text-white font-black rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <Save size={20}/> {saving ? 'Guardando...' : 'GUARDAR MI DISPONIBILIDAD'}
                </button>
            </div>
        </div>
    );
};
export default ScheduleConfig;
