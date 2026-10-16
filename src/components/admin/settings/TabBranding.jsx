import { Field, Toggle, TextArea, UploadField, Card } from './SettingsFields';

export default function TabBranding({ settings, update }) {
  return (
    <div className="space-y-4">
      <Card title="Logo & Assets" description="Use approved client assets. A text wordmark is valid when it is an intentional brand decision, not a missing-logo fallback.">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand Mark Mode</label>
          <select
            value={settings.brand_mark_mode || 'uploaded_logo'}
            onChange={(e) => update('brand_mark_mode', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="uploaded_logo">Uploaded Logo</option>
            <option value="text_wordmark">Approved Text Wordmark</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Launch requires either a logo file or an explicitly approved text wordmark.</p>
        </div>
        <div />
        <UploadField label="Logo (light backgrounds)" k="logo_url" settings={settings} update={update} />
        <UploadField label="Reversed Logo (dark backgrounds)" k="logo_reversed_url" settings={settings} update={update} />
        <UploadField label="Favicon" k="favicon_url" settings={settings} update={update} />
        <UploadField label="Hero Image" k="hero_image_url" settings={settings} update={update} hint="Optional primary homepage image. Use a real client photo when available." />
        <UploadField label="About / Team Image" k="about_image_url" settings={settings} update={update} hint="Optional authentic team, family, owner, or company image for About/story sections." />
      </Card>

      <Card title="Brand Colors" description="Start with the three core choices below. The remaining fields are supporting controls and usually should stay close to those core colors.">
        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-bold text-slate-900 mb-1">Simple rule of thumb</div>
          <div><b>Dark / Primary:</b> navigation, headings, footer, and major structure. <b>Accent:</b> highlights, icons, and links. <b>CTA:</b> the color used to draw attention to important buttons. Use the light background as the quiet neutral that gives the brand room to breathe.</div>
          <div className="mt-2 pt-2 border-t border-slate-200"><b>CTA contrast rule:</b> Primary actions use a filled CTA color. Secondary actions on light sections use dark text with a brand-color outline. Secondary actions on dark sections use light text with the same brand-color outline, then fill with the CTA color on hover.</div>
        </div>
        <Field label="Accent / Highlight Color" k="accent_color" settings={settings} update={update} hint="Use for links, icons, dividers, active states, and small emphasis. Usually your secondary brand color." />
        <Field label="Primary CTA / Button Color" k="cta_color" settings={settings} update={update} hint="Use for the main action you want visitors to notice, such as Request a Quote or Book Service." />
        <Field label="Primary Button Text" k="button_text_color" settings={settings} update={update} hint="Choose for strong contrast against the CTA color. This does not need to be white." />
        <Field label="CTA Hover Color" k="cta_hover_color" settings={settings} update={update} hint="A slightly darker or richer version of the CTA color for hover/pressed states." />
        <Field label="Dark / Primary Brand Color" k="dark_text_color" settings={settings} update={update} hint="Use for navigation, headings, footer/background structure, and readable dark text." />
        <Field label="Light / Page Background" k="light_background_color" settings={settings} update={update} hint="Use a soft neutral rather than pure white when the brand calls for a warmer or more refined feel." />
      </Card>

      <Card title="Community / Organization Support" description="Optional. Use only when the client has approved this affiliation or support statement.">
        <Field label="Organization Name" k="community_support_name" settings={settings} update={update} placeholder="Organization name" />
        <Field label="Display Label" k="community_support_label" settings={settings} update={update} placeholder="Proudly Supporting" />
        <Field label="Organization URL" k="community_support_url" settings={settings} update={update} placeholder="https://…" />
        <UploadField label="Support Badge / Logo" k="community_support_badge_url" settings={settings} update={update} />
      </Card>

      <Card title="Secondary / Outline Buttons" description="Advanced controls. Most clients can leave these aligned with the core palette unless an outline button needs special contrast.">
        <Field label="Border Color" k="secondary_button_border_color" settings={settings} update={update} />
        <Field label="Text / Icon Color" k="secondary_button_text_color" settings={settings} update={update} />
        <Field label="Hover Background" k="secondary_button_hover_background_color" settings={settings} update={update} />
        <Field label="Hover Text / Icon" k="secondary_button_hover_text_color" settings={settings} update={update} />
      </Card>

      <Card title="Website Content">
        <Field label="Primary Message" k="primary_message" settings={settings} update={update} hint="e.g. Quick. Reliable. Honest." />
        <Field label="First-Trip Completion Text" k="first_trip_completion_text" settings={settings} update={update} hint="Optional verified claim. Leave blank unless the client can support it." />
        <Field label="Warranty Text" k="warranty_text" settings={settings} update={update} hint="Optional. Enter only the client's actual warranty." />
        <Field label="Warranty Duration (Days)" k="warranty_duration_days" settings={settings} update={update} type="number" hint="Operational setting. Zero means do not automatically create a warranty expiration date." />
        <Toggle label="Family-Owned" k="family_owned" settings={settings} update={update} hint="Enable only when verified for this client." />
        <TextArea label="About Copy" k="about_copy" settings={settings} update={update} rows={4} />
      </Card>
    </div>
  );
}