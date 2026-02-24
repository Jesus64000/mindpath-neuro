import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ShieldCheck, CheckCircle, AlertCircle, LogIn } from 'lucide-react';

const SuperAdminSetup = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'exists' | 'error'
    const [message, setMessage] = useState('');

    const handleBootstrap = async () => {
        setStatus('loading');
        try {
            const res = await api.post('/admin/bootstrap');
            setStatus('success');
            setMessage(res.data.message);
        } catch (err) {
            if (err.response?.status === 409) {
                setStatus('exists');
                setMessage(err.response.data.message);
            } else {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Error inesperado.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                <div className="h-20 w-20 bg-mindpath-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={42} className="text-mindpath-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Super Admin Setup</h1>
                <p className="text-slate-400 text-sm mb-8">
                    Crea la cuenta de administrador del sistema. Este endpoint solo funciona una vez.
                </p>

                <div className="bg-black/20 rounded-2xl p-4 text-left mb-6 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Credenciales</p>
                    <p className="text-white font-mono text-sm">📧 admin@admin.com</p>
                    <p className="text-white font-mono text-sm">🔑 admin123</p>
                    <p className="text-yellow-400 text-xs mt-2">⚠️ Cámbialas después del primer login.</p>
                </div>

                {status === null && (
                    <button
                        onClick={handleBootstrap}
                        className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold py-4 rounded-2xl transition-colors text-base"
                    >
                        Crear Super Admin
                    </button>
                )}

                {status === 'loading' && (
                    <p className="text-slate-300 animate-pulse font-medium">Creando admin...</p>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
                            <CheckCircle size={20} className="text-green-400 shrink-0" />
                            <p className="text-green-300 text-sm font-medium text-left">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-2xl transition-colors"
                        >
                            <LogIn size={18} /> Ir al Login
                        </button>
                    </div>
                )}

                {(status === 'exists' || status === 'error') && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                            <AlertCircle size={20} className="text-red-400 shrink-0" />
                            <p className="text-red-300 text-sm font-medium text-left">{message}</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-2xl transition-colors"
                        >
                            <LogIn size={18} /> Ir al Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminSetup;
