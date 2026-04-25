# SEO Implementation Guide for IndyPay

## ✅ Completed

### 1. SEO Infrastructure Created
- **`lib/seo.ts`**: Core SEO utility with metadata generation function
- **`lib/page-metadata.ts`**: Pre-configured metadata for all pages
- **Homepage (`app/page.tsx`)**: SEO metadata added

### 2. Features Implemented
- ✅ Dynamic metadata generation
- ✅ Open Graph tags for social sharing
- ✅ Twitter Card support
- ✅ Canonical URLs
- ✅ Keywords optimization
- ✅ Structured metadata for all pages
- ✅ Robots meta tags
- ✅ Author and publisher information

## 📋 How to Add SEO to Remaining Pages

### Template for Adding SEO to Any Page

```typescript
// At the top of any page.tsx file, add these imports:
import { Metadata } from 'next';
import { generateMetadata, commonKeywords } from '@/lib/seo';
import { pageMetadata } from '@/lib/page-metadata';

// Then add this export before the default export:
export const metadata: Metadata = generateMetadata(
  pageMetadata['path/to/page'] // e.g., 'business/omni-channel'
);

// Or for custom metadata:
export const metadata: Metadata = generateMetadata({
  title: 'Your Page Title',
  description: 'Your page description (150-160 characters)',
  keywords: [...commonKeywords, 'specific', 'keywords', 'here'],
  canonical: '/your-page-path',
});
```

### Example: Adding SEO to Business Omni-Channel Page

```typescript
// app/business/omni-channel/page.tsx
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata: Metadata = generateMetadata(
  pageMetadata['business/omni-channel']
);

export default function OmniChannelPage() {
  // ... rest of component
}
```

## 📊 Pages with Pre-configured Metadata

All metadata is ready in `lib/page-metadata.ts` for:

### Business Pages
- ✅ `/business/omni-channel`
- ✅ `/business/in-store`
- ✅ `/business/online`
- ✅ `/business/pay-later`
- ✅ `/business/global-collections`
- ✅ `/business/payouts`
- ✅ `/business/dashboard`

### Solutions Pages
- ✅ `/solutions/nocode`
- ✅ `/solutions/invoices`
- ✅ `/solutions/nowpay`
- ✅ `/solutions/government-business`
- ✅ `/solutions/schoolpay`
- ✅ `/solutions/hotelpay`
- ✅ `/solutions/healthcarepay`
- ✅ `/solutions/societypay`
- ✅ `/solutions/bfsipay`

### Platform Pages
- ✅ `/platform`
- ✅ `/platform/payments-in-a-box`
- ✅ `/platform/embedded-finance`
- ✅ `/platform/cash-management-services`
- ✅ `/platform/cms`
- ✅ `/platform/card-in-a-box`
- ✅ `/platform/financial-inclusion`

### About Pages
- ✅ `/about`
- ✅ `/about/culture`
- ✅ `/about/partner-with-us`
- ✅ `/about/media-centre`

### Other Pages
- ✅ `/developer-hub`
- ✅ `/policies/terms`
- ✅ `/policies/cookies`
- ✅ `/policies/refund`

## 🎯 SEO Best Practices Implemented

### 1. Title Tags
- Format: `Page Title | IndyPay`
- Length: 50-60 characters
- Includes primary keywords

### 2. Meta Descriptions
- Length: 150-160 characters
- Compelling and action-oriented
- Includes target keywords naturally

### 3. Keywords
- Primary keywords identified for each page
- Common brand keywords included
- Long-tail keywords for specific pages

### 4. Open Graph Tags
- Title, description, image for social sharing
- Proper dimensions (1200x630px)
- Locale set to en_IN

### 5. Twitter Cards
- Summary large image format
- Optimized for Twitter sharing
- Creator attribution

### 6. Canonical URLs
- Prevents duplicate content issues
- Points to the preferred version
- Absolute URLs with domain

### 7. Robots Meta
- Index/follow for public pages
- Noindex for policy pages
- Proper crawling directives

## 🚀 Next Steps

### Immediate Actions
1. Add metadata exports to all remaining pages using the template above
2. Create OG image (`/images/indypay-og.png`) - 1200x630px
3. Add Google verification code in `lib/seo.ts`
4. Test metadata with tools like:
   - Google Rich Results Test
   - Facebook Sharing Debugger
   - Twitter Card Validator

### Additional SEO Enhancements
1. **Structured Data (JSON-LD)**
   - Organization schema
   - Product schema for payment solutions
   - BreadcrumbList for navigation
   - FAQPage schema where applicable

2. **Performance Optimization**
   - Image optimization (already using Next.js Image)
   - Lazy loading
   - Code splitting
   - CDN for static assets

3. **Content Optimization**
   - H1 tags on every page
   - Proper heading hierarchy (H1 → H2 → H3)
   - Alt text for all images
   - Internal linking strategy

4. **Technical SEO**
   - XML sitemap generation
   - Robots.txt configuration
   - 404 page optimization
   - Mobile responsiveness (already implemented)

5. **Local SEO**
   - Google Business Profile
   - Local schema markup
   - NAP consistency

## 📝 Quick Reference

### Adding SEO to a New Page

```typescript
// 1. Import required modules
import { Metadata } from 'next';
import { generateMetadata, commonKeywords } from '@/lib/seo';

// 2. Export metadata
export const metadata: Metadata = generateMetadata({
  title: 'Page Title',
  description: 'Page description',
  keywords: [...commonKeywords, 'page', 'specific', 'keywords'],
  canonical: '/page-path',
});

// 3. Export component
export default function PageName() {
  // Component code
}
```

### Testing Checklist
- [ ] Title appears correctly in browser tab
- [ ] Meta description shows in search results preview
- [ ] OG image displays when sharing on social media
- [ ] Canonical URL is correct
- [ ] No duplicate metadata
- [ ] Mobile-friendly
- [ ] Fast page load

## 🔧 Maintenance

### Regular Tasks
- Update metadata when page content changes
- Monitor search rankings for target keywords
- Update OG images for seasonal campaigns
- Review and update keywords quarterly
- Check for broken canonical URLs

### Monitoring Tools
- Google Search Console
- Google Analytics
- Bing Webmaster Tools
- SEMrush / Ahrefs (optional)

## 📞 Support

For questions about SEO implementation:
1. Review this guide
2. Check `lib/seo.ts` for utility functions
3. Reference `lib/page-metadata.ts` for examples
4. Test changes in development before deploying

---

**Status**: SEO infrastructure complete. Ready for deployment to all pages.
**Last Updated**: 2026-04-25
