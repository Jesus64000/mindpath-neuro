const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../frontend/src/pages/admin/AdminDashboard.jsx');
let content = fs.readFileSync(target, 'utf8');

// Replace "Theming" with "Personalización"
content = content.replace(
    /'👥 Usuarios',\s*\.\.\.\(isAdmin \? \['🎨 Theming'\] : \[\]\),/g,
    `'👥 Usuarios',\n        ...(isAdmin ? ['🎨 Personalización'] : []),`
);

// Add the reset button to the theming options
content = content.replace(
    /<div className="bg-white dark:bg-\[var\(--bg-card\)\] rounded-2xl border border-gray-100 dark:border-\[var\(--border-color\)\] p-5">\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Colores del Sistema<\/label>/g,
    `<div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Colores del Sistema</label>
                                    <button 
                                        onClick={() => {
                                            previewColor('primary_color', '#6D28D9');
                                            previewColor('primary_hover', '#5B21B6');
                                        }}
                                        className="text-xs font-bold text-mindpath-primary hover:underline"
                                    >
                                        Restaurar por defecto
                                    </button>
                                </div>`
);

fs.writeFileSync(target, content);
console.log('Fixed AdminDashboard.');
