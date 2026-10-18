import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Package, Star, Calendar, Phone, CheckCircle2 } from 'lucide-react';

const TYPE_CONFIG = {
  SAFETY_FLAG: { label: 'SAFETY FLAG', cls: 'bg-red-50 border-red-300 text-red-800', icon: AlertTriangle },
  NEW_REQUEST: { label: 'NEW REQUEST', cls: 'bg-blue-50 border-blue-300 text-blue-800', icon: Phone },
  WAITING_CUSTOMER: { label: 'WAITING ON CUSTOMER', cls: 'bg-amber-50 border-amber-300 text-amber-800', icon: Clock },
  UNSCHEDULED: { label: 'UNSCHEDULED', cls: 'bg-orange-50 border-orange-300 text-orange-800', icon: Calendar },
  PARTS_READY: { label: 'PARTS READY', cls: 'bg-green-50 border-green-300 text-green-800', icon: CheckCircle2 },
  PART_BACKORDERED: { label: 'PART BACKORDERED', cls: 'bg-red-50 border-red-300 text-red-800', icon: Package },
  REVIEW_DUE: { label: 'REVIEW DUE', cls: 'bg-purple-50 border-purple-300 text-purple-800', icon: Star },
  OVERDUE_FOLLOWUP: { label: 'OVERDUE FOLLOW-UP', cls: 'bg-amber-50 border-amber-300 text-amber-800', icon: Clock },
  FOLLOW_UP_DUE: { label: 'FOLLOW-UP DUE', cls: 'bg-yellow-50 border-yellow-300 text-yellow-800', icon: Clock },
};

export default function ActionQueue({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-dark mb-1">Action Queue</h2>
        <p className="text-sm text-slate-400">No actions pending — you're all caught up.</p>
      </div>
    );
  }

  const priorityOrder = { high: 0, medium: 1, normal: 2 };
  const sorted = [...items].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-brand-dark">Action Queue</h2>
        <span className="text-xs text-slate-500">{items.length} need attention</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {sorted.map((item) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.UNSCHEDULED;
          return (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
              <div className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${cfg.cls} flex items-center gap-1 whitespace-nowrap`}>
                <cfg.icon className="w-3 h-3" /> {cfg.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {item.customer}
                  {item.jobNumber && (
                    <span className="font-mono text-xs text-slate-500 ml-2">{item.jobNumber}</span>
                  )}
                  {item.isTestData && (
                    <span className="ml-1 text-[9px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-sans">TEST</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {[item.appliance, item.city].filter(Boolean).join(' · ')}
                </div>
                <div className="text-xs text-slate-400">{item.waitTime}</div>
              </div>
              <Link
                to={item.actionTo}
                className="flex-shrink-0 bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-accent-dark whitespace-nowrap"
              >
                {item.actionLabel}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}