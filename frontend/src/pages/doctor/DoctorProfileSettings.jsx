import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import {
    User, MapPin, Award, BookOpen, Save, Camera, CheckCircle,
    GraduationCap, Building2, AlertCircle, ChevronDown, Globe, CreditCard
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import DoctorPaymentMethods from './DoctorPaymentMethods';
import { BACKEND_URL } from '../../api/constants';

// Idiomas predefinidos
const LANGUAGE_OPTIONS = [
    'Español', 'Inglés', 'Francés', 'Portugués', 'Italiano',
    'Alemán', 'Árabe', 'Chino', 'Japonés', 'Ruso'
];

const DoctorProfileSettings = () => {
    const { updateUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        full_name: '', specialty: '', bio: '', clinic_name: '',
        clinic_address: '', license_number: '', experience_years: '',
        education: '', consultation_fee: ''
    });
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [paymentCatalog, setPaymentCatalog] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [profilePicture, setProfilePicture] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get('/doctors/profile/settings'),
            api.get('/doctors/specialties'),
            api.get('/doctors/payment-methods'),
        ]).then(([profileRes, specialtiesRes, paymentRes]) => {
            const d = profileRes.data;
            setFormData({
                full_name:        d.full_name        ?? '',
                specialty:        d.specialty        ?? '',
                bio:              d.bio              ?? '',
                clinic_name:      d.clinic_name      ?? '',
                clinic_address:   d.clinic_address   ?? '',
                license_number:   d.license_number   ?? '',
                experience_years: d.experience_years ?? '',
                education:        d.education        ?? '',
                consultation_fee: d.consultation_fee ?? '',
            });
            // Idiomas: parsear CSV guardado
            if (d.languages) {
                setSelectedLanguages(d.languages.split(',').map(l => l.trim()).filter(Boolean));
            }
            if (d.profile_picture) setProfilePicture(d.profile_picture);
            setSpecialties(specialtiesRes.data.map(s => s.name));
            setPaymentCatalog(paymentRes.data.catalog || []);
            setPaymentMethods(paymentRes.data.methods || []);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    const toggleLanguage = (lang) => {
        setSelectedLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadError('');
        setPreview(URL.createObjectURL(file));
        const form = new FormData();
        form.append('avatar', file);
        try {
            const res = await api.post('/upload/profile-picture', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfilePicture(res.data.url);
            updateUser({ profile_picture: res.data.url });
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Error al subir la foto.');
            setPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/doctors/profile/settings', {
                ...formData,
                languages: selectedLanguages.join(', ')
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Error al guardar');
        }
    };

    const avatarSrc = preview
        ? preview
        : profilePicture
            ? `${BACKEND_URL}${profilePicture}`
            : null;

    if (loading) return <div className="p-20 text-center font-bold text-mindpath-primary">Cargando tu configuración...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white italic">Mi Perfil Profesional</h1>
                    <p className="text-gray-500 dark:text-slate-400">Configura cómo te ven tus pacientes en el directorio.</p>
                </div>
                {saved && activeTab === 'profile' && (
                    <div className="flex items-center text-green-600 font-bold animate-bounce">
                        <CheckCircle size={20} className="mr-2"/> ¡Cambios guardados!
                    </div>
                )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 mb-6 px-2">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={`pb-3 font-black transition-colors ${activeTab === 'profile' ? 'text-mindpath-primary border-b-4 border-mindpath-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    Datos del Perfil
                </button>
                <button 
                    onClick={() => setActiveTab('payments')} 
                    className={`pb-3 font-black transition-colors ${activeTab === 'payments' ? 'text-mindpath-primary border-b-4 border-mindpath-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    Métodos de Pago
                </button>
            </div>

            {activeTab === 'profile' ? (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm text-center">
                        <div className="relative inline-block group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                            {avatarSrc ? (
                                <img src={avatarSrc} alt="Foto de perfil"
                                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white dark:border-slate-700 shadow-md" />
                            ) : (
                                <div className="w-32 h-32 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto flex items-center justify-center text-4xl font-black text-gray-300 dark:text-slate-500 border-4 border-white dark:border-slate-700 shadow-md">
                                    {formData.full_name ? formData.full_name[0].toUpperCase() : 'D'}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <Camera className="text-white" size={24}/>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-mindpath-primary hover:underline block mx-auto mt-3">
                            Cambiar foto
                        </button>
                        {uploadError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center justify-center gap-1">
                                <AlertCircle size={12}/> {uploadError}
                            </p>
                        )}
                        <h2 className="font-black text-lg mt-3 text-gray-900 dark:text-white">{formData.full_name || 'Doctor'}</h2>
                        <p className="text-mindpath-primary dark:text-mindpath-primary text-sm font-bold uppercase">{formData.specialty}</p>
                    </div>

                    {/* Bio */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase flex items-center gap-2 mb-3">
                            <BookOpen size={14}/> Biografía Profesional
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            className="w-full h-48 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-sm text-gray-800 dark:text-slate-200 leading-relaxed outline-none focus:ring-2 focus:ring-mindpath-primary/20 resize-none placeholder-gray-400 dark:placeholder-slate-500"
                            placeholder="Cuéntale a tus pacientes sobre tu trayectoria..."
                        />
                    </div>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Credenciales */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-6">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2">
                            <Award size={18} className="text-mindpath-primary dark:text-mindpath-primary"/> Credenciales y Experiencia
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2">
                                    <User size={13}/> Nombre Completo
                                </label>
                                <input type="text" value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                    placeholder="Dr. Juan Pérez" />
                            </div>

                            {/* Especialidad — dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Especialidad</label>
                                <div className="relative">
                                    <select value={formData.specialty}
                                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 appearance-none pr-10">
                                        <option value="">Selecciona...</option>
                                        {specialties.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        <option value={formData.specialty && !specialties.includes(formData.specialty) ? formData.specialty : ''} disabled={true}>
                                            {formData.specialty && !specialties.includes(formData.specialty) ? `${formData.specialty} (actual)` : ''}
                                        </option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Licencia */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Nro. Licencia / CMVP</label>
                                <input type="text" value={formData.license_number}
                                    onChange={e => setFormData({...formData, license_number: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                    placeholder="MPPS / CMVP" />
                            </div>

                            {/* Años de experiencia */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Años de Experiencia</label>
                                <input type="number" value={formData.experience_years}
                                    onChange={e => setFormData({...formData, experience_years: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                    placeholder="0" min={0} />
                            </div>

                            {/* Tarifa de consulta */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2">
                                    <span className="bg-mindpath-primary text-white text-[10px] px-1.5 py-0.5 rounded-md font-black">$</span> Monto por Consulta
                                </label>
                                <input type="number" value={formData.consultation_fee}
                                    onChange={e => setFormData({...formData, consultation_fee: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                    placeholder="Ej. 40" min={0} step="0.01" />
                            </div>
                        </div>
                    </div>

                    {/* Idiomas multi-select */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2">
                            <Globe size={18} className="text-mindpath-primary dark:text-mindpath-primary"/> Idiomas que dominas
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {LANGUAGE_OPTIONS.map(lang => {
                                const active = selectedLanguages.includes(lang);
                                return (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => toggleLanguage(lang)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                            active
                                                ? 'bg-mindpath-primary text-white border-mindpath-primary shadow-md shadow-mindpath-primary dark:shadow-mindpath-primary/20'
                                                : 'bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:border-mindpath-primary/50'
                                        }`}
                                    >
                                        {lang}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedLanguages.length > 0 && (
                            <p className="text-xs text-gray-400 mt-2">
                                Seleccionado: <span className="font-bold text-mindpath-primary dark:text-mindpath-primary">{selectedLanguages.join(', ')}</span>
                            </p>
                        )}
                    </div>

                    {/* Educación */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2">
                            <GraduationCap size={18} className="text-mindpath-primary dark:text-mindpath-primary"/> Formación Académica
                        </h3>
                        <textarea value={formData.education}
                            onChange={e => setFormData({...formData, education: e.target.value})}
                            className="w-full h-32 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-sm text-gray-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-mindpath-primary/20 resize-none placeholder-gray-400 dark:placeholder-slate-500"
                            placeholder={"Ej. Universidad Central de Venezuela — Medicina, 2015\nHarvard Medical School — Neurología, 2018"} />
                    </div>

                    {/* Ubicación */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2">
                            <MapPin className="text-red-500"/> Ubicación del Consultorio
                        </h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2">
                                <Building2 size={13}/> Clínica / Hospital
                            </label>
                            <input type="text" value={formData.clinic_name}
                                onChange={e => setFormData({...formData, clinic_name: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                placeholder="Ej: Centro Médico San Francisco" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Dirección Exacta</label>
                            <input type="text" value={formData.clinic_address}
                                onChange={e => setFormData({...formData, clinic_address: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                placeholder="Ej: Calle 72, Piso 4, Consultorio 402" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={loading}
                            className="bg-mindpath-primary hover:bg-[#5C27C7] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0px_#5C27C7] hover:shadow-none hover:translate-y-1 hover:translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <Save size={18} className="animate-pulse" /> Guardar Todos los Cambios
                        </button>
                    </div>
                </div>
                </form>
            ) : (
                <DoctorPaymentMethods 
                    paymentCatalog={paymentCatalog} 
                    paymentMethods={paymentMethods} 
                    setPaymentMethods={setPaymentMethods} 
                />
            )}
        </div>
    );
};

export default DoctorProfileSettings;
