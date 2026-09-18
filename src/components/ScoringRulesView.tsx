import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Clock, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  Calculator, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Timer
} from 'lucide-react';
import { 
  ScoringConfig, 
  ArrivalRule, 
  ScoringApplyScope, 
  ApplyScoringResponse, 
  Event 
} from '../types';
import { translations, Language } from '../utils/i18n';

interface ScoringRulesViewProps {
  lang: Language;
  userRole: 'admin' | 'servant' | 'supervisor';
  events: Event[];
  activeEvent: Event | null;
  onRulesApplied: () => void;
}

interface PresetRule {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  config: ScoringConfig;
}

const DEFAULT_ARRIVAL_RULES: ArrivalRule[] = [
  { max_late_minutes: 5, score: 100, label: '≤ 5 min late (Full)', label_ar: 'تأخير ≤ 5 دقائق (كامل)' },
  { max_late_minutes: 15, score: 80, label: '6–15 min late', label_ar: 'تأخير 6–15 دقيقة' },
  { max_late_minutes: 30, score: 50, label: '16–30 min late', label_ar: 'تأخير 16–30 دقيقة' },
  { max_late_minutes: 9999, score: 0, label: '> 30 min late', label_ar: 'تأخير أكثر من 30 دقيقة' }
];

const PRESETS: PresetRule[] = [
  {
    id: 'standard',
    name: 'Standard Conference',
    name_ar: 'المؤتمر العام القياسي',
    description: 'Balanced scoring with 2-min grace and gradual arrival deductions',
    description_ar: 'نظام متوازن: دقيقتان سماح، وتدرج تدريجي لدرجات الحضور المتأخر',
    config: {
      maximum_score: 100,
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      minimum_score: 0,
      arrival_rules: [
        { max_late_minutes: 5, score: 100, label: '≤ 5 min late (Full)', label_ar: 'تأخير ≤ 5 دقائق (كامل)' },
        { max_late_minutes: 15, score: 80, label: '6–15 min late', label_ar: 'تأخير 6–15 دقيقة' },
        { max_late_minutes: 30, score: 50, label: '16–30 min late', label_ar: 'تأخير 16–30 دقيقة' },
        { max_late_minutes: 9999, score: 0, label: '> 30 min late', label_ar: 'تأخير أكثر من 30 دقيقة' }
      ]
    }
  },
  {
    id: 'strict',
    name: 'Strict Spiritual Retreat',
    name_ar: 'الخلوة الروحية والالتزام الصارم',
    description: '1-min grace period and 3 pts/min exit deduction with firm arrival cutoffs',
    description_ar: 'دقيقة سماح واحدة، خصم 3 درجات/دقيقة خروج، وشرائح حضور صارمة',
    config: {
      maximum_score: 100,
      grace_period_minutes: 1,
      exit_deduction_rate: 3,
      minimum_score: 0,
      arrival_rules: [
        { max_late_minutes: 3, score: 100, label: '≤ 3 min late (On Time)', label_ar: 'تأخير ≤ 3 دقائق (في الموعد)' },
        { max_late_minutes: 10, score: 70, label: '4–10 min late', label_ar: 'تأخير 4–10 دقائق' },
        { max_late_minutes: 20, score: 35, label: '11–20 min late', label_ar: 'تأخير 11–20 دقيقة' },
        { max_late_minutes: 9999, score: 0, label: '> 20 min late', label_ar: 'تأخير أكثر من 20 دقيقة' }
      ]
    }
  },
  {
    id: 'forgiving',
    name: 'Youth Fellowship & Activities',
    name_ar: 'لقاءات الشباب والأنشطة المرنة',
    description: 'Generous 5-min grace and mild 1 pt/min deduction rate',
    description_ar: 'فترة سماح 5 دقائق، وخصم خفيف 1 درجة لكل دقيقة خروج',
    config: {
      maximum_score: 100,
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      minimum_score: 0,
      arrival_rules: [
        { max_late_minutes: 10, score: 100, label: '≤ 10 min late (Full)', label_ar: 'تأخير ≤ 10 دقائق (كامل)' },
        { max_late_minutes: 20, score: 85, label: '11–20 min late', label_ar: 'تأخير 11–20 دقيقة' },
        { max_late_minutes: 35, score: 65, label: '21–35 min late', label_ar: 'تأخير 21–35 دقيقة' },
        { max_late_minutes: 9999, score: 30, label: '> 35 min late', label_ar: 'تأخير أكثر من 35 دقيقة' }
      ]
    }
  }
];

