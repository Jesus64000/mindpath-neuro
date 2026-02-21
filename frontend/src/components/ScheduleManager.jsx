import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Clock, Plus, Trash2, AlertCircle } from 'lucide-react';

const dayTranslations = {
    Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
    Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo'
};

const ScheduleManager = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '12:00'
    });

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules/me');
            setSchedules(response.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error al cargar tus horarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Aseguramos formato HH:mm:ss para MySQL
            const payload = {
                ...formData,
                start_time: `${formData.start_time}:00`,
                end_time: `${formData.end_time}:00`
            };
            await api.post('/schedules', payload);
            fetchSchedules(); // Recargamos la lista
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el horario.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/schedules/${id}`);
            setSchedules(schedules.filter(s => s.id !== id)); // Actualizamos el estado sin recargar
        } catch (err) {
            setError('No se pudo eliminar el horario.');
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-mindpath-dark mb-6 flex items-center">
                <Clock className="text-mindpath-primary mr-2" />
                Mi Disponibilidad
            </h3>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 flex items-center rounded-xl text-sm">
                    <AlertCircle size={18} className="mr-2" />
                    {error}
                </div>
            )}

            {/* Formulario para agregar */}
            <form onSubmit={handleAddSchedule} className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Día de la semana</label>
                    <select 
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary outline-none"
                    >
                        {Object.entries(dayTranslations).map(([en, es]) => (
                            <option key={en} value={en}>{es}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hora Inicio</label>
                    <input 
                        type="time" 
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary outline-none"
                        required
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hora Fin</label>
                    <input 
                        type="time" 
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary outline-none"
                        required
                    />
                </div>
                <div className="flex items-end">
                    <button type="submit" className="w-full md:w-auto px-6 py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-medium rounded-xl flex items-center justify-center transition-colors">
                        <Plus size={20} className="mr-1" /> Agregar
                    </button>
                </div>
            </form>

            {/* Lista de horarios activos */}
            <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Horarios Configuradas</h4>
                {loading ? (
                    <p className="text-gray-400">Cargando...</p>
                ) : schedules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="flex justify-between items-center p-4 bg-mindpath-light border border-violet-100 rounded-2xl">
                                <div>
                                    <p className="font-bold text-mindpath-dark">{dayTranslations[schedule.day_of_week]}</p>
                                    <p className="text-sm text-mindpath-primary font-medium">
                                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleDelete(schedule.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar horario"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">Aún no has configurado tu disponibilidad.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleManager;