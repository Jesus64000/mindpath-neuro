import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, BadgeCheck, BrainCircuit, Phone, Calendar, AlertCircle, CheckCircle, Building2, ChevronDown, CreditCard, Globe, FileText } from 'lucide-react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { BACKEND_URL } from '../../api/constants';

const Register = () => {
    const [role, setRole] = useState('patient');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [specialties, setSpecialties] = useState([]);
    const [clinics, setClinics]   = useState([]);
    const [paymentCatalogs, setPaymentCatalogs] = useState([]);
    const navigate = useNavigate();
    const { clinicName: systemClinicName, logoUrl } = useSettingsStore();

    // Campos comunes
    const [fullName,  setFullName]  = useState('');
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [dni,       setDni]       = useState('');

    // Campos de paciente
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender,      setGender]      = useState('F');
    const [phone,       setPhone]       = useState('');

    // Campos de doctor
    const [specialty,      setSpecialty]      = useState('');
    const [licenseNumber,  setLicenseNumber]  = useState('');
    const [clinicName,     setClinicName]     = useState('');
    const [modality,       setModality]       = useState('ambas');
    const [rif,            setRif]            = useState('');
    const [doctorPhone,    setDoctorPhone]    = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [catalogMethodId, setCatalogMethodId] = useState('');
    const [accountDetails,  setAccountDetails]  = useState('');

    // Cargar especialidades, clínicas y catálogo de pagos al montar
    useEffect(() => {
        api.get('/doctors/specialties')
            .then(res => setSpecialties(res.data))
            .catch(() => setSpecialties([]));
        api.get('/doctors/clinics')
            .then(res => setClinics(res.data))
            .catch(() => setClinics([]));
        api.get('/doctors/payment-catalog')
            .then(res => setPaymentCatalogs(res.data))
            .catch(() => setPaymentCatalogs([]));
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload = {
                email,
                password,
                full_name: fullName,
                role,
                dni: dni || undefined,
                // Paciente
                date_of_birth: role === 'patient' ? dateOfBirth : undefined,
                gender:        role === 'patient' ? gender       : undefined,
                phone:         role === 'patient' ? phone        : (role === 'doctor' ? doctorPhone : undefined),
                // Doctor
                specialty:      role === 'doctor' ? specialty      : undefined,
                license_number: role === 'doctor' ? licenseNumber  : undefined,
                clinic_name:    role === 'doctor' ? clinicName     : undefined,
                modality:       role === 'doctor' ? modality       : undefined,
                rif:            role === 'doctor' ? rif            : undefined,
                consultation_fee: role === 'doctor' ? consultationFee : undefined,
                catalog_method_id: role === 'doctor' ? catalogMethodId : undefined,
                account_details:   role === 'doctor' ? accountDetails  : undefined,
            };

            await api.post('/auth/register', payload);
            setSuccess('¡Cuenta creada! Redirigiendo al login...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors placeholder-gray-400 dark:placeholder-slate-500";
    const selectClass = "block w-full pl-10 pr-8 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white appearance-none text-sm transition-colors";

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 font-sans transition-colors">
            {/* Formulario */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-6">
                        {logoUrl ? (
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md inline-block border border-white/20 shadow-md">
                                <img 
                                    src={logoUrl.startsWith('http') ? logoUrl : `${BACKEND_URL}${logoUrl}`} 
                                    alt={systemClinicName} 
                                    className="h-10 w-auto object-contain mx-auto" 
                                />
                            </div>
                        ) : (
                            <BrainCircuit size={40} className="mx-auto text-mindpath-primary mb-2" />
                        )}
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crea tu cuenta</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Únete a {systemClinicName} y transforma la experiencia clínica.</p>

                    {/* Toggle Rol */}
                    <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
                        <button type="button" onClick={() => setRole('patient')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'patient' ? 'bg-white dark:bg-slate-750 shadow-sm text-mindpath-primary font-bold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                            <User size={16} className="mr-2" /> Soy Paciente
                        </button>
                        <button type="button" onClick={() => setRole('doctor')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white dark:bg-slate-750 shadow-sm text-mindpath-primary font-bold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                            <Stethoscope size={16} className="mr-2" /> Soy Doctor
                        </button>
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

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ej. Juan Pérez" required />
                            </div>
                        </div>

                        {/* Cédula / DNI (campo común) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cédula de Identidad / DNI</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                <input type="text" value={dni} onChange={e => setDni(e.target.value)}
                                    className={inputClass}
                                    placeholder="V-12345678" required />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="correo@ejemplo.com" required />
                            </div>
                        </div>

                        {/* ── CAMPOS DOCTOR ── */}
                        {role === 'doctor' && (
                            <>
                                {/* Especialidad (dropdown desde BD) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Stethoscope size={18} className="text-gray-400" /></div>
                                        <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                                            className={selectClass}
                                            required={role === 'doctor'}>
                                            <option value="">Selecciona tu especialidad...</option>
                                            {specialties.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                            <option value="Otra">Otra (escríbela en tu perfil)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* Licencia */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Licencia / CMVP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck size={18} className="text-gray-400" /></div>
                                        <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                                            className={inputClass}
                                            placeholder="Nro. de registro" required={role === 'doctor'} />
                                    </div>
                                </div>

                                {/* Centro de Salud / Clínica (dropdown desde BD) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Salud / Clínica</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 size={18} className="text-gray-400" /></div>
                                        <select value={clinicName} onChange={e => setClinicName(e.target.value)}
                                            className={selectClass}
                                            required={role === 'doctor'}>
                                            <option value="">Seleccione un centro...</option>
                                            {clinics.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400" /></div>
                                        <input type="tel" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)}
                                            className={inputClass}
                                            placeholder="+58 412 000 0000" required={role === 'doctor'} />
                                    </div>
                                </div>

                                {/* Modalidad de Atención */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de Atención</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe size={18} className="text-gray-400" /></div>
                                        <select value={modality} onChange={e => setModality(e.target.value)}
                                            className={selectClass}
                                            required>
                                            <option value="ambas">Ambas (Online y Presencial)</option>
                                            <option value="online">Solo Online</option>
                                            <option value="presencial">Solo Presencial</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* RIF (Opcional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RIF (Opcional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText size={18} className="text-gray-400" /></div>
                                        <input type="text" value={rif} onChange={e => setRif(e.target.value)}
                                            className={inputClass}
                                            placeholder="J-12345678-9" />
                                    </div>
                                </div>

                                {/* ── CONFIGURACIÓN DE COBRO (OBLIGATORIA) ── */}
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-500/20 space-y-4">
                                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center">
                                        <CreditCard size={16} className="mr-2" /> Configuración de Cobro
                                    </h4>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Monto por Consulta ($)</label>
                                        <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                            placeholder="Ej. 40" required={role === 'doctor'} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Primer Método de Pago</label>
                                        <select value={catalogMethodId} onChange={e => setCatalogMethodId(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                            required={role === 'doctor'}>
                                            <option value="">Selecciona un método...</option>
                                            {paymentCatalogs.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Datos de Cuenta / Instrucciones</label>
                                        <textarea value={accountDetails} onChange={e => setAccountDetails(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm resize-none"
                                            placeholder="Ej. Zelle: correo@ejemplo.com (Titular: Juan Pérez)" 
                                            rows={2} required={role === 'doctor'} />
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
                                                className={inputClass}
                                                required={role === 'patient'} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Género</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-gray-900 dark:text-white text-sm transition-colors"
                                            required={role === 'patient'}>
                                            <option value="F" className="dark:bg-slate-800">Femenino</option>
                                            <option value="M" className="dark:bg-slate-800">Masculino</option>
                                            <option value="O" className="dark:bg-slate-800">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono (opcional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                            className={inputClass}
                                            placeholder="+58 412 000 0000" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400 dark:text-slate-500" /></div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Mínimo 6 caracteres" minLength={6} required />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-mindpath-primary hover:bg-mindpath-primaryHover transition-all disabled:bg-gray-400 dark:disabled:bg-slate-800 disabled:cursor-not-allowed">
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-bold text-mindpath-primary hover:text-mindpath-primaryHover transition-colors">
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </div>

            {/* Branding */}
            <div className="hidden lg:flex w-1/2 bg-mindpath-primary flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/15 z-0"></div>
                <div className="z-10 text-center text-white flex flex-col items-center">
                    {logoUrl ? (
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md mb-6 border border-white/20 shadow-lg">
                            <img 
                                src={logoUrl.startsWith('http') ? logoUrl : `${BACKEND_URL}${logoUrl}`} 
                                alt={systemClinicName} 
                                className="h-16 w-auto object-contain max-w-[280px]" 
                            />
                        </div>
                    ) : (
                        <h2 className="text-white text-3xl font-black mb-6 tracking-wide">{systemClinicName}</h2>
                    )}
                    <h2 className="text-4xl font-bold mb-4">El futuro de la clínica</h2>
                    <p className="text-lg text-gray-200 max-w-md mx-auto">
                        Únete a la red de profesionales y pacientes que están transformando las consultas gracias al poder de la Inteligencia Artificial.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
