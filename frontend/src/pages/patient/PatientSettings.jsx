import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { User, Phone, MapPin, Save, Camera, CheckCircle, AlertCircle, Mail, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { BACKEND_URL } from '../../api/constants';

const PatientSettings = () => {
    const { user, updateUser } = useAuthStore();
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', address: '', date_of_birth: '', gender: ''
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        api.get('/patients/profile').then(res => {
            const d = res.data;
            setFormData({
                full_name:     d.full_name     ?? '',
                email:         d.email         ?? '',
                phone:         d.phone         ?? '',
                address:       d.address       ?? '',
                date_of_birth: d.date_of_birth ? d.date_of_birth.slice(0, 10) : '',
                gender:        d.gender        ?? 'F',
            });
            if (d.profile_picture) setProfilePicture(d.profile_picture);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

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
            updateUser({ profile_picture: res.data.url }); // Sincronizar instantáneamente con el header
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Error al subir la foto.');
            setPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/patients/profile', {
                full_name: formData.full_name,
                phone:     formData.phone,
                address:   formData.address,
            });
            updateUser({ full_name: formData.full_name });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Error al guardar los cambios.');
        }
    };

    const avatarSrc = preview
        ? preview
        : profilePicture
            ? `${BACKEND_URL}${profilePicture}`
            : null;

    const genderLabel = { M: 'Masculino', F: 'Femenino', O: 'Otro' };

    if (loading) return <div className="p-20 text-center font-bold text-mindpath-primary">Cargando tu perfil...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mi Perfil</h1>
                    <p className="text-gray-500 dark:text-slate-400">Mantén tu información actualizada.</p>
                </div>
                {saved && (
                    <div className="flex items-center text-green-600 font-bold animate-bounce">
                        <CheckCircle size={20} className="mr-2"/> ¡Cambios guardados!
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Foto de perfil */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Foto de perfil"
                                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg" />
                        ) : (
                            <div className="w-28 h-28 bg-mindpath-light dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl font-black text-mindpath-primary dark:text-mindpath-primary border-4 border-white dark:border-slate-700 shadow-lg">
                                {formData.full_name ? formData.full_name[0].toUpperCase() : 'P'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Camera className="text-white" size={22}/>
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <div>
                        <p className="font-black text-xl text-gray-900 dark:text-white">{formData.full_name}</p>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">{formData.email}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{genderLabel[formData.gender]} • {formData.date_of_birth ? new Date(formData.date_of_birth + 'T12:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="mt-3 text-sm font-bold text-mindpath-primary dark:text-mindpath-primary hover:underline flex items-center gap-1">
                            <Camera size={14}/> Cambiar foto de perfil
                        </button>
                        {uploadError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/> {uploadError}</p>
                        )}
                    </div>
                </div>

                {/* Información personal */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2"><User size={18} className="text-mindpath-primary dark:text-mindpath-primary"/> Información Personal</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2"><User size={13}/> Nombre Completo</label>
                            <input type="text" value={formData.full_name}
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                placeholder="Tu nombre completo" />
                        </div>

                        {/* Email (readonly) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2"><Mail size={13}/> Correo Electrónico</label>
                            <input type="email" value={formData.email} readOnly
                                className="w-full p-4 bg-gray-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-gray-400 cursor-not-allowed outline-none" />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2"><Phone size={13}/> Teléfono</label>
                            <input type="tel" value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                                placeholder="+58 412 000 0000" />
                        </div>

                        {/* Fecha (readonly) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2"><Calendar size={13}/> Fecha de Nacimiento</label>
                            <input type="date" value={formData.date_of_birth} readOnly
                                className="w-full p-4 bg-gray-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-gray-400 cursor-not-allowed outline-none" />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2 flex items-center gap-2"><MapPin size={13}/> Dirección</label>
                        <input type="text" value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 placeholder-gray-400 dark:placeholder-slate-500"
                            placeholder="Ej. Av. Bella Vista, Edif. Torres, Apto 3B, Maracaibo" />
                    </div>
                </div>

                <button type="submit"
                    className="w-full py-5 bg-gray-900 text-white font-black rounded-[1.5rem] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200">
                    <Save size={20}/> GUARDAR CAMBIOS
                </button>
            </form>
        </div>
    );
};

export default PatientSettings;
