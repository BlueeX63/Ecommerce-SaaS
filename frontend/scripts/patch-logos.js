const fs = require('fs');
const path = require('path');

const templatesDir = path.join(process.cwd(), 'src', 'app', 'templates');
const templateDirs = fs.readdirSync(templatesDir).filter(d => fs.statSync(path.join(templatesDir, d)).isDirectory());

templateDirs.forEach(dir => {
  const layoutPath = path.join(templatesDir, dir, 'layout.tsx');
  if (!fs.existsSync(layoutPath)) return;

  let content = fs.readFileSync(layoutPath, 'utf8');
  let changed = false;

  // 1. Standard pattern: {logoUrl ? <img ... /> : <div className="flex items-center gap-2"><Icon className="w-6 h-6" /><span>{brandName}</span></div>}
  const regex1 = /{(t?logoUrl)\s*\?\s*(<img[^>]+>)\s*:\s*<div\s+className="flex items-center gap-2">([\s\S]*?)<span[^>]*>({t?brandName})<\/span><\/div>}/g;
  
  content = content.replace(regex1, (match, logoVar, imgTag, iconTag, brandVar) => {
    changed = true;
    return `<div className="flex items-center gap-2">
                {${logoVar} ? ${imgTag} : ${iconTag}}
                <span>${brandVar}</span>
              </div>`;
  });

  // 2. Horizon special pattern
  const horizonRegex = /{\s*logoUrl\s*\?\s*\(\s*(<img[^>]+>)\s*\)\s*:\s*\(\s*<div\s+className="flex items-center gap-2">([\s\S]*?)<span className={`text-2xl font-medium tracking-widest text-black uppercase \${outfit\.className}`}>{brandName\.charAt\(0\)}<span className="text-black\/40">{brandName\.slice\(1\)}<\/span><\/span><\/div>\s*\)\s*}/g;
  content = content.replace(horizonRegex, (match, imgTag, iconTag) => {
    changed = true;
    return `<div className="flex items-center gap-2">
                {logoUrl ? ${imgTag} : ${iconTag}}
                <span className={\`text-2xl font-medium tracking-widest text-black uppercase \${outfit.className}\`}>{brandName.charAt(0)}<span className="text-black/40">{brandName.slice(1)}</span></span>
              </div>`;
  });

  // 3. Simple replace tLogoUrl ? <img ... /> : tBrandName
  const regex2 = /{(t?logoUrl)\s*\?\s*(<img[^>]+>)\s*:\s*(t?brandName)}/g;
  content = content.replace(regex2, (match, logoVar, imgTag, brandVar) => {
    changed = true;
    return `<div className="flex items-center gap-3">
                {${logoVar} && ${imgTag}}
                <span>{${brandVar}}</span>
              </div>`;
  });

  // 4. Wrapped in span pattern (Velocity/Quantum footers)
  const regex3 = /<span className={(`[^`]+`)}>({logoUrl\s*\?\s*<img[^>]+>\s*:\s*<div className="flex items-center gap-2"><[^>]+><span>{brandName}<\/span><\/div>})<\/span>/g;
  content = content.replace(regex3, (match, className, inner) => {
    changed = true;
    // We already replaced the inner part if regex1 ran first, so let's adjust regex1 to not conflict if possible.
    // Actually regex1 will match the inner part. So the result of regex1 inside span would be:
    // <span className={...}><div className="flex items-center gap-2">...</div></span>
    // We can clean this up:
    return match; // It's fine to have div inside span, or we can just leave it to regex1
  });

  // 5. Fix copyright text bug in quantum layout
  if (dir === 'quantum' || dir === 'horizon') {
    const copyrightRegex = /const copyrightText = [^;]+;/;
    content = content.replace(copyrightRegex, (match) => {
      changed = true;
      if (dir === 'quantum') {
         return 'const copyrightText = customData?.formData?.copyrightText || `© ${new Date().getFullYear()} ${brandName} Design Studio. All rights reserved.`;';
      }
      if (dir === 'horizon') {
         return 'const copyrightText = customData?.formData?.copyrightText || `© ${new Date().getFullYear()} ${brandName} STUDIO.`;';
      }
      return match;
    });
  }

  if (changed) {
    fs.writeFileSync(layoutPath, content);
    console.log(`Updated ${layoutPath}`);
  }
});
