-- =====================================================================
-- Sew Suite: Supabase table creation + seed data
-- Run in the Supabase SQL Editor for project: wjxcvwjihkmsuerwxned
-- DO NOT touch existing platform tables (clients, content_pieces, etc.)
-- =====================================================================

-- Pages
CREATE TABLE IF NOT EXISTS sewsuite_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  meta_title text,
  meta_desc text,
  hero_headline text,
  hero_subheadline text,
  hero_body text,
  updated_at timestamptz DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS sewsuite_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_desc text,
  long_desc text,
  features jsonb DEFAULT '[]',
  faq_items jsonb DEFAULT '[]',
  meta_title text,
  meta_desc text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true
);

-- Testimonials
CREATE TABLE IF NOT EXISTS sewsuite_testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company text,
  quote text NOT NULL,
  rating int DEFAULT 5,
  approved boolean DEFAULT true,
  sort_order int DEFAULT 0
);

-- FAQ (global)
CREATE TABLE IF NOT EXISTS sewsuite_faq (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true
);

-- =====================================================================
-- SEED: Testimonials
-- =====================================================================
INSERT INTO sewsuite_testimonials (name, company, quote, rating, approved, sort_order) VALUES
(
  'Marcus T.',
  'Allen Eagles Booster Club',
  'Sew Suite handled our entire booster club order — over 200 pieces — without a single issue. The embroidery quality on the jackets was exceptional. We''ve been going back for three years.',
  5, true, 0
),
(
  'Sarah K.',
  'GreenTech Renewables',
  'We needed branded bags and polos for a trade show with a tight deadline. Sew Suite delivered early and the quality was exactly what we needed. Our team looked professional and we got compliments all weekend.',
  5, true, 1
),
(
  'James R.',
  'Tommy Terrific''s Car Wash',
  'I''ve ordered from a lot of places online and nothing compares. Sew Suite actually took the time to make our logo look right on a visor — something I could never get right through a print-on-demand site.',
  5, true, 2
);

-- =====================================================================
-- SEED: Global FAQ
-- =====================================================================
INSERT INTO sewsuite_faq (question, answer, sort_order, active) VALUES
('What''s the minimum order quantity?', 'Most embroidery and screen print orders start at 12 pieces. Some specialty items or complex jobs may have higher minimums. Contact us with your specific needs and we''ll find the right solution.', 0, true),
('Do I need print-ready artwork?', 'We can work with most file formats — AI, EPS, PDF, and high-res PNG are ideal. If you only have a low-resolution logo, we can often work with it or advise on getting a proper file from a designer. Just send us what you have.', 1, true),
('How long does an order take?', 'Standard turnaround is 7-10 business days from proof approval. Rush options are available for an additional fee — contact us to discuss your timeline.', 2, true),
('Can you source the garments for me?', 'Yes. We work with multiple wholesale suppliers and can source polos, t-shirts, jackets, hats, bags, and more. Just tell us what you''re looking for and your budget.', 3, true),
('What''s the difference between embroidery and screen printing?', 'Embroidery uses thread stitched directly into the fabric — it''s durable, professional, and ideal for logos on polos, hats, and jackets. Screen printing uses ink applied to the surface of the fabric — it''s better for complex artwork, large prints, and high-quantity t-shirt runs.', 4, true),
('Do you offer design services?', 'We handle the digitizing process that converts your artwork for embroidery production. For original logo design or brand creation, we recommend working with a graphic designer first, then bringing us the finished file.', 5, true),
('Can I see a proof before my order goes into production?', 'Always. We send a digital proof for approval before any production begins. Nothing gets made until you sign off.', 6, true),
('Do you ship or is pickup only?', 'Both. We ship nationwide via UPS/FedEx, and local pickup is available at our Allen/Lucas TX location.', 7, true);

-- =====================================================================
-- SEED: Services
-- =====================================================================

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'custom-embroidery',
  'Custom Embroidery',
  'Thread-perfect logos and text on polos, hats, jackets, bags, and more. Our most popular service for a reason.',
  'Custom embroidery is the gold standard for branded apparel — durable, professional, and impossible to mistake for anything other than the real thing. At Sew Suite, we''ve been digitizing and stitching logos for businesses across North Texas for over 17 years. We know what makes embroidery look right, and more importantly, what makes it hold up wash after wash.

