import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Upload, X, DollarSign, Landmark, CreditCard, Check, Sparkles, Copy } from 'lucide-react';

// Recibe appointment completo para mostrar monto y método
const UploadProofModal = ({ isOpen, onClose, onSuccess, appointment }) => {
  const [file, setFile] = useState(null);
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Métodos de pago del doctor
  const [doctorMethods, setDoctorMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(appointment?.payment_method || '');

  // Tasa de cambio BCV
  const [exchangeRate, setExchangeRate] = useState(36.50);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    if (isOpen && appointment?.doctor_id) {
      // Cargar métodos de pago del doctor
      api.get(`/doctors/${appointment.doctor_id}`).then(res => {
        setDoctorMethods(res.data.payment_methods || []);
      }).catch(err => console.error("Error al cargar métodos del doctor:", err));
      
      setSelectedMethod(appointment.payment_method);
      
      // Obtener tasa BCV configurada en el Admin
      setLoadingRate(true);
      api.get('/admin/settings')
        .then(res => {
          if (res.data && res.data.exchange_rate) {
            setExchangeRate(parseFloat(res.data.exchange_rate) || 36.50);
          }
        })
        .catch(err => console.error("Error al cargar tasa de cambio del servidor:", err))
        .finally(() => setLoadingRate(false));
    }
  }, [isOpen, appointment]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleCopyInstructions = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecciona un archivo de comprobante.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = uploadRes.data.url;
      await api.post(`/appointments/${appointment?.appointment_id}/payment-proof`, {
        proof_url: fileUrl,
        reference,
        payment_method: selectedMethod,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir el comprobante.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const currentMethodDetails = doctorMethods.find(m => m.method_name === selectedMethod);
  const amountUSD = Number(appointment.consultation_fee_snapshot || 0);
  
  // Detectar si el método es en Bolívares (Pago Móvil, Transferencia Bancaria)
  const isLocalMethod = selectedMethod && (
    selectedMethod.toLowerCase().includes('movil') ||
    selectedMethod.toLowerCase().includes('móvil') ||
    selectedMethod.toLowerCase().includes('transferencia') ||
    selectedMethod.toLowerCase().includes('banco') ||
    selectedMethod.toLowerCase().includes('bolivar') ||
    selectedMethod.toLowerCase().includes('bs')
  );

  const amountVES = amountUSD * exchangeRate;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-900/90 border border-purple-500/20 rounded-[2.5rem] w-full max-w-md p-7 relative shadow-[0_0_50px_0_rgba(109,40,217,0.15)] overflow-hidden text-white transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-slate-800/80 border border-white/5 rounded-full hover:bg-slate-700 hover:border-white/10 text-gray-400 hover:text-white transition-all duration-200"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles size={18} />
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Reportar Pago
          </h2>
        </div>

        {/* Main Amount Card */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900/50 border border-purple-500/20 shadow-inner">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monto a pagar</span>
            <div className="flex items-center text-emerald-400 font-black text-lg gap-0.5">
              <DollarSign size={18} />
              <span>{amountUSD.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-400 ml-1">USD</span>
            </div>
          </div>
          
          <label className="block text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1.5">Confirmar Método de Pago</label>
          <div className="relative">
            <select 
              value={selectedMethod} 
              onChange={e => setSelectedMethod(e.target.value)}
              className="w-full p-3 pl-4 rounded-xl border border-white/10 bg-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="platform" className="bg-slate-900 text-white">Pago por Plataforma (General)</option>
              {doctorMethods.map(m => (
                <option key={m.id} value={m.method_name} className="bg-slate-900 text-white">{m.method_name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
              <CreditCard size={14} />
            </div>
          </div>

          {/* Dynamic Bs Exchange Rate Calculator */}
          {isLocalMethod && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-400">Tasa de Cambio (BCV):</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl tracking-wide">
                  {exchangeRate.toFixed(2)} Bs/$
                </span>
              </div>

              {/* Total in Bs (VES) Badge */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Total a Transferir (VES)</span>
                <div className="text-xl font-black text-emerald-400 tracking-tight">
                  {amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">Bs.</span>
                </div>
              </div>
            </div>
          )}

          {/* Details of selected method */}
          {currentMethodDetails && (
            <div className="mt-3 relative text-[11px] text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 whitespace-pre-line leading-relaxed">
              <div className="flex items-center justify-between font-black text-purple-400 mb-1.5 uppercase tracking-wider text-[10px]">
                <span className="flex items-center gap-1"><Landmark size={12} /> Instrucciones de Pago</span>
                <button 
                  onClick={() => handleCopyInstructions(currentMethodDetails.account_details)}
                  className="p-1 hover:bg-white/10 rounded transition-all text-slate-400 hover:text-white"
                  title="Copiar datos"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
              {currentMethodDetails.account_details}
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom File Upload Dropzone */}
          <div className="relative">
            <input
              type="file"
              id="payment-proof-file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`p-4 rounded-2xl border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center gap-2 ${
              file 
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' 
                : 'border-white/10 bg-slate-800/50 hover:border-purple-500/30 hover:bg-purple-500/5 text-slate-400 hover:text-slate-200'
            }`}>
              {file ? (
                <>
                  <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check size={20} />
                  </div>
                  <div className="text-xs font-bold truncate max-w-[280px]">
                    {file.name}
                  </div>
                  <span className="text-[10px] text-emerald-500/80">Archivo seleccionado correctamente</span>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-slate-800 text-slate-300">
                    <Upload size={20} />
                  </div>
                  <div className="text-xs font-bold">Seleccionar Comprobante</div>
                  <span className="text-[10px] text-slate-500">PDF, JPG o PNG de la transferencia</span>
                </>
              )}
            </div>
          </div>

          {/* Reference Input */}
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Nro de referencia o nota (ej. Transferencia #1234)"
            className="w-full p-3.5 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />

          {error && <div className="text-red-500 text-xs font-black bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-950/40 hover:shadow-purple-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {uploading ? 'Subiendo...' : 'Enviar comprobante'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProofModal;
