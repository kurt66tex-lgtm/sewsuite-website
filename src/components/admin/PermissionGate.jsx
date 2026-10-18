import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasSectionAccess, firstAllowedAdminPath, canManageTeamAccess, canManageBusinessSettings, isAgencyOwner } from '@/lib/accessControl';

export default function PermissionGate({ permission, children }) {
  const { user } = useAuth();

  let allowed = false;
  if (permission === 'team_access') allowed = canManageTeamAccess(user);
  else if (permission === 'business_settings') allowed = canManageBusinessSettings(user);
  else if (permission === 'agency_controls') allowed = isAgencyOwner(user);
  else if (permission === 'agency_settings') allowed = isAgencyOwner(user);
  else allowed = hasSectionAccess(user, permission);

  if (!allowed) return <Navigate to={firstAllowedAdminPath(user)} replace />;
  return children;
}
