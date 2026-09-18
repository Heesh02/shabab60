import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  LogOut, 
  ArrowRightLeft, 
  Edit3, 
  Eye, 
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Attendance, Team, Event, Participant } from '../types';
import { translations, Language } from '../utils/i18n';
import { LiveTimer } from './LiveTimer';

interface AttendanceViewProps {
  lang: Language;
  attendances: Attendance[];
  participants: Participant[];
  teams: Team[];
  events: Event[];
  activeEventId: string | null;
  selectedEventId: string;
  onSelectEventId: (id: string) => void;
  onOpenDetailModal: (attendance: Attendance) => void;
  onOpenOverrideModal: (attendance: Attendance) => void;
  onRegisterExit: (attendanceId: string) => void;
  onRegisterReturn: (attendanceId: string) => void;
  userRole: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  lang,
  attendances,
  participants,
  teams,
  events,
  activeEventId,
  selectedEventId,
  onSelectEventId,
  onOpenDetailModal,
  onOpenOverrideModal,
  onRegisterExit,
  onRegisterReturn,
  userRole
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Build full combined list including un-attended participants for complete conference visibility
  const combinedList = useMemo(() => {
    const activeParticipants = participants.filter(p => p.active);
    const attendedParticipantIds = new Set(attendances.map(a => a.participant_id));

    // Existing attendances
    const items = [...attendances];

    // Add un-attended participants as synthetic NOT_ATTENDED records if viewing current or selected event
    if (selectedStatusFilter === 'all' || selectedStatusFilter === 'NOT_ATTENDED') {
      activeParticipants.forEach(p => {
        if (!attendedParticipantIds.has(p.id)) {
          const team = teams.find(t => t.id === p.team_id);
          const currentEv = events.find(e => e.id === selectedEventId);
          items.push({
            id: `not-att-${p.id}`,
            participant_id: p.id,
            participant_name: p.full_name,
            participant_number: p.participant_number,
            team_id: p.team_id,
            team_name: team?.name,
            team_name_ar: team?.name_ar,
            event_id: selectedEventId,
            event_name: currentEv?.name,
            event_name_ar: currentEv?.name_ar,
            arrival_time: '',
            base_score: 0,
            total_time_out_minutes: 0,
            grace_period_minutes: currentEv?.grace_period_minutes || 2,
            deductible_minutes: 0,
            deduction_rate: currentEv?.exit_deduction_rate || 2,
            total_deduction: 0,
            final_score: 0,
            status: 'NOT_ATTENDED',
            override_score: null,
            override_reason: null,
            override_by: null,
            override_date: null,
            created_by: '',
            created_at: '',
            updated_at: '',
            exits: []
          });
        }
      });
    }

    return items;
  }, [attendances, participants, teams, events, selectedEventId, selectedStatusFilter]);

  // Filter combined list
  const filteredList = useMemo(() => {
    return combinedList.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.participant_name || '').toLowerCase().includes(q);
        const matchesNum = (item.participant_number || '').toLowerCase().includes(q);
        if (!matchesName && !matchesNum) return false;
      }

      // Team
      if (selectedTeamFilter !== 'all' && item.team_id !== selectedTeamFilter) {
        return false;
      }

