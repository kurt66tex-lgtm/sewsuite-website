import { Link } from 'react-router-dom';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function PrivacyPolicy() {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const contactParts = [settings?.customer_support_email || settings?.email, settings?.phone].filter(Boolean);
  const isProjectQuote = settings?.business_model === 'project_quote';
  const collectServiceAddress = settings?.privacy_collect_service_address ?? !isProjectQuote;
  const collectBillingShipping = settings?.privacy_collect_billing_shipping_address === true;
  const collectEquipment = settings?.privacy_collect_equipment_details ?? !isProjectQuote;
  const collectProject = settings?.privacy_collect_project_details ?? isProjectQuote;
  const collectFiles = settings?.privacy_collect_uploaded_files !== false;
  const createProjectFiles = settings?.privacy_create_project_files === true;
  const useChat = settings?.privacy_use_chat !== false;
  const useAnalytics = settings?.privacy_use_analytics !== false;
  const useReviews = settings?.privacy_use_review_requests === true || settings?.review_requests_enabled === true;
  const useText = settings?.privacy_use_text_messages !== false;
  const useAiVoice = settings?.privacy_use_ai_voice === true;
  const storeCallTranscripts = settings?.privacy_store_call_transcripts === true;
  const recordCalls = settings?.privacy_record_calls === true;

  const collected = ['your name, phone number, and email address'];
  if (collectServiceAddress) collected.push('service or job-site address');
  if (collectBillingShipping) collected.push('billing or shipping information when applicable');
  if (collectProject) collected.push('project or quote details such as scope, quantities, timing, and requirements');
  if (collectEquipment) collected.push('property, appliance, equipment, or service details relevant to your request');
  if (collectFiles) collected.push('photos, artwork, documents, or other files you choose to provide');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-accent">Home</Link> / Privacy Policy</nav>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-slate-700 space-y-4">
        <p>{businessName} ("we," "us," or "our") respects your privacy. This policy explains how we collect, use, and protect information you provide through our website and when you contact or request work from us.</p>
        <h2 className="text-xl font-semibold text-slate-900">Information We Collect</h2>
        <p>{settings?.privacy_custom_information_text || `When you contact us, submit a request${useChat ? ', use our chat assistant' : ''}${useAiVoice ? ', or speak with our automated/AI-assisted phone receptionist' : ''}, we may collect ${collected.join(', ')}. ${useAiVoice ? 'Information you provide during a phone conversation may also be used to create or update a request in our customer-management system.' : ''}${useAnalytics ? ' We may also collect information about how you reached or used the website when available.' : ''}`}</p>
        <h2 className="text-xl font-semibold text-slate-900">How We Use Your Information</h2>
        <p>We use information to respond to inquiries, prepare quotes or service requests, plan and perform approved work, communicate about your request, maintain customer and project or service history{useReviews ? ', support review-request workflows' : ''}, and operate and improve the business. We do not sell your personal information.</p>
        {(collectFiles || createProjectFiles) && <>
          <h2 className="text-xl font-semibold text-slate-900">{createProjectFiles ? 'Photos, Artwork & Project Files' : 'Photos & Files'}</h2>
          <p>{settings?.privacy_custom_files_text || (createProjectFiles
            ? 'Files you provide may include logos, artwork, photographs, documents, specifications, or other project materials. We may also create, modify, prepare, or retain proofs, production files, artwork, or other project-related materials as part of preparing and completing approved work. Access is intended to be limited to authorized people who need the information for the request or project.'
            : 'Files you upload are stored for request-related use and are intended to be accessible only to authorized people who need them to assist with your request. They are not intended to be publicly discoverable.')}</p>
        </>}
        {(useText || settings?.email) && <><h2 className="text-xl font-semibold text-slate-900">Text Messages (SMS) & Email Consent</h2>
          <p>If you provide consent, we may send you {useText ? 'text messages (SMS)' : ''}{useText && settings?.email ? ' or ' : ''}{settings?.email ? 'email messages' : ''} about your request, quote, project, appointment, or service as applicable. {useText ? ' You can opt out of text messages at any time by replying STOP. Message and data rates may apply.' : ''}</p></>}
        {useAiVoice && <>
          <h2 className="text-xl font-semibold text-slate-900">AI-Assisted Phone Calls</h2>
          <p>Some calls may be handled by an automated or AI-assisted voice receptionist. Audio is processed by our phone and AI service providers so the system can understand and respond to the caller, collect request details, create or update CRM records, and route or support follow-up when appropriate.</p>
          {storeCallTranscripts && <p>Text transcripts or call summaries may be retained with business records to help us respond to requests, maintain project or service history, review call handling, and improve operations.</p>}
          {recordCalls
            ? <p>Audio recordings may also be retained when call recording is enabled. Any recording workflow should be used with the disclosures or consent required by applicable law.</p>
            : <p>Our configured workflow does not retain audio recordings of these AI-assisted calls.</p>}
        </>}
        {useAnalytics && <><h2 className="text-xl font-semibold text-slate-900">Website & Attribution Information</h2><p>We may use analytics and attribution information, such as pages visited and referring sources, to understand website use and how customers find us.</p></>}
        <h2 className="text-xl font-semibold text-slate-900">Data Retention</h2>
        <p>We retain customer, request, project, and service records{storeCallTranscripts ? ', including retained call transcripts or summaries,' : ''} for as long as reasonably necessary to provide the requested work, maintain appropriate history, satisfy legal or operational requirements, and support the business relationship.</p>
        <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
        <p>{contactParts.length ? <>For privacy questions, please contact us at {contactParts.join(' or ')}.</> : <>Privacy contact information will be provided by the business before launch.</>}</p>
      </div>
    </div>
  );
}
