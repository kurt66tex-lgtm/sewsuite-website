import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, FileCode2, Globe2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

async function copyText(value) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

export default function SeoLaunchPackPanel({ control, update }) {
  const [pack, setPack] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await base44.functions.invoke('getSeoLaunchPack', {
        redirects: control?.seo_legacy_redirects || []
      });
      const data = res?.data || res || {};
      if (data.error) throw new Error(data.error);
      setPack(data);
    } catch (e) {
      setError(e.message || 'Unable to generate SEO Launch Pack.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { generate(); }, []);

  const redirects = control?.seo_legacy_redirects || [];
  const setRedirects = next => update('seo_legacy_redirects', next);

  const addRedirect = () => {
    setRedirects([...redirects, {
      id:'redirect-' + Date.now(),
      from_path:'',
      to_path:'',
      http_status:301,
      notes:'',
      active:true
    }]);
  };

  const patchRedirect = (idx, patch) => {
    const next = [...redirects];
    next[idx] = { ...next[idx], ...patch };
    setRedirects(next);
  };

  const removeRedirect = idx => setRedirects(redirects.filter((_, i) => i !== idx));

  const copy = async (value, label) => {
    try {
      await copyText(value);
      setNotice(label + ' copied.');
    } catch {
      setError('Clipboard access was not available.');
    }
  };

  const v = pack?.validation || {};
  const blockers = v.blockers || [];
  const warnings = v.warnings || [];

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Globe2 className="w-5 h-5 text-brand-accent mt-0.5" />
          <div>
            <h2 className="font-bold text-slate-900">SEO Launch Pack</h2>
            <p className="text-xs text-slate-500">Factory-generated sitemap, robots rules, index/noindex inventory, redirect map, and domain-cutover checklist.</p>
          </div>
        </div>
        <button onClick={generate} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate / Refresh
        </button>
      </div>

      <div className="p-5 space-y-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

        {pack && (
          <>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Canonical Base</div>
                <div className="mt-1 text-sm font-bold text-slate-900 break-all">{pack.canonical_base_url || 'Not configured'}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Indexable URLs</div>
                <div className="mt-1 text-xl font-black text-slate-900">{v.indexable_url_count ?? 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Noindex Pages</div>
                <div className="mt-1 text-xl font-black text-slate-900">{v.noindex_page_count ?? 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Migration Redirects</div>
                <div className="mt-1 text-xl font-black text-slate-900">{v.active_redirect_count ?? 0}</div>
              </div>
            </div>

            <div className={'rounded-lg border px-4 py-3 text-sm flex items-start gap-2 ' + (v.passed ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700')}>
              {v.passed ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <div>
                <div className="font-bold">{v.passed ? 'SEO Launch Pack validation passed' : 'SEO Launch Pack has blockers'}</div>
                {blockers.map((x, i) => <div key={i} className="mt-1">{x}</div>)}
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="font-bold mb-1">Warnings</div>
                {warnings.map((x, i) => <div key={i}>• {x}</div>)}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2"><FileCode2 className="w-4 h-4" /> sitemap.xml</div>
                  <button onClick={() => copy(pack.sitemap_xml, 'sitemap.xml')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><Clipboard className="w-3.5 h-3.5" /> Copy</button>
                </div>
                <pre className="p-3 text-[11px] leading-relaxed overflow-auto max-h-64 bg-slate-950 text-slate-100 whitespace-pre-wrap">{pack.sitemap_xml}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2"><FileCode2 className="w-4 h-4" /> robots.txt</div>
                  <button onClick={() => copy(pack.robots_txt, 'robots.txt')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><Clipboard className="w-3.5 h-3.5" /> Copy</button>
                </div>
                <pre className="p-3 text-[11px] leading-relaxed overflow-auto max-h-64 bg-slate-950 text-slate-100 whitespace-pre-wrap">{pack.robots_txt}</pre>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="px-4 py-3 bg-slate-50 border-b font-bold text-sm text-slate-900">Index / Noindex Inventory</div>
              <div className="p-4 grid lg:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">Indexable Sitemap URLs</div>
                  <div className="max-h-56 overflow-auto space-y-1">
                    {(pack.sitemap_entries || []).map(x => <div key={x.path} className="text-xs font-mono text-slate-700">{x.path}</div>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">Explicit Noindex Pages</div>
                  <div className="max-h-56 overflow-auto space-y-1">
                    {(pack.noindex_pages || []).map(x => <div key={x.type + ':' + x.path} className="text-xs"><span className="font-mono text-slate-700">{x.path}</span><span className="text-slate-400"> — {x.reason}</span></div>)}
                    {(pack.noindex_pages || []).length === 0 && <div className="text-xs text-slate-400">None.</div>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="rounded-lg border border-slate-200">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-900">Legacy URL Redirect Map</div>
              <div className="text-xs text-slate-500">Add old indexed paths before domain cutover. Permanent migrations should normally use 301/308 at the hosting or edge layer.</div>
            </div>
            <button onClick={addRedirect} className="inline-flex items-center gap-1 rounded-lg bg-brand-accent text-brand-dark px-3 py-1.5 text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Add Redirect</button>
          </div>
          <div className="p-4 space-y-2">
            {redirects.map((r, idx) => (
              <div key={r.id || idx} className="grid lg:grid-cols-[1fr_1fr_90px_1.2fr_70px_auto] gap-2 items-center">
                <input value={r.from_path || ''} onChange={e => patchRedirect(idx, { from_path:e.target.value })} placeholder="/old-page" className="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" />
                <input value={r.to_path || ''} onChange={e => patchRedirect(idx, { to_path:e.target.value })} placeholder="/new-page" className="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" />
                <select value={r.http_status || 301} onChange={e => patchRedirect(idx, { http_status:Number(e.target.value) })} className="border border-slate-300 rounded px-2 py-1.5 text-sm">
                  {[301,308,302,307].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <input value={r.notes || ''} onChange={e => patchRedirect(idx, { notes:e.target.value })} placeholder="Migration note" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.active !== false} onChange={e => patchRedirect(idx, { active:e.target.checked })} /> Active</label>
                <button onClick={() => removeRedirect(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded" aria-label="Remove redirect"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {redirects.length === 0 && <div className="text-sm text-slate-400">No legacy redirects entered yet.</div>}
          </div>
        </div>

        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1">SEO / Domain Migration Notes</span>
          <textarea rows={3} value={control?.seo_launch_notes || ''} onChange={e => update('seo_launch_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Existing site notes, Search Console ownership, special redirects, domain-provider notes, etc." />
        </label>

        {pack && (
          <div className="rounded-lg border border-slate-200">
            <div className="px-4 py-3 bg-slate-50 border-b font-bold text-sm text-slate-900">Domain Cutover Checklist</div>
            <div className="p-4 space-y-2">
              {(pack.checklist || []).map((x, i) => <div key={i} className="flex gap-2 text-sm text-slate-700"><span className="font-bold text-slate-400">{i + 1}.</span><span>{x}</span></div>)}
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400">Save Agency Controls after editing redirects or migration notes. Generate / Refresh validates the current unsaved redirect rows too.</div>
      </div>
    </section>
  );
}