      // Status
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [combinedList, searchQuery, selectedTeamFilter, selectedStatusFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Participant Number', 'Full Name', 'Team', 'Status', 'Arrival Time', 'Base Score', 'Time Out (min)', 'Deduction', 'Final Score', 'Overridden'];
    const rows = filteredList.map(a => [
      a.participant_number || '',
      `"${a.participant_name || ''}"`,
      `"${a.team_name || ''}"`,
      a.status,
      a.arrival_time ? new Date(a.arrival_time).toLocaleTimeString() : 'N/A',
      a.base_score,
      a.total_time_out_minutes,
      a.total_deduction,
      a.final_score,
      a.override_score !== null ? `Yes (${a.override_score})` : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `conference_attendance_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="attendance-view-container" className="space-y-6">
      {/* Top Header & Event Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span>{t.nav_attendance}</span>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
              {filteredList.length} {lang === 'ar' ? 'سجل' : 'records'}
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'ar' ? 'عرض حي لبيانات الحضور والخروج المؤقت وحساب الدرجات الدقيق' : 'Live attendance tracking, exit durations, and automatic score calculations'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Event dropdown */}
          <select
            id="select-event-filter"
            value={selectedEventId}
            onChange={(e) => onSelectEventId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {lang === 'ar' ? ev.name_ar : ev.name} {ev.status === 'active' ? `(${lang === 'ar' ? 'نشط الآن' : 'Active'})` : `(${ev.status})`}
              </option>
            ))}
          </select>

          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.export_data}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (PRD Section 31: Filtering by Participant, Team, Status) */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-attendees"
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Team filter */}
        <select
          id="select-team-filter"
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
        >
          <option value="all">{t.all_teams}</option>
          {teams.map(tm => (
            <option key={tm.id} value={tm.id}>
              {lang === 'ar' ? tm.name_ar : tm.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          id="select-status-filter"
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
        >
          <option value="all">{t.all_statuses}</option>
          <option value="PRESENT">{t.status_present}</option>
          <option value="TEMPORARILY_OUT">{t.status_temporarily_out}</option>
          <option value="NOT_ATTENDED">{t.status_not_attended}</option>
          <option value="COMPLETED">{t.status_completed}</option>
        </select>
      </div>

      {/* Attendance Table / Cards (Desktop & Mobile-Optimized) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-sm">
            {lang === 'ar' ? 'لا توجد سجلات تطابق شروط البحث المختارة.' : 'No attendees match your search filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{lang === 'ar' ? 'المشارك' : 'Participant'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الفريق' : 'Team'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4">{t.arrival_time}</th>
                  <th className="py-3 px-4">{t.total_time_out}</th>
                  <th className="py-3 px-4">{t.final_score}</th>
                  <th className="py-3 px-4 text-right">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredList.map((att) => {
                  const isAttended = att.status !== 'NOT_ATTENDED';
                  const isPresent = att.status === 'PRESENT';
                  const isOut = att.status === 'TEMPORARILY_OUT';

                  return (
                    <tr 
                      key={att.id} 
                      className={`hover:bg-amber-50/40 transition-colors ${
                        isOut ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Participant */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <span>{att.participant_name}</span>
                          {att.override_score !== null && (
                            <span 
                              title={`Override: ${att.override_reason}`}
                              className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.2 rounded border border-purple-200"
                            >
                              {lang === 'ar' ? 'معدل يدوياً' : 'Overridden'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-stone-400">
                          {att.participant_number}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4 text-stone-600">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700">
                          {lang === 'ar' ? (att.team_name_ar || att.team_name) : att.team_name}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {att.status === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t.status_present}
                          </span>
                        )}
                        {att.status === 'TEMPORARILY_OUT' && (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                              {t.status_temporarily_out}
                            </span>
                            {att.active_exit && (
                              <LiveTimer exitTimeIso={att.active_exit.exit_time} className="text-[11px] py-0.5 px-1.5" />
                            )}
                          </div>
                        )}
                        {att.status === 'NOT_ATTENDED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                            {t.status_not_attended}
                          </span>
                        )}
                        {att.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-200 px-2 py-0.5 rounded-full">
                            {t.status_completed}
                          </span>
                        )}
                      </td>

                      {/* Arrival */}
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {att.arrival_time ? new Date(att.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>

                      {/* Time out */}
                      <td className="py-3 px-4">
                        {isAttended ? (
                          <span className={`font-mono ${att.total_time_out_minutes > 0 ? 'text-amber-800 font-bold' : 'text-stone-400'}`}>
                            {att.total_time_out_minutes} {t.minutes}
                          </span>
                        ) : (
                          <span className="text-stone-300">--</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4">
                        {isAttended ? (
                          <div className="flex items-center gap-1">
                            <span className={`font-extrabold text-sm ${att.final_score >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {att.final_score}
                            </span>
                            <span className="text-[10px] text-stone-400">/{att.base_score}</span>
                          </div>
                        ) : (
                          <span className="text-stone-300">0</span>
                        )}
                      </td>

                      {/* Actions (PRD Sections 12 & 28) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Modal Trigger */}
                          {isAttended && (
                            <button
                              type="button"
                              onClick={() => onOpenDetailModal(att)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition cursor-pointer"
                              title={t.details}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {/* Servant Temporary Exit button */}
                          {isPresent && userRole !== 'supervisor' && (
                            <button
                              type="button"
                              onClick={() => onRegisterExit(att.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition cursor-pointer flex items-center gap-1"
                              title={t.btn_temp_exit}
                            >
                              <LogOut className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden sm:inline">{t.btn_temp_exit}</span>
                            </button>
                          )}

                          {/* Servant Record Return button */}
                          {isOut && userRole !== 'supervisor' && (
                            <button
                              type="button"
                              onClick={() => onRegisterReturn(att.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition cursor-pointer flex items-center gap-1"
                              title={t.btn_record_return}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="hidden sm:inline">{t.btn_record_return}</span>
                            </button>
                          )}

                          {/* Admin Score Override button (PRD Section 28) */}
                          {isAttended && userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => onOpenOverrideModal(att)}
                              className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-md transition cursor-pointer"
                              title={t.btn_override}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
