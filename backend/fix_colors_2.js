const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else if (file.endsWith('.jsx')) {
            filelist.push(dirFile);
        }
    });
    return filelist;
};

const srcDir = path.join(__dirname, '../frontend/src');
const files = walkSync(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace strict mindpath-dark text/bgs
    content = content.replace(/bg-mindpath-dark/g, 'bg-slate-900');
    content = content.replace(/text-mindpath-dark/g, 'text-slate-900');

    // Replace the Hardcoded Recharts colors in AdminDashboard & DoctorStats
    if(file.includes('AdminDashboard.jsx') || file.includes('DoctorStats.jsx')) {
        // We'll replace the static CHART_COLORS with slightly varied opacities of mindpath-primary
        content = content.replace(
            /const CHART_COLORS = \['#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'\];/g,
            `// COLORES DINAMICOS
const getDynamicChartColors = () => {
    const root = document.documentElement;
    const baseRGB = getComputedStyle(root).getPropertyValue('--color-primary-rgb').trim() || '109 40 217';
    // Generar variaciones de opacidad para el pie chart
    return [
        \`rgb(\${baseRGB})\`,
        \`rgb(\${baseRGB} / 0.8)\`,
        \`rgb(\${baseRGB} / 0.6)\`,
        \`rgb(\${baseRGB} / 0.4)\`,
        \`rgb(\${baseRGB} / 0.2)\`,
    ];
};`
        );
        // AdminDashboard PieChart loop fix
        content = content.replace(
            /CHART_COLORS\[i % CHART_COLORS\.length\]/g,
            'getDynamicChartColors()[i % 5]'
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated:', file);
    }
});
console.log('Finished secondary color sweep.');
