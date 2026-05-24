import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import api from '../../api/axiosConfig';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage(res.data.message);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Error al procesar la solicitud.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full animate-fadeIn">
                
                {/* HEADER */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-mindpath-primary to-indigo-600 rounded-2xl shadow-xl shadow-mindpath-primary/20 mb-6">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Mindpath <span className="text-mindpath-primary">Neuro</span></h1>
                    <p className="text-gray-500 dark:text-slate-500 mt-2 font-medium">Recuperación de Acceso</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl p-8 md:p-10 relative overflow-hidden">
                    {/* Decoración */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-mindpath-primary/10 rounded-full blur-3xl"></div>
                    
                    {status === 'success' ? (
                        <div className="text-center py-6 animate-slideUp">
                            <div className="inline-flex items-center justify-center h-20 w-20 bg-green-500/10 rounded-full text-green-500 mb-6 border border-green-500/20">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Enlace Enviado</h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                                {message}
                            </p>
                            <Link to="/login" className="inline-flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-mindpath-primary/25">
                                Volver al login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">¿Olvidaste tu contraseña?</h2>
                                <p className="text-sm text-gray-400 dark:text-slate-400 leading-relaxed">
                                    No te preocupes. Introduce tu correo electrónico y te enviaremos un enlace seguro para restablecerla.
                                </p>
                            </div>

                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-shake">
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Correo Electrónico</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-mindpath-primary transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input 
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-mindpath-primary focus:ring-4 focus:ring-mindpath-primary/10 transition-all font-medium"
                                            placeholder="tunombre@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-mindpath-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {status === 'loading' ? <RefreshCw className="animate-spin" size={20}/> : <Mail size={20}/>}
                                    {status === 'loading' ? 'PROCESANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-mindpath-primary transition-colors inline-flex items-center gap-2 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Volver al inicio de sesión
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
