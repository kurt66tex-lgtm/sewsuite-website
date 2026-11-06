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

## Sew Suite implementation status
`scripts/optimize-public-images.mjs` generates **public-only** WebP variants and a manifest; it does not replace any live page references. Next integration task: wire the manifest into public hero/portfolio rendering and static SEO HTML, add regression tests, and run a full preview build. Existing CRM upload paths must remain untouched.

## Acceptance criteria
No customer upload path is accessed; no approved image disappears; original assets remain available; meaningful alt text; responsive sources; stable layout; no lazy-loaded hero; no regressions in reviews QR/button, FAQs, Our Work, or footer. Confirm performance with measured results rather than assumed KB targets.
