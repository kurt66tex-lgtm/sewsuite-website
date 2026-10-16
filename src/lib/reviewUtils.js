// Review workflow utilities — eligibility, due-date calculations, templates.

export const DEFAULT_REVIEW_REQUEST_TEMPLATE = `Hi {{first_name}}, thank you for choosing {{business_name}} for your recent service. If you'd like to share feedback about your experience, you can leave a Google review here:

{{google_review_url}}

Thank you,
{{business_name}}`;

export const DEFAULT_REVIEW_REMINDER_TEMPLATE = `Hi {{first_name}}, just a quick follow-up from {{business_name}}. If you'd like to share feedback about your recent service, you can do so here:

{{google_review_url}}

Thank you.`;

/**
 * A job is review-eligible only when truly operationally complete:
 * - status === 'Completed'
 * - no unresolved (non-complete, non-canceled) visit exists
 * - no pending Return Visit exists
 * - no parts remain outstanding (Needed / Ordered / Backordered)
 */
export function isJobReviewEligible(job, visits = [], parts = []) {
  if (!job || job.status !== 'Completed') return false;

  const hasUnresolvedVisit = (visits || []).some(
    (v) => v.status !== 'Complete' && v.status !== 'Canceled'
  );
  if (hasUnresolvedVisit) return false;

  const hasPendingReturn = (visits || []).some(
    (v) =>
      v.visit_type === 'Return Visit' &&
      v.status !== 'Complete' &&
      v.status !== 'Canceled'
  );
  if (hasPendingReturn) return false;

  const hasOutstandingParts = (parts || []).some(
    (p) =>
      p.status === 'Needed' ||
      p.status === 'Ordered' ||
      p.status === 'Backordered'
  );
  if (hasOutstandingParts) return false;

  return true;
}

export function calculateReviewDueDate(completedAt, initialDelayDays = 1) {
  if (!completedAt) return null;
  const d = new Date(completedAt);
  d.setDate(d.getDate() + (initialDelayDays || 1));
  return d.toISOString().slice(0, 10);
}

export function calculateReminderDueDate(requestSentDate, reminderDelayDays = 3) {
  if (!requestSentDate) return null;
  const d = new Date(requestSentDate);
  d.setDate(d.getDate() + (reminderDelayDays || 3));
  return d.toISOString().slice(0, 10);
}

export function renderTemplate(template, vars = {}) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

/**
 * Automation can only be considered "ready" when:
 * - google_review_url is set
 * - review_requests_enabled is true
 * - at least one channel (email or SMS) is enabled
 */
export function isReviewAutomationReady(settings) {
  if (!settings) return false;
  return !!(
    settings.google_review_url &&
    settings.review_requests_enabled &&
    settings.review_email_enabled
  );
}

export function getReviewStatusColor(status) {
  const colors = {
    Eligible: 'bg-slate-100 text-slate-700',
    'Request Due': 'bg-amber-100 text-amber-800',
    'Request Sent': 'bg-blue-100 text-blue-700',
    'Reminder Due': 'bg-amber-100 text-amber-800',
    'Reminder Sent': 'bg-blue-100 text-blue-700',
    'Review Received': 'bg-green-100 text-green-700',
    'Do Not Ask': 'bg-slate-200 text-slate-500',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}