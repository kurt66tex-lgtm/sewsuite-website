import { Field, Toggle, TextArea, Card } from './SettingsFields';
import { AlertTriangle } from 'lucide-react';
import {
  isReviewAutomationReady,
  DEFAULT_REVIEW_REQUEST_TEMPLATE,
  DEFAULT_REVIEW_REMINDER_TEMPLATE,
} from '@/lib/reviewUtils';

export default function TabReviews({ settings, update }) {
  const ready = isReviewAutomationReady(settings);
  const missingUrl = !settings.google_review_url;

  return (
    <div className="space-y-4">
      {(missingUrl || !ready) && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {missingUrl
            ? 'AUTOMATION OFF — Google Review URL is required. Add it below before enabling automation.'
            : 'AUTOMATION OFF — Enable review requests and the Email channel to turn on automation.'}
        </div>
      )}
      {ready && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          AUTOMATION ON — review requests will be sent automatically per the configured schedule.
        </div>
      )}

      <Card title="Review Configuration">
        <Field label="Google Review URL" k="google_review_url" settings={settings} update={update} placeholder="https://g.page/your-business/review" />
        <Field label="Google Review QR Image URL (optional)" k="google_review_qr_url" settings={settings} update={update} placeholder="/google-review-qr.svg or hosted image URL" />
        <Toggle label="Review Requests Enabled" k="review_requests_enabled" settings={settings} update={update} hint="Keep OFF until email/domain/provider settings are configured and tested." />
        <Toggle label="Reminders Enabled" k="review_reminders_enabled" settings={settings} update={update} />
        <Toggle label="Email Channel Enabled" k="review_email_enabled" settings={settings} update={update} />
        <Toggle label="SMS Channel Enabled" k="review_sms_enabled" settings={settings} update={update} hint="Reserved for a future SMS provider. Email is the active automated delivery channel." />
        <Field label="Initial Delay (days)" k="review_initial_delay_days" settings={settings} update={update} type="number" hint="Wait time after job completion before sending request" />
        <Field label="Reminder Delay (days)" k="review_reminder_delay_days" settings={settings} update={update} type="number" hint="Wait time after request sent before sending reminder" />
      </Card>

      <Card title="Message Templates" description="Neutral wording — no review-gating. Use {{first_name}}, {{appliance_type}}, {{google_review_url}} variables.">
        <TextArea
          label="Request Template"
          k="review_request_template"
          settings={settings}
          update={update}
          rows={6}
          placeholder={DEFAULT_REVIEW_REQUEST_TEMPLATE}
        />
        <TextArea
          label="Reminder Template"
          k="review_reminder_template"
          settings={settings}
          update={update}
          rows={5}
          placeholder={DEFAULT_REVIEW_REMINDER_TEMPLATE}
        />
      </Card>
    </div>
  );
}