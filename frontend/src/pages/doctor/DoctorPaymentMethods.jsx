import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Save } from 'lucide-react';
import {
    getPaymentTemplate,
    getCatalogKey,
    buildPaymentDetails,
    createDefaultPaymentFields,
    parsePaymentDetails,
    VENEZUELAN_BANKS
} from './paymentUtils';

const DoctorPaymentMethods = ({ paymentCatalog, paymentMethods, setPaymentMethods }) => {
    const [paymentForm, setPaymentForm] = useState({
        catalog_method_id: '',
        method_name: '',
        account_details: '',
        is_active: true,
        sort_order: 100,
    });
    const [paymentFields, setPaymentFields] = useState({ custom_details: '' });
    const [editingPaymentMethodId, setEditingPaymentMethodId] = useState(null);
    const [paymentTemplateHint, setPaymentTemplateHint] = useState('');
    const [selectedPaymentCatalogName, setSelectedPaymentCatalogName] = useState('');
    const [paymentSaved, setPaymentSaved] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const resetPaymentForm = () => {
        setPaymentForm({
            catalog_method_id: '',
            method_name: '',
            account_details: '',
            is_active: true,
            sort_order: 100,
        });
        setPaymentFields({ custom_details: '' });
        setSelectedPaymentCatalogName('');
        setEditingPaymentMethodId(null);
        setPaymentTemplateHint('');
        setPaymentError('');
    };

    const startEditPaymentMethod = (method) => {
        setEditingPaymentMethodId(method.id);
        const template = getPaymentTemplate(method.catalog_name || method.method_name || '', method.default_details_template || '');
        const currentCatalogName = method.catalog_name || method.method_name || '';
        setPaymentForm({
            catalog_method_id: method.catalog_method_id || '',
            method_name: method.method_name || '',
            account_details: method.account_details || '',
            is_active: !!method.is_active,
            sort_order: method.sort_order ?? 100,
        });
        setSelectedPaymentCatalogName(currentCatalogName);
        setPaymentFields(parsePaymentDetails(currentCatalogName, method.account_details || ''));
        setPaymentTemplateHint(template?.hint || '');
        setPaymentError('');
    };

    const handlePaymentMethodSubmit = async (e) => {
        e.preventDefault();
        setPaymentError('');
        try {
            const accountDetails = buildPaymentDetails(selectedPaymentCatalogName || paymentForm.method_name || '', paymentFields) || paymentForm.account_details;
            const payload = {
                ...paymentForm,
                account_details: accountDetails,
                catalog_method_id: paymentForm.catalog_method_id || null,
                sort_order: Number(paymentForm.sort_order || 100),
                is_active: !!paymentForm.is_active,
            };

            if (editingPaymentMethodId) {
                const res = await api.put(`/doctors/payment-methods/${editingPaymentMethodId}`, payload);
                setPaymentMethods(prev => prev.map(method => method.id === editingPaymentMethodId ? res.data : method));
                setPaymentSaved(true);
            } else {
                const res = await api.post('/doctors/payment-methods', payload);
                setPaymentMethods(prev => [...prev, res.data]);
                setPaymentSaved(true);
            }
            setTimeout(() => setPaymentSaved(false), 2500);
            resetPaymentForm();
        } catch (error) {
            setPaymentError(error.response?.data?.message || 'Error al guardar el método de pago.');
        }
    };

    const deletePaymentMethod = async (id) => {
        if (!window.confirm('¿Eliminar este método de pago?')) return;
        try {
            await api.delete(`/doctors/payment-methods/${id}`);
            setPaymentMethods(prev => prev.filter(method => method.id !== id));
            if (editingPaymentMethodId === id) resetPaymentForm();
        } catch (error) {
            setPaymentError(error.response?.data?.message || 'Error al eliminar el método.');
        }
    };

    const handlePaymentCatalogChange = (e) => {
        const value = e.target.value;
        if (!value) {
            resetPaymentForm();
            return;
        }
        
        const selectedCatalog = paymentCatalog.find(item => String(item.id) === String(value));
        const template = getPaymentTemplate(selectedCatalog?.name || '', selectedCatalog?.default_details_template || '');
        const nextName = selectedCatalog?.name || '';
        setPaymentForm(prev => ({
            ...prev,
            catalog_method_id: value,
            method_name: prev.method_name || selectedCatalog?.name || '',
            account_details: prev.account_details || template?.placeholder || '',
        }));
        setSelectedPaymentCatalogName(nextName);
        setPaymentFields(createDefaultPaymentFields(nextName, template?.placeholder || ''));
        setPaymentTemplateHint(template?.hint || '');
    };

    // Filter catalog items to only show those not yet added, UNLESS we are editing that specific item.
    const availableCatalog = paymentCatalog.filter(item => {
        if (getCatalogKey(item.name) === 'pago por plataforma') return false;
        if (editingPaymentMethodId && String(paymentForm.catalog_method_id) === String(item.id)) return true;
        return !paymentMethods.some(method => String(method.catalog_method_id) === String(item.id));
    });

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-black text-xl text-gray-900 dark:text-white border-b dark:border-white/10 pb-4 flex items-center gap-2 w-full md:w-auto md:flex-1">
                    <Save size={18} className="text-mindpath-primary dark:text-mindpath-primary"/> Métodos de Pago
                </h3>
                {paymentSaved && <span className="text-sm font-bold text-green-600">Cambios guardados.</span>}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">1. Elige el tipo</label>
                    <select
                        value={paymentForm.catalog_method_id}
                        onChange={handlePaymentCatalogChange}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20 appearance-none pr-10"
                    >
                        <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Seleccione un método de pago...</option>
                        {availableCatalog.map(item => (
                            <option key={item.id} value={item.id} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{item.name}</option>
                        ))}
                    </select>
                </div>

                {selectedPaymentCatalogName && (
                    <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-slate-700/30 p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Formato guiado</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-slate-200">{selectedPaymentCatalogName}</p>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{paymentTemplateHint || 'Campos sugeridos por defecto'}</p>
                        </div>

                        {(getCatalogKey(selectedPaymentCatalogName) === 'transferencia bancaria' || getCatalogKey(selectedPaymentCatalogName) === 'transferencia') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    value={paymentFields.bank_name || ''}
                                    onChange={e => setPaymentFields(p => ({ ...p, bank_name: e.target.value }))}
                                    className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20 appearance-none"
                                >
                                    <option value="" className="bg-white dark:bg-slate-800">Selecciona un Banco...</option>
                                    {VENEZUELAN_BANKS.map(bank => (
                                        <option key={bank.code} value={bank.name} className="bg-white dark:bg-slate-800">{bank.name}</option>
                                    ))}
                                </select>
                                <input type="text" value={paymentFields.account_holder || ''} onChange={e => setPaymentFields(p => ({ ...p, account_holder: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Titular" />
                                <input type="text" value={paymentFields.account_number || ''} onChange={e => setPaymentFields(p => ({ ...p, account_number: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Número de cuenta" />
                                <div className="flex bg-white dark:bg-slate-800/80 rounded-2xl focus-within:ring-2 focus-within:ring-mindpath-primary/20 overflow-hidden">
                                    <select
                                        value={paymentFields.doc_type || 'V'}
                                        onChange={e => setPaymentFields(p => ({ ...p, doc_type: e.target.value }))}
                                        className="p-4 pr-6 bg-transparent text-sm text-gray-900 dark:text-white font-bold outline-none focus:ring-0 border-r border-gray-100 dark:border-slate-700/50 appearance-none"
                                    >
                                        <option value="V" className="bg-white dark:bg-slate-800">V</option>
                                        <option value="E" className="bg-white dark:bg-slate-800">E</option>
                                        <option value="J" className="bg-white dark:bg-slate-800">J</option>
                                        <option value="P" className="bg-white dark:bg-slate-800">P</option>
                                        <option value="G" className="bg-white dark:bg-slate-800">G</option>
                                    </select>
                                    <input type="text" value={paymentFields.id_number || ''} onChange={e => setPaymentFields(p => ({ ...p, id_number: e.target.value }))} className="w-full p-4 bg-transparent border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-0" placeholder="Cédula/RIF" />
                                </div>
                                <input type="text" value={paymentFields.account_type || ''} onChange={e => setPaymentFields(p => ({ ...p, account_type: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20 md:col-span-2" placeholder="Tipo de cuenta (corriente, ahorro...)" />
                            </div>
                        )}

                        {getCatalogKey(selectedPaymentCatalogName) === 'zelle' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="email" value={paymentFields.zelle_email || ''} onChange={e => setPaymentFields(p => ({ ...p, zelle_email: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Correo Zelle" />
                                <input type="text" value={paymentFields.account_holder || ''} onChange={e => setPaymentFields(p => ({ ...p, account_holder: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Nombre completo del titular" />
                            </div>
                        )}

                        {getCatalogKey(selectedPaymentCatalogName) === 'binance' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" value={paymentFields.binance_id || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_id: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Binance ID" />
                                <input type="email" value={paymentFields.binance_email || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_email: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Correo asociado" />
                                <input type="text" value={paymentFields.binance_user || ''} onChange={e => setPaymentFields(p => ({ ...p, binance_user: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20 md:col-span-2" placeholder="Usuario / alias" />
                            </div>
                        )}

                        {getCatalogKey(selectedPaymentCatalogName) === 'paypal' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="email" value={paymentFields.paypal_email || ''} onChange={e => setPaymentFields(p => ({ ...p, paypal_email: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Correo PayPal" />
                                <input type="text" value={paymentFields.paypal_link || ''} onChange={e => setPaymentFields(p => ({ ...p, paypal_link: e.target.value }))} className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20" placeholder="Enlace (Ej: paypal.me/miusuario)" />
                            </div>
                        )}

                        {(getCatalogKey(selectedPaymentCatalogName) === 'pago movil' || getCatalogKey(selectedPaymentCatalogName) === 'pago móvil') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    value={paymentFields.bank_name || ''}
                                    onChange={e => setPaymentFields(p => ({ ...p, bank_name: e.target.value }))}
                                    className="w-full p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mindpath-primary/20 appearance-none"
                                >
                                    <option value="" className="bg-white dark:bg-slate-800">Selecciona un Banco...</option>
                                    {VENEZUELAN_BANKS.map(bank => (
                                        <option key={bank.code} value={bank.name} className="bg-white dark:bg-slate-800">{bank.name}</option>
                                    ))}
                                </select>
                                <div className="flex bg-white dark:bg-slate-800/80 rounded-2xl focus-within:ring-2 focus-within:ring-mindpath-primary/20 overflow-hidden">
                                    <select
                                        value={paymentFields.phone_prefix || '0412'}
                                        onChange={e => setPaymentFields(p => ({ ...p, phone_prefix: e.target.value }))}
                                        className="p-4 pr-6 bg-transparent text-sm text-gray-900 dark:text-white font-bold outline-none focus:ring-0 border-r border-gray-100 dark:border-slate-700/50 appearance-none"
                                    >
                                        <option value="0412">0412</option>
                                        <option value="0414">0414</option>
                                        <option value="0424">0424</option>
                                        <option value="0416">0416</option>
                                        <option value="0426">0426</option>
                                        <option value="0422">0422</option>
                                    </select>
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={paymentFields.phone_body || ''}
                                        onChange={e => setPaymentFields(p => ({ ...p, phone_body: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full p-4 bg-transparent border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-0"
                                        placeholder="Número (7 dígitos)"
                                    />
                                </div>
                                <div className="flex bg-white dark:bg-slate-800/80 rounded-2xl focus-within:ring-2 focus-within:ring-mindpath-primary/20 overflow-hidden md:col-span-2">
                                    <select
                                        value={paymentFields.doc_type || 'V'}
                                        onChange={e => setPaymentFields(p => ({ ...p, doc_type: e.target.value }))}
                                        className="p-4 pr-6 bg-transparent text-sm text-gray-900 dark:text-white font-bold outline-none focus:ring-0 border-r border-gray-100 dark:border-slate-700/50 appearance-none"
                                    >
                                        <option value="V">V</option>
                                        <option value="E">E</option>
                                        <option value="J">J</option>
                                        <option value="P">P</option>
                                        <option value="G">G</option>
                                        <option value="R">R</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={paymentFields.id_number || ''}
                                        onChange={e => setPaymentFields(p => ({ ...p, id_number: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full p-4 bg-transparent border-none text-sm text-gray-900 dark:text-white outline-none focus:ring-0"
                                        placeholder="Número de Cédula o RIF"
                                    />
                                </div>
                            </div>
                        )}

                        {(getCatalogKey(selectedPaymentCatalogName) === 'efectivo en consultorio' || getCatalogKey(selectedPaymentCatalogName) === 'efectivo') && (
                            <textarea
                                value={paymentFields.cash_note || ''}
                                onChange={e => setPaymentFields(p => ({ ...p, cash_note: e.target.value }))}
                                className="w-full h-24 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-mindpath-primary/20 resize-none"
                                placeholder="Indicaciones para efectivo"
                            />
                        )}

                        {getCatalogKey(selectedPaymentCatalogName) === 'pago por plataforma' && (
                            <textarea
                                value={paymentFields.platform_note || ''}
                                onChange={e => setPaymentFields(p => ({ ...p, platform_note: e.target.value }))}
                                className="w-full h-24 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-mindpath-primary/20 resize-none"
                                placeholder="Instrucciones para pago por plataforma"
                            />
                        )}

                        {getCatalogKey(selectedPaymentCatalogName) === 'otro' && (
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Detalles personalizados</label>
                                <textarea
                                    value={paymentFields.custom_details || ''}
                                    onChange={e => setPaymentFields(p => ({ ...p, custom_details: e.target.value }))}
                                    className="w-full h-32 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border-none text-sm text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-mindpath-primary/20 resize-none"
                                    placeholder="Escribe aquí los datos de cobro personalizados"
                                />
                            </div>
                        )}
                    </div>
                )}

                {selectedPaymentCatalogName && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Nombre visible (opcional)</label>
                            <input
                                type="text"
                                value={paymentForm.method_name}
                                onChange={e => setPaymentForm(p => ({ ...p, method_name: e.target.value }))}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20"
                                placeholder={`Se completará como ${selectedPaymentCatalogName}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase ml-2">Orden de Visualización (Menor número se muestra primero)</label>
                            <input
                                type="number"
                                value={paymentForm.sort_order}
                                onChange={e => setPaymentForm(p => ({ ...p, sort_order: e.target.value }))}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-none text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-mindpath-primary/20"
                                min={1}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={paymentForm.is_active}
                                onChange={e => setPaymentForm(p => ({ ...p, is_active: e.target.checked }))}
                                className="w-4 h-4 text-mindpath-primary rounded"
                            />
                            Método activo
                        </label>
                    </>
                )}

                {paymentError && <p className="text-sm font-medium text-red-500">{paymentError}</p>}

                {selectedPaymentCatalogName && (
                    <div className="flex gap-3 flex-wrap">
                        <button type="button" onClick={handlePaymentMethodSubmit} className="px-5 py-3 rounded-xl bg-mindpath-primary text-white font-bold hover:bg-mindpath-primaryHover transition-colors">
                            {editingPaymentMethodId ? 'Actualizar método' : 'Agregar método al perfil'}
                        </button>
                        {editingPaymentMethodId && (
                            <button type="button" onClick={resetPaymentForm} className="px-5 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                Cancelar edición
                            </button>
                        )}
                        {!editingPaymentMethodId && selectedPaymentCatalogName && (
                            <button type="button" onClick={resetPaymentForm} className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                Limpiar
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3 mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Tus Métodos Activos</h4>
                {paymentMethods.length === 0 ? (
                    <p className="text-sm text-gray-400">Todavía no has configurado métodos de pago.</p>
                ) : (
                    paymentMethods.map(method => (
                        <div key={method.id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-700/40 flex items-start justify-between gap-4">
                            <div>
                                <p className="font-black text-gray-900 dark:text-white">{method.method_name}</p>
                                {method.catalog_name && <p className="text-xs text-mindpath-primary font-bold mt-1">Base: {method.catalog_name}</p>}
                                <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 whitespace-pre-line">{method.account_details}</p>
                                <p className="text-xs text-gray-400 mt-2">Orden: {method.sort_order} {method.is_active ? '• Activo' : '• Inactivo'}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => startEditPaymentMethod(method)} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-slate-200">
                                    Editar
                                </button>
                                <button type="button" onClick={() => deletePaymentMethod(method.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold">
                                    Borrar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DoctorPaymentMethods;