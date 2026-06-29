import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { BACKEND_URL } from '../../api/constants';
import { 
    CreditCard, Search, Download, Eye, FileText, XCircle, 
    AlertCircle, CheckCircle, Activity, Filter, RefreshCw, Calendar, RotateCcw, X
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';

const paymentStatusConfig = {
    paid: { label: 'Pagado', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' },
    verifying: { label: 'Por Verificar', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' },
    pending: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30' },
    rejected: { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30' },
    unpaid: { label: 'Sin Pagar', color: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-700' }
};

const methodLabels = {
    platform: 'Plataforma (Online)',
    in_person: 'Pago en Consultorio',
    pago_movil: 'Pago Móvil',
    transferencia: 'Transferencia Bancaria',
    zelle: 'Zelle',
    efectivo: 'Efectivo',
    paypal: 'PayPal',
    card: 'Tarjeta de Crédito'
};

const DoctorPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [modalityFilter, setModalityFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [zoomImage, setZoomImage] = useState(null);
    const [zoomRef, setZoomRef] = useState('');

    const fetchPayments = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/doctors/payments');
            setPayments(res.data);
        } catch (e) {
            console.error('Error cargando pagos:', e);
            setError('No se pudo cargar el historial de pagos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const d = new Date(`${datePart}T12:00:00`);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const resetFilters = () => {
        setQuery('');
        setStatusFilter('all');
        setMethodFilter('all');
        setModalityFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = query || statusFilter !== 'all' || methodFilter !== 'all' || modalityFilter !== 'all' || startDate || endDate;

    // Filtrado Avanzado
    const q = query.toLowerCase();
    const filtered = payments.filter(p => {
        const matchesQuery = !q || p.patient_name?.toLowerCase().includes(q) || 
                             p.invoice_number?.toLowerCase().includes(q) ||
                             (p.payment_reference && p.payment_reference.toLowerCase().includes(q));
        const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
        const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
        const matchesModality = modalityFilter === 'all' || p.appointment_type === modalityFilter;

        let matchesDate = true;
        if (p.appointment_date) {
            const pDateStr = p.appointment_date.includes('T') ? p.appointment_date.split('T')[0] : p.appointment_date;
            if (startDate && pDateStr < startDate) matchesDate = false;
            if (endDate && pDateStr > endDate) matchesDate = false;
        }

        return matchesQuery && matchesStatus && matchesMethod && matchesModality && matchesDate;
    });

    const handleZoom = (proofUrl, ref) => {
        if (!proofUrl) return;
        const url = proofUrl.startsWith('http') ? proofUrl : `${BACKEND_URL}${proofUrl}`;
        setZoomImage(url);
        setZoomRef(ref || '');
    };

    // Calcular estadísticas simples basadas en pagos
    const totalEarnings = payments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const pendingEarnings = payments
        .filter(p => p.payment_status === 'verifying')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-mindpath-light dark:bg-mindpath-primary/40 rounded-xl flex items-center justify-center text-mindpath-primary">
                        <CreditCard size={22} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Registro de Pagos</h1>
                </div>

                <button 
                    onClick={fetchPayments} 
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-gray-600 dark:text-slate-300 transition-colors"
                    title="Actualizar datos"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Resumen de Cobros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-2xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Total Cobrado (Neto)</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">${totalEarnings.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Por Verificar</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">${pendingEarnings.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Consultas Totales</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{payments.length}</p>
                    </div>
                </div>
            </div>

            {/* Panel Avanzado de Filtros */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                {/* Primera Fila: Buscador y Botón Restablecer */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-2.5 w-full md:w-96 gap-2">
                        <Search size={18} className="text-gray-400 dark:text-slate-500 shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por paciente, factura o referencia..."
                            className="outline-none text-sm bg-transparent text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 w-full font-medium"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button 
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3.5 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl transition-all border border-red-100 dark:border-red-900/30 self-end md:self-auto"
                        >
                            <RotateCcw size={14} /> Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* Segunda Fila: Filtros Específicos (Método, Modalidad, Fechas desde/hasta) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    {/* Método de Pago */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Tipo de Pago</label>
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="w-full p-2.5 text-xs font-bold bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-mindpath-primary text-gray-700 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="all">💳 Todos los métodos</option>
                            <option value="pago_movil">📱 Pago Móvil</option>
                            <option value="zelle">⚡ Zelle</option>
                            <option value="in_person">🏢 Pago en Consultorio</option>
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="transferencia">🏦 Transferencia Bancaria</option>
                            <option value="platform">💻 Plataforma (Online)</option>
                            <option value="paypal">🅿️ PayPal</option>
                            <option value="card">💳 Tarjeta de Crédito</option>
                        </select>
                    </div>

                    {/* Modalidad de Consulta */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Modalidad</label>
                        <select
                            value={modalityFilter}
                            onChange={(e) => setModalityFilter(e.target.value)}
                            className="w-full p-2.5 text-xs font-bold bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-mindpath-primary text-gray-700 dark:text-slate-200 cursor-pointer"
                        >
                            <option value="all">🏥 Todas las modalidades</option>
                            <option value="virtual">🎥 Virtual (Online)</option>
                            <option value="presencial">🏢 Presencial</option>
                        </select>
                    </div>

                    {/* Fecha Desde */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Fecha Desde</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2.5 text-xs font-bold bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-mindpath-primary text-gray-700 dark:text-slate-200 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Fecha Hasta */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Fecha Hasta</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2.5 text-xs font-bold bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:border-mindpath-primary text-gray-700 dark:text-slate-200 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Tercera Fila: Estado del Pago (Pills) */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100 dark:border-white/5 scrollbar-none">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-400 shrink-0 mr-1">Estado:</span>
                    {[
                        { val: 'all', label: 'Todos' },
                        { val: 'paid', label: 'Pagados' },
                        { val: 'verifying', label: 'Por Verificar' },
                        { val: 'pending', label: 'Pendientes' },
                        { val: 'rejected', label: 'Rechazados' }
                    ].map(btn => (
                        <button
                            key={btn.val}
                            onClick={() => setStatusFilter(btn.val)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                                statusFilter === btn.val
                                    ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-sm'
                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado en Tabla */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={36} />
                </div>
            ) : error ? (
                <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-[2rem] text-center text-red-700 dark:text-red-400 font-bold">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                    {error}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-white/10">
                                <tr>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Fecha / Hora</th>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Paciente</th>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Modalidad</th>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Monto</th>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Método</th>
                                    <th className="p-5 font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Estado</th>
                                    <th className="p-5 text-right font-bold text-gray-400 dark:text-slate-400 text-xs uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {filtered.map(p => {
                                    const st = paymentStatusConfig[p.payment_status] || paymentStatusConfig.pending;
                                    return (
                                        <tr key={p.appointment_id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="p-5 whitespace-nowrap">
                                                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{formatDate(p.appointment_date)}</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.start_time ? p.start_time.substring(0, 5) : '—'}</p>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar fullName={p.patient_name} size="8" />
                                                    <span className="font-bold text-gray-800 dark:text-white text-sm">{p.patient_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 whitespace-nowrap hidden sm:table-cell">
                                                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold">
                                                    {p.appointment_type === 'virtual' ? '🎥 Virtual' : '🏥 Presencial'}
                                                </span>
                                            </td>
                                            <td className="p-5 whitespace-nowrap">
                                                <span className="font-extrabold text-gray-900 dark:text-white text-sm">${parseFloat(p.amount || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="p-5 hidden md:table-cell">
                                                {p.payment_method ? (
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300">{methodLabels[p.payment_method] || p.payment_method}</p>
                                                        {p.payment_reference && (
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Ref: {p.payment_reference}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 dark:text-slate-500 italic">No especificado</span>
                                                )}
                                            </td>
                                            <td className="p-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {p.payment_proof_url && !p.payment_proof_url.toLowerCase().endsWith('.pdf') && (
                                                        <button 
                                                            onClick={() => handleZoom(p.payment_proof_url, p.payment_reference)}
                                                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-gray-600 dark:text-slate-300 transition-colors"
                                                            title="Ver Comprobante"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                    )}
                                                    {p.payment_proof_url && p.payment_proof_url.toLowerCase().endsWith('.pdf') && (
                                                        <a 
                                                            href={p.payment_proof_url.startsWith('http') ? p.payment_proof_url : `${BACKEND_URL}${p.payment_proof_url}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-gray-600 dark:text-slate-300 transition-colors inline-block"
                                                            title="Ver Comprobante PDF"
                                                        >
                                                            <Eye size={15} />
                                                        </a>
                                                    )}
                                                    {p.invoice_pdf_path ? (
                                                        <a 
                                                            href={`${BACKEND_URL}${p.invoice_pdf_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-mindpath-primary/10 hover:bg-mindpath-primary/20 text-mindpath-primary rounded-xl transition-colors inline-block"
                                                            title="Descargar Factura PDF"
                                                            download
                                                        >
                                                            <Download size={15} />
                                                        </a>
                                                    ) : (
                                                        <span className="p-2 text-gray-300 dark:text-slate-600 cursor-not-allowed" title="Sin factura generada">
                                                            <Download size={15} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center text-gray-400 dark:text-slate-500 font-bold">
                                            <CreditCard size={36} className="mx-auto mb-3 opacity-30" />
                                            Sin registros de cobros coincidentes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Lightbox Zoom Modal */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
                    onClick={() => { setZoomImage(null); setZoomRef(''); }}
                >
                    <div className="relative max-w-4xl w-full flex flex-col items-center">
                        <button 
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 font-black text-sm bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 transition-all flex items-center gap-1"
                            onClick={() => { setZoomImage(null); setZoomRef(''); }}
                        >
                            <XCircle size={16} /> Cerrar
                        </button>
                        <img 
                            src={zoomImage} 
                            alt="Comprobante de pago ampliado" 
                            className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl cursor-default" 
                            onClick={(e) => e.stopPropagation()}
                        />
                        {zoomRef && (
                            <p className="mt-4 text-white font-bold bg-black/60 px-4 py-2 rounded-xl text-sm" onClick={(e) => e.stopPropagation()}>
                                Referencia Bancaria: {zoomRef}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPayments;
