import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const CatalogsTab = ({ 
    specialties, 
    loading, 
    newSpe, 
    setNewSpe, 
    editSpe, 
    setEditSpe, 
    onCreate, 
    onUpdate, 
    onDelete 
}) => {
    return (
        <div className="space-y-4 animate-fadeIn">
            <h2 className="font-bold text-gray-800 dark:text-white">Gestión de Especialidades</h2>

            <div className="flex gap-3">
                <input 
                    value={newSpe} 
                    onChange={e => setNewSpe(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onCreate()}
                    placeholder="Nueva especialidad (ej: Cardiología)..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white" 
                />
                <button onClick={onCreate} className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm">
                    <Plus size={16}/> Agregar
                </button>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-400 animate-pulse">Cargando especialidades...</p>
                ) : specialties.length === 0 ? (
                    <p className="p-6 text-gray-400 text-center">Sin especialidades. Agrega la primera arriba.</p>
                ) : (
                    specialties.map((s, i) => (
                        <div key={s.id} className={`flex items-center px-5 py-4 gap-3 ${i !== 0 ? 'border-t border-gray-50 dark:border-[var(--border-color)]' : ''}`}>
                            {editSpe?.id === s.id ? (
                                <>
                                    <input 
                                        value={editSpe.name} 
                                        onChange={e => setEditSpe(p => ({ ...p, name: e.target.value }))}
                                        className="flex-1 border border-mindpath-primary rounded-lg px-3 py-1.5 text-sm focus:outline-none dark:bg-slate-700 dark:text-white" 
                                    />
                                    <button onClick={onUpdate} className="text-green-600 hover:text-green-700 font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-green-50">Guardar</button>
                                    <button onClick={() => setEditSpe(null)} className="text-gray-400 hover:text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancelar</button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-gray-800 dark:text-white text-sm font-medium">{s.name}</span>
                                    <button onClick={() => setEditSpe({ id: s.id, name: s.name })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                        <Pencil size={15}/>
                                    </button>
                                    <button onClick={() => onDelete(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={15}/>
                                    </button>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
                <AlertTriangle size={12}/> Las especialidades con doctores asociados no pueden eliminarse.
            </p>
        </div>
    );
};

export default CatalogsTab;
