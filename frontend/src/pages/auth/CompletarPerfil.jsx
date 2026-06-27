import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Stethoscope, BadgeCheck, BrainCircuit, Phone, Calendar,
    AlertCircle, CheckCircle, Building2, ChevronDown, CreditCard,
    Globe, FileText, Mail, ShieldCheck, Trash2
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useAuthStore } from '../../store/useAuthStore';
import {
    buildPaymentDetails,
    createDefaultPaymentFields,
    getCatalogKey,
    VENEZUELAN_BANKS
} from '../doctor/paymentUtils';

const CompletarPerfil = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuthStore();

    // Datos que vienen de Google (pre-llenados)
    const [googleData, setGoogleData] = useState(null);

    // Rol elegido por el usuario
    const [role, setRole] = useState('patient');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Catálogos de la BD
    const [specialties, setSpecialties] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [paymentCatalogs, setPaymentCatalogs] = useState([]);

    // Campos comunes adicionales
    const [dniPrefix, setDniPrefix] = useState('V');
    const [dniBody,   setDniBody]   = useState('');
    const dni = dniBody ? `${dniPrefix}-${dniBody}` : '';

    // Campos de paciente
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('F');
    const [phonePrefix, setPhonePrefix] = useState('0412');
    const [phoneBody, setPhoneBody] = useState('');

    // Campos de doctor
    const [specialty, setSpecialty] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [modality, setModality] = useState('ambas');
    const [rifPrefix,      setRifPrefix]      = useState('J');
    const [rifBody,        setRifBody]        = useState('');
    const rif = rifBody ? `${rifPrefix}-${rifBody}` : '';
    const [doctorPhonePrefix, setDoctorPhonePrefix] = useState('0412');
    const [doctorPhoneBody, setDoctorPhoneBody] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    
    // Clínicas múltiples
    const [selectedClinics, setSelectedClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState('');
    const [customClinicAddress, setCustomClinicAddress] = useState('');

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

    const handleRemoveClinic = (clinicId) => {
        setSelectedClinics(selectedClinics.filter(sc => String(sc.clinic_id) !== String(clinicId)));
    };
    
    // Métodos de pago múltiples
    const [paymentMethodsList, setPaymentMethodsList] = useState([]);
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [selectedCatalogName, setSelectedCatalogName] = useState('');
    const [paymentFields, setPaymentFields] = useState({ custom_details: '' });
    const [visibleMethodName, setVisibleMethodName] = useState('');
    const [paymentOrder, setPaymentOrder] = useState('1');

    const handleCatalogSelectChange = (e) => {
        const val = e.target.value;
        setSelectedCatalogId(val);
        if (!val) {
            setSelectedCatalogName('');
            setPaymentFields({ custom_details: '' });
            return;
        }
        const cat = paymentCatalogs.find(p => String(p.id) === String(val));
        const catName = cat ? cat.name : '';
        setSelectedCatalogName(catName);
        setPaymentFields(createDefaultPaymentFields(catName, cat?.default_details_template || ''));
    };

    const handleAddPaymentMethod = (e) => {
        e.preventDefault();
        if (!selectedCatalogId) return;
        const details = buildPaymentDetails(selectedCatalogName, paymentFields);
        const name = visibleMethodName || selectedCatalogName;
        const newMethod = {
            catalog_method_id: Number(selectedCatalogId),
            method_name: name,
            account_details: details,
            sort_order: Number(paymentOrder) || 1
        };
        setPaymentMethodsList([...paymentMethodsList, newMethod]);
        
        // Reset form
        setSelectedCatalogId('');
        setSelectedCatalogName('');
        setPaymentFields({ custom_details: '' });
        setVisibleMethodName('');
        setPaymentOrder(String(paymentMethodsList.length + 2));
    };

    // ── Cargar datos de Google desde sessionStorage ─────────────────
    useEffect(() => {
        const rawData = sessionStorage.getItem('google_pending_data');
        if (!rawData) {
            // Si no hay datos pendientes, redirigir al login
            navigate('/login');
            return;
        }
        setGoogleData(JSON.parse(rawData));

        // Cargar catálogos
        api.get('/doctors/specialties').then(res => setSpecialties(res.data)).catch(() => setSpecialties([]));
        api.get('/doctors/clinics').then(res => setClinics(res.data)).catch(() => setClinics([]));
        api.get('/doctors/payment-catalog').then(res => setPaymentCatalogs(res.data)).catch(() => setPaymentCatalogs([]));
    }, [navigate]);

    // ── Enviar el formulario ────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (role === 'doctor') {
            if (modality !== 'online' && selectedClinics.length === 0) {
                setError('Debe seleccionar al menos un centro de salud / clínica.');
                setLoading(false);
                return;
            }
            if (paymentMethodsList.length === 0) {
                setError('Debe agregar al menos un método de pago.');
                setLoading(false);
                return;
            }
        }

        try {
            const payload = {
                google_id: googleData.google_id,
                email: googleData.email,
                full_name: googleData.full_name,
                role,
                dni: dniBody ? dni : undefined,
                // Paciente
                date_of_birth: role === 'patient' ? dateOfBirth : undefined,
                gender:        role === 'patient' ? gender       : undefined,
                phone:         role === 'patient' ? (phoneBody ? `${phonePrefix}${phoneBody}` : undefined) : (doctorPhoneBody ? `${doctorPhonePrefix}${doctorPhoneBody}` : undefined),
                // Doctor
                specialty:          role === 'doctor' ? specialty          : undefined,
                license_number:     role === 'doctor' ? licenseNumber      : undefined,
                modality:           role === 'doctor' ? modality           : undefined,
                rif:                role === 'doctor' ? rif                : undefined,
                consultation_fee:   role === 'doctor' ? consultationFee    : undefined,
                clinics:            role === 'doctor' ? selectedClinics    : undefined,
                payment_methods:    role === 'doctor' ? paymentMethodsList : undefined,
            };

            const response = await api.post('/auth/google-complete', payload);
            const { token, user } = response.data;

            // Guardar sesión
            localStorage.setItem('mindpath_token', token);
            localStorage.setItem('mindpath_user', JSON.stringify(user));
            sessionStorage.removeItem('google_pending_data');

            setSuccess('¡Cuenta creada! Redirigiendo...');

            setTimeout(() => {
                if (user.role === 'doctor') navigate('/doctor/dashboard');
                else if (user.role === 'patient') navigate('/patient/dashboard');
                else navigate('/admin/dashboard');
            }, 1200);

        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear la cuenta. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors placeholder-gray-400 dark:placeholder-slate-500";
    const selectClass = "block w-full pl-10 pr-8 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white appearance-none text-sm transition-colors";

    if (!googleData) return null;

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 font-sans transition-colors">
            {/* Formulario */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-md">

                    {/* Logo móvil */}
                    <div className="lg:hidden text-center mb-6">
                        <BrainCircuit size={40} className="mx-auto text-mindpath-primary mb-2" />
                    </div>

                    {/* Cabecera */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">¡Casi listo!</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Solo necesitamos un poco más de información para configurar tu cuenta.</p>
                    </div>

                    {/* Tarjeta de cuenta Google */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl mb-6">
                        {googleData.picture ? (
                            <img src={googleData.picture} alt="Foto de perfil" className="w-10 h-10 rounded-full border-2 border-blue-300" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                <User size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-300 truncate">{googleData.full_name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{googleData.email}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                            <ShieldCheck size={12} />
                            Google
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-750 dark:text-red-400 rounded-xl flex items-center text-sm">
                            <AlertCircle size={16} className="mr-2 shrink-0" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-750 dark:text-green-400 rounded-xl flex items-center text-sm">
                            <CheckCircle size={16} className="mr-2 shrink-0" /> {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Toggle Rol */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">¿Cómo usarás Mindpath?</label>
                            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                                <button type="button" onClick={() => setRole('patient')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'patient' ? 'bg-white dark:bg-slate-750 shadow-sm text-mindpath-primary font-bold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                                    <User size={16} className="mr-2" /> Soy Paciente
                                </button>
                                <button type="button" onClick={() => setRole('doctor')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white dark:bg-slate-750 shadow-sm text-mindpath-primary font-bold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                                    <Stethoscope size={16} className="mr-2" /> Soy Doctor
                                </button>
                            </div>
                        </div>

                        {/* Cédula / DNI (común para todos) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cédula de Identidad / DNI</label>
                            <div className="flex gap-2">
                                <select value={dniPrefix} onChange={e => setDniPrefix(e.target.value)}
                                    className="w-24 px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors outline-none">
                                    <option value="V">V</option>
                                    <option value="E">E</option>
                                </select>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                    <input type="text" value={dniBody} onChange={e => setDniBody(e.target.value.replace(/\D/g, ''))}
                                        className={inputClass} placeholder="Ej. 12345678" required />
                                </div>
                            </div>
                        </div>

                        {/* ── CAMPOS DOCTOR ── */}
                        {role === 'doctor' && (
                            <>
                                {/* Especialidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Especialidad</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Stethoscope size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                        <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={selectClass} required>
                                            <option value="" className="dark:bg-slate-800">Selecciona tu especialidad...</option>
                                            {specialties.map(s => <option key={s.id} value={s.name} className="dark:bg-slate-800">{s.name}</option>)}
                                            <option value="Otra" className="dark:bg-slate-800">Otra (escríbela en tu perfil)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* Modalidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Modalidad de Atención</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                        <select value={modality} onChange={e => setModality(e.target.value)} className={selectClass} required>
                                            <option value="ambas" className="dark:bg-slate-800">Ambas (Online y Presencial)</option>
                                            <option value="online" className="dark:bg-slate-800">Solo Online</option>
                                            <option value="presencial" className="dark:bg-slate-800">Solo Presencial</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* Centros de Salud / Clínicas (Lista dinámica + Selector Dropdown) */}
                                {modality !== 'online' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Centros de Salud / Clínicas (Agrega al menos una)</label>
                                        <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                            
                                            {/* Clínicas agregadas */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Clínicas agregadas ({selectedClinics.length})</label>
                                                {selectedClinics.length === 0 ? (
                                                    <p className="text-xs text-red-500 italic">No has agregado ninguna clínica aún. Debes agregar al menos una usando el selector de abajo.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                        {selectedClinics.map((sc) => {
                                                            const clinicObj = clinics.find(c => c.id === sc.clinic_id);
                                                            return (
                                                                <div key={sc.clinic_id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700/50 text-xs">
                                                                    <div className="pr-2">
                                                                        <p className="font-bold text-gray-900 dark:text-white">{clinicObj ? clinicObj.name : 'Cargando...'}</p>
                                                                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                                                            Dirección: {sc.custom_address || clinicObj?.default_address || 'Online'}
                                                                        </p>
                                                                    </div>
                                                                    <button type="button" onClick={() => handleRemoveClinic(sc.clinic_id)}
                                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md shrink-0">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Formulario para agregar clínica */}
                                            <div className="border-t border-gray-200 dark:border-slate-700/50 pt-3 space-y-3">
                                                <p className="text-xs font-bold text-gray-700 dark:text-slate-300">Asociar centro de salud:</p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div>
                                                        <select value={selectedClinicId} onChange={e => setSelectedClinicId(e.target.value)}
                                                            className="block w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs outline-none">
                                                            <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Selecciona clínica/centro...</option>
                                                            {clinics.map(c => (
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

                                                <button type="button" onClick={handleAddClinic}
                                                    className="px-3 py-1.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white text-xs font-bold rounded-lg transition-all">
                                                    + Agregar Centro
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Licencia / CMVP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Licencia / CMVP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                        <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                                            className={inputClass} placeholder="Nro. de registro" required />
                                    </div>
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
                                    <div className="flex gap-2">
                                        <select value={doctorPhonePrefix} onChange={e => setDoctorPhonePrefix(e.target.value)}
                                            className="w-24 px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors outline-none">
                                            <option value="0412">0412</option>
                                            <option value="0414">0414</option>
                                            <option value="0424">0424</option>
                                            <option value="0416">0416</option>
                                            <option value="0426">0426</option>
                                            <option value="0422">0422</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                            <input type="text" name="doctorPhoneBody" id="doctorPhoneBody" autoComplete="tel-national" maxLength={7} value={doctorPhoneBody} onChange={e => setDoctorPhoneBody(e.target.value.replace(/\D/g, ''))}
                                                className={inputClass} placeholder="7 dígitos" required />
                                        </div>
                                    </div>
                                </div>

                                {/* RIF */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">RIF (Opcional)</label>
                                    <div className="flex gap-2">
                                        <select value={rifPrefix} onChange={e => setRifPrefix(e.target.value)}
                                            className="w-24 px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors outline-none">
                                            <option value="J">J</option>
                                            <option value="R">R</option>
                                            <option value="G">G</option>
                                            <option value="P">P</option>
                                            <option value="V">V</option>
                                            <option value="E">E</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                            <input type="text" value={rifBody} onChange={e => setRifBody(e.target.value.replace(/\D/g, ''))}
                                                className={inputClass} placeholder="123456789" />
                                        </div>
                                    </div>
                                </div>

                                {/* Configuración de Cobro */}
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-250 dark:border-slate-700/50 space-y-4">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center">
                                        <CreditCard size={16} className="mr-2 text-mindpath-primary" /> Configuración de Cobro
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Monto por Consulta ($)</label>
                                        <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
                                            className="block w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none"
                                            placeholder="Ej. 40" required />
                                    </div>

                                    {/* Métodos agregados */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Métodos de pago agregados ({paymentMethodsList.length})</label>
                                        {paymentMethodsList.length === 0 ? (
                                            <p className="text-xs text-gray-500 dark:text-slate-400 italic">No has agregado ningún método aún. Usa el formulario de abajo para agregar al menos uno.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                {paymentMethodsList.map((m, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/50 text-xs">
                                                        <div className="pr-2">
                                                            <p className="font-bold text-gray-900 dark:text-white">{m.method_name} (Orden: {m.sort_order})</p>
                                                            <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line mt-0.5">{m.account_details}</p>
                                                        </div>
                                                        <button type="button" onClick={() => setPaymentMethodsList(paymentMethodsList.filter((_, i) => i !== idx))}
                                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md shrink-0">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Formulario para agregar */}
                                    <div className="border-t border-gray-200 dark:border-slate-700/50 pt-3 space-y-3">
                                        <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Agregar nuevo método de pago:</p>
                                        
                                        <div>
                                            <select value={selectedCatalogId} onChange={handleCatalogSelectChange}
                                                className="block w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs outline-none">
                                                <option value="">Selecciona un tipo...</option>
                                                {paymentCatalogs.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedCatalogName && (
                                            <div className="space-y-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-150 dark:border-slate-700/40">
                                                {(getCatalogKey(selectedCatalogName) === 'transferencia bancaria' || getCatalogKey(selectedCatalogName) === 'transferencia') && (
                                                    <div className="space-y-2">
                                                        <select
                                                            value={paymentFields.bank_name || ''}
                                                            onChange={e => setPaymentFields(p => ({ ...p, bank_name: e.target.value }))}
                                                            className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                                        >
                                                            <option value="" className="bg-white dark:bg-slate-800 text-gray-400">Selecciona un Banco...</option>
                                                            {VENEZUELAN_BANKS.map(bank => (
                                                                <option key={bank.code} value={bank.name} className="bg-white dark:bg-slate-800">{bank.name}</option>
                                                            ))}
                                                        </select>
                                                        <input type="text" value={paymentFields.account_holder || ''} onChange={e => setPaymentFields(p => ({ ...p, account_holder: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Titular" />
                                                        <input type="text" value={paymentFields.account_number || ''} onChange={e => setPaymentFields(p => ({ ...p, account_number: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Número de cuenta" />
                                                        <div className="flex border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                            <select value={paymentFields.doc_type || 'V'} onChange={e => setPaymentFields(p => ({ ...p, doc_type: e.target.value }))} className="px-2 py-1.5 bg-gray-50 dark:bg-slate-700 text-xs border-r border-gray-200 dark:border-slate-700 outline-none">
                                                                <option value="V">V</option>
                                                                <option value="E">E</option>
                                                                <option value="J">J</option>
                                                                <option value="P">P</option>
                                                                <option value="G">G</option>
                                                            </select>
                                                            <input type="text" value={paymentFields.id_number || ''} onChange={e => setPaymentFields(p => ({ ...p, id_number: e.target.value }))} className="w-full px-2 py-1.5 border-none text-xs outline-none" placeholder="Cédula/RIF" />
                                                        </div>
                                                        <input type="text" value={paymentFields.account_type || ''} onChange={e => setPaymentFields(p => ({ ...p, account_type: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Tipo de cuenta (corriente, ahorro...)" />
                                                    </div>
                                                )}

                                                {getCatalogKey(selectedCatalogName) === 'zelle' && (
                                                    <div className="space-y-2">
                                                        <input type="email" value={paymentFields.zelle_email || ''} onChange={e => setPaymentFields(p => ({ ...p, zelle_email: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Correo Zelle" />
                                                        <input type="text" value={paymentFields.account_holder || ''} onChange={e => setPaymentFields(p => ({ ...p, account_holder: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Titular" />
                                                    </div>
                                                )}

                                                {getCatalogKey(selectedCatalogName) === 'binance' && (
                                                    <div className="space-y-2">
                                                        <input type="text" value={paymentFields.binance_id || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_id: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Binance ID" />
                                                        <input type="email" value={paymentFields.binance_email || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_email: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Correo" />
                                                        <input type="text" value={paymentFields.binance_user || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_user: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Usuario / alias" />
                                                    </div>
                                                )}

                                                {getCatalogKey(selectedCatalogName) === 'paypal' && (
                                                    <div className="space-y-2">
                                                        <input type="email" value={paymentFields.paypal_email || ''} onChange={e => setPaymentFields(p => ({ ...p, paypal_email: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Correo PayPal" />
                                                        <input type="text" value={paymentFields.paypal_link || ''} onChange={e => setPaymentFields(p => ({ ...p, paypal_link: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none" placeholder="Enlace paypal.me" />
                                                    </div>
                                                )}

                                                {(getCatalogKey(selectedCatalogName) === 'pago movil' || getCatalogKey(selectedCatalogName) === 'pago móvil') && (
                                                    <div className="space-y-2">
                                                        <select
                                                            value={paymentFields.bank_name || ''}
                                                            onChange={e => setPaymentFields(p => ({ ...p, bank_name: e.target.value }))}
                                                            className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                                        >
                                                            <option value="">Selecciona un Banco...</option>
                                                            {VENEZUELAN_BANKS.map(bank => (
                                                                <option key={bank.code} value={bank.name}>{bank.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="flex border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                            <select
                                                                value={paymentFields.phone_prefix || '0412'}
                                                                onChange={e => setPaymentFields(p => ({ ...p, phone_prefix: e.target.value }))}
                                                                className="px-2 py-1.5 bg-gray-50 dark:bg-slate-700 text-xs border-r border-gray-200 dark:border-slate-700 outline-none"
                                                            >
                                                                <option value="0412">0412</option>
                                                                <option value="0414">0414</option>
                                                                <option value="0424">0424</option>
                                                                <option value="0416">0416</option>
                                                                <option value="0426">0426</option>
                                                                <option value="0422">0422</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                maxLength={7}
                                                                value={paymentFields.phone_body || ''}
                                                                onChange={e => setPaymentFields(p => ({ ...p, phone_body: e.target.value.replace(/\D/g, '') }))}
                                                                className="w-full px-2 py-1.5 border-none text-xs outline-none"
                                                                placeholder="Número (7 dígitos)"
                                                            />
                                                        </div>
                                                        <div className="flex border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                            <select
                                                                value={paymentFields.doc_type || 'V'}
                                                                onChange={e => setPaymentFields(p => ({ ...p, doc_type: e.target.value }))}
                                                                className="px-2 py-1.5 bg-gray-50 dark:bg-slate-700 text-xs border-r border-gray-200 dark:border-slate-700 outline-none"
                                                            >
                                                                <option value="V">V</option>
                                                                <option value="E">E</option>
                                                                <option value="J">J</option>
                                                                <option value="P">P</option>
                                                                <option value="G">G</option>
                                                                <option value="R">R</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                value={paymentFields.id_number || ''}
                                                                onChange={e => setPaymentFields(p => ({ ...p, id_number: e.target.value.replace(/\D/g, '') }))}
                                                                className="w-full px-2 py-1.5 border-none text-xs outline-none"
                                                                placeholder="Número de Cédula o RIF"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {(getCatalogKey(selectedCatalogName) === 'efectivo en consultorio' || getCatalogKey(selectedCatalogName) === 'efectivo') && (
                                                    <textarea value={paymentFields.cash_note || ''} onChange={e => setPaymentFields(p => ({ ...p, cash_note: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs resize-none outline-none" placeholder="Indicaciones para efectivo" rows={2} />
                                                )}

                                                {getCatalogKey(selectedCatalogName) === 'otro' && (
                                                    <textarea value={paymentFields.custom_details || ''} onChange={e => setPaymentFields(p => ({ ...p, custom_details: e.target.value }))} className="block w-full px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs resize-none outline-none" placeholder="Detalles de pago" rows={2} />
                                                )}

                                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100/50">
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 font-bold uppercase">Nombre visible (opcional)</label>
                                                        <input type="text" value={visibleMethodName} onChange={e => setVisibleMethodName(e.target.value)} className="block w-full px-2 py-1 border border-gray-250 dark:border-slate-700 rounded-lg text-[11px] outline-none" placeholder="Ej. Pago Móvil Personal" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 font-bold uppercase">Orden de visualización</label>
                                                        <input type="number" value={paymentOrder} onChange={e => setPaymentOrder(e.target.value)} className="block w-full px-2 py-1 border border-gray-250 dark:border-slate-700 rounded-lg text-[11px] outline-none" min={1} />
                                                    </div>
                                                </div>

                                                <button type="button" onClick={handleAddPaymentMethod}
                                                    className="w-full mt-2 py-1.5 px-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-lg text-xs transition-colors">
                                                    Agregar a la lista
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── CAMPOS PACIENTE ── */}
                        {role === 'patient' && (
                            <>
                                <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha de Nacimiento</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                                                className={inputClass} required />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Género</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm" required>
                                            <option value="F" className="dark:bg-slate-800">Femenino</option>
                                            <option value="M" className="dark:bg-slate-800">Masculino</option>
                                            <option value="O" className="dark:bg-slate-800">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono (opcional)</label>
                                    <div className="flex gap-2">
                                        <select value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)}
                                            className="w-24 px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors outline-none">
                                            <option value="0412">0412</option>
                                            <option value="0414">0414</option>
                                            <option value="0424">0424</option>
                                            <option value="0416">0416</option>
                                            <option value="0426">0426</option>
                                            <option value="0422">0422</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                            <input type="text" name="patientPhoneBody" id="patientPhoneBody" autoComplete="tel-national" maxLength={7} value={phoneBody} onChange={e => setPhoneBody(e.target.value.replace(/\D/g, ''))}
                                                className={inputClass} placeholder="7 dígitos" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Botón de envío */}
                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-mindpath-primary hover:bg-mindpath-primaryHover transition-all disabled:bg-gray-400 dark:disabled:bg-slate-800 disabled:cursor-not-allowed">
                            {loading ? 'Creando tu cuenta...' : 'Completar Registro'}
                        </button>

                    </form>

                    <p className="mt-5 text-center text-xs text-gray-400 dark:text-slate-500">
                        Al registrarte aceptas nuestros términos de uso y política de privacidad.
                    </p>
                </div>
            </div>

            {/* Branding lateral */}
            <div className="hidden lg:flex w-1/2 bg-mindpath-primary flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/15 z-0"></div>
                <div className="z-10 text-center text-white max-w-sm">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BrainCircuit size={44} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Un último paso</h2>
                    <p className="text-lg text-gray-200 leading-relaxed">
                        Completa tu perfil para que podamos personalizar tu experiencia en Mindpath Neuro.
                    </p>
                    <div className="mt-8 flex justify-center gap-6 text-sm text-white/70">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">✓</div>
                            <span>Google</span>
                        </div>
                        <div className="w-12 border-t border-white/30 self-center"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-mindpath-primary">2</div>
                            <span>Tu perfil</span>
                        </div>
                        <div className="w-12 border-t border-white/30 self-center"></div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                            <span>Listo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletarPerfil;
