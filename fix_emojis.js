const fs = require('fs');
const path = require('path');

const dir = './src';
const replacements = {
    'ðŸ‘‹': '👋',
    'ðŸŸ¡': '🟡',
    'ðŸŸ ': '🟠',
    'ðŸ”´': '🔴',
    'ðŸ”’': '🔒',
    'âœ…': '✅',
    'âœ“': '✓',
    'â€”': '—',
    'ðŸ’™': '💙',
    'âœ•': '✕',
    'ðŸ’¬': '💬',
    'ðŸ›¡ï¸': '🛡️',
    'âš¡': '⚡',
    'ðŸ’š': '💚',
    'ðŸ¤': '🤝',
    'ðŸ”': '🔍',
    'ðŸ‘': '👋',
    'ðŸŸ': '🟡'
};

function walk(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const [bad, good] of Object.entries(replacements)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed emojis in ${fullPath}`);
            }
        }
    });
}

walk(dir);
