export type FieldType = 'text' | 'textarea' | 'image' | 'array';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  defaultValue: any;
  placeholder?: string;
  description?: string;
}

export interface TabDef {
  id: string;
  label: string;
  fields: FieldDef[];
}

export interface TemplateSchema {
  id: string;
  name: string;
  tabs: TabDef[];
}


export const TEMPLATE_SCHEMAS: Record<string, TemplateSchema> = {
  "starter-minimalist": {
    id: "starter-minimalist",
    name: "Minimalist",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "ESSENTIALS."  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" },
          { name: "announcementText", label: "Announcement Bar", type: "text", defaultValue: "Free shipping on orders over 100" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroTitle", label: "Hero Title", type: "textarea", defaultValue: "Simplicity is the ultimate sophistication." },
          { name: "tagline", label: "Tagline", type: "textarea", defaultValue: "Curated everyday essentials built to last. No logos, no fuss, just quality materials and timeless design." },
          { name: "primaryCta", label: "Primary CTA Button", type: "text", defaultValue: "Shop Collection" },
          { name: "featuredTitle", label: "Featured Products Title", type: "text", defaultValue: "New Arrivals" },
          { name: "aboutTitle", label: "About Section Title", type: "text", defaultValue: "Built for everyday life." },
          { name: "aboutDescription", label: "About Section Text", type: "textarea", defaultValue: "We believe in buying less but better. Our products are designed in-house and manufactured using sustainable practices to ensure they stand the test of time. No fast fashion, just enduring style." }
        ]
      },
      {
        id: "shop",
        label: "Shop Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Collection" },
          { name: "shopDescription", label: "Shop Description", type: "textarea", defaultValue: "Explore our full range of minimalist essentials. Carefully designed for longevity and timeless style." },
          { name: "shopCategories", label: "Filter Categories (Comma separated)", type: "text", defaultValue: "All, Tops, Bottoms, Accessories, Bags, Shoes" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'About Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Our Story' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Founded with a vision to create exceptional products.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop' },
          { name: 'feature1Title', label: 'Feature 1 Title', type: 'text', defaultValue: 'Uncompromising Quality' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'We believe in quality over quantity.' },
          { name: 'feature2Title', label: 'Feature 2 Title', type: 'text', defaultValue: 'Radical Transparency' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'Every piece in our collection is carefully curated.' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Get In Touch' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Contact Us' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '123 Design District\nNew York, NY 10012' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'hello@example.com' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+1 (555) 123-4567' },
          { name: 'contactHours', label: 'Operating Hours', type: 'textarea', defaultValue: 'Monday — Friday\n9:00 AM — 6:00 PM EST' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Shop' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'Company' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Social' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "starter-essence": {
    id: "starter-essence",
    name: "Essence",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "ESSENCE"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "preTitle", label: "Pre-Title Label", type: "text", defaultValue: "New Collection 2026" },
          { name: "heroTitle", label: "Hero Title Line 1", type: "text", defaultValue: "Timeless Form" },
          { name: "heroTitleItalic", label: "Hero Title Line 2 (Italic)", type: "text", defaultValue: "Meets Function." },
          { name: "heroDescription", label: "Hero Description", type: "textarea", defaultValue: "Discover our latest collection of meticulously crafted homeware. Designed to elevate your everyday rituals with understated elegance." },
          { name: "heroCta", label: "Hero CTA Button", type: "text", defaultValue: "Explore Collection" },
          { name: "heroImage", label: "Hero Image URL", type: "image", defaultValue: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2940&auto=format&fit=crop" },
          { name: "philosophyQuote", label: "Philosophy Quote", type: "textarea", defaultValue: "\"We believe that the objects we surround ourselves with should inspire calm and bring quiet joy to daily life.\"" },
          { name: "philosophyAuthor", label: "Philosophy Author", type: "text", defaultValue: "— Elena Rostova, Founder" },
          { name: "featuredTitle", label: "Featured Products Title", type: "text", defaultValue: "Curated Objects" },
          { name: "featuredDesc", label: "Featured Products Description", type: "text", defaultValue: "Essentials for the modern home." },
          { name: "viewAllText", label: "View All Button Text", type: "text", defaultValue: "View All" },
          { name: "editorialTitle", label: "Editorial Section Title", type: "text", defaultValue: "The Art of Stillness" },
          { name: "editorialDesc", label: "Editorial Section Description", type: "textarea", defaultValue: "Our designs are rooted in the belief that simplicity is the ultimate sophistication. We source natural materials and work with master artisans to create pieces that age beautifully over time." },
          { name: "editorialCta", label: "Editorial Section CTA", type: "text", defaultValue: "Read Our Story" },
          { name: "editorialImage", label: "Editorial Section Image", type: "image", defaultValue: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?q=80&w=2940&auto=format&fit=crop" }
        ]
      },
      {
        id: "shop",
        label: "Shop Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "The Collection" },
          { name: "shopCategories", label: "Filter Categories (Comma separated)", type: "text", defaultValue: "All, Ceramics, Textiles, Glassware, Furniture" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'About Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Our Story' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Founded with a vision to create exceptional products.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'We believe in quality over quantity.' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'Every piece in our collection is carefully curated.' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Get In Touch' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Contact Us' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '123 Design District\nNew York, NY 10012' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'hello@example.com' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+1 (555) 123-4567' },
          { name: 'contactHours', label: 'Operating Hours', type: 'textarea', defaultValue: 'Monday — Friday\n9:00 AM — 6:00 PM EST' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Studio' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'Enquiries' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Hours' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "starter-origin": {
    id: "starter-origin",
    name: "Origin",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "ORIGIN"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroTitle", label: "Hero Title", type: "text", defaultValue: "Earthy & Raw" },
          { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea", defaultValue: "Modern ceramics for the mindful home" },
          { name: "heroImage", label: "Hero Image URL", type: "image", defaultValue: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=2940&auto=format&fit=crop" },
          { name: "primaryCta", label: "Primary CTA", type: "text", defaultValue: "Shop Now" },
          { name: "manifestoTitle", label: "Manifesto Title", type: "text", defaultValue: "Our Manifesto" },
          { name: "manifestoText", label: "Manifesto Text", type: "textarea", defaultValue: "Origin was born from a desire to return to basics." },
          { name: "manifestoCta", label: "Manifesto CTA", type: "text", defaultValue: "Read Our Story" },
          { name: "manifestoImage", label: "Manifesto Image", type: "image", defaultValue: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2940&auto=format&fit=crop" },
          { name: "featuredTitle", label: "Featured Products Title", type: "text", defaultValue: "Featured Goods" },
          { name: "featuredDesc", label: "Featured Products Description", type: "text", defaultValue: "Carefully selected staples for everyday living." },
          { name: "viewAllText", label: "View All Text", type: "text", defaultValue: "View All" }
        ]
      },
      {
        id: "shop",
        label: "Shop Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Origin Shop" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Vases, Bowls, Plates, Cups" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'About Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Our Story' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Founded with a vision to create exceptional products.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2000&auto=format&fit=crop' },
          { name: 'feature1Title', label: 'Feature 1 Title', type: 'text', defaultValue: 'The Journey' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'We believe in quality over quantity.' },
          { name: 'feature2Title', label: 'Feature 2 Title', type: 'text', defaultValue: 'Our Promise' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'Every piece in our collection is carefully curated.' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Get In Touch' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Contact Us' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '123 Design District\nNew York, NY 10012' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'hello@example.com' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+1 (555) 123-4567' },
          { name: 'contactHours', label: 'Operating Hours', type: 'textarea', defaultValue: 'Monday — Friday\n9:00 AM — 6:00 PM EST' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Explore' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'Company' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Support' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "starter-canvas": {
    id: "starter-canvas",
    name: "Canvas",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "CANVAS"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroHeadline", label: "Headline", type: "textarea", defaultValue: "Artful Living." },
          { name: "heroSubtext", label: "Subtext", type: "textarea", defaultValue: "Curated objects for the modern gallery home." },
          { name: "editorialTitle", label: "Editorial Title", type: "text", defaultValue: "The Gallery Edit" },
          { name: "editorialText", label: "Editorial Text", type: "textarea", defaultValue: "Our newest curation explores the intersection of brutalist architecture and soft modernism." },
          { name: "editorialImage1", label: "First Editorial Image", type: "image", defaultValue: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop" },
          { name: "editorialImage2", label: "Second Editorial Image", type: "image", defaultValue: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop" },
          { name: "shopTitle", label: "Shop Section Title", type: "text", defaultValue: "Selected Works." },
          { name: "philosophyQuote", label: "Philosophy Quote", type: "textarea", defaultValue: "\"We surround ourselves with objects that demand nothing but our attention.\"" },
          { name: "philosophyCta", label: "Philosophy CTA", type: "text", defaultValue: "Discover the Maison" }
        ]
      },
      {
        id: "shop",
        label: "Collection Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Canvas Collection" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Art, Furniture, Lighting, Objects" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'Maison Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'The Shape \nOf Things.' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Canvas is an independent design house focused on creating objects of uncompromising quality. We believe that true luxury lies in restraint and negative space.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop' },
          { name: 'feature1Title', label: 'Feature 1 Title', type: 'text', defaultValue: 'Philosophy.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'Our flagship space was conceived as a brutalist sanctuary in the heart of the city. A place where objects can breathe and be appreciated for their intrinsic forms.' },
          { name: 'feature2Title', label: 'Feature 2 Title', type: 'text', defaultValue: 'The Collection' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'We curate pieces from independent designers globally. Each object must meet our strict criteria: uncompromising quality, bold geometry, and absolute permanence.' }
        ]
      },
      {
        id: 'contact',
        label: 'Concierge Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Concierge' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Inquiries.' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '1984 Monolith Blvd\nSector 4\nNew York, NY 10001' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'inquiries@canvas.studio' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+1 (555) 019-8472' },
          { name: 'contactHours', label: 'Operating Hours', type: 'textarea', defaultValue: 'Monday — Friday\n9:00 AM — 6:00 PM EST' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Index' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'Information' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Social' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "growth-nexus-pro": {
    id: "growth-nexus-pro",
    name: "Nexus Pro",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "NEXUS"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "preTitle", label: "Pre-Title", type: "text", defaultValue: "The Evolution of Style" },
          { name: "heroTitle1", label: "Hero Title Line 1", type: "text", defaultValue: "Form Meets" },
          { name: "heroTitle2", label: "Hero Title Line 2", type: "text", defaultValue: "Function." },
          { name: "heroDesc", label: "Hero Description", type: "textarea", defaultValue: "Engineered garments and essentials designed for the modern metropolitan landscape." },
          { name: "heroCta", label: "Hero CTA", type: "text", defaultValue: "Explore Collection" },
          { name: "heroImage", label: "Background Image URL", type: "image", defaultValue: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=2564&auto=format&fit=crop" },
          { name: "marqueeText1", label: "Marquee Item 1", type: "text", defaultValue: "Engineered Precision" },
          { name: "marqueeText2", label: "Marquee Item 2", type: "text", defaultValue: "Aesthetic Dominance" },
          { name: "marqueeText3", label: "Marquee Item 3", type: "text", defaultValue: "Urban Utility" },
          { name: "featuredTitle", label: "Featured Title", type: "text", defaultValue: "New Arrivals" },
          { name: "featuredSubtitle", label: "Featured Subtitle", type: "text", defaultValue: "Curated selection" },
          { name: "featureTitle", label: "Feature Section Title", type: "textarea", defaultValue: "Redefining \nBoundaries." },
          { name: "featureDesc", label: "Feature Section Desc", type: "textarea", defaultValue: "We construct garments utilizing avant-garde materials that challenge the status quo. Our designs are driven by uncompromising utility and striking minimalism." },
          { name: "featureBullet1", label: "Feature Bullet 1", type: "text", defaultValue: "Advanced Weatherproof Fabrics" },
          { name: "featureBullet2", label: "Feature Bullet 2", type: "text", defaultValue: "Ergonomic Articulation" },
          { name: "featureBullet3", label: "Feature Bullet 3", type: "text", defaultValue: "Sustainable Production Methods" },
          { name: "featureCta", label: "Feature Section CTA", type: "text", defaultValue: "Read Our Story" },
          { name: "featureImage", label: "Feature Section Image", type: "image", defaultValue: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop" },
          { name: "viewAllText", label: "View All Button Text", type: "text", defaultValue: "View All" }
        ]
      },
      {
        id: "shop",
        label: "Collection Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Nexus Pro Arsenal" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Techwear, Footwear, Accessories, Hardware" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'About Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Designing the Future of Essentials.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop' },
          { name: 'feature1Title', label: 'Section Title', type: 'text', defaultValue: 'The Vision' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Nexus Pro was established to bridge the gap between technical performance and metropolitan aesthetics. We engineer garments that adapt to the wearer\'s environment, providing uncompromising utility without sacrificing design.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'We operate as a global collective of designers, material scientists, and urban athletes. Our development process is iterative and relentless, resulting in gear that performs flawlessly in concrete jungles.' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'This isn\'t just clothing or accessories; it\'s industrial design applied to the body. It is hardware for the human form.' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Support' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Contact Us.' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '123 Innovation Drive, Silicon Valley, CA 94025' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'support@nexuspro.com' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+1 (800) 555-0199' },
          { name: 'contactHours', label: 'Operating Hours', type: 'textarea', defaultValue: 'Our customer service team is available Monday through Friday, from 9 AM to 6 PM PST. We aim to respond to all inquiries within 24 hours.' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Arsenal' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'Protocol' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Comms' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "growth-velocity": {
    id: "growth-velocity",
    name: "Velocity",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "VELOCITY"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroTitle", label: "Hero Title", type: "text", defaultValue: "VELOCITY" },
          { name: "heroSubtitle", label: "Hero Subtitle", type: "text", defaultValue: "System // Override // Active" },
          { name: "primaryCta", label: "Primary CTA", type: "text", defaultValue: "Initialize Sequence" },
          { name: "heroImage", label: "Hero Image URL", type: "image", defaultValue: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop" },
          { name: "marqueeText1", label: "Marquee Item 1", type: "text", defaultValue: "Cybernetic Enhance" },
          { name: "marqueeText2", label: "Marquee Item 2", type: "text", defaultValue: "Neo-Tokyo Aesthetics" },
          { name: "shopTitle", label: "Shop Section Title", type: "text", defaultValue: "The Arsenal" },
          { name: "featuredSubtitle", label: "Featured Subtitle", type: "text", defaultValue: "Latest Deployments" },
          { name: "viewAllText", label: "View All Button Text", type: "text", defaultValue: "Access Full Grid" }
        ]
      },
      {
        id: "shop",
        label: "Products Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Gear Grid" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Apparel, Hardware, Implants, Mods" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'About Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Protocol // 01' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'We are the architects of the future. We don\'t just design clothes; we engineer armor for the digital age.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'Every garment is a piece of hardware. We source advanced synthetics, utilize laser-cut precision, and engineer for maximum mobility in urban environments.' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'We outfit the vanguard of the new world. Those who move fast, think critically, and demand gear that can keep pace with an accelerating reality.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Contact Information' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Contact Us' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '35.6762° N, 139.6503° E\nTokyo, Japan' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'support@velocity.com' },
          { name: 'contactPhone', label: 'Response Time', type: 'text', defaultValue: 'Usually within 24 hours' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Cybernetic aesthetics for the modern vanguard.' },
          { name: 'footerCol1', label: 'Footer Column 1 Title', type: 'text', defaultValue: 'Grid Access' },
          { name: 'footerCol2', label: 'Footer Column 2 Title', type: 'text', defaultValue: 'System' },
          { name: 'footerCol3', label: 'Footer Column 3 Title', type: 'text', defaultValue: 'Network' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 VELOCITY. SYSTEM SECURED.' }
        ]
      }]
  },
  "growth-quantum": {
    id: "growth-quantum",
    name: "Quantum",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "QUANTUM"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroTitle", label: "Hero Title", type: "text", defaultValue: "Future Living Objects." },
          { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea", defaultValue: "Discover our curated collection of avant-garde conceptual art and functional masterpieces that transcend ordinary space." },
          { name: "primaryCta", label: "Primary CTA", type: "text", defaultValue: "Explore Collection" },
          { name: "marqueeText1", label: "Marquee Item 1", type: "text", defaultValue: "Limitless Design" },
          { name: "marqueeText2", label: "Marquee Item 2", type: "text", defaultValue: "Conceptual Art" },
          { name: "marqueeText3", label: "Marquee Item 3", type: "text", defaultValue: "Avant-Garde" }
        ]
      },
      {
        id: "shop",
        label: "Collection Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Quantum Realm" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Energy, Matter, Anti-Matter, Plasma" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'Philosophy Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'text', defaultValue: 'Beyond Form. \nBeyond Function.' },
          { name: 'aboutText1', label: 'About Text 1', type: 'textarea', defaultValue: 'Quantum was founded on a singular premise: that the objects we interact with every day should not merely serve a purpose, but should elevate our consciousness.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'We collaborate with visionary designers and avant-garde artists to blur the lines between conceptual art and functional homeware. Every artifact in our collection is a testament to what happens when imagination is unconstrained by traditional manufacturing limitations.' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'We don\'t sell furniture. We curate experiences.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?q=80&w=2000&auto=format&fit=crop' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'textarea', defaultValue: 'Whether you\'re inquiring about a bespoke commission or need support with a recent acquisition, our concierge is at your disposal.' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Let\'s Connect.' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '100 Quantum Way\nNeo-Tokyo, 100-0001' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'concierge@quantum.design' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+81 3 1234 5678' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  },
  "growth-horizon": {
    id: "growth-horizon",
    name: "Horizon",
    tabs: [
      {
        id: "general",
        label: "General",
        fields: [
          { name: "brandName", label: "Brand Name", type: "text", defaultValue: "HORIZON"  },
          { name: "logoUrl", label: "Logo URL", type: "image", defaultValue: "" }
        ]
      },
      {
        id: "home",
        label: "Home Page",
        fields: [
          { name: "heroTitle", label: "Hero Title", type: "text", defaultValue: "Pure Vision." },
          { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea", defaultValue: "" },
          { name: "ctaText", label: "CTA Button", type: "text", defaultValue: "Enter Vault" },
          { name: "marqueeText1", label: "Marquee Item 1", type: "text", defaultValue: "AESTHETIC" },
          { name: "marqueeText2", label: "Marquee Item 2", type: "text", defaultValue: "INTELLIGENCE" },
          { name: "ethosTitle", label: "Ethos Title", type: "text", defaultValue: "Our Ethos" },
          { name: "ethosText", label: "Ethos Text", type: "textarea", defaultValue: "Design is not just what it looks like and feels like. \nDesign is how it works." },
          { name: "ethosCta", label: "Ethos CTA", type: "text", defaultValue: "Read Our Manifesto" }
        ]
      },
      {
        id: "shop",
        label: "Collection Page",
        fields: [
          { name: "shopTitle", label: "Shop Title", type: "text", defaultValue: "Digital Store" },
          { name: "shopCategories", label: "Filter Categories", type: "text", defaultValue: "All, Software, Courses, Assets, Subscriptions" }
        ]
      }
    ,
      {
        id: 'about',
        label: 'Manifesto Page',
        fields: [
          { name: 'aboutTitle', label: 'About Title', type: 'textarea', defaultValue: 'We believe that aesthetic excellence is not a luxury, but a fundamental requirement for the modern digital experience.' },
          { name: 'aboutText1', label: 'About Text 1', type: 'text', defaultValue: 'Uncompromising Quality.' },
          { name: 'aboutText2', label: 'About Text 2', type: 'textarea', defaultValue: 'Horizon was founded on a singular principle: digital assets should be crafted with the same meticulous attention to detail as physical luxury goods. We reject the generic, the templated, and the uninspired.' },
          { name: 'aboutText3', label: 'About Text 3', type: 'textarea', defaultValue: 'Every UI kit, typography pairing, and motion asset in our archive is designed to elevate your brand from merely functional to profoundly memorable. We exist for the creators who push boundaries.' },
          { name: 'aboutHeroImage', label: 'About Hero Image', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2000&auto=format&fit=crop' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact Page',
        fields: [
          { name: 'contactPreTitle', label: 'Contact Pre-Title', type: 'text', defaultValue: 'Connect' },
          { name: 'contactTitle', label: 'Contact Title', type: 'text', defaultValue: 'Start a \nDialogue.' },
          { name: 'contactAddress', label: 'Address', type: 'textarea', defaultValue: '142 Aesthetics Blvd.\nDesign District\nNew York, NY 10012' },
          { name: 'contactEmail', label: 'Email Address', type: 'text', defaultValue: 'studio@horizon.design' },
          { name: 'contactPhone', label: 'Phone Number', type: 'text', defaultValue: '+81 3 1234 5678' }
        ]
      },
      {
        id: 'footer',
        label: 'Footer',
        fields: [
          { name: 'footerText', label: 'Footer Description', type: 'textarea', defaultValue: 'Elevating everyday life with curated designs.' },
          { name: 'socialInsta', label: 'Instagram Link', type: 'text', defaultValue: '#' },
          { name: 'socialTwitter', label: 'Twitter (X) Link', type: 'text', defaultValue: '#' },
          { name: 'socialFacebook', label: 'Facebook Link', type: 'text', defaultValue: '#' },
          { name: 'copyrightText', label: 'Copyright Text', type: 'text', defaultValue: '© 2026 Studio. All rights reserved.' }
        ]
      }]
  }
};
