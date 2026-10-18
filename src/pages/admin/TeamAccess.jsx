import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Edit3, X, Loader2, Check, LockKeyhole, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner, isClientAdmin, canManageTeamAccess } from '@/lib/accessControl';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { isProjectQuoteModel } from '@/lib/businessModel';

const SECTIONS = [
  ['perm_dashboard', 'Dashboard'],
  ['perm_inbox', 'Inbox'],
  ['perm_schedule', 'Schedule'],
  ['perm_jobs', 'Jobs'],
  ['perm_customers', 'Customers'],
  ['perm_reviews', 'Reviews'],
  ['perm_reports', 'Reports']
];

function typeForUser(u) {
  if (u.is_agency_owner) return 'agency_owner';
  if (u.is_client_admin) return 'client_admin';
  if (u.role === 'technician') return 'technician';
  if (u.role === 'office') return 'office';
  return 'none';
}

function permissionSummary(u, sections = SECTIONS, isProjectQuote = false) {
  if (u.is_agency_owner) return 'Full agency access';
  if (u.is_client_admin) return 'All CRM sections + team access';
  if (u.role === 'technician') return isProjectQuote ? 'Legacy field-service technician access' : 'Assigned technician work only';
  if (u.role !== 'office') return 'No CRM access';
  const labels = sections.filter(([key]) => u[key]).map(([, label]) => label);
  if (u.perm_team_access) labels.push('Team & Access');
  return labels.length ? labels.join(', ') : 'No sections assigned';
}

