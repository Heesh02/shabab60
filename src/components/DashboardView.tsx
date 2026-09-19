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
  Sliders,
  BarChart3,
  Trophy,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  LabelList 
} from 'recharts';
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

  // Sort teams by mean score (average_score) descending for fair ranking across unequal team sizes
  const sortedTeams = [...teams].sort((a, b) => 
    (b.average_score || 0) - (a.average_score || 0) || (b.total_score || 0) - (a.total_score || 0)
  );

  // Prepare data for the Live 4-Team Mean Score BarChart
  const chartData = sortedTeams.map((team, idx) => {
    const displayName = lang === 'ar' ? team.name_ar : team.name;
    const shortName = lang === 'ar'
      ? team.name_ar.replace('الفريق ', '').replace('الأول', '1').replace('الثاني', '2').replace('الثالث', '3').replace('الرابع', '4')
      : team.name.replace('Team ', 'T');

    return {
      id: team.id,
      name: shortName,
      fullName: displayName,
      color: team.color || '#d97706',
      meanScore: Number((team.average_score || 0).toFixed(1)),
      totalScore: team.total_score || 0,
      participantCount: team.participant_count || 0,
      rank: team.rank || idx + 1
    };
  });

  // Custom high-contrast tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-stone-900/95 text-white p-3.5 rounded-xl shadow-xl border border-stone-700 text-xs backdrop-blur-xs min-w-[210px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: d.color }}></span>
              <span className="font-bold text-white text-sm">{d.fullName}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              #{d.rank}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline gap-3 text-emerald-400 font-bold">
              <span>{lang === 'ar' ? 'متوسط الدرجات (Mean):' : 'Mean Score:'}</span>
              <span className="font-mono text-base font-black">{d.meanScore} <span className="text-[10px] text-emerald-500 font-normal">{t.points}</span></span>
            </div>
            <div className="flex justify-between items-center gap-3 text-stone-300">
              <span>{lang === 'ar' ? 'المجموع الكلي للنقاط:' : 'Total Points:'}</span>
              <span className="font-mono font-semibold text-white">{d.totalScore} {t.points}</span>
            </div>
            <div className="flex justify-between items-center gap-3 text-stone-300">
              <span>{lang === 'ar' ? 'عدد الأعضاء المسجلين:' : 'Registered Members:'}</span>
              <span className="font-mono font-semibold text-white">{d.participantCount} {lang === 'ar' ? 'مشارك' : 'youth'}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
              <span>{lang === 'ar' ? 'معيار التكافؤ: المجموع ÷ الأعضاء' : 'Fair: Total ÷ Members'}</span>
              <span className="text-amber-400 font-semibold">{t.chart_fairness_tag}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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

      {/* 4 TEAMS LIVE MEAN SCORE CHART (PRD: Real-time Live Mean Score Chart updating on any scan) */}
      <div id="live-4-teams-mean-chart" className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5">
        {/* Header with live indicator & fairness notice */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {t.chart_live_badge}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {t.chart_fairness_tag}
              </span>
            </div>
            <h3 className="font-black text-stone-900 text-lg sm:text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <span>{t.chart_mean_score_title}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
              {t.mean_score_explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('daily-scores')}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'المراقب اليومي' : 'Daily Monitor'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'ar' ? 'عرض لوحة الترتيب' : 'Leaderboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Recharts Bar Chart */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 25, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="fullName" 
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                label={{ 
                  value: t.chart_mean_axis, 
                  angle: -90, 
                  position: 'insideLeft', 
                  fill: '#64748b', 
                  fontSize: 11,
                  style: { textAnchor: 'middle' },
                  offset: 0
                }}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar 
                dataKey="meanScore" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={64}
                animationDuration={600}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} />
                ))}
                <LabelList 
                  dataKey="meanScore" 
                  position="top" 
                  formatter={(val: any) => `${val} ${t.points}`}
                  style={{ fill: '#1e293b', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4 Teams Executive Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          {sortedTeams.map((team, idx) => {
            const rank = team.rank || idx + 1;
            const meanScore = Number((team.average_score || 0).toFixed(1));
            const memberCount = team.participant_count || 0;
            const totalScore = team.total_score || 0;

            return (
              <div 
                key={team.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 hover:border-amber-300 transition flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: team.color }}
                      ></span>
                      <h4 className="font-extrabold text-stone-900 text-sm truncate max-w-[130px]">
                        {lang === 'ar' ? team.name_ar : team.name}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      rank === 2 ? 'bg-stone-200 text-stone-800' :
                      rank === 3 ? 'bg-orange-100 text-orange-900' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                    </span>
                  </div>

                  <div className="my-2 bg-white p-2.5 rounded-lg border border-stone-200 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">
                      {lang === 'ar' ? 'متوسط الدرجات (Mean)' : 'Mean Score'}
                    </span>
                    <span className="text-xl font-black text-emerald-700 font-mono block">
                      {meanScore} <span className="text-[10px] text-stone-400 font-normal">{t.points}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/80">
                  <span>{memberCount} {lang === 'ar' ? 'مشارك' : 'members'}</span>
                  <span>{lang === 'ar' ? 'المجموع:' : 'Total:'} <strong className="font-mono text-stone-700">{totalScore} {t.points}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Audit Actions Feed (PRD Section 38) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
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
  );
};
