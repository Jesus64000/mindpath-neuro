import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { 
        const t = setTimeout(onClose, 3500); 
        return () => clearTimeout(t); 
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold max-w-sm ${
            type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            {type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
            {msg}
        </div>
    );
};

export default Toast;
