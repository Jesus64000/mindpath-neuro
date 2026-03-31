import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        
        if (result.success) {
            if (result.role === 'doctor') navigate('/doctor/dashboard');
            else if (result.role === 'patient') navigate('/patient/dashboard');
            else navigate('/admin/dashboard');
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            
            {/* PANEL IZQUIERDO: Branding */}
            <div className="hidden lg:flex lg:w-[45%] bg-mindpath-primary flex-col justify-center px-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/15 z-0"></div>
                
                <div className="relative z-10">
                    <h2 className="text-white text-2xl font-bold mb-8 tracking-wide">Mindpath</h2>
                    <h1 className="text-white text-5xl font-bold leading-tight mb-6">
                        IA Integrativa para<br/>la Excelencia Clínica
                    </h1>
                    <p className="text-gray-300 text-lg max-w-md leading-relaxed">
                        Optimiza la atención neurológica con nuestras herramientas avanzadas de telemedicina y diagnóstico impulsado por IA.
                    </p>
                </div>
            </div>

            {/* PANEL DERECHO: Formulario de Login */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center px-8 sm:px-16 lg:px-24">
                <div className="w-full max-w-md mx-auto">
                    
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de nuevo</h2>
                        <p className="text-gray-500 text-sm">Por favor, introduce tus datos para acceder al panel.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded-md">
                            <AlertCircle size={20} className="mr-2" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Correo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="ejemplo@correo.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Mínimo 6 caracteres.</p>
                        </div>

                        {/* Recordarme y Olvidaste contraseña */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-mindpath-primary focus:ring-mindpath-primary border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Recordarme
                                </label>
                            </div>
                            <Link to="/forgot-password" size="sm" className="text-sm text-mindpath-primary hover:text-mindpath-primaryHover font-medium">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Botón Principal */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 mt-4 text-sm"
                        >
                            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    {/* Botones Sociales (Comentados temporalmente) */}
                    {/* 
                    <div className="mt-8 flex items-center justify-center">
                        <div className="border-t border-gray-200 flex-grow"></div>
                        <span className="px-3 text-sm text-gray-500 bg-white">O inicia sesión con</span>
                        <div className="border-t border-gray-200 flex-grow"></div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Google</span>
                        </button>
                        <button type="button" className="flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Facebook</span>
                        </button>
                    </div>
                    */}

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        ¿No tienes una cuenta? <a href="/register" className="text-mindpath-primary font-medium hover:underline">Regístrate</a>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;
