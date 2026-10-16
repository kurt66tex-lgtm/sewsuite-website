import { useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function Field({ label, k, settings, update, type = 'text', hint, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={settings[k] ?? ''}
        onChange={(e) => update(k, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, k, settings, update, rows = 3, hint, placeholder }) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        value={settings[k] ?? ''}
        onChange={(e) => update(k, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, k, settings, update, hint, defaultTrue }) {
  const val = k in settings ? settings[k] : (defaultTrue ? true : false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={val ? 'true' : 'false'}
        onChange={(e) => update(k, e.target.value === 'true')}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="false">Off</option>
        <option value="true">On</option>
      </select>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function UploadField({ label, k, settings, update, hint }) {
  const inputRef = useRef(null);
  const uploadingRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadingRef.current.textContent = 'Uploading…';
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update(k, file_url);
      uploadingRef.current.textContent = '';
    } catch (err) {
      uploadingRef.current.textContent = 'Upload failed';
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {settings[k] && (
          <img src={settings[k]} alt={label} className="w-16 h-16 rounded-lg border border-slate-200 object-contain bg-slate-50 flex-shrink-0" />
        )}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 hover:border-brand-accent"
          >
            Upload / Replace
          </button>
          {settings[k] && (
            <input
              value={settings[k]}
              onChange={(e) => update(k, e.target.value)}
              className="w-full mt-2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-500 bg-slate-50"
              readOnly
            />
          )}
          <span ref={uploadingRef} className="text-xs text-brand-dark ml-2" />
        </div>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Card({ title, children, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-brand-dark mb-4">{title}</h2>
      {description && <p className="text-sm text-slate-500 mb-3 -mt-2">{description}</p>}
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}