Every embroidery order starts with proper digitizing — the process of converting your logo into a stitch file that tells our machines exactly how to recreate your design in thread. Bad digitizing is the most common reason embroidery looks cheap or falls apart. We don''t outsource this step. Our digitizing ensures your logo maintains its proportions, colors, and details on every garment.

We embroider on virtually any flat or structured surface — polo shirts, dress shirts, jackets, hats, caps, bags, towels, patches, and more. If you can wear it or carry it, we can probably embroider it.

Minimum order is 12 pieces. Turnaround is 7-10 business days from proof approval.',
  '["Professional in-house digitizing included with every order","Works on polos, jackets, hats, bags, and most structured garments","Thread colors matched to your brand colors","Durable through hundreds of wash cycles","Digital proof approval before production","12-piece minimum on most orders"]',
  '[{"q":"How do I send you my logo for embroidery?","a":"Email your artwork to us in any format — AI, EPS, PDF, or high-res PNG preferred. If you have a lower-quality file, send it anyway and we''ll advise on the best path forward."},{"q":"What garments can you embroider?","a":"Most flat or structured fabric surfaces — polo shirts, dress shirts, t-shirts, jackets, fleece, hats, caps, bags, totes, blankets, and patches. Some very stretchy or thin fabrics are not ideal for embroidery; we''ll let you know if your chosen garment is a concern."},{"q":"Is the digitizing fee included in my quote?","a":"Yes. We include digitizing in our pricing — there''s no separate setup fee buried in the quote."},{"q":"How many colors can my embroidered logo be?","a":"Most embroidery machines run up to 15 thread colors. We''ll match your brand colors as closely as possible using our thread inventory."}]',
  'Custom Embroidery Services | Sew Suite — Allen, TX',
  'Professional custom embroidery for businesses in Allen, Lucas, and DFW. Polos, hats, jackets, bags, and more. 17+ years experience. Get a free quote.',
  1, true
);

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'screen-printing',
  'Screen Printing',
  'Vibrant, long-lasting prints for t-shirts, hoodies, and apparel. Best for larger runs and bold designs.',
  'Screen printing delivers vivid, high-impact designs that simply cannot be replicated with other decoration methods. When you need a bold graphic across the full chest of a t-shirt, or a multi-color design that pops across hundreds of event shirts, screen printing is the right call.

At Sew Suite, we handle screen printing jobs for events, teams, company outings, fundraisers, and branded merchandise. Our process produces sharp, consistent results that hold their color through repeated washing — no fading, no cracking, no peeling.

Screen printing is most cost-effective at larger quantities. The more pieces in your run, the lower your cost per unit. Minimum orders typically start at 12 pieces, and pricing improves significantly from 24 pieces and beyond.

Standard turnaround is 7-10 business days from approved proof. Rush options available.',
  '["Ideal for high-quantity t-shirt, hoodie, and event apparel runs","Vibrant ink colors that hold up through repeated washing","Up to 6 spot colors per design","Full front, full back, and sleeve placement options","Best value at 24 pieces and above","Available on a wide range of Gildan, Next Level, Bella+Canvas, and similar brands"]',
  '[{"q":"What''s the difference between screen printing and embroidery?","a":"Screen printing uses ink applied to the fabric surface — ideal for large designs, t-shirts, and high quantities. Embroidery uses thread stitched into the fabric — more durable and professional-looking on structured garments like polos and hats. We can advise which method is right for your project."},{"q":"What file format do I need for screen printing?","a":"Vector files are ideal — AI or EPS preferred. High-res PDF and PNG files (300dpi or above) also work well. If your artwork is raster-only, we may be able to recreate it in vector format for a small fee."},{"q":"Can you print photographs or gradient designs?","a":"Spot color screen printing works best with solid colors and defined shapes. Gradient or photographic images are possible using a process called simulated process printing, but are best suited to light-colored garments and require a larger minimum order. Ask us for details."}]',
  'Custom Screen Printing | Sew Suite — Allen, TX',
  'Vibrant custom screen printing for t-shirts, hoodies, and apparel in Allen TX and DFW. Great for events, teams, and company shirts. Low minimums. Fast turnaround.',
  2, true
);

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'branded-apparel',
  'Branded Apparel',
  'Full-service branded uniform and apparel programs for businesses. We handle sourcing, decoration, and delivery.',
  'A professional branded apparel program is more than ordering a few shirts with a logo on them. It''s about consistency — every employee wearing the same quality garment, with the same logo placement, every time you reorder. At Sew Suite, we manage the whole process so you don''t have to.

