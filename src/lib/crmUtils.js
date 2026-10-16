/**
 * CRM utility functions for job numbers, model/serial validation,
 * and appliance type normalization.
 */

/**
 * Generate a unique human-readable job number: ZR-YYMMDD-###
 * @param {object} base44 - The base44 SDK client
 * @returns {Promise<string>}
 */
export async function generateJobNumber(base44) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `ZR-${yy}${mm}${dd}`;

  const existing = await base44.entities.Job.list('-created_date', 500);
  const todayJobs = existing.filter(j => j.job_number && j.job_number.startsWith(prefix));
  const maxSeq = todayJobs.reduce((max, j) => {
    const parts = j.job_number.split('-');
    const seq = parseInt(parts[parts.length - 1], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}-${nextSeq}`;
}

/**
 * Normalize a phone number to digits-only for matching.
 * Strips formatting; removes leading 1 for US numbers.
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

/**
 * Normalize a model or serial number: trim whitespace, collapse duplicate spaces.
 * Does NOT remove any other characters — suspicious chars are flagged separately.
 * @param {string} value
 * @returns {string}
 */
export function normalizeModelSerial(value) {
  if (!value || typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Check if a model or serial number contains suspicious characters.
 * Allowed: letters, numbers, hyphens, slashes, periods, parentheses, spaces.
 * @param {string} value
 * @returns {boolean}
 */
export function isModelSerialSuspicious(value) {
  if (!value || typeof value !== 'string') return false;
  return !/^[a-zA-Z0-9/().\s-]+$/.test(value);
}

/**
 * Normalize an appliance type by removing a trailing " Repair" suffix.
 * e.g., "Dishwasher Repair" -> "Dishwasher"
 * @param {string} type
 * @returns {string}
 */
export function normalizeApplianceType(type) {
  if (!type || typeof type !== 'string') return type;
  return type.replace(/\s+Repair$/i, '').trim();
}

/**
 * Determine if an AI pre-diagnosis contains meaningful information
 * beyond the customer's reported problem.
 * @param {string} preDiagnosis - The AI pre-diagnosis text
 * @param {string} reportedProblem - The customer's reported problem description
 * @returns {boolean}
 */
export function hasMeaningfulPreDiagnosis(preDiagnosis, reportedProblem) {
  if (!preDiagnosis || !preDiagnosis.trim()) return false;
  if (!reportedProblem || !reportedProblem.trim()) return true;
  const norm1 = preDiagnosis.toLowerCase().trim();
  const norm2 = reportedProblem.toLowerCase().trim();
  if (norm1 === norm2) return false;
  // If pre-diagnosis merely echoes the problem with minor wrapper text
  if (norm1.includes(norm2) && norm1.length < norm2.length + 20) return false;
  return true;
}