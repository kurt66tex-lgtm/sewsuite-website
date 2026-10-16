import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, ChevronUp, ChevronDown, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

async function catalog(action, payload = {}) {
  const res = await base44.functions.invoke('manageBusinessCatalog', { action, ...payload });
  const data = res?.data || res || {};
  if (data.error) throw new Error(data.error);
  return data;
}

const ANSWER_TYPES = [
  ['text', 'Text'],
  ['choice', 'Choice'],
  ['yes_no', 'Yes / No'],
  ['number', 'Number'],
  ['photo', 'Photo Request']
];

const emptyQuestion = {
  service_type_id: '',
  question_key: '',
  question_text: '',
  answer_type: 'text',
  options: [],
  required: false,
  active: true,
  display_order: 99,
  ai_guidance: '',
  photo_request_text: ''
};

export default function IntakeQuestionsManager() {
  const [services, setServices] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await catalog('list');
      setServices(data.services || []);
      setQuestions(data.intake_questions || []);
    } catch (e) {
      setError(e.message || 'Unable to load intake questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.id, s.name])), [services]);

  const ordered = useMemo(() => [...questions].sort((a, b) => {
    const sa = serviceMap[a.service_type_id] || 'General';
    const sb = serviceMap[b.service_type_id] || 'General';
    return sa.localeCompare(sb) || (Number(a.display_order || 99) - Number(b.display_order || 99)) || String(a.question_text || '').localeCompare(String(b.question_text || ''));
  }), [questions, serviceMap]);

  const toggle = async (q) => {
    await catalog('toggle_intake_question', { id: q.id });
    await load();
  };

  const move = async (q, direction) => {
    const sameService = ordered.filter(item => (item.service_type_id || '') === (q.service_type_id || ''));
    const index = sameService.findIndex(item => item.id === q.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sameService.length) return;
    const next = [...sameService];
    [next[index], next[target]] = [next[target], next[index]];
    await catalog('reorder_intake_questions', { ids: next.map(item => item.id) });
    await load();
  };

  const save = async (question) => {
    setError('');
    try {
      await catalog('save_intake_question', { question });
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to save intake question.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-dark">Service Intake Questions</h2>
          <p className="text-xs text-slate-500">Reusable qualification questions used by the request form and AI assistant. General questions can apply to every service.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyQuestion })} className="inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-sm font-bold px-3 py-1.5 rounded-lg">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {error && <div className="mx-4 mt-3 border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

      {loading ? <div className="p-4 text-slate-400">Loading…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Service</th>
                <th className="text-left px-4 py-2">Question</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Required</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordered.map(q => {
                const sameService = ordered.filter(item => (item.service_type_id || '') === (q.service_type_id || ''));
                const idx = sameService.findIndex(item => item.id === q.id);
                return (
                  <tr key={q.id} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-2 text-xs font-semibold text-slate-600">{serviceMap[q.service_type_id] || 'General'}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-900">{q.question_text}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{q.question_key}</div>
                    </td>
                    <td className="px-4 py-2 text-xs">{ANSWER_TYPES.find(([v]) => v === q.answer_type)?.[1] || q.answer_type}</td>
                    <td className="px-4 py-2 text-xs">{q.required ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => toggle(q)} className={`text-xs px-2 py-0.5 rounded ${q.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {q.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-0.5">
                        <button onClick={() => move(q, -1)} disabled={idx <= 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => move(q, 1)} disabled={idx < 0 || idx >= sameService.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-2"><button onClick={() => setEditing(q)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
              {ordered.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No independent intake questions yet. Existing legacy service questions continue to work as a fallback.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && <QuestionEditor question={editing} services={services} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function QuestionEditor({ question, services, onSave, onClose }) {
  const [form, setForm] = useState({
    ...emptyQuestion,
    ...question,
    service_type_id: question.service_type_id || ''
  });
  const [optionsText, setOptionsText] = useState((question.options || []).join('\n'));

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-dark">{question.id ? 'Edit Intake Question' : 'Add Intake Question'}</h3>
            <p className="text-xs text-slate-500 mt-1">Keep questions useful and short. The AI should ask only what is relevant, not run every customer through a long questionnaire.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Applies To</label>
            <select value={form.service_type_id} onChange={e => update('service_type_id', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">General — all services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Answer Type</label>
            <select value={form.answer_type} onChange={e => update('answer_type', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {ANSWER_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Question *</label>
          <input value={form.question_text || ''} onChange={e => update('question_text', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="What type of fixture is affected?" autoFocus />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Question Key</label>
          <input value={form.question_key || ''} onChange={e => update('question_key', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="fixture_type" />
          <p className="text-xs text-slate-400 mt-1">Stable key saved in the lead's structured intake answers. If blank, one is generated from the question.</p>
        </div>

        {form.answer_type === 'choice' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Choices</label>
            <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} rows={5} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder={"Kitchen faucet\nBathroom faucet\nShower / tub\nOutdoor faucet"} />
            <p className="text-xs text-slate-400 mt-1">One choice per line.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">AI Guidance</label>
          <textarea value={form.ai_guidance || ''} onChange={e => update('ai_guidance', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Example: If yes, consider this urgent and ask whether active damage is occurring." />
        </div>

        {form.answer_type === 'photo' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Photo Request Text</label>
            <textarea value={form.photo_request_text || ''} onChange={e => update('photo_request_text', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="If you can, upload a clear photo of the equipment and its data label." />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.required} onChange={e => update('required', e.target.checked)} />
          Required on the public request form
        </label>

        <div className="flex gap-2 border-t pt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button
            onClick={() => onSave({
              ...form,
              options: form.answer_type === 'choice' ? optionsText.split('\n').map(v => v.trim()).filter(Boolean) : []
            })}
            disabled={!form.question_text?.trim()}
            className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