export const ScoringRulesView: React.FC<ScoringRulesViewProps> = ({
  lang,
  userRole,
  events,
  activeEvent,
  onRulesApplied
}) => {
  const t = translations[lang];
  const isAdmin = userRole === 'admin';

  // Config State
  const [maxScore, setMaxScore] = useState<number>(100);
  const [minScore, setMinScore] = useState<number>(0);
  const [gracePeriod, setGracePeriod] = useState<number>(2);
  const [deductionRate, setDeductionRate] = useState<number>(2);
  const [arrivalRules, setArrivalRules] = useState<ArrivalRule[]>(DEFAULT_ARRIVAL_RULES);

  // Application Scope State
  const [scope, setScope] = useState<ScoringApplyScope>('all');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [recalculateAttendances, setRecalculateAttendances] = useState<boolean>(true);

  // Status & Feedback State
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSavedConfig, setLastSavedConfig] = useState<ScoringConfig | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null);

  // Simulator State
  const [simLateMinutes, setSimLateMinutes] = useState<number>(4);
  const [simTotalTimeOut, setSimTotalTimeOut] = useState<number>(7);

  // Fetch initial configuration from server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/scoring-rules');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setMaxScore(data.config.maximum_score ?? 100);
            setMinScore(data.config.minimum_score ?? 0);
            setGracePeriod(data.config.grace_period_minutes ?? 2);
            setDeductionRate(data.config.exit_deduction_rate ?? 2);
            if (data.config.arrival_rules && Array.isArray(data.config.arrival_rules)) {
              setArrivalRules(data.config.arrival_rules);
            }
            setLastSavedConfig(data.config);
          }
        }
      } catch (err) {
        console.error('Failed to load scoring rules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Initialize selectedEventIds with all active and scheduled events if empty
  useEffect(() => {
    if (events.length > 0 && selectedEventIds.length === 0) {
      setSelectedEventIds(events.filter(e => e.status !== 'completed').map(e => e.id));
    }
  }, [events, selectedEventIds.length]);

  // Load a preset
  const handleApplyPreset = (preset: PresetRule) => {
    if (!isAdmin) return;
    setMaxScore(preset.config.maximum_score);
    setMinScore(preset.config.minimum_score);
    setGracePeriod(preset.config.grace_period_minutes);
    setDeductionRate(preset.config.exit_deduction_rate);
    setArrivalRules(JSON.parse(JSON.stringify(preset.config.arrival_rules)));
    setFeedback({
      type: 'success',
      message: lang === 'ar' ? `تم تحميل نموذج "${preset.name_ar}"` : `Loaded "${preset.name}" preset`
    });
  };

  // Arrival Tier Manipulation
  const handleAddArrivalTier = () => {
    if (!isAdmin) return;
    const sorted = [...arrivalRules].sort((a, b) => a.max_late_minutes - b.max_late_minutes);
    const lastFinite = sorted.filter(r => r.max_late_minutes < 9999).pop();
    const newMinutes = lastFinite ? lastFinite.max_late_minutes + 15 : 45;
    const newScore = lastFinite ? Math.max(0, lastFinite.score - 25) : 25;

    const newTier: ArrivalRule = {
      max_late_minutes: newMinutes,
      score: newScore,
      label: `≤ ${newMinutes} min late`,
      label_ar: `تأخير ≤ ${newMinutes} دقيقة`
    };

    // Insert before the 9999 (cutoff) tier if present
    const cutoffIndex = arrivalRules.findIndex(r => r.max_late_minutes >= 9999);
    if (cutoffIndex !== -1) {
      const copy = [...arrivalRules];
      copy.splice(cutoffIndex, 0, newTier);
      setArrivalRules(copy);
    } else {
      setArrivalRules([...arrivalRules, newTier]);
    }
  };

  const handleUpdateArrivalTier = (index: number, field: keyof ArrivalRule, value: any) => {
    if (!isAdmin) return;
    const updated = [...arrivalRules];
    updated[index] = { ...updated[index], [field]: value };
    setArrivalRules(updated);
  };

  const handleRemoveArrivalTier = (index: number) => {
    if (!isAdmin || arrivalRules.length <= 1) return;
    const updated = arrivalRules.filter((_, i) => i !== index);
    setArrivalRules(updated);
  };

  // Simulator Calculations
  const simCalculation = useMemo(() => {
    // 1. Arrival Score
    let baseScore = 0;
    const sorted = [...arrivalRules].sort((a, b) => a.max_late_minutes - b.max_late_minutes);
    for (const rule of sorted) {
      if (simLateMinutes <= rule.max_late_minutes) {
        baseScore = Math.min(maxScore, Math.max(0, rule.score));
        break;
      }
    }

    // 2. Exit Deductions
    const deductibleMinutes = Math.max(0, simTotalTimeOut - gracePeriod);
    const totalDeduction = Number((deductibleMinutes * deductionRate).toFixed(1));
    const calculatedScore = Math.max(minScore, baseScore - totalDeduction);

    return {
      baseScore,
      deductibleMinutes,
      totalDeduction,
      finalScore: calculatedScore
    };
  }, [simLateMinutes, simTotalTimeOut, arrivalRules, maxScore, minScore, gracePeriod, deductionRate]);

  // Save and Apply Configuration
  const handleSaveAndApply = async () => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      setFeedback(null);

      // Validate arrival rules
      if (!arrivalRules || arrivalRules.length === 0) {
        throw new Error(lang === 'ar' ? 'يجب إدخال شريحة وصول واحدة على الأقل' : 'At least one arrival tier is required');
      }

      // Sort arrival rules by max_late_minutes
      const sortedRules = [...arrivalRules].sort((a, b) => Number(a.max_late_minutes) - Number(b.max_late_minutes));

      const configToSave: ScoringConfig = {
        maximum_score: Number(maxScore),
        minimum_score: Number(minScore),
        grace_period_minutes: Number(gracePeriod),
        exit_deduction_rate: Number(deductionRate),
        arrival_rules: sortedRules
      };

      const payload = {
        config: configToSave,
        options: {
          scope,
          target_event_ids: scope === 'selected' ? selectedEventIds : undefined,
          recalculate_attendances: recalculateAttendances
        },
        performed_by: 'Administrator'
      };

      const res = await fetch('/api/scoring-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to apply scoring rules');
      }

      const result: ApplyScoringResponse = await res.json();
      setLastSavedConfig(result.config);
      setFeedback({
        type: 'success',
        message: lang === 'ar' ? result.message_ar : result.message,
        details: lang === 'ar'
          ? `تم تحديث ${result.updated_events_count} جلسة وإعادة حساب درجات ${result.recalculated_attendances_count} مشارك بنجاح.`
          : `Updated ${result.updated_events_count} session(s) and recalculated ${result.recalculated_attendances_count} attendance score(s).`
      });

      // Notify parent to refresh stats, attendances, and events
      onRulesApplied();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error saving scoring rules'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-stone-500">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold uppercase tracking-wider">
          {lang === 'ar' ? 'جارٍ تحميل قواعد التقييم...' : 'Loading Scoring Rules...'}
        </p>
      </div>
    );
  }

  return (
    <div id="scoring-rules-view" className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Sliders className="w-5 h-5 text-amber-800" />
              </span>
              <h2 className="text-xl font-bold text-stone-900">
                {lang === 'ar' ? 'إعدادات وقواعد احتساب الدرجات' : 'Scoring Rules Configuration'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl mt-1">
              {lang === 'ar'
                ? 'محرك الحسابات المعتمد: التحكم في درجات الحضور وشرائح التأخير، مدة السماح للخروج المؤقت، ونسبة الخصم لكل دقيقة مع خيارات التطبيق وإعادة الحساب.'
                : 'Server-authoritative scoring engine: set arrival thresholds, exit grace period duration, per-minute deduction rates, and choose propagation scope for sessions.'}
            </p>
          </div>

          {/* Role Badge Indicator */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'ar' ? 'صلاحيات المدير مفعلة (تعديل كامل)' : 'Admin Mode (Full Access)'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'ar' ? 'وضع المشاهدة (قراءة فقط للمسؤولين)' : 'Read-Only (Admin Login Required)'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Presets Bar */}
        <div className="mt-5 pt-4 border-t border-stone-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'ar' ? 'نماذج جاهزة سريعة' : 'Quick Scoring Presets'}</span>
            </span>
            <span className="text-[11px] text-stone-400 font-mono">
              {lang === 'ar' ? 'اختر نموذجاً لتعبئة الحقول تلقائياً' : 'Click a preset to populate rule parameters'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                disabled={!isAdmin}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl border text-left rtl:text-right transition cursor-pointer ${
                  !isAdmin 
                    ? 'opacity-60 cursor-not-allowed bg-stone-50 border-stone-200' 
                    : 'bg-stone-50 hover:bg-amber-50/70 hover:border-amber-400 border-stone-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-stone-900">
                    {lang === 'ar' ? preset.name_ar : preset.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    {preset.config.grace_period_minutes}m / {preset.config.exit_deduction_rate}pts
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {lang === 'ar' ? preset.description_ar : preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div 
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-xs font-bold">{feedback.message}</p>
            {feedback.details && (
              <p className="text-[11px] text-stone-600 mt-0.5">{feedback.details}</p>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Parameters Grid: Base Score, Grace Period, Deduction Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Maximum Base Score & Floor */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-stone-900 mb-2">
              <span className="p-1.5 rounded-lg bg-stone-100 text-stone-700">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'الدرجة العظمى والحد الأدنى' : 'Base Score & Floor'}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 mb-4">
              {lang === 'ar'
                ? 'الدرجة التي يحصل عليها المشارك عند الحضور في الموعد بدون تأخير، والحد الأدنى الذي لا تنزل الدرجة تحته.'
                : 'Maximum score awarded for on-time arrival, and the minimum floor score below which deductions cannot drop.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {lang === 'ar' ? 'الدرجة العظمى للجلسة (نقطة)' : 'Max Session Base Score (Points)'}
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min="1"
                  max="500"
                  value={maxScore}
                  onChange={e => setMaxScore(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-sm font-bold text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {lang === 'ar' ? 'الحد الأدنى للدرجة (Floor)' : 'Minimum Floor Score'}
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min="0"
                  max={maxScore}
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
            {lang === 'ar' ? `نطاق التقييم: ${minScore} إلى ${maxScore} درجة` : `Allowed Range: ${minScore} to ${maxScore} pts`}
          </div>
        </div>

        {/* Grace Period for Temporary Exits */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-stone-900 mb-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'فترة السماح للخروج المؤقت' : 'Temporary Exit Grace Period'}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 mb-4">
              {lang === 'ar'
                ? 'عدد الدقائق المسموح للمشارك بقضائها خارج الجلسة (لأسباب طارئة أو خدمة) قبل بدء خصم أي درجات.'
                : 'Cumulative minutes a participant is allowed outside the session before any point deductions occur.'}
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'ar' ? 'مدة السماح (بالدقائق)' : 'Grace Period (Minutes)'}
                  </label>
                  <span className="font-mono font-extrabold text-sm text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                    {gracePeriod} {t.minutes}
                  </span>
                </div>
                <input
                  type="range"
                  disabled={!isAdmin}
                  min="0"
                  max="20"
                  step="1"
                  value={gracePeriod}
                  onChange={e => setGracePeriod(Number(e.target.value))}
                  className="w-full accent-sky-700 cursor-pointer"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 2, 5, 10].map(m => (
                  <button
                    key={m}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setGracePeriod(m)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono font-bold border cursor-pointer transition ${
                      gracePeriod === m
                        ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
            {gracePeriod === 0 ? (
              <span className="text-rose-700 font-semibold">
                {lang === 'ar' ? 'خصم فوري من أول دقيقة خروج' : 'Zero tolerance: immediate deduction on exit'}
              </span>
            ) : (
              <span>
                {lang === 'ar' 
                  ? `أول ${gracePeriod} دقائق غياب مجانية بالكامل` 
                  : `First ${gracePeriod} min of cumulative exit are deduction-free`}
              </span>
            )}
          </div>
        </div>

        {/* Exit Deduction Rate */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-stone-900 mb-2">
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'معدل خصم الخروج المؤقت' : 'Per-Minute Deduction Rate'}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 mb-4">
              {lang === 'ar'
                ? 'عدد النقاط المخصومة عن كل دقيقة يقضيها المشارك خارج القاعة بعد انتهاء فترة السماح المحددة.'
                : 'Points subtracted per minute spent outside a session after the grace period has expired.'}
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'ar' ? 'معدل الخصم (نقطة/دقيقة)' : 'Deduction Rate (Pts/Minute)'}
                  </label>
                  <span className="font-mono font-extrabold text-sm text-rose-900 bg-rose-100 px-2 py-0.5 rounded">
                    {deductionRate} {t.points_per_min}
                  </span>
                </div>
                <input
                  type="range"
                  disabled={!isAdmin}
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={deductionRate}
                  onChange={e => setDeductionRate(Number(e.target.value))}
                  className="w-full accent-rose-700 cursor-pointer"
                />
              </div>

              {/* Quick Rate Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 5].map(r => (
                  <button
                    key={r}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setDeductionRate(r)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono font-bold border cursor-pointer transition ${
                      deductionRate === r
                        ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {r} pt/m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
            {lang === 'ar' 
              ? `معادلة: الخصم = (الوقت بالخارج - ${gracePeriod}) × ${deductionRate}` 
              : `Formula: Loss = MAX(0, TimeOut - ${gracePeriod}) × ${deductionRate}`}
          </div>
        </div>
      </div>

      {/* Arrival Time Thresholds & Corresponding Scores/Deductions */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>{lang === 'ar' ? 'شرائح الحضور والتأخير (Arrival Time Thresholds & Scores)' : 'Arrival Time Thresholds & Corresponding Scores'}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'ar'
                ? 'تحديد الدرجة الممنوحة للمشارك بناءً على وقت وصوله ومسحه لكود الحضور مقارنةً بموعد بدء الجلسة الرسمي.'
                : 'Configure the arrival score and deduction tier awarded to each attendee based on minutes late past session start time.'}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleAddArrivalTier}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة شريحة تأخير' : 'Add Arrival Tier'}</span>
            </button>
          )}
        </div>

        {/* Arrival Tiers Visual Timeline Bar */}
        <div className="mb-5 p-3 bg-stone-50 rounded-xl border border-stone-200">
          <div className="text-[11px] font-bold text-stone-600 mb-2 flex items-center justify-between">
            <span>{lang === 'ar' ? 'مخطط زمني لشرائح الحضور المعتمدة' : 'Visual Timeline of Arrival Tiers'}</span>
            <span className="text-stone-400 font-mono">Start Time 0:00 ➔ Late Minutes</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {arrivalRules.map((rule, idx) => {
              const prev = idx > 0 ? arrivalRules[idx - 1].max_late_minutes : 0;
              const isCutoff = rule.max_late_minutes >= 9999;
              const rangeLabel = isCutoff 
                ? `> ${prev}m` 
                : `${prev === 0 ? '0' : prev + 1}–${rule.max_late_minutes}m`;

              return (
                <div 
                  key={idx}
                  className={`flex-1 min-w-[110px] p-2 rounded-lg border text-center font-mono ${
                    rule.score === maxScore
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : rule.score >= maxScore * 0.7
                      ? 'bg-sky-50 border-sky-300 text-sky-950'
                      : rule.score > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-stone-500">{rangeLabel}</div>
                  <div className="text-sm font-extrabold mt-0.5">{rule.score} pts</div>
                  <div className="text-[10px] text-stone-500 truncate mt-0.5">
                    {lang === 'ar' ? (rule.label_ar || rule.label) : (rule.label || rule.label_ar)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tiers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border border-stone-200 rounded-lg overflow-hidden">
            <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الحد الأقصى للتأخير' : 'Max Late (Minutes)'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الدرجة الممنوحة' : 'Awarded Score'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'مقدار الخصم' : 'Arrival Deduction'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الوصف الإنجليزي' : 'English Label'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الوصف العربي' : 'Arabic Label'}</th>
                {isAdmin && <th className="py-2.5 px-3 text-center">{lang === 'ar' ? 'حذف' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {arrivalRules.map((tier, idx) => {
                const isCutoff = tier.max_late_minutes >= 9999;
                const deduction = Math.max(0, maxScore - tier.score);

                return (
                  <tr key={idx} className="hover:bg-stone-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-400">
                      {idx + 1}
                    </td>

                    {/* Max Late Minutes */}
                    <td className="py-2.5 px-3">
                      {isCutoff ? (
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {lang === 'ar' ? '> الحد الأقصى (قطع)' : '> Cutoff (> 30m+)'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-500 font-mono text-xs">≤</span>
                          <input
                            type="number"
                            disabled={!isAdmin}
                            min="1"
                            max="300"
                            value={tier.max_late_minutes}
                            onChange={e => handleUpdateArrivalTier(idx, 'max_late_minutes', Number(e.target.value))}
                            className="w-18 p-1.5 bg-stone-50 border border-stone-300 rounded font-mono font-bold text-xs focus:bg-white focus:outline-none"
                          />
                          <span className="text-stone-500 text-[11px]">{t.minutes}</span>
                        </div>
                      )}
                    </td>

                    {/* Awarded Score */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          disabled={!isAdmin}
                          min="0"
                          max={maxScore}
                          value={tier.score}
                          onChange={e => handleUpdateArrivalTier(idx, 'score', Number(e.target.value))}
                          className="w-18 p-1.5 bg-stone-50 border border-stone-300 rounded font-mono font-extrabold text-xs text-stone-900 focus:bg-white focus:outline-none"
                        />
                        <span className="text-stone-500 text-[11px]">{t.points}</span>
                      </div>
                    </td>

                    {/* Computed Deduction from Max */}
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {deduction === 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          0 pts (Full)
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          -{deduction} pts (-{Math.round((deduction / maxScore) * 100)}%)
                        </span>
                      )}
                    </td>

                    {/* English Label */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={tier.label || ''}
                        onChange={e => handleUpdateArrivalTier(idx, 'label', e.target.value)}
                        placeholder="e.g. ≤ 5 min late"
                        className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* Arabic Label */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={tier.label_ar || ''}
                        onChange={e => handleUpdateArrivalTier(idx, 'label_ar', e.target.value)}
                        placeholder="مثال: في الموعد"
                        className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded text-xs focus:bg-white focus:outline-none"
                      />
                    </td>

                    {/* Delete Action */}
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={arrivalRules.length <= 1}
                          onClick={() => handleRemoveArrivalTier(idx)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          title={lang === 'ar' ? 'حذف الشريحة' : 'Remove tier'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Live Scoring Simulator */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white p-6 rounded-2xl shadow-md border border-stone-800">
        <div className="flex items-center gap-2 mb-2 text-amber-400">
          <Calculator className="w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wide uppercase">
            {lang === 'ar' ? 'محاكي الحساب التفاعلي المباشر (Live Rule Simulator)' : 'Live Interactive Scoring Formula Simulator'}
          </h3>
        </div>
        <p className="text-xs text-stone-400 mb-5">
          {lang === 'ar'
            ? 'جرّب القيم المعدلة مباشرة لمعاينة كيف سيتم احتساب درجات المشارك وخصومات الخروج قبل اعتماد القواعد.'
            : 'Test drive your scoring parameters in real-time. Slide arrival delay and exit duration to verify exact calculations.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4 bg-stone-800/60 p-4 rounded-xl border border-stone-700/60 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-stone-300 font-bold">
                  {lang === 'ar' ? 'تأخير وقت الوصول (دقائق)' : 'Arrival Delay After Start Time'}
                </span>
                <span className="text-amber-300 font-extrabold bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                  {simLateMinutes} {t.minutes}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={simLateMinutes}
                onChange={e => setSimLateMinutes(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono mt-1">
                <span>0m (On Time)</span>
                <span>15m late</span>
                <span>30m late</span>
                <span>45m+ late</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-stone-300 font-bold">
                  {lang === 'ar' ? 'إجمالي الدقائق بالخارج (خروج مؤقت)' : 'Total Cumulative Time Outside'}
                </span>
                <span className="text-rose-300 font-extrabold bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                  {simTotalTimeOut} {t.minutes}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={simTotalTimeOut}
                onChange={e => setSimTotalTimeOut(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono mt-1">
                <span>0m (No exit)</span>
                <span>Grace: {gracePeriod}m</span>
                <span>15m out</span>
                <span>30m out</span>
              </div>
            </div>
          </div>

          {/* Mathematical Step-by-Step Breakdown */}
          <div className="bg-stone-800/90 p-4 rounded-xl border border-stone-700 flex flex-col justify-between">
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-700/80">
                <span className="text-stone-400">1. {lang === 'ar' ? 'درجة الوصول الأولية' : 'Arrival Base Score'}:</span>
                <span className="font-bold text-amber-300">{simCalculation.baseScore} pts</span>
              </div>

              <div className="flex items-center justify-between pb-1.5 border-b border-stone-700/80">
                <span className="text-stone-400">
                  2. {lang === 'ar' ? 'الوقت الخاضع للخصم' : 'Deductible Absence'}:
                </span>
                <span className="text-stone-200">
                  MAX(0, {simTotalTimeOut}m - {gracePeriod}m) = <strong className="text-sky-300">{simCalculation.deductibleMinutes} min</strong>
                </span>
              </div>

              <div className="flex items-center justify-between pb-1.5 border-b border-stone-700/80">
                <span className="text-stone-400">
                  3. {lang === 'ar' ? 'مجموع خصم الخروج' : 'Exit Penalty Deduction'}:
                </span>
                <span className="text-stone-200">
                  {simCalculation.deductibleMinutes}m × {deductionRate} = <strong className="text-rose-400">-{simCalculation.totalDeduction} pts</strong>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-300 font-bold uppercase tracking-wider">
                  4. {lang === 'ar' ? 'الدرجة النهائية للمشارك' : 'Calculated Final Score'}:
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {simCalculation.finalScore} / {maxScore} pts
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-700/60 text-[11px] text-stone-400 flex items-center justify-between">
              <span>{lang === 'ar' ? 'مطابق لمعايير الأوديت والسيرفر' : 'Verified Server-Authoritative Formula'}</span>
              <span className="text-amber-400 font-bold">
                {Math.round((simCalculation.finalScore / maxScore) * 100)}% Grade
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Application Scope & Execution */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <Calendar className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-sm text-stone-900">
            {lang === 'ar' ? 'نطاق التطبيق والحفظ للجلسات' : 'Save & Application Scope'}
          </h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          {lang === 'ar'
            ? 'حدد الجلسات والفقرات التي سيتم تطبيق هذه القواعد عليها، وما إذا كنت ترغب في إعادة احتساب درجات الحضور الحالية تلقائياً.'
            : 'Specify whether these scoring rules apply to new future events only, the active session, or all existing conference sessions.'}
        </p>

        {/* Scope Radio Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Option 1: All existing & future */}
          <label 
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              scope === 'all' 
                ? 'bg-amber-50/70 border-amber-500 shadow-2xs' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <input
              type="radio"
              name="scope"
              disabled={!isAdmin}
              checked={scope === 'all'}
              onChange={() => setScope('all')}
              className="mt-1 accent-amber-600"
            />
            <div>
              <span className="font-bold text-xs text-stone-900 block">
                {lang === 'ar' ? 'تطبيق على جميع الجلسات (الحالية + القادمة + المستقبلية)' : 'Apply to All Sessions (Active + Scheduled + Future)'}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {lang === 'ar'
                  ? 'يحفظ القواعد كقالب افتراضي لجميع الجلسات الجديدة، ويحدث فوراً كل جلسات المؤتمر المسجلة.'
                  : 'Saves as default template and updates all existing conference sessions in the database.'}
              </span>
            </div>
          </label>

          {/* Option 2: Active Session Only */}
          <label 
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              scope === 'active' 
                ? 'bg-amber-50/70 border-amber-500 shadow-2xs' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <input
              type="radio"
              name="scope"
              disabled={!isAdmin}
              checked={scope === 'active'}
              onChange={() => setScope('active')}
              className="mt-1 accent-amber-600"
            />
            <div>
              <span className="font-bold text-xs text-stone-900 block">
                {lang === 'ar' 
                  ? `تطبيق على الجلسة النشطة الآن فقط (${activeEvent?.name_ar || activeEvent?.name || 'لا توجد'})` 
                  : `Apply to Active Session Only (${activeEvent?.name || 'None'})`}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {lang === 'ar'
                  ? 'يحدث الجلسة النشطة الحالية فقط ويحفظ القواعد كقالب للجلسات الجديدة المستقبلية.'
                  : 'Updates the ongoing active session and saves as global template for future new sessions.'}
              </span>
            </div>
          </label>

          {/* Option 3: Future Events Only */}
          <label 
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              scope === 'future' 
                ? 'bg-amber-50/70 border-amber-500 shadow-2xs' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <input
              type="radio"
              name="scope"
              disabled={!isAdmin}
              checked={scope === 'future'}
              onChange={() => setScope('future')}
              className="mt-1 accent-amber-600"
            />
            <div>
              <span className="font-bold text-xs text-stone-900 block">
                {lang === 'ar' ? 'حفظ كقالب للجلسات الجديدة المستقبلية فقط' : 'Future New Sessions Only (Default Template)'}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {lang === 'ar'
                  ? 'لا يغير أي جلسة قائمة بالفعل، ويطبق القواعد تلقائياً عند إنشاء أي جلسة مؤتمر جديدة.'
                  : 'Preserves all existing sessions unchanged. Auto-applies to newly created sessions.'}
              </span>
            </div>
          </label>

          {/* Option 4: Selected Events */}
          <label 
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              scope === 'selected' 
                ? 'bg-amber-50/70 border-amber-500 shadow-2xs' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <input
              type="radio"
              name="scope"
              disabled={!isAdmin}
              checked={scope === 'selected'}
              onChange={() => setScope('selected')}
              className="mt-1 accent-amber-600"
            />
            <div>
              <span className="font-bold text-xs text-stone-900 block">
                {lang === 'ar' ? 'اختيار جلسات محددة يدوياً' : 'Select Specific Existing Sessions'}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {lang === 'ar'
                  ? 'اختر الجلسات المراد تطبيق القواعد عليها من القائمة.'
                  : 'Manually pick which existing sessions will receive these rules.'}
              </span>
            </div>
          </label>
        </div>

        {/* Multi-select events if scope === 'selected' */}
        {scope === 'selected' && (
          <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-700 block mb-2">
              {lang === 'ar' ? 'اختر الجلسات المستهدفة:' : 'Choose Target Sessions:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {events.map(ev => {
                const checked = selectedEventIds.includes(ev.id);
                return (
                  <label key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200 text-xs cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedEventIds([...selectedEventIds, ev.id]);
                        } else {
                          setSelectedEventIds(selectedEventIds.filter(id => id !== ev.id));
                        }
                      }}
                      className="accent-amber-600"
                    />
                    <span className="font-bold text-stone-800 truncate">
                      {lang === 'ar' ? ev.name_ar : ev.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono ml-auto">
                      ({ev.status})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Recalculate Attendances Option */}
        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex items-start gap-3">
          <input
            id="checkbox-recalculate"
            type="checkbox"
            disabled={!isAdmin || scope === 'future'}
            checked={recalculateAttendances && scope !== 'future'}
            onChange={e => setRecalculateAttendances(e.target.checked)}
            className="mt-1 accent-amber-700"
          />
          <div className="flex-1 text-xs">
            <label htmlFor="checkbox-recalculate" className="font-bold text-stone-900 cursor-pointer block">
              {lang === 'ar' 
                ? 'إعادة احتساب درجات الحضور الحالية فوراً في الجلسات المحددة (Retroactive Recalculation)'
                : 'Immediately Recalculate Existing Participant Attendance Scores'}
            </label>
            <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
              {lang === 'ar'
                ? 'يعيد السيرفر فوراً تطبيق شرائح الوصول ونسب الخصم على جميع سجلات الحضور السابقة لتحديث لوحة الشرف ونقاط الفرق. يتم الحفاظ على الاستثناءات الإدارية اليدوية (Override) لضمان نزاهة سجل التدقيق.'
                : 'Authoritatively re-evaluates arrival base scores and exit duration deductions against existing attendance records. Note: Manual administrative overrides are strictly preserved for audit integrity.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-stone-400" />
            <span>
              {lastSavedConfig?.updated_at ? (
                <>
                  {lang === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                  <span className="font-mono">{new Date(lastSavedConfig.updated_at).toLocaleString()}</span>
                </>
              ) : (
                <span>{lang === 'ar' ? 'الإعدادات الأولية للنظام' : 'System Initial Defaults'}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAdmin && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAndApply}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{lang === 'ar' ? 'جارٍ الحفظ وإعادة الحساب...' : 'Saving & Recalculating...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حفظ وتطبيق القواعد الآن' : 'Save & Apply Scoring Rules'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
