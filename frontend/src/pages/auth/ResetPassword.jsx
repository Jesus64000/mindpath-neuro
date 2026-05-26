import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../api/axiosConfig';
import useSettingsStore from '../../store/useSettingsStore';
import { BACKEND_URL } from '../../api/constants';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [status, setStatus] = useState(token ? 'idle' : 'error'); 
    const [message, setMessage] = useState(token ? '' : 'El token de recuperación es requerido. Por favor, solicita un nuevo enlace.');
    const { clinicName, logoUrl } = useSettingsStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (passwords.new !== passwords.confirm) {
            setStatus('error');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        if (passwords.new.length < 6) {
            setStatus('error');
            setMessage('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setStatus('loading');
        try {
            const res = await api.post('/auth/reset-password', {
                token,
                newPassword: passwords.new
            });
            setStatus('success');
            setMessage(res.data.message);
            // Redirigir al login después de 3 segundos
            setTimeout(() => navigate('/login'), 3500);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Error al restablecer la contraseña.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full animate-fadeIn">
                
                {/* LOGO / HEADER */}
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
                    <p className="text-gray-500 dark:text-slate-500 mt-2 font-medium">Seguridad y Recuperación de Acceso</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-2xl p-8 md:p-10 relative overflow-hidden">
                    {/* Decoración de fondo */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-mindpath-primary/10 rounded-full blur-3xl"></div>
                    
                    {status === 'success' ? (
                        <div className="text-center py-6 animate-slideUp">
                            <div className="inline-flex items-center justify-center h-20 w-20 bg-green-500/10 rounded-full text-green-500 mb-6 border border-green-500/20">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">¡Contraseña Actualizada!</h2>
                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                                Tu acceso ha sido restaurado con éxito. Serás redirigido al portal de inicio en unos segundos.
                            </p>
                            <Link to="/login" className="inline-flex items-center gap-2 text-mindpath-primary font-bold hover:underline">
                                Ir al login ahora <ArrowLeft size={16} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Restablecer Contraseña</h2>
                                <p className="text-sm text-gray-400 dark:text-slate-400">Ingresa tu nueva clave de acceso debajo.</p>
                            </div>

                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-shake">
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Nueva Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-mindpath-primary transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={passwords.new}
                                            onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-mindpath-primary focus:ring-4 focus:ring-mindpath-primary/10 transition-all"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Confirmar Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-mindpath-primary transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={passwords.confirm}
                                            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-mindpath-primary focus:ring-4 focus:ring-mindpath-primary/10 transition-all"
                                            placeholder="Repite tu contraseña"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={status === 'loading' || !token}
                                    className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-mindpath-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {status === 'loading' ? <RefreshCw className="animate-spin" size={20}/> : <Shield size={20}/>}
                                    {status === 'loading' ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-mindpath-primary transition-colors inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Volver al inicio de sesión
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

export default ResetPassword;
