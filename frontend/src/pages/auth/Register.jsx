import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, BadgeCheck, BrainCircuit, Phone, Calendar, AlertCircle, CheckCircle, Building2, ChevronDown } from 'lucide-react';
import api from '../../api/axiosConfig';

const Register = () => {
    const [role, setRole] = useState('patient');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [specialties, setSpecialties] = useState([]);
    const navigate = useNavigate();

    // Campos comunes
    const [fullName,  setFullName]  = useState('');
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');

    // Campos de paciente
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender,      setGender]      = useState('F');
    const [phone,       setPhone]       = useState('');

    // Campos de doctor
    const [specialty,      setSpecialty]      = useState('');
    const [licenseNumber,  setLicenseNumber]  = useState('');
    const [clinicName,     setClinicName]     = useState('');

    // Cargar especialidades al montar
    useEffect(() => {
        api.get('/doctors/specialties')
            .then(res => setSpecialties(res.data))
            .catch(() => setSpecialties([]));
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
                date_of_birth: role === 'patient' ? dateOfBirth : undefined,
                gender:        role === 'patient' ? gender       : undefined,
                phone:         role === 'patient' ? phone        : undefined,
                specialty:      role === 'doctor' ? specialty      : undefined,
                license_number: role === 'doctor' ? licenseNumber  : undefined,
                clinic_name:    role === 'doctor' ? clinicName     : undefined,
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

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Formulario */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-6">
                        <BrainCircuit size={40} className="mx-auto text-mindpath-primary mb-2" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
                    <p className="text-gray-500 mb-6">Únete a Mindpath y transforma la experiencia clínica.</p>

                    {/* Toggle Rol */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button type="button" onClick={() => setRole('patient')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'patient' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                            <User size={16} className="mr-2" /> Soy Paciente
                        </button>
                        <button type="button" onClick={() => setRole('doctor')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Stethoscope size={16} className="mr-2" /> Soy Doctor
                        </button>
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

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                    placeholder="Ej. Juan Pérez" required />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400" /></div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
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
                                            className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white appearance-none"
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

                                <div className="flex gap-4">
                                    {/* Licencia */}
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Licencia / CMVP</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck size={18} className="text-gray-400" /></div>
                                            <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                                placeholder="Nro. de registro" required={role === 'doctor'} />
                                        </div>
                                    </div>
                                </div>

                                {/* Clínica */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clínica / Hospital</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 size={18} className="text-gray-400" /></div>
                                        <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                            placeholder="Ej. Centro Médico San Francisco" />
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
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                                required={role === 'patient'} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)}
                                            className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                            required={role === 'patient'}>
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
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                            placeholder="+58 412 000 0000" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary bg-gray-50 focus:bg-white"
                                    placeholder="Mínimo 6 caracteres" minLength={6} required />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
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
                <div className="z-10 text-center text-white">
                    <Stethoscope size={80} className="mx-auto mb-6 text-purple-200" />
                    <h2 className="text-4xl font-bold mb-4">El futuro de la clínica</h2>
                    <p className="text-lg text-purple-100 max-w-md mx-auto">
                        Únete a la red de profesionales y pacientes que están transformando las consultas gracias al poder de la Inteligencia Artificial.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
