import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, BadgeCheck, BrainCircuit } from 'lucide-react';

const Register = () => {
    const [role, setRole] = useState('patient');
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        // TODO: integrar registro real
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Formulario izquierdo */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-6">
                        <BrainCircuit size={40} className="mx-auto text-mindpath-primary mb-2" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
                    <p className="text-gray-500 mb-6">Únete a Mindpath y transforma la experiencia clínica.</p>

                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            onClick={() => setRole('patient')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'patient' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <User size={16} className="mr-2" /> Soy Paciente
                        </button>
                        <button
                            onClick={() => setRole('doctor')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white shadow-sm text-mindpath-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Stethoscope size={16} className="mr-2" /> Soy Doctor
                        </button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-mindpath-primary focus:border-mindpath-primary bg-gray-50 focus:bg-white"
                                    placeholder="Ej. Juan Pérez"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-mindpath-primary focus:border-mindpath-primary bg-gray-50 focus:bg-white"
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        {role === 'doctor' && (
                            <div className="flex gap-4 animate-fade-in">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                    <input
                                        type="text"
                                        className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-mindpath-primary focus:border-mindpath-primary bg-gray-50 focus:bg-white"
                                        placeholder="Ej. Psicólogo Clínico"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Licencia / CMVP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BadgeCheck size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-mindpath-primary focus:border-mindpath-primary bg-gray-50 focus:bg-white"
                                            placeholder="Nro. de registro"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-mindpath-primary focus:border-mindpath-primary bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                        >
                            Crear Cuenta
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

            {/* Branding derecho (oculto en mobile) con mismo color que login */}
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
