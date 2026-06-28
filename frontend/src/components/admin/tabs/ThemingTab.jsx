import { Palette, Upload, Save, RefreshCw, Mail, Landmark } from 'lucide-react';
import { BACKEND_URL } from '../../../api/constants';

const PRESET_FONTS = ['Inter','Roboto','Poppins','Outfit','Nunito','Lato','Open Sans','Montserrat','Raleway','system-ui'];

const ThemingTab = ({ 
    theme, 
    setTheme, 
    logoFile, 
    setLogoFile, 
    customFontName, 
    setCustomFontName, 
    onSave, 
    onPreviewColor, 
    saving,
    onSyncBcv,
    syncingBcv,
    onSendTestEmail,
    sendingTestEmail = false
}) => {
    const [testEmailInput, setTestEmailInput] = useState('');
    
    const isCustomFont = !PRESET_FONTS.includes(theme.font_family) && theme.font_family !== '__custom__';

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="font-bold text-gray-800 dark:text-white">Motor de Personalización</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nombre de la Clínica</label>
                        <input 
                            value={theme.clinic_name} 
                            onChange={e => setTheme(p => ({ ...p, clinic_name: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        />
                    </div>

                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Colores del Sistema</label>
                            <button 
                                onClick={() => {
                                    onPreviewColor('primary_color', '#6D28D9');
                                    onPreviewColor('primary_hover', '#5B21B6');
                                }}
                                className="text-xs font-bold text-mindpath-primary hover:underline"
                            >
                                Restaurar por defecto
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <input type="color" value={theme.primary_color}
                                    onChange={e => onPreviewColor('primary_color', e.target.value)}
                                    className="h-12 w-16 rounded-xl border-0 cursor-pointer bg-transparent" 
                                />
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-white">Color Primario</p>
                                    <p className="text-xs text-gray-400 font-mono">{theme.primary_color}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <input type="color" value={theme.primary_hover}
                                    onChange={e => onPreviewColor('primary_hover', e.target.value)}
                                    className="h-12 w-16 rounded-xl border-0 cursor-pointer bg-transparent" 
                                />
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-white">Color Hover (botones)</p>
                                    <p className="text-xs text-gray-400 font-mono">{theme.primary_hover}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tipografía del Sistema</label>
                        <select
                            value={isCustomFont ? '__custom__' : theme.font_family}
                            onChange={e => {
                                if (e.target.value === '__custom__') {
                                    setCustomFontName('');
                                    setTheme(p => ({ ...p, font_family: '__custom__' }));
                                } else {
                                    setCustomFontName('');
                                    setTheme(p => ({ ...p, font_family: e.target.value }));
                                }
                            }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-3"
                        >
                            <option value="Inter">Inter (Moderna)</option>
                            <option value="Roboto">Roboto (Clásica)</option>
                            <option value="Poppins">Poppins (Redondeada)</option>
                            <option value="Outfit">Outfit (Geométrica)</option>
                            <option value="Nunito">Nunito (Suave)</option>
                            <option value="Lato">Lato (Elegante)</option>
                            <option value="Open Sans">Open Sans (Legible)</option>
                            <option value="Montserrat">Montserrat (Fuerte)</option>
                            <option value="Raleway">Raleway (Fina)</option>
                            <option value="system-ui">Sistema (Por defecto del SO)</option>
                            <option value="__custom__">✨ Google Font personalizada...</option>
                        </select>

                        {(isCustomFont || theme.font_family === '__custom__') && (
                            <div className="animate-fadeIn mt-1 mb-3 p-4 bg-mindpath-primary/5 border border-mindpath-primary/20 rounded-xl">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                    Nombre exacto de la fuente en Google Fonts
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Space Mono, Oswald, Playfair Display..."
                                    value={customFontName}
                                    onChange={e => {
                                        setCustomFontName(e.target.value);
                                        if (e.target.value.trim()) {
                                            const formatted = e.target.value.trim().replace(/\s+/g, '+');
                                            const url = `https://fonts.googleapis.com/css2?family=${formatted}:wght@300;400;500;600;700;800&display=swap`;
                                            let el = document.getElementById('mindpath-preview-font');
                                            if (!el) { el = document.createElement('link'); el.id = 'mindpath-preview-font'; el.rel = 'stylesheet'; document.head.appendChild(el); }
                                            el.href = url;
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-800 dark:text-white"
                                />
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">
                                    Busca en <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-mindpath-primary hover:underline font-semibold">fonts.google.com</a> y copia el nombre tal cual aparece.
                                </p>
                            </div>
                        )}

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Vista previa</p>
                            <p
                                className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                                style={{ fontFamily: `'${ (isCustomFont || theme.font_family === '__custom__') ? customFontName || 'Inter' : theme.font_family}', sans-serif` }}
                            >
                                MindPath Neuro — Centro de Salud Mental y Neurológica. Tu bienestar es nuestra prioridad. 0123456789<br/>
                                <span className="font-bold">Texto en negrita</span> · <span className="font-light">Texto ligero</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Logo</label>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Subir desde disco</p>
                                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-3 hover:border-mindpath-primary transition-colors">
                                    <Upload size={16} className="text-gray-400"/>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{logoFile ? logoFile.name : 'Subir PNG transparente (Sin fondo · recomendado)'}</span>
                                    <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={e => {
                                        if (e.target.files[0]) setLogoFile(e.target.files[0]);
                                    }}/>
                                </label>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">O pegar URL externa</p>
                                <input value={theme.logo_url} onChange={e => setTheme(p => ({ ...p, logo_url: e.target.value }))}
                                    placeholder="https://mi-sitio.com/logo.png"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                                <input 
                                    type="checkbox" 
                                    id="hide_sidebar_text"
                                    checked={!!theme.hide_sidebar_text}
                                    onChange={e => setTheme(p => ({ ...p, hide_sidebar_text: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-mindpath-primary focus:ring-mindpath-primary"
                                />
                                <label htmlFor="hide_sidebar_text" className="text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                                    Ocultar texto del nombre de la clínica en la barra lateral
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
                                Recomendado si tu logo personalizado ya incluye el nombre de tu clínica (como un logo horizontal), así se verá mucho más grande y limpio.
                            </p>
                            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl mt-3 text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-semibold">
                                💡 <strong>Recomendación de Diseño:</strong> Sube tu logo en formato <strong>PNG con fondo transparente</strong> y recortado al ras (sin márgenes o espacios vacíos grandes en los bordes). Esto permitirá que se adapte perfectamente al fondo del sistema y se visualice con el tamaño ideal tanto en la app como en tus <strong>facturas PDF e informes clínicos descargables</strong>.
                            </div>
                        </div>
                    </div>

                    {/* CONFIGURACIÓN DE TASA DE CAMBIO BCV (Bs/$) */}
                    <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <Landmark size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Tasa de Cambio Bolívares (BCV)</h3>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Conversión oficial de citas en Bs</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-widest">Modo de Tasa</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setTheme(p => ({ ...p, exchange_rate_mode: 'auto' }))}
                                        style={theme.exchange_rate_mode === 'auto' ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color } : {}}
                                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                            theme.exchange_rate_mode === 'auto' 
                                                ? 'text-white shadow-sm font-extrabold' 
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                        }`}
                                    >
                                        🌐 Automático (APIs)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setTheme(p => ({ ...p, exchange_rate_mode: 'manual' }))}
                                        style={theme.exchange_rate_mode === 'manual' ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color } : {}}
                                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                            theme.exchange_rate_mode === 'manual' 
                                                ? 'text-white shadow-sm font-extrabold' 
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                        }`}
                                    >
                                        ✍️ Manual (Fijo)
                                    </button>
                                </div>
                            </div>

                            {theme.exchange_rate_mode === 'auto' ? (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">🔍 Monitoreo Automático Activo</p>
                                    El servidor consulta en paralelo y selecciona la tasa de cambio oficial de dos APIs estables <strong>(DolarApi oficial y PyDolarVe)</strong> con reintentos y tolerancia a fallos.
                                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                                            <span>Tasa Actual:</span>
                                            <span style={{ color: theme.primary_color }} className="font-black text-sm">{Number(theme.exchange_rate || 36.50).toFixed(2)} Bs/$</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={onSyncBcv}
                                            disabled={syncingBcv}
                                            style={{ backgroundColor: theme.primary_color }}
                                            className="w-full flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] text-white font-bold py-2 px-3 rounded-lg border-0 text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            <RefreshCw size={11} className={syncingBcv ? 'animate-spin' : ''} />
                                            {syncingBcv ? 'Sincronizando...' : 'Sincronizar ahora con la API 🇻🇪'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Valor de la Tasa Manual (Bs/$)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={theme.exchange_rate || ''}
                                            onChange={e => setTheme(p => ({ ...p, exchange_rate: parseFloat(e.target.value) || 0 }))}
                                            placeholder="Ej: 36.50"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold" 
                                        />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Bs.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Vista Previa</h3>
                    <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-slate-600">
                        <div className="flex">
                            <div className="w-28 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 p-3 flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                    {(theme.logo_url || logoFile) ? (
                                        <img src={logoFile ? URL.createObjectURL(logoFile) : (theme.logo_url.startsWith('http') ? theme.logo_url : `${BACKEND_URL}${theme.logo_url}`)} 
                                            alt="Logo" className={`${(theme.hide_sidebar_text && (theme.logo_url || logoFile)) ? 'h-8 max-w-[75px]' : 'h-5'} w-auto object-contain mr-1 shrink-0 rounded`} />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                                    )}
                                    {!(theme.hide_sidebar_text && (theme.logo_url || logoFile)) && (
                                        <span className="text-xs font-bold text-gray-700 dark:text-white truncate">{theme.clinic_name}</span>
                                    )}
                                </div>
                                {['Panel', 'Pacientes', 'Agenda'].map(n => (
                                    <div key={n} className={`text-xs px-2 py-1.5 rounded-lg font-medium ${n === 'Panel' ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                                        style={n === 'Panel' ? { backgroundColor: theme.primary_color } : {}}>
                                        {n}
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-slate-900 p-3 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold"
                                        style={{ backgroundColor: theme.primary_color }}>
                                        Botón primario
                                    </button>
                                    <button className="text-xs text-white px-3 py-1.5 rounded-lg font-bold"
                                        style={{ backgroundColor: theme.primary_hover }}>
                                        Botón hover
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onSave} 
                disabled={saving}
                className="flex items-center gap-2 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold px-8 py-4 rounded-2xl transition-colors disabled:opacity-60 shadow-lg shadow-mindpath-primary/25"
            >
                {saving ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}
                {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
    );
};

export default ThemingTab;
