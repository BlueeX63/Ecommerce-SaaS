const fs = require('fs');

function unescapeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(filePath, content, 'utf8');
}

unescapeFile('src/app/store/[slug]/checkout/page.tsx');
console.log('Fixed escapes');
