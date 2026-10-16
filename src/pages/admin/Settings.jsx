import { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { clearSettingsCache } from '@/hooks/useBusinessSettings';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner } from '@/lib/accessControl';
import TabBusiness from '@/components/admin/settings/TabBusiness';
import TabBranding from '@/components/admin/settings/TabBranding';
import TabServices from '@/components/admin/settings/TabServices';
import TabChat from '@/components/admin/settings/TabChat';
import TabReputationManagement from '@/components/admin/settings/TabReputationManagement';
import TabGoogleLocalServices from '@/components/admin/settings/TabGoogleLocalServices';
import TabSEO from '@/components/admin/settings/TabSEO';
import TabNotifications from '@/components/admin/settings/TabNotifications';
import TabTeam from '@/components/admin/settings/TabTeam';
import TabIntegrations from '@/components/admin/settings/TabIntegrations';
import TabModules from '@/components/admin/settings/TabModules';

const TABS = [
  { key: 'business', label: 'Business' },
  { key: 'branding', label: 'Website & Branding' },
  { key: 'services', label: 'Services & Coverage' },
  { key: 'chat', label: 'Chat Assistant' },
  { key: 'reputation', label: 'Reputation Management' },
  { key: 'glsa', label: 'Google Local Services' },
  { key: 'seo', label: 'SEO & Analytics' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'team', label: 'Team / Technicians' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'modules', label: 'Modules' },
];

export default function Settings() {
  const { user } = useAuth();
  const agencyOwner = isAgencyOwner(user);
  const [settings, setSettings] = useState(null);
  const [savedSettings, setSavedSettings] = useState(null);
  const [marketingAddOns, setMarketingAddOns] = useState(null);
  const [activeTab, setActiveTab] = useState('business');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const visibleTabs = agencyOwner
    ? TABS
    : TABS.filter(t => ['business', 'branding', 'services', 'chat', 'reputation', 'glsa', 'notifications'].includes(t.key));

  useEffect(() => {
    Promise.all([
      base44.functions.invoke('manageBusinessSettings', { action: 'get' }),
      base44.functions.invoke('getClientMarketingAddOns', {})
    ]).then(([settingsRes, addOnRes]) => {
      const settingsData = settingsRes?.data || settingsRes || {};
      const addOnData = addOnRes?.data || addOnRes || {};
      const loaded = settingsData.settings || {};
      setSettings(loaded);
      setSavedSettings(loaded);
      setMarketingAddOns(addOnData);
    }).catch((e) => {
      setError(e.message || 'Unable to load settings.');
      setSettings({});
      setSavedSettings({});
      setMarketingAddOns({ agency:{}, reputation:{}, glsa:{} });
    });
  }, []);

  const dirty = settings && savedSettings && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageBusinessSettings', {
        action: 'update',
        settings
      });
      const data = res?.data || res || {};
      if (data.error) throw new Error(data.error);
      const updated = data.settings || settings;
      setSettings(updated);
      clearSettingsCache();
      setSavedSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-8 text-slate-500">Loading settings…</div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Business Settings</h1>
          {!agencyOwner && <p className="text-sm text-slate-500 mt-1">Manage client business information, website branding, coverage, chat, reviews, and notifications.</p>}
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-5 py-2.5 rounded-lg disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Settings'}
          {dirty && !saved && <span className="w-2 h-2 rounded-full bg-red-500" />}
        </button>
      </div>

      {error && <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="flex flex-wrap gap-1 mb-5 border-b border-slate-200 pb-2">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === t.key ? 'bg-brand-dark text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'business' && <TabBusiness settings={settings} update={update} />}
      {activeTab === 'branding' && <TabBranding settings={settings} update={update} />}
      {activeTab === 'services' && <TabServices settings={settings} />}
      {activeTab === 'chat' && <TabChat settings={settings} update={update} />}
      {activeTab === 'reputation' && <TabReputationManagement settings={settings} update={update} addOn={marketingAddOns} />}
      {activeTab === 'glsa' && <TabGoogleLocalServices settings={settings} addOn={marketingAddOns} />}
      {activeTab === 'seo' && <TabSEO settings={settings} update={update} />}
      {activeTab === 'notifications' && <TabNotifications settings={settings} update={update} />}
      {activeTab === 'team' && <TabTeam />}
      {activeTab === 'integrations' && <TabIntegrations settings={settings} />}
      {activeTab === 'modules' && <TabModules settings={settings} update={update} />}
    </div>
  );
}