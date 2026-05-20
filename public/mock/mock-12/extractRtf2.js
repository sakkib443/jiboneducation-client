const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ac reading.rtf');
let raw = fs.readFileSync(filePath, 'latin1');

// Find the actual document content part (between first \pard and \lsdpriority or \datastore)
// RTF stores actual text after the stylesheet/colorttbl/fonttbl declarations

// Step 1: Remove the header area (everything before first \pard )
let startIdx = raw.indexOf('\\pard');
if (startIdx === -1) startIdx = 0;
let content = raw.substring(startIdx);

// Step 2: Remove everything after the style list (which starts with \lsdpriority patterns)
let endIdx = content.indexOf('\\lsdpriority');
if (endIdx > 0) content = content.substring(0, endIdx);

// Step 3: Replace RTF unicode escapes \'xx
content = content.replace(/\\'([0-9a-fA-F]{2})/g, (m, hex) => {
    const code = parseInt(hex, 16);
    if (code >= 32 && code < 256) return String.fromCharCode(code);
    return '';
});

// Step 4: Replace \par and \line with newlines
content = content.replace(/\\par\b\r?\n?/g, '\n');
content = content.replace(/\\line\b/g, '\n');
content = content.replace(/\\tab\b/g, '\t');

// Step 5: Remove ALL other RTF control words
content = content.replace(/\\[*]?[a-zA-Z]+\-?[0-9]* ?/g, '');

// Step 6: Remove braces
content = content.replace(/[{}]/g, '');

// Step 7: Clean whitespace
content = content.replace(/\r\n/g, '\n');
content = content.replace(/\r/g, '\n');
content = content.replace(/[ \t]+/g, ' ');
content = content.replace(/\n[ \t]+/g, '\n');
content = content.replace(/\n{3,}/g, '\n\n');
content = content.trim();

fs.writeFileSync(path.join(__dirname, 'clean.txt'), content, 'utf8');
console.log('Written to clean.txt');
console.log('Total chars:', content.length);
console.log('\n=== CONTENT ===\n');
console.log(content);
