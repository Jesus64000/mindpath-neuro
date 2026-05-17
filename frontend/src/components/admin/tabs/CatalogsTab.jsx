import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Pagination from '../shared/Pagination';

const CatalogsTab = ({ 
    specialties, 
    loading, 
    newSpe, 
    setNewSpe, 
    editSpe, 
    setEditSpe, 
    onCreate, 
    onUpdate, 
    onDelete,
    pagination,
    onPageChange,
    isAdmin = false,
    paymentCatalog = [],
    paymentCatalogLoading = false,
    paymentCatalogForm,
    setPaymentCatalogForm,
    editingPaymentCatalog,
    setEditingPaymentCatalog,
    onCreatePaymentCatalog,
    onUpdatePaymentCatalog,
    onDeletePaymentCatalog,
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

            <Pagination pagination={pagination} onPageChange={onPageChange} />
            <p className="text-xs text-gray-400 flex items-center gap-1">
                <AlertTriangle size={12}/> Las especialidades con doctores asociados no pueden eliminarse.
            </p>

            {isAdmin && (
                <div className="mt-8 space-y-4">
                    <h2 className="font-bold text-gray-800 dark:text-white">Catálogo global de métodos de pago</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            value={paymentCatalogForm.name}
                            onChange={e => setPaymentCatalogForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Nombre del método"
                            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white"
                        />
                        <input
                            value={paymentCatalogForm.sort_order}
                            onChange={e => setPaymentCatalogForm(p => ({ ...p, sort_order: e.target.value }))}
                            type="number"
                            placeholder="Orden"
                            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white"
                        />
                        <button
                            onClick={editingPaymentCatalog ? onUpdatePaymentCatalog : onCreatePaymentCatalog}
                            className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm justify-center"
                        >
                            <Plus size={16}/> {editingPaymentCatalog ? 'Actualizar' : 'Agregar'}
                        </button>
                    </div>

                    <textarea
                        value={paymentCatalogForm.description}
                        onChange={e => setPaymentCatalogForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Descripción o nota de uso"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-[var(--bg-card)] dark:border-[var(--border-color)] dark:text-white"
                    />

                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] overflow-hidden">
                        {paymentCatalogLoading ? (
                            <p className="p-6 text-gray-400 animate-pulse">Cargando métodos...</p>
                        ) : paymentCatalog.length === 0 ? (
                            <p className="p-6 text-gray-400 text-center">Sin métodos de pago globales.</p>
                        ) : (
                            paymentCatalog.map((method, i) => (
                                <div key={method.id} className={`flex items-center px-5 py-4 gap-3 ${i !== 0 ? 'border-t border-gray-50 dark:border-[var(--border-color)]' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-800 dark:text-white text-sm font-medium">{method.name}</span>
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${method.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{method.is_active ? 'Activo' : 'Inactivo'}</span>
                                        </div>
                                        {method.description && <p className="text-xs text-gray-400 mt-1">{method.description}</p>}
                                    </div>
                                    <button
                                        onClick={() => setEditingPaymentCatalog(method)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Pencil size={15}/>
                                    </button>
                                    <button
                                        onClick={() => onDeletePaymentCatalog(method.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={15}/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogsTab;
