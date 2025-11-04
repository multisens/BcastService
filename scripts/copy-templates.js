const fs = require('fs');
const path = require('path');

function copyEJSTemplates() {
    const srcDir = path.join(__dirname, '../src/modules');
    const distDir = path.join(__dirname, '../dist/modules');
    
    function copyFiles(dir) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                copyFiles(fullPath);
            } else if (path.extname(item) === '.ejs') {
                const relativePath = path.relative(srcDir, fullPath);
                const destPath = path.join(distDir, relativePath);
                
                // Criate the directory if it does not exist
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                
                // Copy the file
                fs.copyFileSync(fullPath, destPath);
                console.log(`Copied: ${relativePath}`);
            }
        });
    }
    
    console.log('Copying EJS templates...');
    copyFiles(srcDir);
}

copyEJSTemplates();