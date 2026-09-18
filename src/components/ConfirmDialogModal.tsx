import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, Loader2 } from 'lucide-react';
import { Language } from '../utils/i18n';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  type: 'clear' | 'reset';
  lang: Language;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  type,
  lang,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'clear';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div 
        id="confirm-dialog-modal"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top decorative bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDanger ? 'bg-rose-600' : 'bg-amber-500'}`} />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                : 'bg-amber-100 text-amber-600 border border-amber-200'
            }`}>
              {isDanger ? <Trash2 className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg leading-snug">
                {title}
              </h3>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDanger ? 'text-rose-600' : 'text-amber-700'}`}>
                {isDanger 
                  ? (lang === 'ar' ? 'إجراء لا يمكن التراجع عنه' : 'Destructive Action')
                  : (lang === 'ar' ? 'إعادة ضبط البيانات' : 'Data Reset')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          {description}
        </p>

        {isDanger && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-bold block mb-1">
                {lang === 'ar' ? 'ما سيتم حذفه بالكامل:' : 'What will be completely wiped:'}
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                <li>{lang === 'ar' ? 'سجل كافة المشاركين المسجلين' : 'All registered participants'}</li>
                <li>{lang === 'ar' ? 'كافة الفرق والدرجات المحتسبة' : 'All teams and team rosters'}</li>
                <li>{lang === 'ar' ? 'كافة الفعاليات والجلسات الروحية' : 'All conference sessions and events'}</li>
                <li>{lang === 'ar' ? 'كافة سجلات الحضور والخروج المؤقت' : 'All attendance, check-ins, and exit logs'}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="btn-cancel-dialog"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-800 hover:bg-stone-100 font-semibold text-xs transition cursor-pointer border border-stone-200"
          >
            {cancelLabel}
          </button>

          <button
            id="btn-confirm-action"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'ar' ? 'جارٍ التنفيذ...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
