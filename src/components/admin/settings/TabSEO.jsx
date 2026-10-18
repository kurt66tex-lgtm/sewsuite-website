import { Field, TextArea, Card } from './SettingsFields';
import { UploadField } from './SettingsFields';

export default function TabSEO({ settings, update }) {
  return (
    <div className="space-y-4">
      <Card title="Google & Search">
        <Field label="Google Business Profile URL" k="google_business_profile_url" settings={settings} update={update} />
        <Field label="Google Search Console Verification Code" k="google_verification_code" settings={settings} update={update} hint="Content of the verification meta tag" />
        <Field label="Primary Business Category" k="primary_business_category" settings={settings} update={update} />
      </Card>

      <Card title="Default Meta">
        <Field label="Default Meta Title" k="seo_default_meta_title" settings={settings} update={update} />
        <TextArea label="Default Meta Description" k="seo_default_meta_description" settings={settings} update={update} rows={2} />
      </Card>

      <Card title="Analytics">
        <Field label="GA4 ID" k="ga4_id" settings={settings} update={update} placeholder="G-XXXXXXXXXX" />
        <Field label="GTM ID" k="gtm_id" settings={settings} update={update} placeholder="GTM-XXXXXXX" />
      </Card>

      <Card title="Social Media & Open Graph">
        <UploadField label="Default Social / OG Image" k="default_social_image_url" settings={settings} update={update} hint="Used for link previews on social media" />
        <Field label="Facebook URL" k="social_facebook_url" settings={settings} update={update} />
        <Field label="Instagram URL" k="social_instagram_url" settings={settings} update={update} />
      </Card>
    </div>
  );
}