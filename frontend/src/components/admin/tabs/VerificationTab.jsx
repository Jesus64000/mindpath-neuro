import { ShieldCheck, ShieldX } from 'lucide-react';
import Pagination from '../shared/Pagination';

const VerificationTab = ({ 
    pending, 
    loading, 
    onVerify, 
    onReject, 
    rejectTarget, 
    setRejectTarget, 
    rejectNotes, 
    setRejectNotes,
    pagination,
    onPageChange
}) => {
    
    if (loading) return <p className="text-gray-400 animate-pulse p-6">Cargando...</p>;

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 dark:text-white">
                    Doctores pendientes de verificación
                    {pending.length > 0 && (
                        <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                            {pending.length}
                        </span>
                    )}
                </h2>
            </div>

            {pending.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)]">
                    <ShieldCheck size={48} className="text-green-400 mx-auto mb-3" />
                    <p className="font-bold text-gray-600 dark:text-white">¡Todo verificado!</p>
                    <p className="text-sm text-gray-400">No hay doctores pendientes.</p>
                </div>
            ) : (
                pending.map(doc => (
                    <div key={doc.id} className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="h-12 w-12 bg-mindpath-light rounded-xl flex items-center justify-center text-mindpath-primary font-bold text-lg shrink-0">
                            {doc.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white">{doc.full_name}</p>
                            <p className="text-sm text-gray-500 dark:text-[var(--text-muted)]">{doc.specialty} · {doc.clinic_name}</p>
                            <p className="text-xs text-gray-400 mt-1">📋 Licencia: <span className="font-mono font-semibold">{doc.license_number}</span></p>
                            <p className="text-xs text-gray-400">✉ {doc.email}</p>
                            {doc.verification_notes && (
                                <p className="text-xs text-orange-500 mt-1">⚠ Nota: {doc.verification_notes}</p>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => onVerify(doc.id)}
                                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                                <ShieldCheck size={15}/> Aprobar
                            </button>
                            <button onClick={() => { setRejectTarget(doc.id); setRejectNotes(''); }}
                                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors border border-red-200">
                                <ShieldX size={15}/> Rechazar
                            </button>
                        </div>
                    </div>
                ))
            )}

            <Pagination pagination={pagination} onPageChange={onPageChange} />

            {rejectTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">Rechazar Doctor</h3>
                        <p className="text-sm text-gray-500 mb-4">Motivo del rechazo (se guardará en el expediente):</p>
                        <textarea 
                            value={rejectNotes} 
                            onChange={e => setRejectNotes(e.target.value)} 
                            rows={3}
                            placeholder="Ej: Licencia inválida, número no encontrado en el registro..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={onReject} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">Confirmar rechazo</button>
                            <button onClick={() => setRejectTarget(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationTab;
