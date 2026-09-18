import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { Attendance } from '../types';
import { translations, Language } from '../utils/i18n';

interface ScoreOverrideModalProps {
  lang: Language;
  attendance: Attendance | null;
  onClose: () => void;
  onSubmit: (attendanceId: string, overrideScore: number, reason: string) => Promise<void>;
  currentAdminName: string;
}

export const ScoreOverrideModal: React.FC<ScoreOverrideModalProps> = ({
  lang,
  attendance,
  onClose,
  onSubmit,
  currentAdminName
}) => {
  const t = translations[lang];

  if (!attendance) return null;

  const [score, setScore] = useState<number>(attendance.override_score ?? attendance.final_score);
  const [reason, setReason] = useState<string>(attendance.override_reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة سبب التعديل لتوثيقه في سجل العمليات.' : 'Override reason is required for audit trail.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(attendance.id, Number(score), reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to override score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div 
        id="score-override-modal"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="bg-purple-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-300" />
            <h3 className="font-bold text-base">{t.modal_override_title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-950 hover:bg-purple-800 text-purple-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-bold text-purple-950">
              <span>{attendance.participant_name}</span>
              <span className="font-mono">{attendance.participant_number}</span>
            </div>
            <div className="flex justify-between text-purple-800">
              <span>{lang === 'ar' ? 'الدرجة المحسوبة آلياً:' : 'Calculated Score:'}</span>
              <span className="font-bold font-mono">{attendance.base_score - attendance.total_deduction} pts</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              {t.override_score_label}
            </label>
            <input
              id="override-score-input"
              type="number"
              min="0"
              max="200"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-bold font-mono text-stone-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              {t.override_reason_label} <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="override-reason-textarea"
              rows={3}
              placeholder={t.override_reason_placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="btn-confirm-override"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : t.btn_save_override}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
