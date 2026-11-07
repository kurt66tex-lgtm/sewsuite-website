# Website Factory — Public Image SEO & Performance Migration Skill

## Scope and non-negotiable isolation
Optimize **public website presentation assets only**: approved hero, service, gallery, portfolio and social preview photographs. Never read, rewrite, compress, convert, delete or migrate customer-submitted CRM artwork or attachments as part of image optimization. Keep original public media as rollback assets. Preserve production artwork byte-for-byte in its existing CRM/R2 workflow.

## Standard operating procedure
1. Inventory public image references and identify copyright/permission status, original format, pixel dimensions, bytes, page placement and alt text.
2. Write meaningful, factual, non-stuffed alt text for informative images; use empty alt for decorative images. Add contextual headings/captions and descriptive filenames where appropriate. Avoid location keywords unless genuinely relevant.
3. Generate responsive WebP widths (480, 800, 1200, 1600 as applicable) and use AVIF only after compatibility, visual quality and size comparisons. Do not upscale.
4. Integrate generated variants with `<picture>` or `srcSet`/`sizes`; retain fallback originals. Use explicit width/height or aspect ratio. Prioritize the LCP hero (fetchPriority high, not lazy); lazy-load below-fold media.
5. Add crawlable portfolio image URLs, suitable ImageObject/CreativeWork structured data and Open Graph/Twitter preview image tags where appropriate. Validate canonical URLs and robots indexing rules separately from preview.
6. Test desktop/mobile image quality, crop parity, layout shifts, LCP, transfer sizes, alt accessibility, broken links, SEO output, sitemap, and regression of all pages.
7. Deploy to preview, visually compare with approved Base44 design, then obtain acceptance before production cutover. Never alter DNS as part of image optimization.

## Sew Suite implementation and verified preview (November 6, 2026)
- The current image branch generates **11 public images and 28 responsive WebP variants**, including 8 approved portfolio photos, the home hero, and 2 logo versions. Originals stay available; branding and cropping are preserved.
- `PublicOptimizedImage` is used on the home hero (eager/high priority), navigation/footer logos, Our Work cards, featured work in home/service/area pages, portfolio details, and optional public About/gallery media. Google review QR remains SVG/PNG for scannability.
- Crawlable static HTML uses responsive image sources, explicit dimensions, portfolio ImageObject structured data and page-specific social preview metadata.
- `npm run build` now includes public image optimization and `npm run test:public-images` (file signatures, coverage, SEO and no CRM art). Production deployment remains gated on Railway catalog and user authorization.
- Isolated visual preview: `https://sewsuite-authentic-comparison-9eb67sj54.vercel.app`. Its approved public-only snapshot is NOT evidence of independent Railway production catalog connectivity.
- The primary reusable skill is `.agents/skills/base44-independent-migration/SKILL.md`; apply its public-image gate on every new site and migration, without copying Sew Suite-specific images or copy.
- **November 6 visual acceptance:** Owner confirms the updated Sew Suite homepage and optimized portfolio photographs look correct and meet appearance expectations. Record public-site image visual parity as PASSED for this desktop acceptance. The owner's browser observation found small WebP transfers; this is not a blanket requirement that every full-resolution variant be under 100 KB. Mobile-specific performance/appearance and production cutover remain separate gates.
