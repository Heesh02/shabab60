import React from 'react';
import { 
  Users, 
  UserCheck, 
  LogOut, 
  UserX, 
  Award, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { DashboardStats, Team, Attendance } from '../types';
import { translations, Language } from '../utils/i18n';
import { LiveTimer } from './LiveTimer';

interface DashboardViewProps {
  lang: Language;
  stats: DashboardStats | null;
  teams: Team[];
  attendances: Attendance[];
  onNavigateTab: (tab: string) => void;
  onOpenAttendanceDetail: (attendance: Attendance) => void;
  onSelectQuickExit: (attendanceId: string) => void;
  onSelectQuickReturn: (attendanceId: string) => void;
  userRole: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  stats,
  teams,
  attendances,
  onNavigateTab,
  onOpenAttendanceDetail,
  onSelectQuickExit,
  onSelectQuickReturn,
  userRole
}) => {
  const t = translations[lang];

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { active_event } = stats;
  const outsideAttendees = attendances.filter(a => a.status === 'TEMPORARILY_OUT');

  return (
    <div id="dashboard-view-container" className="space-y-6">
      {/* Current Active Event Banner (PRD Section 29) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b263b] via-[#162132] to-[#0d1b2a] text-white p-6 shadow-md border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {active_event ? (lang === 'ar' ? 'جلسة جارية الآن' : 'Session In Progress') : (lang === 'ar' ? 'لا توجد جلسة نشطة' : 'No Active Session')}
              </span>
              {active_event && (
                <span className="text-xs text-amber-300/80 font-mono">
                  {new Date(active_event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(active_event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100 tracking-tight">
              {active_event ? (lang === 'ar' ? active_event.name_ar : active_event.name) : t.res_no_active_event}
            </h1>
            {active_event && (
              <p className="text-sm text-stone-300 mt-1 max-w-xl">
                {lang === 'ar' 
                  ? `الدرجة القصوى: ${active_event.maximum_score} درجة • سماح الخروج: ${active_event.grace_period_minutes} دقيقة • الخصم: ${active_event.exit_deduction_rate} درجة/دقيقة` 
                  : `Max Score: ${active_event.maximum_score} pts • Exit Grace: ${active_event.grace_period_minutes} min • Rate: ${active_event.exit_deduction_rate} pts/min`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <button
                id="btn-goto-scoring-rules"
                type="button"
                onClick={() => onNavigateTab('scoring-rules')}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5"
                title={lang === 'ar' ? 'إعدادات قواعد احتساب الدرجات' : 'Scoring Rules Configuration'}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{t.nav_scoring_rules}</span>
              </button>
            )}

            <button
              id="btn-goto-scanner"
              type="button"
              onClick={() => onNavigateTab('scanner')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              {t.nav_scanner}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (PRD Section 29) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase">
            <span>{t.total_participants}</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {stats.total_participants}
            </span>
            <span className="text-xs text-stone-400 block mt-0.5">{lang === 'ar' ? 'مشارك مسجل' : 'Registered youth'}</span>
          </div>
        </div>

        {/* Present Now */}
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold uppercase">
            <span>{t.present_now}</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
              {stats.present_count}
            </span>
            <span className="text-xs text-emerald-700 block mt-0.5">
              {stats.total_participants > 0 ? `${Math.round((stats.present_count / stats.total_participants) * 100)}%` : '0%'} {lang === 'ar' ? 'من الإجمالي' : 'of total'}
            </span>
          </div>
        </div>

        {/* Temporarily Out */}
        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold uppercase">
            <span>{t.outside_now}</span>
            <LogOut className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
                {stats.temporarily_out_count}
              </span>
              <span className="text-xs text-amber-800 block mt-0.5">{lang === 'ar' ? 'عداد يعمل' : 'Timer active'}</span>
            </div>
            {stats.temporarily_out_count > 0 && (
              <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            )}
          </div>
        </div>

        {/* Not Attended */}
        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold uppercase">
            <span>{t.not_attended}</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-900">
              {stats.not_attended_count}
            </span>
            <span className="text-xs text-rose-700 block mt-0.5">{lang === 'ar' ? 'غائب / لم يسجل' : 'Absent yet'}</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="col-span-2 lg:col-span-1 bg-stone-900 text-white p-4 rounded-xl border border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase">
            <span>{t.avg_score}</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats.average_score}
              </span>
              <span className="text-xs text-stone-400">/ 100</span>
            </div>
            <span className="text-xs text-amber-300/80 block mt-0.5">{lang === 'ar' ? 'للحاضرين حالياً' : 'Current session'}</span>
          </div>
        </div>
      </div>

      {/* Live Temporarily Out Watch Strip (PRD Section 18: Live Temporary Exit Timer) */}
      {outsideAttendees.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></span>
              <h3 className="font-bold text-amber-950 text-sm sm:text-base flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                {lang === 'ar' ? 'المشاركون بالخارج حالياً (عداد الخروج المباشر)' : 'Participants Outside Now (Live Exit Timers)'}
              </h3>
            </div>
            <span className="text-xs font-medium text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
              {outsideAttendees.length} {lang === 'ar' ? 'مشاركين بالخارج' : 'outside'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {outsideAttendees.map((att) => (
              <div 
                key={att.id}
                className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900 text-sm">
                      {att.participant_name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {att.participant_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                    <span>
                      {t.exited_at} {att.active_exit ? new Date(att.active_exit.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {att.active_exit && (
                    <LiveTimer exitTimeIso={att.active_exit.exit_time} />
                  )}
                  {userRole !== 'supervisor' && (
                    <button
                      type="button"
                      onClick={() => onSelectQuickReturn(att.id)}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition"
                    >
                      {t.btn_record_return}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Progress Overview & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              {lang === 'ar' ? 'متابعة أداء الفرق' : 'Team Performance Overview'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('daily-scores')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-200"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'المراقب اليومي' : 'Daily Monitor'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('leaderboard')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === 'ar' ? 'عرض لوحة الترتيب' : 'View Leaderboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team) => (
              <div 
                key={team.id}
                className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/50 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: team.color }}
                    ></span>
                    <span className="font-bold text-stone-800 text-sm">
                      {lang === 'ar' ? team.name_ar : team.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-700">
                    {team.total_score || 0} {t.points}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200/80">
                  <span>{team.participant_count || 0} {lang === 'ar' ? 'مشاركين' : 'members'}</span>
                  <span>{lang === 'ar' ? 'المتوسط' : 'Avg'}: {team.average_score || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Actions Feed (PRD Section 38) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-stone-700" />
                {lang === 'ar' ? 'أحدث عمليات التسجيل' : 'Recent Activity Log'}
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
            </div>

            <div className="space-y-3">
              {stats.recent_audits?.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-b border-stone-100 pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">{log.participant_name || log.action}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-600 mt-0.5 truncate">
                    {lang === 'ar' && log.details_ar ? log.details_ar : log.details}
                  </p>
                  <span className="text-[10px] text-stone-400">
                    {log.performed_by}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500">
            <span>{t.conference_system}</span>
            <span className="font-mono text-[11px] text-amber-700 font-semibold">D365 Model V1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
