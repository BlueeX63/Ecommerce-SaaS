const fs = require('fs');
const path = require('path');

const filePaths = [
  "src/app/preview/empire/aero/AeroContext.tsx",
  "src/app/preview/empire/obsidian/ObsidianContext.tsx",
  "src/app/preview/growth/horizon/HorizonContext.tsx",
  "src/app/preview/growth/nexus-pro/ShopContext.tsx",
  "src/app/preview/growth/quantum/QuantumContext.tsx",
  "src/app/preview/growth/velocity/VelocityContext.tsx",
  "src/app/preview/starter/canvas/CartContext.tsx",
  "src/app/preview/starter/essence/CartContext.tsx",
  "src/app/preview/starter/minimalist/CartContext.tsx",
  "src/app/preview/starter/origin/CartContext.tsx"
];

// Helper to extract the function body block (handles nested brackets)
function replaceFunction(content, funcName, replacementText) {
  const regex = new RegExp(`const ${funcName}\\s*=\\s*\\(.*?\\)\\s*=>\\s*\\{`, 's');
  const match = content.match(regex);
  if (!match) return content;
  
  let startIndex = match.index;
  let blockStart = startIndex + match[0].length - 1;
  
  let braceCount = 1;
  let endIndex = blockStart + 1;
  
  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '{') braceCount++;
    if (content[endIndex] === '}') braceCount--;
    endIndex++;
  }
  
  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex);
  
  return before + replacementText + after;
}

const applyCouponReplacement = `const applyCoupon = async (code: string) => {
    setCouponError(null);
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          tenantId: '00000000-0000-0000-0000-000000000000' // Using dummy UUID, in real app from session
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(code.toUpperCase());
        // For simplicity, we just use the discount percentage or flat amount.
        // The API returns discount_amount and discount_type. 
        // Real implementation would store this in context state.
      } else {
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
    }
  };`;

const addReviewReplacement = `const addReview = async (productId: string, rating: number, comment: string, userName: string) => {
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          tenantId: '00000000-0000-0000-0000-000000000000',
          rating,
          comment,
          title: 'Review',
          customerId: null
        })
      });
      
      if (res.ok) {
        const newReview: Review = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          userName,
          rating,
          comment,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        };
        setReviews(prev => [...prev, newReview]);
        // Call showToast if it exists in scope, else ignore
        try { if (typeof showToast !== 'undefined') showToast("Review submitted successfully"); } catch(e) {}
      }
    } catch(err) {
      console.error(err);
    }
  };`;

filePaths.forEach(fp => {
  const fullPath = path.join(__dirname, fp);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  content = replaceFunction(content, 'applyCoupon', applyCouponReplacement);
  content = replaceFunction(content, 'addReview', addReviewReplacement);
  
  // also fix the discountAmount logic
  const discountLogicRegex = /let discountAmount = 0;[\s\S]*?if\s*\(appliedCoupon[\s\S]*?else[\s\S]*?\}/;
  if (discountLogicRegex.test(content)) {
    content = content.replace(discountLogicRegex, `let discountAmount = 0;
  if (appliedCoupon === 'DISCOUNT20') {
    discountAmount = (cartTotal || 0) * 0.2;
  } else if (appliedCoupon === 'SAVE50') {
    discountAmount = Math.min(50, cartTotal || 0);
  } else if (appliedCoupon) {
    discountAmount = (cartTotal || 0) * 0.1; // Default 10% for API coupons for demo
  }`);
  }

  fs.writeFileSync(fullPath, content);
  console.log('Updated:', fp);
});
