import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trophy, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Sparkles, 
  Award, 
  Check, 
  AlertTriangle,
  UserCheck,
  Shield,
  Palette
} from 'lucide-react';
import { Team } from '../types';
import { translations, Language } from '../utils/i18n';

interface TeamsViewProps {
  lang: Language;
  teams: Team[];
  onCreateTeam: (teamData: { name: string; name_ar: string; color: string; leader_name?: string }) => Promise<void>;
  onUpdateTeam: (id: string, updates: { name: string; name_ar: string; color: string; leader_name?: string }) => Promise<void>;
  onDeleteTeam: (id: string, reassignToTeamId?: string) => Promise<void>;
  userRole: string;
}

const COLOR_PRESETS = [
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'Deep Purple', hex: '#7c3aed' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Indigo', hex: '#4338ca' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Dark Slate', hex: '#334155' }
];

export const TeamsView: React.FC<TeamsViewProps> = ({
  lang,
  teams,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  userRole
}) => {
  const t = translations[lang];
  const isAdmin = userRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Create Team Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newLeader, setNewLeader] = useState('');
  const [newColor, setNewColor] = useState('#d97706');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Team Modal
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editLeader, setEditLeader] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Team Modal
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Success / Notice banner
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Filtered teams
  const filteredTeams = teams.filter(team => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      team.name.toLowerCase().includes(q) ||
      team.name_ar.toLowerCase().includes(q) ||
      (team.leader_name && team.leader_name.toLowerCase().includes(q))
    );
  });

  // Top team & stats calculation (Sorted by Mean Score for fair competition across unequal team counts)
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, t) => sum + (t.participant_count || 0), 0);
  const topTeam = teams.length > 0 ? [...teams].sort((a, b) => (b.average_score || 0) - (a.average_score || 0))[0] : null;
  const maxMeanScore = topTeam?.average_score || 1;
  const averageTeamMeanScore = totalTeams > 0
    ? Number((teams.reduce((sum, t) => sum + (t.average_score || 0), 0) / totalTeams).toFixed(1))
    : 0;

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsSubmittingCreate(true);
      await onCreateTeam({
        name: newName.trim(),
        name_ar: newNameAr.trim() || newName.trim(),
        color: newColor,
        leader_name: newLeader.trim()
      });
      setNewName('');
      setNewNameAr('');
      setNewLeader('');
      setNewColor('#d97706');
      setIsCreateOpen(false);
      showNotice(t.team_created_success);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditNameAr(team.name_ar);
    setEditLeader(team.leader_name || '');
    setEditColor(team.color);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;

    try {
      setIsSubmittingEdit(true);
      await onUpdateTeam(editingTeam.id, {
        name: editName.trim(),
        name_ar: editNameAr.trim() || editName.trim(),
        color: editColor,
        leader_name: editLeader.trim()
      });
      setEditingTeam(null);
      showNotice(t.team_updated_success);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (team: Team) => {
    setDeletingTeam(team);
    // Find default fallback team
    const fallback = teams.find(t => t.id !== team.id);
    setReassignTargetId(fallback?.id || '');
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingTeam) return;

    try {
      setIsSubmittingDelete(true);
      await onDeleteTeam(deletingTeam.id, reassignTargetId || undefined);
      setDeletingTeam(null);
      showNotice(t.team_deleted_success);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div id="teams-view-container" className="space-y-6">
      {/* Notice Banner */}
      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="text-emerald-700 hover:text-emerald-950">✕</button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-6 text-white border border-amber-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
              {lang === 'ar' ? 'إدارة التنافس والفرق' : 'Conference Team Management'}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {t.teams_title}
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-xl">
            {t.teams_subtitle}
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-team-trigger"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.btn_add_team}</span>
          </button>
        )}
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.total_teams}</span>
            <span className="text-xl font-black text-stone-900 font-mono">{totalTeams}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.total_participants}</span>
            <span className="text-xl font-black text-stone-900 font-mono">{totalMembers}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.top_scoring_team}</span>
            <span className="text-base font-black text-stone-900 truncate block">
              {topTeam ? (lang === 'ar' ? topTeam.name_ar : topTeam.name) : '-'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.team_avg_score}</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {averageTeamMeanScore} <span className="text-[10px] text-stone-400 font-normal">{t.points}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Fairness Scoring Callout Banner */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-bold">{lang === 'ar' ? 'معيار التكافؤ العادل مفعّل:' : 'Fair Scoring Rule:'}</strong> {t.mean_score_explanation}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-md shrink-0 border border-amber-300">
          {t.chart_fairness_tag}
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="team-search-input"
            type="text"
            placeholder={lang === 'ar' ? 'بحث باسم الفريق أو الخادم القائد...' : 'Search teams by name or leader...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTeams.map((team, idx) => {
          const isExpanded = expandedTeamId === team.id;
          const rank = team.rank || idx + 1;
          const totalScore = team.total_score || 0;
          const memberCount = team.participant_count || 0;
          const avgScore = team.average_score || (memberCount > 0 ? Number((totalScore / memberCount).toFixed(1)) : 0);
          const percentOfTop = maxMeanScore > 0 ? Math.round((avgScore / maxMeanScore) * 100) : 0;

          return (
            <div 
              key={team.id}
              id={`team-card-${team.id}`}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Bar matching team color */}
              <div className="h-2 w-full" style={{ backgroundColor: team.color }}></div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                {/* Header: Badge, Names, Rank, Action Buttons */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-xl shadow-xs flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                            {lang === 'ar' ? team.name_ar : team.name}
                          </h3>
                          {lang === 'ar' && team.name !== team.name_ar && (
                            <span className="text-[11px] text-stone-400 font-medium">({team.name})</span>
                          )}
                          {lang === 'en' && team.name_ar && (
                            <span className="text-[11px] text-stone-400 font-medium">({team.name_ar})</span>
                          )}
                        </div>
                        {team.leader_name ? (
                          <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center gap-1">
                            <span className="text-stone-400">{lang === 'ar' ? 'الخادم القائد:' : 'Leader:'}</span>
                            <span className="text-stone-700 font-semibold">{team.leader_name}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic mt-0.5">
                            {lang === 'ar' ? 'لم يتم تعيين خادم' : 'No leader assigned'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${
                        rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        rank === 2 ? 'bg-stone-100 text-stone-800 border border-stone-300' :
                        rank === 3 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                        'bg-stone-50 text-stone-600 border border-stone-200'
                      }`}>
                        {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(team)}
                            title={t.btn_edit_team}
                            className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(team)}
                            title={t.btn_delete_team}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* High Visibility Score Card emphasizing Mean Score */}
                  <div className="my-4 p-3 rounded-xl bg-stone-50/80 border border-stone-200/80 grid grid-cols-3 gap-2 text-center items-center">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {t.team_members}
                      </span>
                      <span className="text-base font-black text-stone-800 font-mono mt-0.5 block">
                        {memberCount}
                      </span>
                      <span className="text-[9px] text-stone-400 block">
                        {lang === 'ar' ? 'مشارك' : 'youth'}
                      </span>
                    </div>

                    <div className="border-x border-emerald-200 bg-emerald-50/70 py-1.5 px-1 rounded-lg">
                      <span className="text-[10px] text-emerald-900 uppercase block font-bold">
                        {t.team_mean_score}
                      </span>
                      <span className="text-2xl font-black text-emerald-800 font-mono block tracking-tight">
                        {avgScore}
                      </span>
                      <span className="text-[9px] text-emerald-700 block uppercase font-medium">
                        {t.points} / {lang === 'ar' ? 'مشارك' : 'member'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {t.team_total_score}
                      </span>
                      <span className="text-base font-black text-amber-900 font-mono mt-0.5 block">
                        {totalScore}
                      </span>
                      <span className="text-[9px] text-stone-400 block font-normal">
                        {t.points}
                      </span>
                    </div>
                  </div>

                  {/* Progress Comparison to Top Team */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[10px] text-stone-500 font-medium">
                      <span>{lang === 'ar' ? 'النسبة مقارنة بالمتصدر' : 'Standing vs Leader'}</span>
                      <span className="font-mono font-bold">{percentOfTop}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: team.color, width: `${Math.max(4, percentOfTop)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Members Breakdown Section */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                    className="w-full py-1.5 px-2 flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span>{t.team_member_breakdown} ({memberCount})</span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {team.members && team.members.length > 0 ? (
                        team.members.map((m, mIdx) => (
                          <div 
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono text-stone-400 w-4">{mIdx + 1}.</span>
                              <div className="min-w-0">
                                <span className="font-bold text-stone-800 truncate block">{m.full_name}</span>
                                <span className="text-[10px] text-stone-400 font-mono block">
                                  {m.participant_number} • {m.attended_events_count} {lang === 'ar' ? 'جلسة' : 'sessions'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-amber-800 font-mono text-xs block">
                                {m.total_score}
                              </span>
                              <span className="text-[9px] text-stone-400 block">{t.points}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[11px] text-stone-400 italic bg-stone-50 rounded-lg">
                          {t.no_members_yet}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TEAM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  {t.btn_add_team}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_name_en} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-create-team-name-en"
                  type="text"
                  required
                  placeholder="e.g. St. Maurice"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_name_ar}
                </label>
                <input
                  id="input-create-team-name-ar"
                  type="text"
                  placeholder="مثال: فريق القديس موريس"
                  value={newNameAr}
                  onChange={e => setNewNameAr(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_leader}
                </label>
                <input
                  id="input-create-team-leader"
                  type="text"
                  placeholder="e.g. Servant Mina"
                  value={newLeader}
                  onChange={e => setNewLeader(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.team_color}</span>
                </label>
                
                {/* Preset Palette */}
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setNewColor(preset.hex)}
                      className={`h-7 rounded-lg flex items-center justify-center transition border ${
                        newColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-stone-900 ring-2 ring-amber-500 scale-105'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {newColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="flex-1 p-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-submit-create-team"
                  type="submit"
                  disabled={isSubmittingCreate || !newName.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  {isSubmittingCreate ? '...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  {t.btn_edit_team}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_name_en} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-edit-team-name-en"
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_name_ar}
                </label>
                <input
                  id="input-edit-team-name-ar"
                  type="text"
                  value={editNameAr}
                  onChange={e => setEditNameAr(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t.team_leader}
                </label>
                <input
                  id="input-edit-team-leader"
                  type="text"
                  value={editLeader}
                  onChange={e => setEditLeader(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.team_color}</span>
                </label>
                
                {/* Preset Palette */}
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setEditColor(preset.hex)}
                      className={`h-7 rounded-lg flex items-center justify-center transition border ${
                        editColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-stone-900 ring-2 ring-amber-500 scale-105'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {editColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-300 p-0.5 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="flex-1 p-1.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-submit-edit-team"
                  type="submit"
                  disabled={isSubmittingEdit || !editName.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  {isSubmittingEdit ? '...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEAM CONFIRMATION MODAL */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-stone-200 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {t.delete_team_confirm_title}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'ar' ? deletingTeam.name_ar : deletingTeam.name}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {(deletingTeam.participant_count || 0) > 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <p className="text-stone-800 font-medium">
                    {lang === 'ar' 
                      ? `هذا الفريق يحتوي على ${(deletingTeam.participant_count || 0)} مشارك مسجل. لحماية بيانات الحضور والدرجات، اختر الفريق الجديد لنقلهم إليه:`
                      : `This team currently has ${deletingTeam.participant_count || 0} registered youth members. To preserve attendance and scoring records, select the destination team to reassign them to:`
                    }
                  </p>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {t.reassign_to_label}
                    </label>
                    <select
                      id="select-reassign-team"
                      value={reassignTargetId}
                      onChange={e => setReassignTargetId(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold"
                    >
                      {teams.filter(t => t.id !== deletingTeam.id).map(team => (
                        <option key={team.id} value={team.id}>
                          {lang === 'ar' ? team.name_ar : team.name} ({team.participant_count || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-stone-600">
                  {lang === 'ar'
                    ? 'هل أنت متأكد من حذف هذا الفريق؟ لا يوجد مشاركون حالياً في هذا الفريق.'
                    : 'Are you sure you want to delete this team? No participants are currently assigned to it.'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDeletingTeam(null)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-confirm-delete-team"
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={isSubmittingDelete}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  {isSubmittingDelete ? '...' : t.confirm_delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