We work with businesses of all sizes to design and execute apparel programs: selecting garments that match your brand and budget, decorating them consistently across every order, and delivering directly to your location or shipping to multiple sites.

Whether you need 20 polos for a new hire class or a full uniform rollout across 10 locations, we handle the logistics. We maintain your decoration files so reorders are fast and consistent — no re-sending artwork, no re-explaining placement.

Ideal for growing businesses, franchise operations, and companies tired of inconsistent results from rotating vendors.',
  '["Single vendor for garment sourcing and decoration","Consistent results across every reorder","We store your decoration files for fast future orders","Multiple garment categories: polos, dress shirts, jackets, outerwear, hats","Wholesale pricing on most major brands","Direct shipping to single or multiple locations"]',
  '[{"q":"Can you handle ongoing reorders for our company?","a":"Yes — and that''s exactly where we shine. We keep your decoration files on file so reorders are fast. Just tell us the quantities and sizes and we''ll get it done."},{"q":"Can you source specific garment brands we''re already using?","a":"In most cases, yes. We work with most major wholesale apparel distributors. If you have a brand or style you''re already using, let us know and we''ll check availability."},{"q":"Do you offer volume pricing?","a":"Yes. Pricing per unit drops as quantity increases. We''ll provide tiered pricing in your quote so you can see the savings at different quantities."}]',
  'Branded Apparel Programs | Sew Suite — Allen, TX',
  'Full-service branded apparel and uniform programs for businesses in Allen TX and DFW. Sourcing, decoration, and delivery managed for you.',
  3, true
);

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'hats-and-caps',
  'Hats & Caps',
  'Structured and unstructured caps, beanies, and visors with embroidered or printed logos. Always a crowd favorite.',
  'Branded hats are one of the highest-visibility items you can put your logo on. They go everywhere your people go — on the job site, at the trade show, to the grocery store on Saturday. At Sew Suite, we embroider hats for businesses, sports teams, events, and organizations across North Texas.

We work with structured caps, unstructured caps, snapbacks, trucker hats, beanies, visors, and performance headwear. Decoration is typically embroidery on the front panel, with optional side, back, or under-brim placement depending on your design.

Logo size and stitch count matter on hats — a design that looks great on a polo may need to be simplified or resized to sit cleanly on a cap front. Our digitizing team handles this translation as part of your order.

Minimum order is 12 pieces. We can source hats if you don''t have a specific style in mind.',
  '["Embroidery on structured caps, trucker hats, beanies, and visors","Front, side, and back panel placement options","Logo digitizing optimized for cap embroidery","Wholesale hat sourcing available","Flexfit, Richardson, Yupoong, and most major brands available","12-piece minimum on most styles"]',
  '[{"q":"Can you put my logo on a hat I already purchased?","a":"In most cases, yes — we call this a customer-supplied blank. Bring or ship us your hats and we''ll add the embroidery. Contact us first so we can confirm your hat style works with our process."},{"q":"My logo has fine lines and small text — will it look good on a hat?","a":"Fine details are the most common challenge with hat embroidery. Our digitizing team will evaluate your design and recommend any simplifications needed to get a clean stitch on the cap front. We''ll show you a proof before anything goes into production."},{"q":"What''s the difference between a structured and unstructured cap?","a":"A structured cap has a stiff front panel that holds its shape — the classic baseball cap look. An unstructured cap has a soft front that collapses when not on your head — more relaxed and popular in lifestyle branding. Both embroider well; the choice is mostly aesthetic."}]',
  'Custom Logo Hats & Caps | Sew Suite — Allen, TX',
  'Custom embroidered hats and caps for businesses, teams, and events in Allen TX and DFW. Structured caps, beanies, visors, and trucker hats. Get a quote today.',
  4, true
);

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'corporate-gifts',
  'Corporate Gifts',
  'Branded bags, drinkware, jackets, and apparel sets for employee gifts, client appreciation, and company events.',
  'When you put your logo on something someone actually keeps and uses, that''s a brand impression that lasts for years. Corporate branded merchandise done right is one of the most cost-effective marketing investments a business can make.

