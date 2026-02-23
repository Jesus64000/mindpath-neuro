import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { User, MapPin, Award, BookOpen, Save, Camera, CheckCircle } from 'lucide-react';

const DoctorProfileSettings = () => {
    const [formData, setFormData] = useState({
        full_name: '', specialty: '', bio: '', clinic_name: '',
        clinic_address: '', license_number: '', experience_years: '', consultation_fee: ''
    });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        api.get('/doctors/profile/settings').then(res => {
            setFormData(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/doctors/profile/settings', formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            alert('Error al guardar');
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-mindpath-primary">Cargando tu configuración...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 italic">Mi Perfil Profesional</h1>
                    <p className="text-gray-500">Configura cómo te ven tus pacientes en el directorio.</p>
                </div>
                {saved && (
                    <div className="flex items-center text-green-600 font-bold animate-bounce">
                        <CheckCircle size={20} className="mr-2"/> ¡Cambios guardados!
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-sans">
                {/* COLUMNA IZQUIERDA: Foto y Bio */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center relative overflow-hidden">
                        <div className="relative inline-block group cursor-pointer">
                            <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-4 border-4 border-white shadow-md flex items-center justify-center text-4xl font-black text-gray-300">
                                {formData.full_name ? formData.full_name[0] : 'D'}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all mb-4">
                                <Camera className="text-white" />
                            </div>
                        </div>
                        <h2 className="font-black text-lg flex items-center justify-center gap-2"><User size={16}/> {formData.full_name}</h2>
                        <p className="text-mindpath-primary text-sm font-bold uppercase">{formData.specialty}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2 mb-3">
                            <BookOpen size={14}/> Biografía Profesional
                        </label>
                        <textarea 
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            className="w-full h-48 p-4 bg-gray-50 rounded-2xl border-none text-sm leading-relaxed outline-none focus:ring-2 focus:ring-mindpath-primary/20"
                            placeholder="Cuéntale a tus pacientes sobre tu trayectoria..."
                        />
                    </div>
                </div>

                {/* COLUMNA DERECHA: Formularios */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sección: Información Médica */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-black text-xl border-b pb-4 flex items-center gap-2"><Award size={18}/> Credenciales y Experiencia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Especialidad Principal</label>
                                <input 
                                    type="text" value={formData.specialty}
                                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Número de Licencia (MPPS/CM)</label>
                                <input 
                                    type="text" value={formData.license_number}
                                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Años de Experiencia</label>
                                <input 
                                    type="number" value={formData.experience_years}
                                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Costo por Consulta ($)</label>
                                <input 
                                    type="number" value={formData.consultation_fee}
                                    onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Ubicación de Consultorio */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-black text-xl border-b pb-4 flex items-center gap-2">
                            <MapPin className="text-red-500"/> Ubicación del Consultorio
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Nombre de la Clínica / Hospital</label>
                                <input 
                                    type="text" value={formData.clinic_name}
                                    onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                    placeholder="Ej: Centro Médico San Francisco"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Dirección Exacta (Piso, Consultorio, Ciudad)</label>
                                <input 
                                    type="text" value={formData.clinic_address}
                                    onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                                    placeholder="Ej: Calle 72, Piso 4, Cons. 402, Maracaibo"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-5 bg-gray-900 text-white font-black rounded-[1.5rem] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                    >
                        <Save size={20}/> ACTUALIZAR MI PERFIL PÚBLICO
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DoctorProfileSettings;
