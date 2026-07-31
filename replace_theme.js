const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/app/preview/growth/quantum');

function walk(directory, callback) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  });
}

const replacements = [
  { match: /#4338CA/g, replace: '#111111' },
  { match: /font-syne/g, replace: 'font-playfair' },
  { match: /font-outfit/g, replace: 'font-inter' },
  { match: /syne\.className/g, replace: 'playfair.className' },
  { match: /outfit\.className/g, replace: 'inter.className' },
  { match: /syne\.variable/g, replace: 'playfair.variable' },
  { match: /outfit\.variable/g, replace: 'inter.variable' },
  { match: /Syne/g, replace: 'Playfair_Display' },
  { match: /Outfit/g, replace: 'Inter' },
  { match: /syne/g, replace: 'playfair' },
  { match: /outfit/g, replace: 'inter' },
  { match: /from-indigo-200 via-purple-100 to-pink-100/g, replace: 'from-gray-300 via-gray-200 to-gray-100' },
  { match: /from-indigo-100 to-purple-50/g, replace: 'from-gray-200 to-gray-100' },
  { match: /from-pink-100 to-transparent/g, replace: 'from-gray-200 to-transparent' },
  { match: /to-pink-500/g, replace: 'to-gray-800' },
  { match: /shadow-indigo-500\/30/g, replace: 'shadow-black/20' },
  { match: /shadow-indigo-500\/50/g, replace: 'shadow-black/40' },
  { match: /rgba\(67,56,202,0\.4\)/g, replace: 'rgba(17,17,17,0.3)' }
];

walk(dir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Custom fix for the import statement so we don't end up with lowercase Playfair_Display
  // Actually, since we replaced "Syne" with "Playfair_Display" and "syne" with "playfair", let's make sure the import is correct.
  
  replacements.forEach(({ match, replace }) => {
    content = content.replace(match, replace);
  });

  // Fix the google fonts import to match what next/font/google expects
  content = content.replace(/import { Playfair_Display, Inter } from "next\/font\/google";/, 'import { Playfair_Display, Inter } from "next/font/google";');
  
  // Fix the subset and variable declaration
  content = content.replace(/const playfair = Playfair_Display\(\{ subsets: \["latin"\], variable: "--font-playfair" \}\);/, 'const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
});