At Sew Suite, we put together branded gift sets and merchandise for employee onboarding kits, client appreciation gifts, trade show giveaways, company anniversaries, and holiday gifts. We handle the sourcing, decoration, and delivery — you handle the relationships.

Popular corporate gift items include: branded bags and totes, embroidered jackets and vests, custom polos, drinkware sets, and apparel bundles. We can work from a specific list you have in mind or help you build a package from scratch based on your budget and recipient.

Minimums vary by item. Contact us with your budget, quantity, and occasion and we''ll build you a package proposal.',
  '["Branded bags, drinkware, apparel, and accessories","Employee onboarding kits and new hire packages","Client appreciation gift sets","Trade show giveaway merchandise","Holiday and company anniversary gifts","Single-vendor coordination for multi-item packages"]',
  '[{"q":"Can you help me figure out what to include in a gift set?","a":"Absolutely. Tell us your budget per person, the number of recipients, and the occasion — we''ll come back with package options."},{"q":"Do you handle shipping to multiple addresses?","a":"For larger corporate programs, yes. We can discuss individual shipping versus consolidated delivery depending on your situation."},{"q":"What''s a realistic lead time for a corporate gift order?","a":"Plan for 2-3 weeks for standard orders. If you''re working toward a specific date — a company event, an onboarding class, a holiday — contact us as early as possible and we''ll let you know what''s achievable."}]',
  'Corporate Branded Gifts & Merchandise | Sew Suite — Allen, TX',
  'Custom branded corporate gifts for businesses in Allen TX and DFW. Branded bags, drinkware, apparel sets, and more. Employee gifts, client appreciation, company events.',
  5, true
);

INSERT INTO sewsuite_services (slug, name, short_desc, long_desc, features, faq_items, meta_title, meta_desc, sort_order, active)
VALUES (
  'team-uniforms',
  'Team Uniforms',
  'Jerseys, polos, and performance wear for sports teams, leagues, and company sports days. Numbered and named.',
  'Every team deserves to look like a team. Whether it''s a company softball league, a youth sports program, an adult recreational league, or a competitive club team, Sew Suite has been outfitting North Texas teams for over 17 years.

We produce decorated jerseys, performance shirts, hoodies, and sport-specific apparel with names, numbers, logos, and sponsor branding. Decoration can be screen printed, heat transferred, or embroidered depending on the garment type and your preference.

For corporate sports leagues and company recreation teams, we also handle matching bags, hats, and accessories so your entire team shows up looking cohesive from head to toe.

Orders are produced with individual names and numbers at no extra hassle — just provide us your roster and we''ll handle the rest. Minimum order is typically 12 pieces.',
  '["Jerseys, performance shirts, and hoodies with names and numbers","League and team logos included in decoration","Screen print, embroidery, and heat transfer options","Matching hats, bags, and accessories available","Roster management — we handle the individual personalization","Youth and adult sizing available"]',
  '[{"q":"How do I provide player names and numbers?","a":"A simple spreadsheet works perfectly — name, number, size for each player. Email it to us when you''re ready to order and we''ll handle the rest."},{"q":"What''s the turnaround time for a team order with names and numbers?","a":"Allow 10-14 business days from proof approval for personalized team orders. Rush options are sometimes available — contact us with your timeline."},{"q":"Can you handle a league with multiple teams?","a":"Yes. We work with leagues and organizations managing multiple teams at once. Contact us to discuss league pricing and coordination."}]',
  'Custom Team Uniforms & Sports Apparel | Sew Suite — Allen, TX',
  'Custom team uniforms, jerseys, and sports apparel for leagues and teams in Allen TX and DFW. Embroidered and printed. Numbers, names, and logos.',
  6, true
);
