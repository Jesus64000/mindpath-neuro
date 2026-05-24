import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Stethoscope, BadgeCheck, BrainCircuit, Phone, Calendar,
    AlertCircle, CheckCircle, Building2, ChevronDown, CreditCard,
    Globe, FileText, Mail, ShieldCheck
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useAuthStore } from '../../store/useAuthStore';

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
    const [dni, setDni] = useState('');

    // Campos de paciente
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('F');
    const [phone, setPhone] = useState('');

    // Campos de doctor
    const [specialty, setSpecialty] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [modality, setModality] = useState('ambas');
    const [rif, setRif] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [catalogMethodId, setCatalogMethodId] = useState('');
    const [accountDetails, setAccountDetails] = useState('');

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

        try {
            const payload = {
                google_id: googleData.google_id,
                email: googleData.email,
                full_name: googleData.full_name,
                role,
                dni: dni || undefined,
                // Paciente
                date_of_birth: role === 'patient' ? dateOfBirth : undefined,
                gender:        role === 'patient' ? gender       : undefined,
                phone:         role === 'patient' ? phone        : (role === 'doctor' ? doctorPhone : undefined),
                // Doctor
                specialty:          role === 'doctor' ? specialty          : undefined,
                license_number:     role === 'doctor' ? licenseNumber      : undefined,
                clinic_name:        role === 'doctor' ? clinicName         : undefined,
                modality:           role === 'doctor' ? modality           : undefined,
                rif:                role === 'doctor' ? rif                : undefined,
                consultation_fee:   role === 'doctor' ? consultationFee    : undefined,
                catalog_method_id:  role === 'doctor' ? catalogMethodId    : undefined,
                account_details:    role === 'doctor' ? accountDetails     : undefined,
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

    const inputClass = 'block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white text-sm';
    const selectClass = 'block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white appearance-none text-sm';

    if (!googleData) return null;

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Formulario */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-md">

                    {/* Logo móvil */}
                    <div className="lg:hidden text-center mb-6">
                        <BrainCircuit size={40} className="mx-auto text-mindpath-primary mb-2" />
                    </div>

                    {/* Cabecera */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">¡Casi listo!</h2>
                        <p className="text-gray-500 text-sm">Solo necesitamos un poco más de información para configurar tu cuenta.</p>
                    </div>

                    {/* Tarjeta de cuenta Google */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-6">
                        {googleData.picture ? (
                            <img src={googleData.picture} alt="Foto de perfil" className="w-10 h-10 rounded-full border-2 border-blue-300" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-blue-900 truncate">{googleData.full_name}</p>
                            <p className="text-xs text-blue-600 truncate">{googleData.email}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                            <ShieldCheck size={12} />
                            Google
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center text-sm">
                            <AlertCircle size={16} className="mr-2 shrink-0" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center text-sm">
                            <CheckCircle size={16} className="mr-2 shrink-0" /> {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Toggle Rol */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">¿Cómo usarás Mindpath?</label>
                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                <button type="button" onClick={() => setRole('patient')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'patient' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <User size={16} className="mr-2" /> Soy Paciente
                                </button>
                                <button type="button" onClick={() => setRole('doctor')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <Stethoscope size={16} className="mr-2" /> Soy Doctor
                                </button>
                            </div>
                        </div>

                        {/* Cédula / DNI (común para todos) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Identidad / DNI</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={18} className="text-gray-400" /></div>
                                <input type="text" value={dni} onChange={e => setDni(e.target.value)}
                                    className={inputClass} placeholder="V-12345678" required />
                            </div>
                        </div>

                        {/* ── CAMPOS DOCTOR ── */}
                        {role === 'doctor' && (
                            <>
                                {/* Especialidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Stethoscope size={18} className="text-gray-400" /></div>
                                        <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={selectClass} required>
                                            <option value="">Selecciona tu especialidad...</option>
                                            {specialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            <option value="Otra">Otra (escríbela en tu perfil)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* Licencia / CMVP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Licencia / CMVP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck size={18} className="text-gray-400" /></div>
                                        <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                                            className={inputClass} placeholder="Nro. de registro" required />
                                    </div>
                                </div>

                                {/* Centro de Salud */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Salud / Clínica</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 size={18} className="text-gray-400" /></div>
                                        <select value={clinicName} onChange={e => setClinicName(e.target.value)} className={selectClass} required>
                                            <option value="">Seleccione un centro...</option>
                                            {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                                            className={inputClass} placeholder="+58 412 000 0000" required />
                                    </div>
                                </div>

                                {/* Modalidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de Atención</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe size={18} className="text-gray-400" /></div>
                                        <select value={modality} onChange={e => setModality(e.target.value)} className={selectClass} required>
                                            <option value="ambas">Ambas (Online y Presencial)</option>
                                            <option value="online">Solo Online</option>
                                            <option value="presencial">Solo Presencial</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown size={16} className="text-gray-400" /></div>
                                    </div>
                                </div>

                                {/* RIF */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RIF (Opcional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText size={18} className="text-gray-400" /></div>
                                        <input type="text" value={rif} onChange={e => setRif(e.target.value)}
                                            className={inputClass} placeholder="J-12345678-9" />
                                    </div>
                                </div>

                                {/* Configuración de Cobro */}
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                                    <h4 className="text-sm font-bold text-amber-800 flex items-center">
                                        <CreditCard size={16} className="mr-2" /> Configuración de Cobro
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 mb-1">Monto por Consulta ($)</label>
                                        <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                            placeholder="Ej. 40" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 mb-1">Primer Método de Pago</label>
                                        <select value={catalogMethodId} onChange={e => setCatalogMethodId(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-sm" required>
                                            <option value="">Selecciona un método...</option>
                                            {paymentCatalogs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-700 mb-1">Datos de Cuenta / Instrucciones</label>
                                        <textarea value={accountDetails} onChange={e => setAccountDetails(e.target.value)}
                                            className="block w-full px-3 py-2 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-sm resize-none"
                                            placeholder="Ej. Zelle: correo@ejemplo.com (Titular: Juan Pérez)"
                                            rows={2} required />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── CAMPOS PACIENTE ── */}
                        {role === 'patient' && (
                            <>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={18} className="text-gray-400" /></div>
                                            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                                                className={inputClass} required />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white text-sm" required>
                                            <option value="F">Femenino</option>
                                            <option value="M">Masculino</option>
                                            <option value="O">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400" /></div>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                            className={inputClass} placeholder="+58 412 000 0000" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Botón de envío */}
                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-mindpath-primary hover:bg-mindpath-primaryHover transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Creando tu cuenta...' : 'Completar Registro'}
                        </button>

                    </form>

                    <p className="mt-5 text-center text-xs text-gray-400">
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
