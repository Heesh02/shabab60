import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Users, 
  Award, 
  Sparkles, 
  Flame,
  Search,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { translations, Language } from '../utils/i18n';

interface LeaderboardData {
  participants: Array<{
    rank: number;
    id: string;
    full_name: string;
    participant_number: string;
    team_name?: string;
    team_name_ar?: string;
    team_color?: string;
    attended_events_count: number;
    total_score: number;
  }>;
  teams: Array<{
    rank: number;
    id: string;
    name: string;
    name_ar: string;
    color: string;
    leader_name?: string;
    member_count: number;
    total_score: number;
    average_score: number;
  }>;
}

interface LeaderboardViewProps {
  lang: Language;
  data: LeaderboardData | null;
  onNavigateToTeams?: () => void;
  onNavigateToDailyScores?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  lang,
  data,
  onNavigateToTeams,
  onNavigateToDailyScores
}) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'individual' | 'teams'>('individual');
  const [searchQuery, setSearchQuery] = useState('');

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredParticipants = data.participants.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    p.participant_number.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div id="leaderboard-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1b263b] to-stone-900 rounded-2xl p-6 text-white border border-amber-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
              {lang === 'ar' ? 'لوحة الشرف والتنافس الروحي' : 'Conference Honor & Scoring Standings'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {t.nav_leaderboard}
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'ar' ? 'تحديث فوري لترتيب المشاركين والفرق بعد كل تسجيل حضور أو خصم' : 'Live updated ranks and scores reflecting arrival times and temporary exits'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-stone-800/90 p-1 rounded-xl flex border border-stone-700">
          <button
            type="button"
            onClick={() => setTab('individual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'individual'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ترتيب الأفراد' : 'Individuals'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('teams')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'teams'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ترتيب الفرق' : 'Teams'}</span>
          </button>
        </div>
      </div>

      {/* Day-by-Day Scores Banner */}
      {onNavigateToDailyScores && (
        <div className="bg-gradient-to-r from-sky-950/60 via-stone-900 to-stone-900 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'مراقب درجات أيام المؤتمر (أربعاء - خميس - جمعة)' : 'Day-by-Day Score Monitor (Wed, Thu & Fri)'}
              </h4>
              <p className="text-xs text-stone-300">
                {lang === 'ar' ? 'استعراض نتائج كل يوم على حدة لتحديد الفائزين يومياً على مستوى الأفراد والفرق' : 'View individual & team performance per day to determine daily winners'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDailyScores}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <span>{lang === 'ar' ? 'فتح المراقب اليومي ←' : 'Open Day Monitor →'}</span>
          </button>
        </div>
      )}

      {/* INDIVIDUAL STANDINGS */}
      {tab === 'individual' && (
        <div className="space-y-4">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.participants.slice(0, 3).map((p, idx) => {
              const medals = ['text-amber-400', 'text-stone-300', 'text-amber-700'];
              const bgColors = ['bg-amber-50/90 border-amber-300', 'bg-stone-50 border-stone-300', 'bg-orange-50/80 border-orange-300'];

              return (
                <div 
                  key={p.id}
                  className={`p-4 rounded-xl border ${bgColors[idx]} shadow-xs flex items-center gap-3 relative overflow-hidden`}
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center font-extrabold text-lg shrink-0">
                    <Medal className={`w-6 h-6 ${medals[idx]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase text-stone-500">#{idx + 1}</span>
                      <span className="font-extrabold text-stone-900 text-sm truncate">{p.full_name}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {lang === 'ar' ? (p.team_name_ar || p.team_name) : p.team_name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-amber-900 font-mono block">
                      {p.total_score}
                    </span>
                    <span className="text-[10px] text-stone-500 block uppercase">{t.points}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Table of all participants */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase">
                  <th className="py-2.5 px-4 w-16">{lang === 'ar' ? 'المركز' : 'Rank'}</th>
                  <th className="py-2.5 px-4">{lang === 'ar' ? 'المشارك' : 'Participant'}</th>
                  <th className="py-2.5 px-4">{lang === 'ar' ? 'الفريق' : 'Team'}</th>
                  <th className="py-2.5 px-4 text-right">{lang === 'ar' ? 'مجموع النقاط' : 'Score'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-stone-600">
                      {p.rank === 1 ? '🥇 1' : p.rank === 2 ? '🥈 2' : p.rank === 3 ? '🥉 3' : `#${p.rank}`}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-stone-900">
                      {p.full_name}
                      <span className="text-[10px] text-stone-400 font-mono ml-2">
                        {p.participant_number}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-stone-600">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700">
                        {lang === 'ar' ? (p.team_name_ar || p.team_name) : p.team_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black font-mono text-sm text-stone-900">
                      {p.total_score} <span className="text-[10px] text-stone-400 font-normal">{t.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEAM STANDINGS */}
      {tab === 'teams' && (
        <div className="space-y-4">
          {/* Fairness info banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-start sm:items-center justify-between gap-3 text-amber-950 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold block sm:inline">
                  {lang === 'ar' ? 'معيار التكافؤ العادل مفعّل:' : 'Fair Scoring Active:'}
                </strong>{' '}
                <span>
                  {t.mean_score_explanation}
                </span>
              </div>
            </div>
            {onNavigateToTeams && (
              <button
                type="button"
                onClick={onNavigateToTeams}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shrink-0"
              >
                {lang === 'ar' ? 'إدارة الفرق' : 'Teams'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.teams.map((team, idx) => {
            const topMean = data.teams[0]?.average_score || 1;
            const percentOfTop = topMean > 0 ? Math.round(((team.average_score || 0) / topMean) * 100) : 0;
            const rank = team.rank || idx + 1;

            return (
              <div 
                key={team.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-full shadow-xs" 
                        style={{ backgroundColor: team.color }}
                      ></span>
                      <h3 className="font-extrabold text-stone-900 text-base">
                        {lang === 'ar' ? team.name_ar : team.name}
                      </h3>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      rank === 2 ? 'bg-stone-200 text-stone-800' :
                      rank === 3 ? 'bg-orange-100 text-orange-900' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                    </span>
                  </div>

                  {team.leader_name && (
                    <p className="text-xs text-stone-500 mb-3">
                      {lang === 'ar' ? 'الخادم القائد:' : 'Leader:'} {team.leader_name}
                    </p>
                  )}

                  {/* Primary Mean Score Box */}
                  <div className="my-3 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold tracking-wide">
                      {lang === 'ar' ? 'متوسط درجات الفريق (المعيار الأساسي للترتيب)' : 'Team Mean Score (Primary Standings Metric)'}
                    </span>
                    <span className="text-2xl font-black text-emerald-800 font-mono mt-0.5 block">
                      {team.average_score} <span className="text-xs font-normal text-emerald-600">{t.points} / {lang === 'ar' ? 'مشارك' : 'member'}</span>
                    </span>
                    <div className="flex items-center justify-center gap-3 mt-1.5 pt-1.5 border-t border-emerald-200/60 text-xs text-stone-600">
                      <span>{lang === 'ar' ? 'المشاركون:' : 'Members:'} <strong className="font-mono text-stone-900">{team.member_count}</strong></span>
                      <span>•</span>
                      <span>{lang === 'ar' ? 'المجموع الكلي:' : 'Total Points:'} <strong className="font-mono text-stone-900">{team.total_score} {t.points}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-stone-500 font-medium mb-1">
                    <span>{lang === 'ar' ? 'النسبة مقارنة بالمتصدر' : 'Standing vs Leader'}</span>
                    <span className="font-mono font-bold">{percentOfTop}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: team.color, 
                        width: `${Math.max(4, Math.min(100, percentOfTop))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};
