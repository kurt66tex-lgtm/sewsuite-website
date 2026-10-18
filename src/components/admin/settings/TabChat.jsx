import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Field, Toggle, TextArea, Card } from './SettingsFields';
import ClientVoiceAIStatus from './ClientVoiceAIStatus';

export default function TabChat({ settings, update }) {
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sendTestLeadNotification = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke('manageBusinessSettings', {
        action: 'test_lead_notification',
        recipient_email: settings.lead_notification_email || settings.email || ''
      });
      const data = res?.data || res || {};
      if (data.error) throw new Error(data.error);
      setTestResult({ ok: true, message: `Test email sent to ${data.recipient_email}. Confirm it arrived before completing launch QA.` });
    } catch (e) {
      setTestResult({ ok: false, message: e.message || 'Unable to send test lead notification.' });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      <ClientVoiceAIStatus />

      <Card title="Chat Assistant" description="Out-of-area detection logic is preserved — do not disable unless necessary.">
        <Toggle label="Chat Enabled" k="chat_enabled" settings={settings} update={update} defaultTrue />
        <Field label="Assistant Name" k="chat_assistant_name" settings={settings} update={update} />
        <TextArea label="Welcome Message" k="chat_welcome_message" settings={settings} update={update} rows={2} />
        <Field label="Photo Limit Per Conversation" k="photo_limit_per_conversation" settings={settings} update={update} type="number" />
      </Card>

      <Card title="Chat Colors" description="Separate chat styling prevents primary CTA colors from creating poor contrast in the chat launcher or message window.">
        <Field label="Launcher Background" k="chat_launcher_background_color" settings={settings} update={update} />
        <Field label="Launcher Text / Icon" k="chat_launcher_text_color" settings={settings} update={update} />
        <Field label="Launcher Border" k="chat_launcher_border_color" settings={settings} update={update} />
        <Field label="Header Background" k="chat_header_background_color" settings={settings} update={update} />
        <Field label="Header Accent" k="chat_header_accent_color" settings={settings} update={update} />
        <Field label="Customer Message Background" k="chat_user_message_background_color" settings={settings} update={update} />
        <Field label="Customer Message Text" k="chat_user_message_text_color" settings={settings} update={update} />
        <Field label="Send Button Background" k="chat_send_background_color" settings={settings} update={update} />
        <Field label="Send Icon Color" k="chat_send_icon_color" settings={settings} update={update} />
      </Card>

      <Card title="Notifications" description="New website leads use the built-in email delivery path. Send a test before launch to confirm delivery to the office inbox.">
        <Field label="Lead Notification Email" k="lead_notification_email" settings={settings} update={update} />
        <Field label="Safety Notification Email" k="safety_notification_email" settings={settings} update={update} />
        <Field label="Safety Notification SMS Number" k="safety_notification_sms" settings={settings} update={update} hint="Optional — requires an SMS provider before use." />
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={sendTestLeadNotification}
            disabled={testingEmail || !(settings.lead_notification_email || settings.email)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-accent disabled:opacity-50"
          >
            {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : testResult?.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Send className="w-4 h-4" />}
            {testingEmail ? 'Sending Test…' : 'Send Test Lead Notification'}
          </button>
          {testResult && <p className={`mt-2 text-xs ${testResult.ok ? 'text-green-700' : 'text-red-600'}`}>{testResult.message}</p>}
        </div>
      </Card>

      <Card title="Emergency Service">
        <Toggle label="Emergency Service Advertised" k="emergency_service_enabled" settings={settings} update={update} hint="Only enable if the client actually offers emergency service." />
      </Card>
    </div>
  );
}