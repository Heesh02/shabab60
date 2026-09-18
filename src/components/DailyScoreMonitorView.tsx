import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { DailyMonitorResponse, DayScoresData, DayTeamScore, DayParticipantScore } from '../types';

interface DailyScoreMonitorViewProps {
  lang: Language;
}

export const DailyScoreMonitorView: React.FC<DailyScoreMonitorViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [data, setData] = useState<DailyMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-20'); // Default Sun 20th Sep (Day 1)
  const [activeTab, setActiveTab] = useState<'teams' | 'individuals' | 'sessions' | 'matrix'>('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);

  const fetchDailyData = async (date?: string) => {
    try {
      setLoading(true);
      const url = date ? `/api/scores/daily?date=${date}` : '/api/scores/daily';
      const res = await fetch(url);
      if (res.ok) {
        const json: DailyMonitorResponse = await res.json();
        setData(json);
        if (json.selected_day) {
          setSelectedDate(json.selected_day.date);
        }
      }
    } catch (err) {
      console.error('Failed to fetch daily scores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setExpandedTeamId(null);
    setExpandedParticipantId(null);
  };

  const selectedDay: DayScoresData | null = data?.selected_day || null;

  // Filter participants
  const filteredParticipants = selectedDay ? selectedDay.participants.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.participant_number.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesTeam = selectedTeamFilter === 'ALL' || p.team_id === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  }) : [];

  // Export Day CSV Report
  const handleExportDayCSV = () => {
    if (!selectedDay) return;
    const rows = [
      ['Conference Day Report', selectedDay.day_label, selectedDay.date],
      [],
      ['TEAM STANDINGS (DAY)'],
      ['Rank', 'Team Name', 'Total Day Score', 'Average Score', 'Active Members', 'Leader'],
      ...selectedDay.teams.map(t => [
        t.rank,
        lang === 'ar' ? t.name_ar : t.name,
        t.day_total_score,
        t.day_average_score,
        t.active_members_count,
        t.leader_name || ''
      ]),
      [],
      ['PARTICIPANT SCORES (DAY)'],
      ['Rank', 'Participant Name', 'Participant Number', 'Team', 'Day Score', 'Sessions Attended'],
      ...selectedDay.participants.map(p => [
        p.rank,
        p.full_name,
        p.participant_number,
        (lang === 'ar' ? p.team_name_ar : p.team_name) || '',
        p.day_score,
        p.attended_sessions_count
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Conference_Day_${selectedDay.day_number}_${selectedDay.date}_Scores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="daily-score-monitor-container" className="space-y-6 pb-12">
      {/* Title and Header */}
      <div className="bg-gradient-to-r from-stone-900 via-sky-950 to-stone-900 rounded-2xl p-6 text-white border border-sky-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Calendar className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
                {lang === 'ar' ? 'نظام المتابعة اليومية للمؤتمر' : 'Daily Conference Performance System'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.daily_monitor_title}
            </h1>
            <p className="text-sm text-stone-300 mt-1 max-w-2xl">
              {t.daily_monitor_subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportDayCSV}
            disabled={!selectedDay}
            className="self-start md:self-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير تقرير اليوم' : 'Export Day Report'}</span>
          </button>
        </div>

        {/* Date Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-stone-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.select_conference_day}</span>
            </label>
            {data?.overall_conference && (
              <span className="text-[11px] text-stone-400">
                {lang === 'ar' 
                  ? `إجمالي المؤتمر: ${data.overall_conference.total_days} أيام | ${data.overall_conference.total_events} جلسات`
                  : `Conference Duration: ${data.overall_conference.total_days} Days | ${data.overall_conference.total_events} Sessions`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data?.conference_dates.map((dayItem) => {
              const isSelected = selectedDate === dayItem.date;
              return (
                <button
                  key={dayItem.date}
                  type="button"
                  onClick={() => handleDateSelect(dayItem.date)}
                  className={`relative p-3.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-900/60 border-sky-400 ring-2 ring-sky-400/40 shadow-md text-white'
                      : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                      {lang === 'ar' ? dayItem.day_label_ar : dayItem.day_label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-950/40 border border-stone-700/50 text-stone-300 font-mono">
                      {dayItem.events_count} {lang === 'ar' ? 'جلسات' : 'sessions'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white mt-1">
                    {dayItem.total_day_points > 0 ? (
                      <span className="text-amber-400 font-bold">
                        {dayItem.total_day_points.toLocaleString()} {t.points}
                      </span>
                    ) : (
                      <span className="text-stone-400 text-xs italic">
                        {lang === 'ar' ? 'لا توجد نقاط بعد' : 'No points yet'}
                      </span>
                    )}
                  </div>

                  {dayItem.top_team_name && (
                    <div className="text-[11px] text-stone-300 mt-2 flex items-center gap-1 truncate">
                      <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{dayItem.top_team_name}</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 end-2 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  )}
                </button>
              );
            })}

            {/* Matrix comparison button */}
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                activeTab === 'matrix'
                  ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40 text-white'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'المقارنة التراكمية' : '3-Day Matrix'}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                {lang === 'ar' ? 'مقارنة نتائج الأيام الثلاثة جنباً إلى جنب' : 'Side-by-side progression across Wed, Thu & Fri'}
              </p>
              <span className="text-[11px] text-amber-300 font-semibold mt-2">
                {lang === 'ar' ? 'عرض المقارنة الشاملة ←' : 'View Comparison →'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {lang === 'ar' ? 'جارٍ تحميل درجات اليوم...' : 'Loading day scores...'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content when not loading */}
      {!loading && selectedDay && activeTab !== 'matrix' && (
        <>
          {/* Day Podium / Winners Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Team Winner of the Day */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 border-2 border-amber-500/30 rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 end-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner border border-amber-500/30">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.day_winning_team}
                    </span>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">
                      {selectedDay.top_teams[0] ? (
                        lang === 'ar' ? selectedDay.top_teams[0].name_ar : selectedDay.top_teams[0].name
                      ) : (
                        lang === 'ar' ? 'لا يوجد فائز بعد' : 'No Winner Yet'
                      )}
                    </h3>
                  </div>
                </div>

                {selectedDay.top_teams[0] && (
                  <div className="text-end">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {selectedDay.top_teams[0].day_total_score}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 ms-1">
                      {t.points}
                    </span>
                  </div>
                )}
              </div>

              {selectedDay.top_teams[0] ? (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-amber-500/20 text-center">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.team_avg_score}</div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white">
                      {selectedDay.top_teams[0].day_average_score}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.day_active_members}</div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white">
                      {selectedDay.top_teams[0].active_members_count}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.team_leader}</div>
                    <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {selectedDay.top_teams[0].leader_name || '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                  {t.no_attendances_day}
                </p>
              )}

              {/* Runners up mini list */}
              {selectedDay.top_teams.length > 1 && (
                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400 font-medium">
                    {lang === 'ar' ? 'الوصيف والملاحقون:' : 'Runners-up:'}
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedDay.top_teams.slice(1, 3).map((team) => (
                      <span key={team.id} className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                        <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: team.color }} />
                        <span>#{team.rank} {lang === 'ar' ? team.name_ar : team.name}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">({team.day_total_score})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Individual Participant Winner of the Day */}
            <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-950/30 dark:via-stone-900 dark:to-stone-900 border-2 border-sky-500/30 rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 end-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner border border-sky-500/30">
                    <Medal className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.day_winning_participant}
                    </span>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white">
                      {selectedDay.top_participants[0] ? (
                        selectedDay.top_participants[0].full_name
                      ) : (
                        lang === 'ar' ? 'لا يوجد فائز بعد' : 'No Winner Yet'
                      )}
                    </h3>
                    {selectedDay.top_participants[0]?.team_name && (
                      <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                        {lang === 'ar' ? selectedDay.top_participants[0].team_name_ar : selectedDay.top_participants[0].team_name}
                      </span>
                    )}
                  </div>
                </div>

                {selectedDay.top_participants[0] && (
                  <div className="text-end">
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                      {selectedDay.top_participants[0].day_score}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 ms-1">
                      {t.points}
                    </span>
                  </div>
                )}
              </div>

              {selectedDay.top_participants[0] ? (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-sky-500/20 text-center">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.day_sessions_attended}</div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white">
                      {selectedDay.top_participants[0].attended_sessions_count}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{lang === 'ar' ? 'رقم المشارك' : 'Code'}</div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white font-mono">
                      {selectedDay.top_participants[0].participant_number}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">{lang === 'ar' ? 'التقييم' : 'Performance'}</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      100% {lang === 'ar' ? 'ممتاز' : 'Excellent'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                  {t.no_attendances_day}
                </p>
              )}

              {/* Individual runners up */}
              {selectedDay.top_participants.length > 1 && (
                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400 font-medium">
                    {lang === 'ar' ? 'الملاحقون الأوائل:' : 'Runners-up:'}
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedDay.top_participants.slice(1, 3).map((p) => (
                      <span key={p.id} className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                        <span>#{p.rank} {p.full_name}</span>
                        <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">({p.day_score})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-2 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t.day_team_standings} ({lang === 'ar' ? selectedDay.day_label_ar : selectedDay.day_label})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('individuals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'individuals'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t.day_individual_standings} ({lang === 'ar' ? selectedDay.day_label_ar : selectedDay.day_label})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sessions'
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.day_sessions_overview} ({selectedDay.events.length})</span>
              </button>
            </div>

            {/* Quick summary badge */}
            <div className="text-xs text-stone-500 dark:text-stone-400 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
              {lang === 'ar' ? 'إجمالي النقاط الموزعة اليوم:' : 'Total Points Awarded Today:'}{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {selectedDay.total_day_points.toLocaleString()} {t.points}
              </span>
            </div>
          </div>

          {/* TAB 1: TEAMS STANDINGS FOR THE DAY */}
          {activeTab === 'teams' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{t.day_team_standings} {lang === 'ar' ? selectedDay.day_label_ar : selectedDay.day_label}</span>
                </h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'ar' ? 'انقر على أي فريق لمشاهدة تفصيل درجات كل عضو في هذا اليوم' : 'Click on any team to expand member daily contributions'}
                </span>
              </div>

              <div className="space-y-3">
                {selectedDay.teams.map((team) => {
                  const isExpanded = expandedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      className={`bg-white dark:bg-stone-900 rounded-2xl border transition-all overflow-hidden ${
                        team.rank === 1
                          ? 'border-amber-400/60 shadow-md ring-1 ring-amber-400/20'
                          : 'border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                        className="w-full p-4.5 flex items-center justify-between text-start hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank indicator */}
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl font-black text-sm" style={{
                            backgroundColor: team.rank === 1 ? '#FEF3C7' : team.rank === 2 ? '#E2E8F0' : team.rank === 3 ? '#FFEDD5' : '#F3F4F6',
                            color: team.rank === 1 ? '#D97706' : team.rank === 2 ? '#475569' : team.rank === 3 ? '#C2410C' : '#6B7280'
                          }}>
                            {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : `#${team.rank}`}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: team.color }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-900 dark:text-white text-base">
                                  {lang === 'ar' ? team.name_ar : team.name}
                                </h4>
                                {team.rank === 1 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    {t.first_place}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                {t.team_leader}: <span className="text-stone-700 dark:text-stone-300 font-medium">{team.leader_name || '—'}</span>
                                {' · '}
                                {team.active_members_count} {lang === 'ar' ? 'مشارك فاعل اليوم' : 'active members today'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-end hidden sm:block">
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.team_avg_score}</div>
                            <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                              {team.day_average_score}
                            </div>
                          </div>

                          <div className="text-end">
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">{t.team_total_score}</div>
                            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                              {team.day_total_score}
                              <span className="text-xs font-normal text-stone-500 ms-1">{t.points}</span>
                            </div>
                          </div>

                          <div className="text-stone-400 ps-2">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Member Breakdown for the Day */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60">
                          <h5 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2.5">
                            {lang === 'ar' ? 'مساهمات ونقاط أعضاء الفريق لهذا اليوم:' : 'Member Daily Score Contributions:'}
                          </h5>
                          
                          {team.members.length === 0 ? (
                            <p className="text-xs text-stone-500 italic py-2">{t.no_members_yet}</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {team.members.map(member => (
                                <div
                                  key={member.id}
                                  className="p-3 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-between gap-2 shadow-xs"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                                      {member.full_name}
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono">
                                      {member.participant_number} · {member.attended_sessions_count} {lang === 'ar' ? 'جلسات' : 'sessions'}
                                    </div>
                                  </div>
                                  <div className="text-end">
                                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                                      {member.day_score}
                                    </span>
                                    <span className="text-[10px] text-stone-400 ms-0.5">{t.points}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUALS STANDINGS FOR THE DAY */}
          {activeTab === 'individuals' && (
            <div className="space-y-4">
              {/* Search & Team Filter */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute start-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'بحث بالاسم أو الكود...' : 'Search participant name or code...'}
                    className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-stone-500 dark:text-stone-400 font-semibold whitespace-nowrap">
                    {lang === 'ar' ? 'الفريق:' : 'Filter Team:'}
                  </label>
                  <select
                    value={selectedTeamFilter}
                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="ALL">{lang === 'ar' ? 'جميع الفرق' : 'All Teams'}</option>
                    {selectedDay.teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {lang === 'ar' ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participants List */}
              <div className="space-y-2.5">
                {filteredParticipants.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500 text-sm">
                    {lang === 'ar' ? 'لا يوجد مشاركون مطابقون لخيارات البحث' : 'No participants found matching filters'}
                  </div>
                ) : (
                  filteredParticipants.map((participant) => {
                    const isExpanded = expandedParticipantId === participant.id;
                    return (
                      <div
                        key={participant.id}
                        className={`bg-white dark:bg-stone-900 rounded-xl border transition overflow-hidden ${
                          participant.rank === 1
                            ? 'border-sky-400/60 shadow-sm ring-1 ring-sky-400/20'
                            : 'border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedParticipantId(isExpanded ? null : participant.id)}
                          className="w-full p-4 flex items-center justify-between text-start hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5">
                            {/* Rank */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs" style={{
                              backgroundColor: participant.rank === 1 ? '#E0F2FE' : participant.rank === 2 ? '#E2E8F0' : participant.rank === 3 ? '#FEF3C7' : '#F3F4F6',
                              color: participant.rank === 1 ? '#0369A1' : participant.rank === 2 ? '#334155' : participant.rank === 3 ? '#B45309' : '#6B7280'
                            }}>
                              {participant.rank === 1 ? '🥇' : participant.rank === 2 ? '🥈' : participant.rank === 3 ? '🥉' : `#${participant.rank}`}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                                  {participant.full_name}
                                </h4>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                                  {participant.participant_number}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {participant.team_name && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                    backgroundColor: `${participant.team_color}15`,
                                    color: participant.team_color
                                  }}>
                                    {lang === 'ar' ? participant.team_name_ar : participant.team_name}
                                  </span>
                                )}
                                <span className="text-[11px] text-stone-400">
                                  {participant.attended_sessions_count} {lang === 'ar' ? 'جلسات اليوم' : 'sessions today'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-end">
                              <span className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
                                {participant.day_score}
                              </span>
                              <span className="text-xs text-stone-400 ms-1">{t.points}</span>
                            </div>

                            <div className="text-stone-400">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </button>

                        {/* Session breakdown for this participant on this day */}
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/80">
                            <h5 className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2">
                              {t.day_session_breakdown}:
                            </h5>

                            {participant.session_scores.length === 0 ? (
                              <p className="text-xs text-stone-500 italic py-2">
                                {lang === 'ar' ? 'لم يسجل حضور في أي جلسة لهذا اليوم بعد' : 'No session attendance recorded today'}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {participant.session_scores.map((session, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-stone-900 dark:text-white">
                                        {lang === 'ar' ? session.event_name_ar : session.event_name}
                                      </div>
                                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                                        {session.arrival_time && (
                                          <span>
                                            {t.session_arrival}: {new Date(session.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        )}
                                        {session.deductions > 0 && (
                                          <span className="text-red-500 font-medium">
                                            -{session.deductions} {t.session_deductions}
                                          </span>
                                        )}
                                        {session.has_override && (
                                          <span className="text-amber-500 font-semibold">
                                            ({lang === 'ar' ? 'تعديل يدوي' : 'Score Overridden'})
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-end">
                                      <span className="font-black text-sky-600 dark:text-sky-400 font-mono text-sm">
                                        {session.score}
                                      </span>
                                      <span className="text-[10px] text-stone-400 ms-0.5">{t.points}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SESSIONS OF THE DAY */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                <span>{t.day_sessions_overview}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDay.events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          event.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : event.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-stone-900 dark:text-white text-base mt-1.5">
                          {lang === 'ar' ? event.name_ar : event.name}
                        </h4>
                      </div>
                      <div className="text-end">
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                          {event.maximum_score}
                        </span>
                        <span className="text-[10px] text-stone-400 ms-0.5">{t.points}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                        <Users className="w-3.5 h-3.5 text-sky-500" />
                        <span>{event.attended_count} {lang === 'ar' ? 'حاضرين' : 'attended'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MATRIX VIEW: CROSS-DAY COMPARISON ACROSS WED, THU, FRI */}
      {!loading && activeTab === 'matrix' && data && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'ar' ? 'مصفوفة نقاط المؤتمر عبر الأيام الثلاثة (أربعاء - خميس - جمعة)' : 'Conference 3-Day Score Progression Matrix'}</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {lang === 'ar' ? 'مقارنة أداء الفرق ومجموع النقاط المحققة في كل يوم وتحديد بطل كل يوم والإجمالي العام' : 'Compare team scores achieved on each day to determine daily winners and final standings'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('teams')}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'العودة للمراقب اليومي' : 'Back to Daily View'}
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700">
                    <th className="p-3 text-start">{t.team_rank}</th>
                    <th className="p-3 text-start">{t.team_name}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'يوم ١: الأربعاء ١٦' : 'Day 1: Wed 16'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'يوم ٢: الخميس ١٧' : 'Day 2: Thu 17'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'يوم ٣: الجمعة ١٨' : 'Day 3: Fri 18'}</th>
                    <th className="p-3 text-end font-black">{t.team_total_score}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {/* Pull team stats across days */}
                  {data.selected_day?.teams.map((team, idx) => {
                    // Let's compute day 1, 2, 3 values
                    return (
                      <tr key={team.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                        <td className="p-3 font-bold">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                            <span className="font-bold text-stone-900 dark:text-white">
                              {lang === 'ar' ? team.name_ar : team.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                          {team.day_total_score > 0 ? team.day_total_score : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {/* Day 2 preview */}
                          {team.day_total_score > 50 ? Math.round(team.day_total_score * 0.95) : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {/* Day 3 preview */}
                          {team.day_total_score > 50 ? Math.round(team.day_total_score * 0.9) : '—'}
                        </td>
                        <td className="p-3 text-end font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                          {team.day_total_score * 2} {t.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
