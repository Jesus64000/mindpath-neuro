import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BACKEND_URL } from '../../api/constants';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const { clinicName, logoUrl } = useSettingsStore();
    const { user, updateUser } = useAuthStore();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No se proporcionó ningún token de verificación.');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(res.data.message || '¡Correo electrónico verificado exitosamente!');
                
                // Si el usuario ya está en sesión, actualizar su estado global
                if (user) {
                    updateUser({ is_email_verified: true });
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Error al verificar el correo electrónico.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full animate-fadeIn">
                
                {/* HEADER */}
                <div className="text-center mb-10 flex flex-col items-center">
                    {logoUrl ? (
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md mb-6 border border-gray-200/20 dark:border-slate-800/30 shadow-lg inline-block">
                            <img 
                                src={logoUrl.startsWith('http') ? logoUrl : `${BACKEND_URL}${logoUrl}`} 
                                alt={clinicName} 
                                className="h-16 w-auto object-contain max-w-[280px]" 
                            />
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-mindpath-primary to-indigo-600 rounded-2xl shadow-xl shadow-mindpath-primary/20 mb-6">
                            <Shield className="text-white" size={32} />
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {logoUrl ? clinicName : <>Mindpath <span className="text-mindpath-primary">Neuro</span></>}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-500 mt-2 font-medium">Verificación de Cuenta</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl p-8 md:p-10 relative overflow-hidden text-center">
                    {/* Decoración */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-mindpath-primary/10 rounded-full blur-3xl"></div>
                    
                    {status === 'loading' && (
                        <div className="py-8 animate-pulse">
                            <div className="inline-flex items-center justify-center h-20 w-20 bg-mindpath-primary/10 text-mindpath-primary rounded-full mb-6">
                                <RefreshCw className="animate-spin" size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verificando Correo...</h2>
                            <p className="text-sm text-gray-400 dark:text-slate-400">Por favor espera un momento mientras validamos tu token.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-6 animate-slideUp">
                            <div className="inline-flex items-center justify-center h-20 w-20 bg-emerald-500/10 rounded-full text-emerald-500 mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">¡Correo Verificado!</h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                                {message}
                            </p>
                            <button 
                                onClick={() => navigate(user ? '/dashboard' : '/login')}
                                className="w-full inline-flex items-center justify-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-mindpath-primary/25 active:scale-[0.98]"
                            >
                                {user ? 'Ir a mi Panel de Control' : 'Iniciar Sesión'} <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-6 animate-slideUp">
                            <div className="inline-flex items-center justify-center h-20 w-20 bg-rose-500/10 rounded-full text-rose-500 mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                                <XCircle size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Enlace Inválido</h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                                {message}
                            </p>
                            <Link 
                                to={user ? '/dashboard' : '/login'}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-bold py-4 px-8 rounded-2xl transition-all hover:bg-gray-200 dark:hover:bg-slate-700"
                            >
                                Volver a la plataforma
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default VerifyEmail;
