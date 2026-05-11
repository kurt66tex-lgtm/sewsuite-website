export interface SewSuitePage {
  id: string;
  slug: string;
  meta_title: string | null;
  meta_desc: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_body: string | null;
  updated_at: string;
}

export interface SewSuiteService {
  id: string;
  slug: string;
  name: string;
  short_desc: string | null;
  long_desc: string | null;
  features: string[];
  faq_items: { q: string; a: string }[];
  meta_title: string | null;
  meta_desc: string | null;
  sort_order: number;
  active: boolean;
}

export interface SewSuiteTestimonial {
  id: string;
  name: string;
  company: string | null;
  quote: string;
  rating: number;
  approved: boolean;
  sort_order: number;
}

export interface SewSuiteFAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
}

export interface GalleryPhoto {
  src: string;
  alt: string;
  name: string;
}
