import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Wrench, Search, X, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isModelSerialSuspicious } from '@/lib/crmUtils';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function Appliances() {
  const { settings } = useBusinessSettings();
  const [appliances, setAppliances] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.ApplianceUnit.filter({ active: true }, '-created_date', 200),
      base44.entities.Customer.list('-created_date', 200)
    ]).then(([apps, custs]) => {
      setAppliances(apps.filter(a => !a.is_test_data));
      setCustomers(custs.filter(c => !c.is_test_data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (settings?.industry_module && settings.industry_module !== 'appliance_repair') {
    return <Navigate to="/admin/customers" replace />;
  }

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  const filtered = appliances.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    const c = customerMap[a.customer_id];
    return (
      a.appliance_type?.toLowerCase().includes(s) ||
      a.brand?.toLowerCase().includes(s) ||
      a.model_number?.toLowerCase().includes(s) ||
      (c && `${c.first_name} ${c.last_name}`.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2"><Wrench className="w-6 h-6" /> Appliances</h1>
          <p className="text-sm text-slate-500 mt-1">{appliances.length} registered appliance{appliances.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search type, brand, model, or customer…" className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-80 focus:ring-2 focus:ring-brand-accent focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appliances found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const c = customerMap[a.customer_id];
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-accent hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-brand-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-dark text-sm">{a.appliance_type}</div>
                    {a.brand && <div className="text-sm text-slate-600">{a.brand}</div>}
                    {a.model_number && (
                      <div className={`text-xs font-mono mt-0.5 ${isModelSerialSuspicious(a.model_number) ? 'text-red-600' : 'text-slate-500'}`}>
                        Model: {a.model_number}
                        {isModelSerialSuspicious(a.model_number) && <span className="ml-1 text-red-500 font-semibold">⚠ Check model number</span>}
                      </div>
                    )}
                    {a.serial_number && (
                      <div className={`text-xs font-mono ${isModelSerialSuspicious(a.serial_number) ? 'text-red-600' : 'text-slate-500'}`}>
                        Serial: {a.serial_number}
                        {isModelSerialSuspicious(a.serial_number) && <span className="ml-1 text-red-500 font-semibold">⚠ Check serial number</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {a.gas_or_electric && a.gas_or_electric !== 'N/A' && (
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${a.gas_or_electric === 'Gas' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{a.gas_or_electric}</span>
                  )}
                  {a.built_in && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Built-in</span>}
                  {a.approximate_age && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{a.approximate_age}</span>}
                </div>
                {c && (
                  <Link to="/admin/customers" className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:text-brand-accent border-t border-slate-100 pt-2">
                    <User className="w-3 h-3 text-slate-400" /> {c.first_name} {c.last_name}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}