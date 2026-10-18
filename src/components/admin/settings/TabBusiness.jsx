import { Field, Toggle, Card } from './SettingsFields';

export default function TabBusiness({ settings, update }) {
  return (
    <div className="space-y-4">
      <Card title="Business Information">
        <Field label="Business Name" k="business_name" settings={settings} update={update} />
        <Field label="Phone" k="phone" settings={settings} update={update} />
        <Field label="Email" k="email" settings={settings} update={update} />
        <Field label="Website URL" k="website_url" settings={settings} update={update} />
        <Field label="Service Region Label" k="service_region_label" settings={settings} update={update} placeholder="e.g. North Texas, DFW, Greater Austin" hint="Used in public website copy and SEO where a broader service-region label is helpful." />
        <Field label="Address Line 1" k="address_line_1" settings={settings} update={update} />
        <div className="grid grid-cols-3 gap-2">
          <Field label="City" k="address_city" settings={settings} update={update} />
          <Field label="State" k="address_state" settings={settings} update={update} />
          <Field label="ZIP" k="address_zip" settings={settings} update={update} />
        </div>
        <Toggle
          label="Show Address Publicly"
          k="show_business_address_publicly"
          settings={settings}
          update={update}
          hint="Hide if customers don't visit this location (service-area business)."
        />
        <Field label="Timezone" k="timezone" settings={settings} update={update} />
      </Card>

      <Card title="Homepage Niche Profile" description="Optional client-specific homepage copy. Provisioning can populate these fields so the core template stays reusable across industries. Leave a field blank to use the business-model fallback.">
        <Field label="Hero Heading" k="home_hero_heading" settings={settings} update={update} placeholder="Primary homepage headline" />
        <Field label="Hero Accent" k="home_hero_accent" settings={settings} update={update} placeholder="Optional highlighted phrase" />
        <Field label="Hero Description" k="home_hero_description" settings={settings} update={update} placeholder="Niche-specific summary of what the business does and who it serves" />
        <Field label="Services Heading" k="home_services_heading" settings={settings} update={update} />
        <Field label="Services Intro" k="home_services_intro" settings={settings} update={update} />
        <Field label="Final CTA Heading" k="home_final_cta_heading" settings={settings} update={update} />
        <Field label="Final CTA Text" k="home_final_cta_text" settings={settings} update={update} />
        <Field label="Homepage Trust Labels (comma-separated)" k="home_trust_items" settings={{...settings, home_trust_items: Array.isArray(settings.home_trust_items) ? settings.home_trust_items.join(', ') : (settings.home_trust_items || '')}} update={(k, v) => update(k, String(v || '').split(',').map(x => x.trim()).filter(Boolean))} placeholder="Artwork Support, Local Pickup, Nationwide Shipping" />
        <p className="text-xs text-slate-500">Value cards, Why Choose cards, and How It Works steps can also be supplied by the provisioning build pack. They intentionally remain structured data rather than comma-separated text.</p>
      </Card>

      <Card title="Privacy & Data Profile" description="Review these settings against the client's actual intake forms, integrations, retention practices and enabled add-ons before launch. The public Privacy Policy uses these choices; they are not proof that a practice is active.">
        <Toggle label="Collect service or job-site address" k="privacy_collect_service_address" settings={settings} update={update} />
        <Toggle label="Collect billing or shipping information" k="privacy_collect_billing_shipping_address" settings={settings} update={update} />
        <Toggle label="Collect equipment, appliance or property details" k="privacy_collect_equipment_details" settings={settings} update={update} />
        <Toggle label="Collect project and quote details" k="privacy_collect_project_details" settings={settings} update={update} />
        <Toggle label="Accept uploaded photos, artwork or files" k="privacy_collect_uploaded_files" settings={settings} update={update} />
        <Toggle label="Create or retain proofs, artwork or project files" k="privacy_create_project_files" settings={settings} update={update} />
        <Toggle label="Use chat to collect inquiries" k="privacy_use_chat" settings={settings} update={update} />
        <Toggle label="Use website analytics or attribution" k="privacy_use_analytics" settings={settings} update={update} />
        <Toggle label="Send review requests" k="privacy_use_review_requests" settings={settings} update={update} />
        <Toggle label="Send text messages" k="privacy_use_text_messages" settings={settings} update={update} />
        <Toggle label="Use AI-assisted phone calls" k="privacy_use_ai_voice" settings={settings} update={update} hint="Discloses that an automated/AI voice receptionist may process caller-provided information." />
        <Toggle label="Retain AI call transcripts or summaries" k="privacy_store_call_transcripts" settings={settings} update={update} hint="Must match the Voice AI transcript-storage setting." />
        <Toggle label="Retain audio call recordings" k="privacy_record_calls" settings={settings} update={update} hint="Enable only when an actual recording workflow and required notice/consent process are in place." />
        <Field label="Reviewed information-collection wording (optional)" k="privacy_custom_information_text" settings={settings} update={update} />
        <Field label="Reviewed file-handling wording (optional)" k="privacy_custom_files_text" settings={settings} update={update} />
        <p className="text-xs text-slate-500">Confirm the privacy contact, third-party processors, cookies, actual retention periods and applicable consent requirements with the client before publishing. Custom wording should be reviewed rather than generated as an unsupported claim.</p>
      </Card>

      <Card title="Social Media" description="Turn on only the social profiles the business wants displayed publicly. An enabled network with a valid URL automatically appears as a linked icon in the website footer.">
        <Toggle label="Facebook" k="social_facebook_enabled" settings={settings} update={update} />
        <Field label="Facebook URL" k="social_facebook_url" settings={settings} update={update} placeholder="https://www.facebook.com/..." />
        <Toggle label="Instagram" k="social_instagram_enabled" settings={settings} update={update} />
        <Field label="Instagram URL" k="social_instagram_url" settings={settings} update={update} placeholder="https://www.instagram.com/..." />
        <Toggle label="TikTok" k="social_tiktok_enabled" settings={settings} update={update} />
        <Field label="TikTok URL" k="social_tiktok_url" settings={settings} update={update} placeholder="https://www.tiktok.com/@..." />
        <Toggle label="LinkedIn" k="social_linkedin_enabled" settings={settings} update={update} />
        <Field label="LinkedIn URL" k="social_linkedin_url" settings={settings} update={update} placeholder="https://www.linkedin.com/company/..." />
        <Toggle label="YouTube" k="social_youtube_enabled" settings={settings} update={update} />
        <Field label="YouTube URL" k="social_youtube_url" settings={settings} update={update} placeholder="https://www.youtube.com/@..." />
        <Toggle label="X / Twitter" k="social_x_enabled" settings={settings} update={update} />
        <Field label="X / Twitter URL" k="social_x_url" settings={settings} update={update} placeholder="https://x.com/..." />
      </Card>

      <Card title="Verified Trust Information" description="Only enter claims the client has confirmed and can support.">
        <Field label="Established Year" k="established_year" settings={settings} update={update} type="number" placeholder="2011" />
        <Field label="Emergency Service Text" k="emergency_service_text" settings={settings} update={update} placeholder="24/7 emergency service available" />
        <Field label="Credentials (comma-separated)" k="credentials" settings={{...settings, credentials: Array.isArray(settings.credentials) ? settings.credentials.join(', ') : (settings.credentials || '')}} update={(k, v) => update(k, String(v || '').split(',').map(x => x.trim()).filter(Boolean))} placeholder="Master Plumber #M40035, LP Certified" />
        <Field label="Trust Highlights (comma-separated)" k="trust_highlights" settings={{...settings, trust_highlights: Array.isArray(settings.trust_highlights) ? settings.trust_highlights.join(', ') : (settings.trust_highlights || '')}} update={(k, v) => update(k, String(v || '').split(',').map(x => x.trim()).filter(Boolean))} placeholder="Family Owned, Local & Accountable" />
      </Card>

      <Card title="Business Hours">
        <Field label="Mon–Fri Hours" k="hours_mon_fri" settings={settings} update={update} placeholder="8:00 AM - 7:00 PM" />
        <Field label="Saturday Hours" k="hours_saturday" settings={settings} update={update} placeholder="8:00 AM - 1:00 PM" />
        <Field label="Sunday Hours" k="hours_sunday" settings={settings} update={update} placeholder="Closed" />
        <Field label="Holiday Hours" k="holiday_hours" settings={settings} update={update} placeholder="e.g. Christmas: Closed" />
      </Card>
    </div>
  );
}