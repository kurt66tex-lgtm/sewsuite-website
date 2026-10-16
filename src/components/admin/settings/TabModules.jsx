import { Card, Field, Toggle } from './SettingsFields';

const INDUSTRIES = [
  ['generic_service', 'Generic Service Business'],
  ['appliance_repair', 'Appliance Repair'],
  ['plumbing', 'Plumbing'],
  ['hvac', 'HVAC'],
  ['electrical', 'Electrical'],
  ['landscaping', 'Landscaping'],
  ['garage_door', 'Garage Door'],
  ['roofing', 'Roofing'],
  ['custom', 'Custom']
];

export default function TabModules({ settings, update }) {
  const enabled = Array.isArray(settings.enabled_modules) ? settings.enabled_modules.join(', ') : '';

  return (
    <div className="space-y-4">
      <Card title="Primary Industry Module" description="Agency-only structural settings. Choose the niche workflow this client app is built around.">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Industry Module</label>
          <select
            value={settings.industry_module || 'generic_service'}
            onChange={(e) => update('industry_module', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {INDUSTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">Changing this does not delete data. Niche-specific UI and workflows are enabled separately as the app is provisioned.</p>
        </div>
        <Toggle
          label="Core Asset Tracking"
          k="asset_tracking_enabled"
          settings={settings}
          update={update}
          hint="Use the generic EquipmentAsset layer for equipment/property records. Appliance Repair uses this alongside the appliance extension."
        />
      </Card>

      <Card title="Asset Terminology" description="Labels used by reusable Core screens and future niche adapters.">
        <Field label="Asset Label — Singular" k="asset_label_singular" settings={settings} update={update} placeholder="Equipment" />
        <Field label="Asset Label — Plural" k="asset_label_plural" settings={settings} update={update} placeholder="Equipment" />
        <Field label="Manufacturer Label" k="manufacturer_label" settings={settings} update={update} placeholder="Manufacturer / Brand" />
      </Card>

      <Card title="Module Activation Rules" description="The Master separates built-in niche adapters from optional custom modules.">
        <div className="sm:col-span-2 text-sm text-slate-600 space-y-2">
          <p><strong>Industry Module:</strong> activates the built-in niche adapter. Appliance Repair exposes appliance/brand workflows; other industries use the generic service routes unless a dedicated niche adapter is implemented.</p>
          <p><strong>Core Asset Tracking:</strong> enables generic EquipmentAsset intake and CRM behavior for non-appliance clients that need persistent equipment/property records.</p>
          <p><strong>Optional Module Keys:</strong> never create functionality by themselves. Add a key only after that module exists in code and has been tested for this client.</p>
          <p><strong>Deactivation:</strong> module flags hide/disable workflow behavior; they do not delete historical records.</p>
        </div>
      </Card>

      <Card title="Optional Reusable Modules" description="Agency-managed module keys for implemented client functionality. These are architectural flags, not customer-facing marketing copy.">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Enabled Module Keys</label>
          <input
            value={enabled}
            onChange={(e) => update('enabled_modules', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
            placeholder="photo_visualizer, project_estimator, customer_portal"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
          />
          <p className="text-xs text-slate-400 mt-1">Comma-separated. Examples: photo_visualizer, project_estimator, customer_portal. A module must still be implemented and configured before this flag has an effect.</p>
        </div>
      </Card>
    </div>
  );
}
