export const CRM_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin' },
  { key: 'inbox', label: 'Inbox', path: '/admin/inbox' },
  { key: 'schedule', label: 'Schedule', path: '/admin/calendar' },
  { key: 'jobs', label: 'Jobs', path: '/admin/jobs' },
  { key: 'customers', label: 'Customers', path: '/admin/customers' },
  { key: 'reviews', label: 'Reviews', path: '/admin/reviews' },
  { key: 'reports', label: 'Reports', path: '/admin/reports' },
];

export function isAgencyOwner(user) {
  return user?.collaborator_role === 'editor' || user?.collaborator_role === 'owner';
}

export function isClientAdmin(user) {
  return user?.role === 'office' && user?.is_client_admin === true && !isAgencyOwner(user);
}

export function hasSectionAccess(user, section) {
  if (!user) return false;

  // The technician workspace is identity-bound and its backend functions require
  // role=technician. Do not expose this route to owner/admin/office accounts.
  if (section === 'technician') return user.role === 'technician';

  if (isAgencyOwner(user)) return true;
  if (user.role === 'technician') return false;
  if (isClientAdmin(user)) return section !== 'agency_settings';
  if (user.role !== 'office' || user.crm_enabled !== true) return false;
  return user[`perm_${section}`] === true;
}

export function canManageTeamAccess(user) {
  return isAgencyOwner(user) ||
    isClientAdmin(user) ||
    (user?.role === 'office' && user?.crm_enabled === true && user?.perm_team_access === true);
}

export function canManageBusinessSettings(user) {
  return isAgencyOwner(user) || isClientAdmin(user);
}

export function firstAllowedAdminPath(user) {
  if (!user) return '/';
  if (user.role === 'technician') return '/admin/technician';
  if (isAgencyOwner(user) || isClientAdmin(user)) return '/admin';
  const match = CRM_SECTIONS.find(s => hasSectionAccess(user, s.key));
  return match?.path || '/';
}

export function accountLabel(user) {
  if (isAgencyOwner(user)) return 'Agency Owner';
  if (isClientAdmin(user)) return 'Client Admin';
  if (user?.role === 'technician') return 'Technician';
  if (user?.role === 'office' && user?.perm_team_access === true) return 'Office Manager';
  if (user?.role === 'office') return 'Office Staff';
  return 'No CRM Access';
}
