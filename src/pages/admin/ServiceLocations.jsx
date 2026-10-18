import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ServiceLocations() {
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceLocation.list('-created_date', 200),
      base44.entities.Customer.list('-created_date', 200)
    ]).then(([locs, custs]) => {
      setLocations(locs.filter(l => !l.archived_at && !l.is_test_data && l.active !== false));
      setCustomers(custs.filter(c => !c.is_test_data));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  const filtered = locations.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    const c = customerMap[l.customer_id];
    return (
      l.location_name?.toLowerCase().includes(s) ||
      l.location_type?.toLowerCase().includes(s) ||
      l.address_line_1?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s) ||
      l.zip?.includes(s) ||
      (c && `${c.first_name} ${c.last_name}`.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2"><MapPin className="w-6 h-6" /> Service Locations</h1>
          <p className="text-sm text-slate-500 mt-1">{locations.length} active location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search location, address, city, or customer…" className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-brand-accent focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No service locations found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Customer</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Location</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Address</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">City</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">ZIP</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => {
                const c = customerMap[l.customer_id];
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {c ? (
                        <Link to="/admin/customers" className="font-semibold text-brand-dark hover:text-brand-accent flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {c.first_name} {c.last_name}
                        </Link>
                      ) : <span className="text-slate-400">Unknown</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{l.location_name || (l.primary_location ? 'Primary Location' : 'Service Location')}</div>
                      <div className="text-xs text-slate-500">{l.location_type || '—'}{l.primary_location ? ' · Primary' : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{l.address_line_1}{l.address_line_2 ? `, ${l.address_line_2}` : ''}</td>
                    <td className="px-4 py-3 text-slate-700">{l.city}</td>
                    <td className="px-4 py-3 text-slate-700">{l.zip}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{l.location_notes || l.gate_access_instructions || l.parking_instructions || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}