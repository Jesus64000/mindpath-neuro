import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BrainCircuit, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        
        if (result.success) {
            // Redirección inteligente según el rol
            if (result.role === 'doctor') navigate('/doctor/dashboard');
            else if (result.role === 'patient') navigate('/patient/dashboard');
            else navigate('/admin/dashboard');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mitad Izquierda: Branding (Oculto en móviles) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-indigo-800 flex-col justify-center items-center text-white p-12">
                <BrainCircuit size={80} className="mb-8 opacity-90" />
                <h1 className="text-5xl font-bold mb-4 font-poppins">Mindpath</h1>
                <p className="text-xl text-violet-100 text-center max-w-md">
                    IA Integrativa para la Excelencia Clínica en Neurología.
                </p>
            </div>

            {/* Mitad Derecha: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido de nuevo</h2>
                        <p className="text-gray-500">Por favor, introduce tus datos para acceder al panel.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded-r-lg">
                            <AlertCircle size={20} className="mr-2" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-violet-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-violet-50 border border-violet-100 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                    placeholder="dr.perez@mindpath.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-violet-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-violet-50 border border-violet-100 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <a href="#" className="text-sm text-violet-600 hover:text-violet-800 font-medium">¿Olvidaste tu contraseña?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors disabled:opacity-70 flex justify-center items-center"
                        >
                            {isLoading ? 'Autenticando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-600 text-sm">
                        ¿No tienes una cuenta? <a href="/register" className="text-violet-600 font-bold hover:underline">Regístrate</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
