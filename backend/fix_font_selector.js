const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../frontend/src/pages/admin/AdminDashboard.jsx');
let content = fs.readFileSync(target, 'utf8');

// Replace the simple font selector block with a combined select + custom input
const oldFontBlock = `                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tipografía del Sistema</label>
                                <select value={theme.font_family || 'Inter'}
                                    onChange={e => setTheme(p => ({ ...p, font_family: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                    <option value="Inter">Inter (Moderna)</option>
                                    <option value="Roboto">Roboto (Clásica)</option>
                                    <option value="Poppins">Poppins (Redondeada)</option>
                                    <option value="Outfit">Outfit (Geométrica)</option>
                                    <option value="system-ui">Sistema (Por defecto del SO)</option>
                                </select>
                            </div>`;

const newFontBlock = `                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tipografía del Sistema</label>
                                <select value={['Inter','Roboto','Poppins','Outfit','Nunito','Lato','Open Sans','Montserrat','Raleway','system-ui'].includes(theme.font_family) ? theme.font_family : '__custom__'}
                                    onChange={e => {
                                        if (e.target.value !== '__custom__') setTheme(p => ({ ...p, font_family: e.target.value }));
                                    }}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-3">
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
                                {(!['Inter','Roboto','Poppins','Outfit','Nunito','Lato','Open Sans','Montserrat','Raleway','system-ui'].includes(theme.font_family) || theme.font_family === '__custom__') && (
                                    <div className="mt-2">
                                        <input 
                                            type="text" 
                                            value={theme.font_family === '__custom__' ? '' : (theme.font_family || '')}
                                            onChange={e => setTheme(p => ({ ...p, font_family: e.target.value }))}
                                            placeholder="Escribe el nombre exacto de la fuente de Google Fonts..."
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mindpath-primary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            Busca fuentes en <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-mindpath-primary hover:underline">fonts.google.com</a> y escribe el nombre exacto (ej: "Playfair Display", "Dancing Script").
                                        </p>
                                    </div>
                                )}
                                <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                                    <p className="text-sm text-gray-600 dark:text-gray-300" style={{ fontFamily: theme.font_family + ', sans-serif' }}>
                                        Vista previa: El zorro marrón ágil salta sobre el perro perezoso. 0123456789
                                    </p>
                                </div>
                            </div>`;

content = content.replace(oldFontBlock, newFontBlock);

fs.writeFileSync(target, content);
console.log('Font selector updated with Google Fonts support.');
