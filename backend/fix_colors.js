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

    // Replace backgrounds, text, borders, etc. with opacities
    content = content.replace(/(bg|text|border|shadow|outline|ring|from|to|via)-(purple|violet)-[1-9]00\/(\d+)/g, '$1-mindpath-primary/$3');
    
    // Replace light variants
    content = content.replace(/(bg|border|ring)-(purple|violet)-(50|100)/g, '$1-mindpath-light');
    content = content.replace(/(text)-(purple|violet)-(50|100)/g, '$1-gray-400');

    // Replace regular ones without opacities
    content = content.replace(/(bg|text|border|shadow|outline|ring|from|to|via)-(purple|violet)-[1-9]00/g, '$1-mindpath-primary');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated:', file);
    }
});

console.log('Finished replacing colors.');
