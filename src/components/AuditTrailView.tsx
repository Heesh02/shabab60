import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  FileText,
  Filter
} from 'lucide-react';
import { AuditLog } from '../types';
import { translations, Language } from '../utils/i18n';

interface AuditTrailViewProps {
  lang: Language;
  logs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  lang,
  logs
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchP = (log.participant_name || '').toLowerCase().includes(q);
      const matchD = (log.details || '').toLowerCase().includes(q);
      const matchU = (log.performed_by || '').toLowerCase().includes(q);
      return matchP || matchD || matchU;
    }
    return true;
  });

  return (
    <div id="audit-trail-container" className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-stone-800" />
            <span>{t.nav_audit_log}</span>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
              {logs.length} {lang === 'ar' ? 'عملية موثقة' : 'events'}
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'ar' ? 'سجل كامل وغير قابل للتعديل لجميع عمليات المسح والخروج والعودة وتعديل الدرجات' : 'Complete immutable audit record of all check-ins, exits, returns, and manual overrides'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
        >
          <option value="all">{lang === 'ar' ? 'كل العمليات' : 'All Actions'}</option>
          <option value="CHECK_IN">CHECK_IN</option>
          <option value="TEMPORARY_EXIT">TEMPORARY_EXIT</option>
          <option value="RETURN">RETURN</option>
          <option value="SCORE_OVERRIDE">SCORE_OVERRIDE</option>
          <option value="EVENT_COMPLETED">EVENT_COMPLETED</option>
          <option value="CLEAR_DATA">CLEAR_DATA</option>
          <option value="RESET_DATA">RESET_DATA</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase">
              <th className="py-3 px-4">{lang === 'ar' ? 'الوقت' : 'Timestamp'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'العملية' : 'Action'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'المشارك' : 'Participant'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'بواسطة' : 'Performed By'}</th>
              <th className="py-3 px-4 text-right">{lang === 'ar' ? 'الدرجة' : 'Score Change'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {filtered.map(log => {
              const isOverride = log.action === 'SCORE_OVERRIDE';
              const isExit = log.action === 'TEMPORARY_EXIT' || log.action === 'EXIT';
              const isReturn = log.action === 'RETURN';
              const isCheckIn = log.action === 'CHECK_IN';
              const isClear = log.action === 'CLEAR_DATA';
              const isReset = log.action === 'RESET_DATA';

              return (
                <tr key={log.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-mono text-stone-600">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      isCheckIn ? 'bg-emerald-100 text-emerald-800' :
                      isExit ? 'bg-amber-100 text-amber-900' :
                      isReturn ? 'bg-sky-100 text-sky-900' :
                      isOverride ? 'bg-purple-100 text-purple-900' :
                      isClear ? 'bg-rose-100 text-rose-900' :
                      isReset ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {log.participant_name || '--'}
                  </td>
                  <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                    {lang === 'ar' && log.details_ar ? log.details_ar : log.details}
                  </td>
                  <td className="py-3 px-4 text-stone-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{log.performed_by}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {log.previous_score !== undefined && log.new_score !== undefined ? (
                      <span className="text-xs">
                        <span className="text-stone-400 line-through mr-1">{log.previous_score}</span>
                        <span className="font-bold text-stone-900">→ {log.new_score}</span>
                      </span>
                    ) : log.new_score !== undefined ? (
                      <span className="font-bold text-stone-900">{log.new_score}</span>
                    ) : (
                      <span className="text-stone-300">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
