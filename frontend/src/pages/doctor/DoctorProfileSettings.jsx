import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import {
    User, MapPin, Award, BookOpen, Save, Camera, CheckCircle,
    GraduationCap, Building2, AlertCircle, ChevronDown, Globe, CreditCard, Trash2
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
    const [signaturePicture, setSignaturePicture] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const [clinicsCatalog, setClinicsCatalog] = useState([]);
    const [selectedClinics, setSelectedClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState('');
    const [customClinicAddress, setCustomClinicAddress] = useState('');
    const [modality, setModality] = useState('ambas');

    const handleAddClinic = () => {
        if (!selectedClinicId) return;
        const exists = selectedClinics.some(sc => String(sc.clinic_id) === String(selectedClinicId));
        if (exists) {
            alert('Esta clínica ya ha sido agregada.');
            return;
        }
        setSelectedClinics([...selectedClinics, { clinic_id: parseInt(selectedClinicId), custom_address: customClinicAddress }]);
        setSelectedClinicId('');
        setCustomClinicAddress('');
    };

    const [showCustomClinicModal, setShowCustomClinicModal] = useState(false);
    const [customClinicForm, setCustomClinicForm] = useState({
        name: '',
        address: '',
        clinic_type: 'Consultorio en Casa'
    });
    const [customClinicLoading, setCustomClinicLoading] = useState(false);

    const handleRequestCustomClinic = async (e) => {
        e.preventDefault();
        if (!customClinicForm.name.trim() || !customClinicForm.address.trim()) {
            alert('Por favor completa el nombre y la dirección completa.');
            return;
        }
        setCustomClinicLoading(true);
        try {
            const res = await api.post('/doctors/custom-clinic', customClinicForm);
            alert(res.data.message || 'Solicitud registrada exitosamente.');
            const profileRes = await api.get('/doctors/profile/settings');
            setSelectedClinics(profileRes.data.clinics || []);
            setShowCustomClinicModal(false);
            setCustomClinicForm({ name: '', address: '', clinic_type: 'Consultorio en Casa' });
        } catch (err) {
            alert(err.response?.data?.message || 'Error al solicitar consultorio.');
        } finally {
            setCustomClinicLoading(false);
        }
    };

    const handleRemoveClinic = (clinicId) => {
        setSelectedClinics(selectedClinics.filter(sc => String(sc.clinic_id) !== String(clinicId)));
    };

    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);
    const signatureInputRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get('/doctors/profile/settings'),
            api.get('/doctors/specialties'),
            api.get('/doctors/payment-methods'),
            api.get('/doctors/clinics'),
        ]).then(([profileRes, specialtiesRes, paymentRes, clinicsRes]) => {
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
            if (d.signature_picture) setSignaturePicture(d.signature_picture);
            setModality(d.modality || 'ambas');
            setSelectedClinics(d.clinics || []);
            setClinicsCatalog(clinicsRes.data || []);
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

    const handleSignatureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadError('');
        setSignaturePreview(URL.createObjectURL(file));
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await api.post('/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSignaturePicture(res.data.url);
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Error al subir la firma.');
            setSignaturePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (modality !== 'online' && selectedClinics.length === 0) {
            alert('Debes seleccionar al menos un centro de salud / clínica.');
            return;
        }
        try {
            await api.put('/doctors/profile/settings', {
                ...formData,
                languages: selectedLanguages.join(', '),
                signature_picture: signaturePicture,
                clinics: selectedClinics,
                modality
            });
            updateUser({ full_name: formData.full_name });
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                window.location.reload();
            }, 1000);
        } catch {
            alert('Error al guardar');
        }
    };

    const avatarSrc = preview
        ? preview
        : profilePicture
            ? (profilePicture.startsWith('http') ? profilePicture : `${BACKEND_URL}${profilePicture}`)
            : null;

    const signatureSrc = signaturePreview
        ? signaturePreview
        : signaturePicture
            ? (signaturePicture.startsWith('http') ? signaturePicture : `${BACKEND_URL}${signaturePicture}`)
            : null;

    if (loading) return <div className="p-20 text-center font-bold text-mindpath-primary">Cargando tu configuración...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mi Perfil Profesional</h1>
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

                    {/* Firma Digital */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm text-center">
                        <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase flex items-center gap-2 mb-3 justify-center">
                            Firma Digital (PNG transparente)
                        </label>
                        <div 
                            className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-mindpath-primary/50 transition-colors bg-gray-50/50 dark:bg-slate-900/10"
                            onClick={() => signatureInputRef.current?.click()}
                        >
                            {signatureSrc ? (
                                <img src={signatureSrc} alt="Firma Digital" className="max-h-20 object-contain mx-auto" />
                            ) : (
                                <div className="py-4 text-gray-400 dark:text-slate-500 flex flex-col items-center gap-2">
                                    <Camera size={24} />
                                    <span className="text-xs font-medium">Subir firma digital</span>
                                </div>
                            )}
                        </div>
                        <input ref={signatureInputRef} type="file" accept="image/png" className="hidden" onChange={handleSignatureChange} />
                        <button type="button" onClick={() => signatureInputRef.current?.click()}
                            className="text-xs font-bold text-mindpath-primary hover:underline block mx-auto mt-3">
                            {signaturePicture ? 'Cambiar firma' : 'Seleccionar firma'}
                        </button>
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
                                    onChange={e => setFormData({...formData, full_name: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})}
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

                            {/* Modalidad de atención */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Modalidad de Atención</label>
                                <div className="relative">
                                    <select value={modality}
                                        onChange={e => setModality(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 appearance-none pr-10">
                                        <option value="ambas">Ambas (Online y Presencial)</option>
                                        <option value="online">Solo Online</option>
                                        <option value="presencial">Solo Presencial</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
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
                    {modality !== 'online' && (
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                            <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2">
                                <MapPin className="text-red-500"/> Centros de Salud / Clínicas
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Selecciona los centros de salud donde consultas y personaliza la dirección de ser necesario.</p>
                            <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                                
                                {/* Clínicas agregadas */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Clínicas asociadas ({selectedClinics.length})</label>
                                    {selectedClinics.length === 0 ? (
                                        <p className="text-xs text-red-500 italic">No has asociado ninguna clínica aún. Debes agregar al menos una usando el selector de abajo o registrando tu consultorio privado.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                            {selectedClinics.map((sc) => {
                                                const clinicObj = clinicsCatalog.find(c => String(c.id) === String(sc.clinic_id)) || sc;
                                                const isPrivate = sc.is_private || clinicObj?.is_private;
                                                const isVerified = (sc.is_verified !== undefined && sc.is_verified !== null) ? sc.is_verified : (clinicObj?.is_verified ?? true);
                                                const clinicType = sc.clinic_type || clinicObj?.clinic_type || 'Consultorio Privado';

                                                return (
                                                    <div key={sc.clinic_id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 text-xs">
                                                        <div className="pr-2 space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold text-gray-900 dark:text-white">{sc.name || clinicObj?.name || 'Consultorio'}</p>
                                                                {isPrivate && (
                                                                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                                        🏠 {clinicType}
                                                                    </span>
                                                                )}
                                                                {isPrivate && !isVerified && (
                                                                    <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
                                                                        ⏳ Pendiente de verificación
                                                                    </span>
                                                                )}
                                                                {isPrivate && isVerified && (
                                                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                                        ✅ Verificado
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                Dirección: {sc.custom_address || clinicObj?.default_address || 'Sin dirección especificada'}
                                                            </p>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveClinic(sc.clinic_id)}
                                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md shrink-0">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Formulario para agregar clínica pública o solicitar consultorio privado */}
                                <div className="border-t border-gray-200 dark:border-slate-700/50 pt-3 space-y-3">
                                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300">Asociar centro de salud público:</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <select value={selectedClinicId} onChange={e => setSelectedClinicId(e.target.value)}
                                                className="block w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs outline-none">
                                                <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Selecciona clínica/centro del catálogo...</option>
                                                {clinicsCatalog.map(c => (
                                                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <input type="text" value={customClinicAddress} onChange={e => setCustomClinicAddress(e.target.value)}
                                                className="block w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs outline-none"
                                                placeholder="Dirección personalizada (opcional)" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                                        <button type="button" onClick={handleAddClinic}
                                            className="px-3 py-1.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white text-xs font-bold rounded-lg transition-all">
                                            + Agregar Centro del Catálogo
                                        </button>

                                        <button type="button" onClick={() => setShowCustomClinicModal(true)}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1">
                                            🏠 Registrar Consultorio Privado / Propio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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

            {/* Modal para Solicitar Registro de Consultorio Privado */}
            {showCustomClinicModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <span>🏠</span> Registrar Consultorio Privado / Propio
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
                            Ingresa los datos de tu consultorio en casa, consultorio alquilado o clínica privada. Tu solicitud será revisada y verificada por el equipo de administración por motivos de seguridad.
                        </p>

                        <form onSubmit={handleRequestCustomClinic} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">
                                    Nombre del Consultorio / Clínica *
                                </label>
                                <input 
                                    type="text"
                                    required
                                    value={customClinicForm.name}
                                    onChange={e => setCustomClinicForm({ ...customClinicForm, name: e.target.value })}
                                    placeholder="Ej: Consultorio Neurológico Dr. Pérez"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">
                                    Tipo de Instalación *
                                </label>
                                <select
                                    value={customClinicForm.clinic_type}
                                    onChange={e => setCustomClinicForm({ ...customClinicForm, clinic_type: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none"
                                >
                                    <option value="Consultorio en Casa">Consultorio en Casa</option>
                                    <option value="Consultorio Alquilado">Consultorio Alquilado</option>
                                    <option value="Clínica / Centro Privado">Clínica / Centro Privado</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">
                                    Dirección Completa *
                                </label>
                                <textarea 
                                    required
                                    rows={3}
                                    value={customClinicForm.address}
                                    onChange={e => setCustomClinicForm({ ...customClinicForm, address: e.target.value })}
                                    placeholder="Ej: Av. Bella Vista con Calle 72, Quinta Los Pinos Nro 45, Planta Baja, Maracaibo"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-mindpath-primary outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomClinicModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={customClinicLoading}
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {customClinicLoading ? 'Enviando...' : 'Enviar a Verificación Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfileSettings;
