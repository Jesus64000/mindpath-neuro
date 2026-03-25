const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../frontend/src/pages/admin/AdminDashboard.jsx');
let content = fs.readFileSync(target, 'utf8');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Make KpiCard clickable — add onClick and cursor-pointer
// ═══════════════════════════════════════════════════════════════════════════════
content = content.replace(
    /const KpiCard = \(\{ icon: Icon, label, value, color = 'text-mindpath-primary', bg = 'bg-mindpath-light' \}\) => \(\s*<div className="bg-white dark:bg-\[var\(--bg-card\)\] rounded-2xl border border-gray-100 dark:border-\[var\(--border-color\)\] p-5 flex items-center gap-4 shadow-sm">/,
    `const KpiCard = ({ icon: Icon, label, value, color = 'text-mindpath-primary', bg = 'bg-mindpath-light', onClick }) => (
    <div onClick={onClick} className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-mindpath-primary/30 transition-all">`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Add font_family to theme state initialization
// ═══════════════════════════════════════════════════════════════════════════════
content = content.replace(
    /const \[theme, setTheme\]\s*= useState\(\{ clinic_name: clinicName, logo_url: logoUrl \|\| '', primary_color: primaryColor, primary_hover: primaryHover \}\);/,
    `const [theme, setTheme]       = useState({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover, font_family: 'Inter' });`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Update useSettingsStore import to include fontFamily
// ═══════════════════════════════════════════════════════════════════════════════
content = content.replace(
    /const \{ clinicName, logoUrl, primaryColor, primaryHover, applySettings \} = useSettingsStore\(\);/,
    `const { clinicName, logoUrl, primaryColor, primaryHover, fontFamily, applySettings } = useSettingsStore();`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Update theme initialization in useEffect to include font_family
// ═══════════════════════════════════════════════════════════════════════════════
content = content.replace(
    /setTheme\(\{ clinic_name: clinicName, logo_url: logoUrl \|\| '', primary_color: primaryColor, primary_hover: primaryHover \}\);/,
    `setTheme({ clinic_name: clinicName, logo_url: logoUrl || '', primary_color: primaryColor, primary_hover: primaryHover, font_family: fontFamily || 'Inter' });`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Update saveTheme to pass font_family in applySettings
// ═══════════════════════════════════════════════════════════════════════════════
content = content.replace(
    /applySettings\(\{ clinic_name: payload\.clinic_name, logo_url: payload\.logo_url, primary_color: payload\.primary_color, primary_hover: payload\.primary_hover \}\);/,
    `applySettings({ clinic_name: payload.clinic_name, logo_url: payload.logo_url, primary_color: payload.primary_color, primary_hover: payload.primary_hover, font_family: payload.font_family });`
);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Add font selector block after the color section (before the Logo block)
// ═══════════════════════════════════════════════════════════════════════════════
const fontSelectorBlock = `
                            <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
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
                            </div>

`;

// Insert font selector right before the Logo block
content = content.replace(
    /(<div className="bg-white dark:bg-\[var\(--bg-card\)\] rounded-2xl border border-gray-100 dark:border-\[var\(--border-color\)\] p-5">\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Logo<\/label>)/,
    fontSelectorBlock + '$1'
);

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Add onClick handlers to KPI cards in the metrics section
// ═══════════════════════════════════════════════════════════════════════════════
// Users
content = content.replace(
    `<KpiCard icon={Users}       label="Usuarios Totales"    value={stats?.kpis.totalUsers} />`,
    `<KpiCard icon={Users}       label="Usuarios Totales"    value={stats?.kpis.totalUsers} onClick={() => setActiveTab(TAB.users)} />`
);
// Verified Doctors
content = content.replace(
    `<KpiCard icon={UserCheck}   label="Doctores Verificados" value={stats?.kpis.totalDoctors} color="text-green-600" bg="bg-green-50" />`,
    `<KpiCard icon={UserCheck}   label="Doctores Verificados" value={stats?.kpis.totalDoctors} color="text-green-600" bg="bg-green-50" onClick={() => setActiveTab(TAB.users)} />`
);
// Pending
content = content.replace(
    `<KpiCard icon={UserX}       label="Pendientes Verificar" value={stats?.kpis.pendingDoctors} color="text-yellow-600" bg="bg-yellow-50" />`,
    `<KpiCard icon={UserX}       label="Pendientes Verificar" value={stats?.kpis.pendingDoctors} color="text-yellow-600" bg="bg-yellow-50" onClick={() => setActiveTab(TAB.verification)} />`
);

fs.writeFileSync(target, content);
console.log('AdminDashboard updated: KPI clicks + font selector + theme state.');