export default function TeamAccess() {
  const { user } = useAuth();
  const { settings } = useBusinessSettings();
  const isProjectQuote = isProjectQuoteModel(settings);
  const sections = isProjectQuote
    ? SECTIONS.filter(([key]) => key !== 'perm_schedule').map(([key, label]) => [key, key === 'perm_jobs' ? 'Projects' : label])
    : SECTIONS;
  const owner = isAgencyOwner(user);
  const clientAdmin = isClientAdmin(user);
  const teamManager = canManageTeamAccess(user);
  const [data, setData] = useState({ users: [], technicians: [], audits: [], pending_invites: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [staffFilter, setStaffFilter] = useState('active');
  const [techEditor, setTechEditor] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageTeamAccess', { action: 'list' });
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e) {
      setError(e.message || 'Unable to load team access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const isInvite = !editor.user_id;
      const payload = {
        action: isInvite ? 'invite' : 'update',
        user_id: editor.user_id,
        email: editor.email,
        access_type: editor.access_type,
        technician_id: editor.technician_id || null,
        permissions: {
          ...Object.fromEntries(SECTIONS.map(([key]) => [key, !!editor[key]])),
          perm_team_access: !!editor.perm_team_access
        },
        app_origin: window.location.origin
      };
      const res = await base44.functions.invoke('manageTeamAccess', payload);
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      if (d.pending && d.register_path) {
        const link = window.location.origin + d.register_path;
        setNotice(d.email_invite_sent
          ? `Invitation sent to ${editor.email}. Access will apply automatically when they register or sign in. Registration link: ${link}`
          : `Access is prepared for ${editor.email}. Send them this registration link: ${link}`
        );
      } else {
        setNotice('Access updated successfully.');
      }
      setEditor(null);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to save access');
    } finally {
      setBusy(false);
    }
  };

  const suspendUser = async (u) => {
    if (u.is_agency_owner || !window.confirm('Suspend CRM access for ' + u.email + '? Their account will remain on record, and access can be restored later.')) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('manageTeamAccess', { action:'update', user_id:u.id, access_type:'none', permissions:{} });
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      setNotice('CRM access suspended for ' + u.email + '.');
      await load();
    } catch(e) { setError(e.message || 'Suspension failed'); }
    finally { setBusy(false); }
  };

  const startInvite = () => setEditor({
    email: '',
    access_type: owner ? 'client_admin' : 'office',
    technician_id: '',
    perm_dashboard: true,
    perm_inbox: true,
    perm_schedule: true,
    perm_jobs: true,
    perm_customers: true,
    perm_reviews: true,
    perm_reports: true,
    perm_team_access: false
  });

  const startEdit = (u) => {
    setEditor({
      user_id: u.id,
      email: u.email,
      access_type: typeForUser(u),
      technician_id: u.technician_id || '',
      ...Object.fromEntries(SECTIONS.map(([key]) => [key, !!u[key]])),
      perm_team_access: !!u.perm_team_access
    });
  };

  const saveTechnician = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageTeamAccess', {
        action: 'upsert_technician',
        technician_id: techEditor.id || null,
        first_name: techEditor.first_name,
        last_name: techEditor.last_name,
        phone: techEditor.phone,
        email: techEditor.email,
        active: techEditor.active !== false
      });
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      setTechEditor(null);
      setNotice('Technician profile saved.');
      await load();
    } catch (e) {
      setError(e.message || 'Unable to save technician');
    } finally {
      setBusy(false);
    }
  };

  const resendInvite = async (inviteId, email) => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageTeamAccess', {
        action: 'resend_invite',
        invite_id: inviteId,
        app_origin: window.location.origin
      });
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      setNotice(`Invitation email sent to ${email}.`);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to resend invitation email');
    } finally {
      setBusy(false);
    }
  };

  const cancelInvite = async (inviteId) => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageTeamAccess', { action: 'cancel_invite', invite_id: inviteId });
      const d = res.data || res;
      if (d.error) throw new Error(d.error);
      setNotice('Pending invite canceled.');
      await load();
    } catch (e) {
      setError(e.message || 'Unable to cancel invite');
    } finally {
      setBusy(false);
    }
  };

  if (!teamManager) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Team & Access</h1>
          <p className="text-sm text-slate-500 mt-1">
            {owner ? 'Agency Owner → Client Admin → staff permissions.' : clientAdmin ? (isProjectQuote ? 'Manage client staff access and project-workflow permissions.' : 'Manage client staff access and technician profiles.') : 'Manage staff access delegated by the Client Admin.'}
          </p>
        </div>
        <button onClick={startInvite} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg">
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className={`grid gap-4 mb-6 ${owner ? 'md:grid-cols-3' : clientAdmin ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {owner && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900"><LockKeyhole className="w-5 h-5 text-brand-accent" /> Agency Owner</div>
            <p className="text-sm text-slate-500 mt-2">You retain master control of the app, security, integrations and client-admin assignment.</p>
          </div>
        )}
        {(owner || clientAdmin) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="w-5 h-5 text-brand-accent" /> Client Admin</div>
            <p className="text-sm text-slate-500 mt-2">Business administrator with all CRM sections, business settings, and staff access controls.</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 font-bold text-slate-900"><Check className="w-5 h-5 text-brand-accent" /> {clientAdmin || owner ? 'Staff' : 'Office Manager'}</div>
          <p className="text-sm text-slate-500 mt-2">
            {clientAdmin || owner
              ? (isProjectQuote ? 'Staff access is assigned section-by-section. Team & Access can optionally be delegated to an Office Manager.' : 'Office access is assigned section-by-section. Team & Access can optionally be delegated to an Office Manager. Technicians remain limited to assigned work.')
              : (isProjectQuote ? 'You can manage Office Staff access. Client Admin access is managed outside this client account.' : 'You can manage Office Staff and Technician access. Client Admin access is managed outside this client account.')}
          </p>
        </div>
      </div>

      {error && <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {notice && <div className="mb-4 border border-green-200 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm break-words">{notice}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">CRM Users</h2>
          <p className="text-xs text-slate-500">
            {owner ? 'Agency Owner controls Client Admin assignment.' : clientAdmin ? (isProjectQuote ? 'You can manage staff. Client Admin assignment is managed outside the client account.' : 'You can manage staff and technicians. Client Admin assignment is managed outside the client account.') : (isProjectQuote ? 'Office Managers can manage staff only.' : 'Office Managers can manage staff and technicians only.')}
          </p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <>
          <div className="px-4 py-2 flex items-center gap-2 text-sm"><label htmlFor="staff-status-filter">Status</label><select id="staff-status-filter" className="rounded border border-slate-300 px-2 py-1" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}><option value="active">Active</option><option value="suspended">Suspended / No CRM Access</option><option value="all">All</option></select><span className="text-xs text-slate-500">Suspension retains historical records. Permanent deletion requires separate verified account removal.</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Account</th>
                  <th className="text-left px-4 py-3">Access</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.filter(u => staffFilter === 'all' || (staffFilter === 'active' ? typeForUser(u) !== 'none' : typeForUser(u) === 'none')).map(u => {
                  const type = typeForUser(u);
                  const editable = type !== 'agency_owner' && (owner || type !== 'client_admin');
                  return (
                    <tr key={u.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{u.full_name || u.email}</div>
                        {u.full_name && <div className="text-xs text-slate-500">{u.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          type === 'agency_owner' ? 'bg-slate-900 text-white' :
                          type === 'client_admin' ? 'bg-yellow-100 text-yellow-900' :
                          type === 'technician' ? 'bg-blue-100 text-blue-700' :
                          type === 'office' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {type === 'agency_owner' ? 'Agency Owner' : type === 'client_admin' ? 'Client Admin' : type === 'technician' ? 'Technician' : type === 'office' && u.perm_team_access ? 'Office Manager' : type === 'office' ? 'Office Staff' : 'No CRM Access'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xl">{permissionSummary(u, sections, isProjectQuote)}</td>
                      <td className="px-4 py-3">
                        {editable && <div className="flex items-center gap-2"><button title="Edit or reactivate access" onClick={() => startEdit(u)} className="text-slate-400 hover:text-slate-900"><Edit3 className="w-4 h-4" /></button>{type !== 'none' && <button disabled={busy} title="Suspend CRM access" onClick={() => suspendUser(u)} className="text-xs text-amber-700 hover:underline disabled:opacity-50">Suspend</button>}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {!isProjectQuote && <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Technician Profiles</h2>
            <p className="text-xs text-slate-500">Create technician records here before assigning technician login access.</p>
          </div>
          <button onClick={() => setTechEditor({ first_name: '', last_name: '', phone: '', email: '', active: true })} className="text-sm font-bold bg-brand-accent text-brand-dark px-3 py-1.5 rounded-lg">Add Technician</button>
        </div>
        <div className="divide-y divide-slate-100">
          {data.technicians?.length ? data.technicians.map(t => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-slate-900">{t.first_name} {t.last_name}</div>
                <div className="text-xs text-slate-500">{t.email || t.phone || 'No contact information'} · {t.active ? 'Active' : 'Inactive'}</div>
              </div>
              <button onClick={() => setTechEditor(t)} className="text-slate-400 hover:text-slate-900"><Edit3 className="w-4 h-4" /></button>
            </div>
          )) : <div className="px-4 py-5 text-sm text-slate-500">No live technician profiles yet.</div>}
        </div>
      </div>}

      {data.pending_invites?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Pending Invitations</h2>
            <p className="text-xs text-slate-500">Access activates automatically when the matching email registers and signs in.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.pending_invites.map(inv => {
              const registerUrl = window.location.origin + '/register?email=' + encodeURIComponent(inv.email) + '&returnTo=' + encodeURIComponent('/admin');
              return (
                <div key={inv.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{inv.email}</div>
                    <div className="text-xs text-slate-500">{inv.access_type === 'client_admin' ? 'Client Admin' : inv.access_type === 'technician' ? (isProjectQuote ? 'Legacy Technician' : 'Technician') : 'Office Staff'}</div>
                    <a href={registerUrl} className="text-xs text-blue-600 hover:underline break-all">{registerUrl}</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={busy}
                      onClick={() => resendInvite(inv.id, inv.email)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Resend Email
                    </button>
                    <button disabled={busy} onClick={() => cancelInvite(inv.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">Cancel</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.audits?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Access Changes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.audits.slice(0, 10).map(a => (
              <div key={a.id} className="px-4 py-2.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{a.actor_email}</span> — {a.action} — {a.target_email}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isProjectQuote && techEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setTechEditor(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">{techEditor.id ? 'Edit Technician' : 'Add Technician'}</h3>
              <button disabled={busy} onClick={() => setTechEditor(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-3">
              <input value={techEditor.first_name || ''} onChange={e => setTechEditor({ ...techEditor, first_name: e.target.value })} placeholder="First name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input value={techEditor.last_name || ''} onChange={e => setTechEditor({ ...techEditor, last_name: e.target.value })} placeholder="Last name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input value={techEditor.phone || ''} onChange={e => setTechEditor({ ...techEditor, phone: e.target.value })} placeholder="Phone" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="email" value={techEditor.email || ''} onChange={e => setTechEditor({ ...techEditor, email: e.target.value })} placeholder="Email" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={techEditor.active !== false} onChange={e => setTechEditor({ ...techEditor, active: e.target.checked })} />
                Active technician
              </label>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button disabled={busy} onClick={() => setTechEditor(null)} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
              <button disabled={busy || !techEditor.first_name?.trim()} onClick={saveTechnician} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? 'Saving…' : 'Save Technician'}</button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setEditor(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">{editor.user_id ? 'Edit CRM Access' : 'Invite CRM User'}</h3>
                <p className="text-xs text-slate-500">Assign only the sections this person needs.</p>
              </div>
              <button disabled={busy} onClick={() => setEditor(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-5">
              {!editor.user_id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={editor.email} onChange={e => setEditor({ ...editor, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="name@example.com" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Account Type</label>
                <select
                  value={editor.access_type}
                  onChange={e => setEditor({ ...editor, access_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  {owner && <option value="client_admin">Client Admin</option>}
                  <option value="office">Office Staff</option>
                  {!isProjectQuote && <option value="technician">Technician</option>}
                  {editor.user_id && <option value="none">No CRM Access</option>}
                </select>
              </div>

              {editor.access_type === 'client_admin' && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
                  {isProjectQuote ? 'Client Admin receives all normal CRM sections and can manage staff access. Client Admin assignment is controlled by the agency.' : 'Client Admin receives all normal CRM sections and can manage Office/Technician access. Client Admin assignment is controlled by the agency.'}
                </div>
              )}

              {editor.access_type === 'office' && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2">CRM Sections</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {sections.map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 cursor-pointer">
                        <input type="checkbox" checked={!!editor[key]} onChange={e => setEditor({ ...editor, [key]: e.target.checked })} />
                        <span className="text-sm font-medium text-slate-800">{label}</span>
                      </label>
                    ))}
                  </div>
                  {(owner || clientAdmin) && (
                    <label className="mt-3 flex items-start gap-2 border border-yellow-200 bg-yellow-50 rounded-lg px-3 py-2.5 cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={!!editor.perm_team_access} onChange={e => setEditor({ ...editor, perm_team_access: e.target.checked })} />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">Team & Access — Office Manager</span>
                        <span className="block text-xs text-slate-600 mt-0.5">{isProjectQuote ? 'Can invite and manage Office Staff. Cannot assign or modify the Client Admin.' : 'Can invite and manage Office Staff and Technicians. Cannot assign or modify the Client Admin.'}</span>
                      </span>
                    </label>
                  )}
                </div>
              )}

              {!isProjectQuote && editor.access_type === 'technician' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Link to Technician</label>
                  <select value={editor.technician_id || ''} onChange={e => setEditor({ ...editor, technician_id: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="">Select technician…</option>
                    {data.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button disabled={busy} onClick={() => setEditor(null)} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
              <button disabled={busy || (!editor.user_id && !editor.email) || (editor.access_type === 'technician' && !editor.technician_id)} onClick={save} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50">
                {busy ? 'Saving…' : editor.user_id ? 'Save Access' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
