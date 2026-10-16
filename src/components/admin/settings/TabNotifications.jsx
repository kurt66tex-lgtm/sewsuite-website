import { AlertTriangle } from 'lucide-react';

const NOTIFICATION_TYPES = [
  { key: 'new_lead', label: 'New Lead / Request', description: 'When a new lead or chat request comes in' },
  { key: 'safety_alert', label: 'Safety Alert', description: 'Gas leak, fire, or electrical danger detected' },
  { key: 'appointment_confirmation', label: 'Appointment Confirmation', description: 'When a visit is scheduled or confirmed' },
  { key: 'appointment_reminder', label: 'Appointment Reminder', description: 'Reminder before a scheduled visit' },
  { key: 'technician_dispatch', label: 'Technician Dispatch', description: 'When a technician is dispatched to a visit' },
  { key: 'part_received', label: 'Part Received', description: 'When an ordered part is marked as received' },
  { key: 'review_request', label: 'Review Request', description: 'When a review request is sent to a customer' },
];

export default function TabNotifications({ settings, update }) {
  const ns = settings.notification_settings || {};

  const updateNotif = (type, field, value) => {
    const current = settings.notification_settings || {};
    const typeSettings = current[type] || {};
    update('notification_settings', {
      ...current,
      [type]: { ...typeSettings, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Enable only channels that are actually configured. New-lead email can use the built-in email delivery path; SMS requires a connected provider.
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Notification</th>
              <th className="text-center px-4 py-3">Enabled</th>
              <th className="text-center px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">SMS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {NOTIFICATION_TYPES.map((n) => {
              const cfg = ns[n.key] || {};
              return (
                <tr key={n.key} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{n.label}</div>
                    <div className="text-xs text-slate-400">{n.description}</div>
                  </td>
                  <td className="text-center px-4 py-3">
                    <input type="checkbox" checked={cfg.enabled || false} onChange={(e) => updateNotif(n.key, 'enabled', e.target.checked)} className="rounded" />
                  </td>
                  <td className="text-center px-4 py-3">
                    <input type="checkbox" checked={cfg.email || false} onChange={(e) => updateNotif(n.key, 'email', e.target.checked)} className="rounded" />
                  </td>
                  <td className="text-center px-4 py-3">
                    <input type="checkbox" checked={cfg.sms || false} onChange={(e) => updateNotif(n.key, 'sms', e.target.checked)} className="rounded" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}