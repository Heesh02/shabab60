import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Trash2,
  TrendingDown,
  Loader2,
  X
} from 'lucide-react';
import { Event, ArrivalRule } from '../types';
import { translations, Language } from '../utils/i18n';

interface EventsViewProps {
  lang: Language;
  events: Event[];
  onActivateEvent: (eventId: string) => Promise<void>;
  onCompleteEvent: (eventId: string) => Promise<void>;
  onUpdateEventRules: (eventId: string, rules: Partial<Event>, recalculate?: boolean) => Promise<void>;
  onCreateEvent: (newEvent: Partial<Event>) => Promise<any>;
  onDeleteEvent?: (eventId: string) => Promise<void>;
  onNavigateToScoringRules?: () => void;
  userRole: string;
}

const getLocalDateTimeString = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const EventsView: React.FC<EventsViewProps> = ({
  lang,
  events,
  onActivateEvent,
  onCompleteEvent,
  onUpdateEventRules,
  onCreateEvent,
  onDeleteEvent,
  onNavigateToScoringRules,
  userRole
}) => {
  const t = translations[lang];

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingArrivalRules, setEditingArrivalRules] = useState<ArrivalRule[]>([]);
  const [recalculateOnSave, setRecalculateOnSave] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);
  
  // New event form state
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [sessionType, setSessionType] = useState('meeting');
  const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'active' | 'draft'>('scheduled');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [gracePeriod, setGracePeriod] = useState(2);
  const [deductionRate, setDeductionRate] = useState(2);
  const [maxScore, setMaxScore] = useState(100);

  const handleOpenCreateModal = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const twoHoursLater = new Date(now.getTime() + 2 * 3600000);

    setName('');
    setNameAr('');
    setStartTime(getLocalDateTimeString(now));
    setEndTime(getLocalDateTimeString(twoHoursLater));
    setSessionType('meeting');
    setSessionStatus('scheduled');
    setGracePeriod(2);
    setDeductionRate(2);
    setMaxScore(100);
    setFormError(null);
    setIsCreating(true);
  };

  const handleOpenEditRules = (ev: Event) => {
    setEditingEvent({ ...ev });
    setEditingArrivalRules(
      ev.arrival_rules && ev.arrival_rules.length > 0
        ? JSON.parse(JSON.stringify(ev.arrival_rules))
        : [
            { max_late_minutes: 5, score: 100, label: '≤ 5 min late (Full)', label_ar: 'تأخير ≤ 5 دقائق' },
            { max_late_minutes: 15, score: 80, label: '6–15 min late', label_ar: 'تأخير 6–15 دقيقة' },
            { max_late_minutes: 30, score: 50, label: '16–30 min late', label_ar: 'تأخير 16–30 دقيقة' },
            { max_late_minutes: 9999, score: 0, label: '> 30 min late', label_ar: 'تأخير أكثر من 30 دقيقة' }
          ]
    );
    setRecalculateOnSave(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalName = (name || nameAr || '').trim();
    const finalNameAr = (nameAr || name || '').trim();

    if (!finalName) {
      setFormError(lang === 'ar' ? 'يرجى إدخال اسم الجلسة' : 'Please enter the session name');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateEvent({
        name: finalName,
        name_ar: finalNameAr,
        type: sessionType,
        status: sessionStatus,
        start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 2 * 3600000).toISOString(),
        grace_period_minutes: Number(gracePeriod),
        exit_deduction_rate: Number(deductionRate),
        maximum_score: Number(maxScore),
        minimum_score: 0,
        arrival_rules: [
          { max_late_minutes: 5, score: Number(maxScore), label: '≤ 5 min late (Full)', label_ar: 'تأخير ≤ 5 دقائق (كامل)' },
          { max_late_minutes: 15, score: Math.round(Number(maxScore) * 0.8), label: '6–15 min late', label_ar: 'تأخير 6–15 دقيقة' },
          { max_late_minutes: 30, score: Math.round(Number(maxScore) * 0.5), label: '16–30 min late', label_ar: 'تأخير 16–30 دقيقة' },
          { max_late_minutes: 9999, score: 0, label: '> 30 min late', label_ar: 'تأخير أكثر من 30 دقيقة' }
        ]
      });

      setIsCreating(false);
      setName('');
      setNameAr('');
      setCreatedNotice(
        lang === 'ar' 
          ? `تم إنشاء الجلسة "${finalNameAr}" بنجاح وحفظها في الجدول!`
          : `Session "${finalName}" created successfully and saved in the schedule!`
      );
      setTimeout(() => {
        setCreatedNotice(null);
      }, 5000);
    } catch (err: any) {
      setFormError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء حفظ الجلسة' : 'Error creating session'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    await onUpdateEventRules(
      editingEvent.id, 
      {
        grace_period_minutes: Number(editingEvent.grace_period_minutes),
        exit_deduction_rate: Number(editingEvent.exit_deduction_rate),
        maximum_score: Number(editingEvent.maximum_score),
        minimum_score: Number(editingEvent.minimum_score ?? 0),
        arrival_rules: editingArrivalRules
      },
      recalculateOnSave
    );
    setEditingEvent(null);
  };

  return (
    <div id="events-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <span>{t.nav_events} & {t.nav_scoring_rules}</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'ar' ? 'إدارة فقرات وجلسات المؤتمر، وتحديد فترات السماح ونسب الخصم والدرجات' : 'Conference sessions schedule and configurable scoring logic rules'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToScoringRules && (
            <button
              type="button"
              onClick={onNavigateToScoringRules}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
            >
              <Sliders className="w-4 h-4 text-amber-700" />
              <span>{lang === 'ar' ? 'تهيئة القواعد العامة' : 'Global Scoring Rules'}</span>
            </button>
          )}

          {userRole === 'admin' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة جلسة مؤتمر جديدة' : 'Add New Session'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notice Banner */}
      {createdNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-xs transition-all animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{createdNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setCreatedNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create New Session Modal / Card */}
      {isCreating && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
            <div>
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                {lang === 'ar' ? 'إنشاء جلسة / فقرة جديدة بالمؤتمر' : 'Create New Conference Session'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {lang === 'ar' 
                  ? 'أدخل بيانات الجلسة ومواعيدها وقواعد احتساب الحضور والانصراف' 
                  : 'Enter session details, schedule times, and scoring parameters'}
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  Session Name (English) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning Prayer & Praise"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  اسم الجلسة (بالعربية) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: صلاة باكر وتسبحة الصباح"
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Type & Initial Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  {lang === 'ar' ? 'نوع الفقرة / الجلسة' : 'Session Category'}
                </label>
                <select
                  value={sessionType}
                  onChange={e => setSessionType(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="meeting">{lang === 'ar' ? 'كلمة روحية / محاضرة (Spiritual Talk)' : 'Spiritual Talk / Lecture'}</option>
                  <option value="prayer">{lang === 'ar' ? 'صلاة باكر وتسبحة (Prayer & Hymns)' : 'Prayer & Hymns'}</option>
                  <option value="liturgy">{lang === 'ar' ? 'قداس إلهي (Divine Liturgy)' : 'Divine Liturgy'}</option>
                  <option value="bible_study">{lang === 'ar' ? 'دراسة الكتاب المقدس (Bible Study)' : 'Bible Study'}</option>
                  <option value="workshop">{lang === 'ar' ? 'ورشة عمل (Workshop)' : 'Workshop'}</option>
                  <option value="competition">{lang === 'ar' ? 'مسابقة وأنشطة (Competition / Activities)' : 'Competition / Activities'}</option>
                  <option value="general">{lang === 'ar' ? 'لقاء عام (General Meeting)' : 'General Meeting'}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  {lang === 'ar' ? 'حالة الجلسة عند الإنشاء' : 'Session Status'}
                </label>
                <select
                  value={sessionStatus}
                  onChange={e => setSessionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="scheduled">{lang === 'ar' ? 'مجدولة (Scheduled)' : 'Scheduled (Starts Later)'}</option>
                  <option value="active">{lang === 'ar' ? 'تفعيل الآن كجلسة نشطة (Active Immediately)' : 'Active Immediately'}</option>
                  <option value="draft">{lang === 'ar' ? 'مسودة (Draft)' : 'Draft'}</option>
                </select>
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  {lang === 'ar' ? 'وقت بدء الجلسة' : 'Session Start Time'}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 uppercase block mb-1">
                  {lang === 'ar' ? 'وقت انتهاء الجلسة' : 'Session End Time'}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Scoring Parameters Preview & Override */}
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <div className="font-bold text-amber-950 text-xs mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>{lang === 'ar' ? 'قواعد احتساب الدرجات للجلسة (افتراضية قابلة للتعديل)' : 'Session Scoring Parameters (Configurable)'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {lang === 'ar' ? 'الدرجة الأساسية القصوى' : 'Maximum Base Score'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={maxScore}
                    onChange={e => setMaxScore(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {lang === 'ar' ? 'فترة السماح للخروج (دقائق)' : 'Grace Period (Minutes)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {lang === 'ar' ? 'معدل الخصم (درجة / دقيقة)' : 'Deduction Rate (Pts/Min)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={deductionRate}
                    onChange={e => setDeductionRate(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg font-semibold cursor-pointer transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حفظ وإنشاء الجلسة' : 'Save & Create Session'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {events.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
            <p className="text-stone-500 text-sm">
              {lang === 'ar' ? 'لا توجد جلسات مسجلة حالياً. اضغط "إضافة جلسة مؤتمر جديدة" لإضافة جلسة.' : 'No sessions created yet. Click "Add New Session" to create one.'}
            </p>
          </div>
        ) : (
          events.map((ev) => {
            const isActive = ev.status === 'active';
            const isCompleted = ev.status === 'completed';

            return (
              <div 
                key={ev.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-amber-400 shadow-md' 
                    : isCompleted 
                    ? 'bg-stone-50 border-stone-200 opacity-90' 
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                          {lang === 'ar' ? 'الجلسة النشطة الآن' : 'Active Session'}
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-200 px-2.5 py-0.5 rounded-full">
                          {lang === 'ar' ? 'مكتملة' : 'Completed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                          {lang === 'ar' ? 'مجدولة' : 'Scheduled'}
                        </span>
                      )}

                      <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ev.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900">
                      {lang === 'ar' ? ev.name_ar : ev.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {lang === 'ar' ? ev.name : ev.name_ar}
                    </p>
                  </div>

                  {/* Actions */}
                  {userRole === 'admin' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isActive && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onActivateEvent(ev.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'بدء وتفعيل الجلسة' : 'Activate Session'}</span>
                        </button>
                      )}

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => onCompleteEvent(ev.id)}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إنهاء الجلسة وإغلاق الخروج' : 'End & Close Session'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditRules(ev)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1.5 border border-stone-300 cursor-pointer transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تعديل القواعد' : 'Edit Rules'}</span>
                      </button>

                      {onDeleteEvent && !isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            const confirmMsg = lang === 'ar'
                              ? `هل أنت متأكد من حذف الجلسة "${ev.name_ar || ev.name}"؟`
                              : `Are you sure you want to delete session "${ev.name}"?`;
                            if (window.confirm(confirmMsg)) {
                              onDeleteEvent(ev.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={lang === 'ar' ? 'حذف الجلسة' : 'Delete session'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Scoring Rules Display (PRD Section 13) */}
                <div className="mt-4 pt-4 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">{t.base_score}</span>
                    <span className="font-extrabold text-stone-900 text-sm mt-0.5 block">{ev.maximum_score} {t.points}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">{t.grace_period}</span>
                    <span className="font-extrabold text-stone-900 text-sm mt-0.5 block">{ev.grace_period_minutes} {t.minutes}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">{t.deduction_rate}</span>
                    <span className="font-extrabold text-rose-700 text-sm mt-0.5 block">{ev.exit_deduction_rate} {t.points_per_min}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">{lang === 'ar' ? 'شرائح الحضور' : 'Arrival Tiers'}</span>
                    <span className="font-bold text-stone-700 text-xs mt-0.5 block">
                      {ev.arrival_rules?.length || 4} {lang === 'ar' ? 'شرائح زمنية' : 'tiers'}
                    </span>
                  </div>
                </div>

                {/* Arrival Rules breakdown */}
                {ev.arrival_rules && ev.arrival_rules.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {ev.arrival_rules.map((rule, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 font-mono"
                      >
                        {rule.label || (rule.max_late_minutes >= 9999 ? '>30m late' : `≤${rule.max_late_minutes}m`)}: <strong className="text-stone-900">{rule.score} pts</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Scoring Rules Modal (PRD Section 13) */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-base">
                  {lang === 'ar' ? 'تعديل قواعد حساب الدرجات للجلسة' : 'Configure Session Scoring Rules'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
              <span className="font-bold text-amber-950 block">
                {lang === 'ar' ? editingEvent.name_ar : editingEvent.name}
              </span>
              <span className="text-amber-800 text-[11px]">
                {lang === 'ar' 
                  ? 'أي تغيير هنا سيتم تطبيقه على هذه الجلسة فقط بشكل مخصص.' 
                  : 'Changes made here will be applied exclusively to this session.'}
              </span>
            </div>

            <form onSubmit={handleSaveEditRules} className="space-y-4 text-xs">
              {/* Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 uppercase block mb-1">
                    {t.base_score} (pts)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={editingEvent.maximum_score}
                    onChange={e => setEditingEvent({ ...editingEvent, maximum_score: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 uppercase block mb-1">
                    {t.grace_period} (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editingEvent.grace_period_minutes}
                    onChange={e => setEditingEvent({ ...editingEvent, grace_period_minutes: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 uppercase block mb-1">
                    {t.deduction_rate} (pts/m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingEvent.exit_deduction_rate}
                    onChange={e => setEditingEvent({ ...editingEvent, exit_deduction_rate: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-stone-900"
                  />
                </div>
              </div>

              {/* Arrival Rules List */}
              <div className="border-t border-stone-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800 uppercase block">
                    {lang === 'ar' ? 'شرائح وقت الوصول والدرجات' : 'Arrival Time Tiers & Scores'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingArrivalRules([
                        ...editingArrivalRules,
                        { max_late_minutes: 45, score: 25, label: '31–45 min late', label_ar: 'تأخير 31–45 دقيقة' }
                      ]);
                    }}
                    className="text-[11px] text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'إضافة شريحة' : 'Add Tier'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingArrivalRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="w-28 shrink-0">
                        <span className="text-[10px] text-stone-500 block">Max Late Min</span>
                        <input
                          type="number"
                          min="0"
                          value={rule.max_late_minutes}
                          onChange={e => {
                            const newRules = [...editingArrivalRules];
                            newRules[idx].max_late_minutes = Number(e.target.value);
                            setEditingArrivalRules(newRules);
                          }}
                          className="w-full p-1 bg-white border border-stone-300 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="w-24 shrink-0">
                        <span className="text-[10px] text-stone-500 block">Score (Pts)</span>
                        <input
                          type="number"
                          min="0"
                          value={rule.score}
                          onChange={e => {
                            const newRules = [...editingArrivalRules];
                            newRules[idx].score = Number(e.target.value);
                            setEditingArrivalRules(newRules);
                          }}
                          className="w-full p-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold text-amber-900"
                        />
                      </div>

                      <div className="flex-1">
                        <span className="text-[10px] text-stone-500 block">Label</span>
                        <input
                          type="text"
                          value={lang === 'ar' ? (rule.label_ar || rule.label) : (rule.label || rule.label_ar || '')}
                          onChange={e => {
                            const newRules = [...editingArrivalRules];
                            if (lang === 'ar') {
                              newRules[idx].label_ar = e.target.value;
                            } else {
                              newRules[idx].label = e.target.value;
                            }
                            setEditingArrivalRules(newRules);
                          }}
                          className="w-full p-1 bg-white border border-stone-300 rounded text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingArrivalRules(editingArrivalRules.filter((_, i) => i !== idx));
                        }}
                        className="mt-4 p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recalculate checkbox */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recalculateOnSave}
                    onChange={e => setRecalculateOnSave(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-stone-800 block">
                      {lang === 'ar' ? 'إعادة حساب درجات الحضور المسجلين تلقائياً' : 'Recalculate existing participant scores for this session'}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {lang === 'ar' 
                        ? 'تحديث درجات الحضور وأوقات الخروج للمشاركين وفقاً للقواعد الجديدة فور الحفظ' 
                        : 'Automatically update existing attendance records and outside time deductions'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ وتطبيق القواعد' : 'Save & Apply Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

