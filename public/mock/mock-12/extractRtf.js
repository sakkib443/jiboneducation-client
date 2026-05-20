const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ac reading.rtf');
let content = fs.readFileSync(filePath, 'latin1');

// Strip RTF formatting
let text = content;

// Remove color/font tables and style sheets (large blocks)
text = text.replace(/\{\\colortbl[^}]*\}/gs, '');
text = text.replace(/\{\\fonttbl[^}]*\}/gs, '');

// Replace paragraph breaks
text = text.replace(/\\par\b/g, '\n');
text = text.replace(/\\line\b/g, '\n');

// Replace unicode characters: \'xx hex codes
text = text.replace(/\\'([0-9a-fA-F]{2})/g, (m, hex) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
});

// Remove all other RTF control words
text = text.replace(/\\[a-zA-Z]+\-?[0-9]* ?/g, '');

// Remove braces
text = text.replace(/[{}]/g, '');

// Clean up whitespace
text = text.replace(/\r/g, '');
text = text.replace(/\n{3,}/g, '\n\n');

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
const output = lines.join('\n');

fs.writeFileSync(path.join(__dirname, 'extracted.txt'), output, 'utf8');
console.log('Done! Lines extracted:', lines.length);
console.log('\n--- CONTENT ---\n');
console.log(output);
