import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { login, loginWithGoogle, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    // ── Login tradicional ──────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);

        if (result.success) {
            if (result.role === 'doctor') navigate('/doctor/dashboard');
            else if (result.role === 'patient') navigate('/patient/dashboard');
            else navigate('/admin/dashboard');
        }
    };

    // ── Login con Google ───────────────────────────────────────────
    const handleGoogleSuccess = async (tokenResponse) => {
        // tokenResponse.credential contiene el ID token de Google
        const result = await loginWithGoogle(tokenResponse.credential, navigate);

        if (result?.success) {
            if (result.role === 'doctor') navigate('/doctor/dashboard');
            else if (result.role === 'patient') navigate('/patient/dashboard');
            else navigate('/admin/dashboard');
        }
        // Si redirect=true ya fue manejado dentro de loginWithGoogle
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // useGoogleLogin devuelve un access token, necesitamos el credential (ID token)
            // Para eso usamos el flow implicit con el campo credential
        },
        flow: 'implicit',
    });

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950 transition-colors">

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

            {/* PANEL DERECHO: Formulario */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-16 lg:px-24 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-md mx-auto">

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido de nuevo</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Por favor, introduce tus datos para acceder al panel.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 flex items-center rounded-md">
                            <AlertCircle size={20} className="mr-2 shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Correo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="ejemplo@correo.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Mínimo 6 caracteres.</p>
                        </div>

                        {/* Recordarme y ¿Olvidaste? */}
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-mindpath-primary focus:ring-mindpath-primary border-gray-300 dark:border-slate-600 dark:bg-slate-800 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-slate-300">
                                    Recordarme
                                </label>
                            </div>
                            <Link to="/forgot-password" className="text-sm text-mindpath-primary hover:text-mindpath-primaryHover font-medium">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Botón principal */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 mt-4 text-sm shadow-md"
                        >
                            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="mt-6 flex items-center">
                        <div className="border-t border-gray-250 dark:border-slate-700 flex-grow"></div>
                        <span className="px-3 text-xs text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 font-medium">O continúa con</span>
                        <div className="border-t border-gray-250 dark:border-slate-700 flex-grow"></div>
                    </div>

                    {/* Botón de Google */}
                    <GoogleLoginButton
                        onSuccess={handleGoogleSuccess}
                        isLoading={isLoading}
                    />

                    {/* Registro */}
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
                        ¿No tienes una cuenta?{' '}
                        <a href="/register" className="text-mindpath-primary font-medium hover:underline">Regístrate</a>
                    </p>

                </div>
            </div>
        </div>
    );
};

// ── Componente botón de Google ────────────────────────────────────────────────
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ onSuccess, isLoading }) => {
    return (
        <div className="mt-4 flex justify-center">
            <div className={`w-full flex justify-center transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        onSuccess(credentialResponse);
                    }}
                    onError={() => {
                        console.error('Error al iniciar sesión con Google');
                    }}
                    width="100%"
                    text="continue_with"
                    locale="es"
                    shape="rectangular"
                    logo_alignment="left"
                    theme="outline"
                />
            </div>
        </div>
    );
};

export default Login;
