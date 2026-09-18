import React from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  ArrowRightLeft, 
  Calculator, 
  AlertCircle, 
  ShieldAlert,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { Attendance, AttendanceExit } from '../types';
import { translations, Language } from '../utils/i18n';
import { LiveTimer } from './LiveTimer';

interface AttendanceDetailModalProps {
  lang: Language;
  attendance: Attendance | null;
  onClose: () => void;
  onOpenOverride: (attendance: Attendance) => void;
  userRole: string;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  lang,
  attendance,
  onClose,
  onOpenOverride,
  userRole
}) => {
  const t = translations[lang];

  if (!attendance) return null;

  const exits: AttendanceExit[] = attendance.exits || [];
  const completedExits = exits.filter(e => e.status === 'COMPLETED');
  const openExit = exits.find(e => e.status === 'OPEN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="attendance-detail-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-stone-900 text-white p-5 border-b border-stone-800 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                {attendance.participant_number}
              </span>
              <span className="text-xs text-stone-400">
                {lang === 'ar' ? (attendance.team_name_ar || attendance.team_name) : attendance.team_name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {attendance.participant_name}
            </h2>
            <p className="text-xs text-stone-300">
              {lang === 'ar' ? (attendance.event_name_ar || attendance.event_name) : attendance.event_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Timing Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
              <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded ${
                attendance.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                attendance.status === 'TEMPORARILY_OUT' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'
              }`}>
                {attendance.status === 'PRESENT' ? t.status_present :
                 attendance.status === 'TEMPORARILY_OUT' ? t.status_temporarily_out : attendance.status}
              </span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">{t.arrival_time}</span>
              <span className="font-bold text-stone-900 text-sm mt-1 block">
                {attendance.arrival_time ? new Date(attendance.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
              </span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[11px] text-stone-500 uppercase font-semibold block">{t.base_score}</span>
              <span className="font-extrabold text-stone-900 text-base mt-0.5 block">
                {attendance.base_score} {t.points}
              </span>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 uppercase font-semibold block">{t.final_score}</span>
              <span className="font-extrabold text-amber-900 text-xl block">
                {attendance.final_score} <span className="text-xs font-normal">/{attendance.base_score}</span>
              </span>
            </div>
          </div>

          {/* Active Live Timer if currently outside */}
          {openExit && (
            <div className="p-4 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-700 animate-bounce" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900">{t.res_already_out}</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {t.exited_at} {new Date(openExit.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
              <LiveTimer exitTimeIso={openExit.exit_time} />
            </div>
          )}

          {/* Mathematical Scoring Calculation Breakdown (PRD Section 16 & 26) */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-amber-700" />
              {lang === 'ar' ? 'المعادلة الحسابية للدرجات والخصومات' : 'Scoring Deduction Formula Breakdown'}
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600 font-sans">{t.base_score}:</span>
                <span className="font-bold text-stone-900">{attendance.base_score} {t.points}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600 font-sans">{t.total_time_out}:</span>
                <span className="text-amber-900">{attendance.total_time_out_minutes} {t.minutes}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600 font-sans">{t.grace_period}:</span>
                <span className="text-emerald-700">{attendance.grace_period_minutes} {t.minutes}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600 font-sans">{t.deductible_time}:</span>
                <span className="text-stone-800">
                  MAX(0, {attendance.total_time_out_minutes} - {attendance.grace_period_minutes}) = {attendance.deductible_minutes} {t.minutes}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600 font-sans">{t.total_deduction} ({attendance.deductible_minutes}m × {attendance.deduction_rate}pts):</span>
                <span className="font-bold text-rose-700">-{attendance.total_deduction} {t.points}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold bg-amber-100/60 px-2 rounded">
                <span className="text-amber-950 font-sans">{t.final_score}:</span>
                <span className="text-amber-950">
                  {attendance.base_score} - {attendance.total_deduction} = {attendance.final_score} {t.points}
                </span>
              </div>
            </div>
          </div>

          {/* Temporary Exits History List (PRD Section 11 & 26) */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-3">
              <LogOut className="w-4 h-4 text-stone-700" />
              {lang === 'ar' ? 'سجل الخروج والعودة المؤقت' : 'Temporary Exits Log'}
            </h3>

            {exits.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-lg border border-stone-200">
                {lang === 'ar' ? 'لم يسجل أي خروج مؤقت لهذا المشارك أثناء الجلسة.' : 'No temporary exits recorded for this attendee.'}
              </p>
            ) : (
              <div className="space-y-2">
                {exits.map((exit, idx) => (
                  <div 
                    key={exit.id} 
                    className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-800">
                        {lang === 'ar' ? `خروج مؤقت رقم ${idx + 1}` : `Exit #${idx + 1}`}
                      </span>
                      <div className="text-stone-500 mt-0.5 flex items-center gap-2">
                        <span>{new Date(exit.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>→</span>
                        <span>{exit.return_time ? new Date(exit.return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (lang === 'ar' ? 'بالخارج حالياً' : 'Outside now')}</span>
                        {exit.auto_closed && (
                          <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-semibold">
                            {lang === 'ar' ? 'أغلق عند نهاية الجلسة' : 'Auto-closed at end'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {exit.status === 'COMPLETED' ? (
                        <span className="font-bold font-mono text-stone-800">
                          {exit.duration_minutes} {t.minutes}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          {lang === 'ar' ? 'مفتوح' : 'OPEN'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail Timeline (PRD Section 27: Attendance Timeline) */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-stone-700" />
              {lang === 'ar' ? 'المخطط الزمني للأحداث (Timeline)' : 'Attendance Audit Timeline'}
            </h3>

            <div className="border-l-2 border-stone-200 pl-4 ml-2 space-y-4 text-xs">
              {/* Check in node */}
              {attendance.arrival_time && (
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"></div>
                  <span className="font-bold text-stone-900">
                    {new Date(attendance.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-stone-600 mt-0.5 font-medium flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'تم تسجيل الحضور بالداخل' : 'Checked In'}
                  </p>
                </div>
              )}

              {/* Exits nodes */}
              {exits.map((e, idx) => (
                <React.Fragment key={e.id}>
                  {/* Exit */}
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white"></div>
                    <span className="font-bold text-stone-900">
                      {new Date(e.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-amber-800 mt-0.5 font-medium flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5" />
                      {lang === 'ar' ? `← خروج مؤقت #${idx + 1}` : `← Temporary Exit #${idx + 1}`}
                    </p>
                  </div>

                  {/* Return if completed */}
                  {e.return_time && (
                    <div className="relative">
                      <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                      <span className="font-bold text-stone-900">
                        {new Date(e.return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-emerald-800 mt-0.5 font-medium flex items-center gap-1">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {lang === 'ar' ? `→ عاد بعد ${e.duration_minutes} دقيقة` : `→ Returned after ${e.duration_minutes} min`}
                      </p>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Final status */}
              {attendance.status === 'COMPLETED' && (
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-stone-700 border-2 border-white"></div>
                  <span className="font-bold text-stone-700">
                    {attendance.updated_at ? new Date(attendance.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                  <p className="text-stone-600 mt-0.5 font-medium">
                    ✓ {lang === 'ar' ? 'اكتملت الجلسة' : 'Event Completed'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Override Info Section (PRD Section 28) */}
          {attendance.override_score !== null && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>{lang === 'ar' ? 'تعديل إداري معتمد للدرجة' : 'Approved Administrative Score Override'}</span>
              </div>
              <div className="flex justify-between text-purple-950 font-mono">
                <span>{lang === 'ar' ? 'الدرجة المعدلة:' : 'Override Score:'} {attendance.override_score} pts</span>
                <span>{lang === 'ar' ? 'بواسطة:' : 'By:'} {attendance.override_by}</span>
              </div>
              <p className="text-purple-800 italic">
                "{attendance.override_reason}"
              </p>
            </div>
          )}

          {/* Admin Override Action button */}
          {userRole === 'admin' && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOverride(attendance);
                }}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{t.btn_override}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
