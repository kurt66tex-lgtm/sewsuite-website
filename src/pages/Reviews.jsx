import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function Reviews() {
  const { settings } = useBusinessSettings();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    base44.entities.Review.filter({ approved_for_website: true }, 'display_order', 100).then(setReviews).catch(() => {});
  }, []);

  const businessName = settings?.business_name || 'Service Business';
  const googleUrl = settings?.google_review_url;
  const googleQrUrl = settings?.google_review_qr_url || (businessName === 'Sew Suite' ? '/sew-suite-google-review-qr.svg' : null);

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Reviews</nav>
          <h1 className="text-4xl font-bold text-slate-900">Reviews</h1>
          <p className="mt-3 text-lg text-slate-600">Approved customer reviews for {businessName}.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-12">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Reviews will appear here once approved.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {reviews.map(r => (
              <div key={r.id} className="border border-slate-200 rounded-xl p-5">
                <div className="flex gap-0.5 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
                {r.title && <h3 className="font-semibold text-slate-900">{r.title}</h3>}
                <p className="mt-1 text-slate-700">"{r.body}"</p>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {r.customer_name} {r.city ? `• ${r.city}` : ''}
                  {(r.review_date_label || r.review_date) && (
                    <span className="font-normal text-slate-500"> · {r.review_date_label || new Date(r.review_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-6 sm:gap-10">
            <div className="text-center sm:text-left max-w-xl">
              <h2 className="text-xl font-bold text-slate-900">Used {businessName}? Share Your Experience.</h2>
              <p className="mt-2 text-slate-600 text-sm">We'd appreciate an honest review. On a phone, use the button below. On another device, you can scan the QR code.</p>
              {googleUrl ? (
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent"><ExternalLink className="w-4 h-4" /> Leave a Google Review</a>
              ) : (
                <Link to="/contact" className="mt-4 inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent">Contact Us</Link>
              )}
            </div>
            {googleUrl && googleQrUrl && (
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:flex shrink-0 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <img src={googleQrUrl} alt={`QR code to leave a Google review for ${businessName}`} className="w-36 h-36 object-contain" />
                <span className="text-xs font-semibold text-slate-600">Scan to review</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}