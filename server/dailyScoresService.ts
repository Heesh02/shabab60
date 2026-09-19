import { Database } from './db.js';
import { 
  DayScoresData, 
  DailyMonitorResponse, 
  DayEventSummary, 
  DayParticipantScore, 
  DayTeamScore,
  DayParticipantSessionScore
} from '../src/types.js';

const ARABIC_WEEKDAYS: Record<string, string> = {
  Sunday: 'الأحد',
  Monday: 'الاثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت'
};

const ARABIC_MONTHS: Record<string, string> = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل',
  May: 'مايو', Jun: 'يونيو', Jul: 'يوليو', Aug: 'أغسطس',
  Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر'
};

const ARABIC_ORDINALS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];

export function formatDayLabels(dateStr: string, dayIndex: number) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    const weekdayEn = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const monthEn = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const dayNum = d.getUTCDate();
    
    const weekdayAr = ARABIC_WEEKDAYS[weekdayEn] || weekdayEn;
    const monthAr = ARABIC_MONTHS[monthEn] || monthEn;
    const ordAr = ARABIC_ORDINALS[dayIndex] || `${dayIndex + 1}`;

    return {
      day_number: dayIndex + 1,
      day_label: `Day ${dayIndex + 1}: ${weekdayEn}, ${monthEn} ${dayNum}`,
      day_label_ar: `اليوم ${ordAr}: ${weekdayAr}، ${dayNum} ${monthAr}`
    };
  } catch {
    return {
      day_number: dayIndex + 1,
      day_label: `Day ${dayIndex + 1}: ${dateStr}`,
      day_label_ar: `اليوم ${dayIndex + 1}: ${dateStr}`
    };
  }
}

export class DailyScoresService {
  public static getDailyMonitor(db: Database, requestedDate?: string): DailyMonitorResponse {
    const events = db.getEvents();
    const participants = db.getParticipants().filter(p => p.active);
    const attendances = db.getAttendances();
    const teams = db.getTeams();

    // Collect all distinct dates from events, plus default 3 conference days if not present
    const dateSet = new Set<string>();
    
    // Ensure the 3 core conference days are always available as baseline (Sep 20-22, 2026)
    dateSet.add('2026-09-20'); // Sun Day 1
    dateSet.add('2026-09-21'); // Mon Day 2
    dateSet.add('2026-09-22'); // Tue Day 3

    events.forEach(e => {
      if (e.start_time) {
        const dateKey = e.start_time.split('T')[0];
        if (dateKey && dateKey.length === 10) {
          dateSet.add(dateKey);
        }
      }
    });

    const sortedDates = Array.from(dateSet).sort();

    // Map each date into day data
    const allDaysData: DayScoresData[] = sortedDates.map((dateStr, idx) => {
      const labels = formatDayLabels(dateStr, idx);
      
      // Events on this date
      const dayEvents = events
        .filter(e => e.start_time && e.start_time.startsWith(dateStr))
        .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());
      const dayEventIds = new Set(dayEvents.map(e => e.id));
      const dayAttendances = attendances.filter(a => dayEventIds.has(a.event_id));

      const eventSummaries: DayEventSummary[] = dayEvents.map(e => {
        const attCount = dayAttendances.filter(a => a.event_id === e.id).length;
        return {
          id: e.id,
          name: e.name,
          name_ar: e.name_ar,
          type: e.type,
          start_time: e.start_time,
          end_time: e.end_time,
          status: e.status,
          maximum_score: e.maximum_score,
          attended_count: attCount
        };
      });

      // Calculate participant scores for this specific day
      const participantScores: DayParticipantScore[] = participants.map(p => {
        const pAtts = dayAttendances.filter(a => a.participant_id === p.id);
        const dayScore = pAtts.reduce((sum, a) => sum + (a.final_score || 0), 0);
        const team = teams.find(t => t.id === p.team_id);

        const sessionScores: DayParticipantSessionScore[] = pAtts.map(a => {
          const ev = dayEvents.find(e => e.id === a.event_id);
          return {
            event_id: a.event_id,
            event_name: ev?.name || a.event_name || 'Session',
            event_name_ar: ev?.name_ar || a.event_name_ar || 'جلسة',
            score: a.final_score || 0,
            base_score: a.base_score || 0,
            deductions: a.total_deduction || 0,
            status: a.status,
            arrival_time: a.arrival_time,
            has_override: a.override_score !== null
          };
        });

        return {
          id: p.id,
          team_id: p.team_id,
          full_name: p.full_name,
          participant_number: p.participant_number,
          qr_code_id: p.qr_code_id,
          team_name: team?.name,
          team_name_ar: team?.name_ar,
          team_color: team?.color,
          rank: 0,
          day_score: dayScore,
          attended_sessions_count: pAtts.length,
          session_scores: sessionScores
        };
      });

      // Sort participants by day score descending
      participantScores.sort((a, b) => b.day_score - a.day_score);
      const rankedParticipants = participantScores.map((p, pIdx) => ({
        ...p,
        rank: pIdx + 1
      }));

      // Calculate team scores for this day
      const teamScores: DayTeamScore[] = teams.map(team => {
        const teamMembers = rankedParticipants.filter(p => p.team_id === team.id);
        const teamTotal = teamMembers.reduce((sum, m) => sum + m.day_score, 0);
        const activeMembers = teamMembers.filter(m => m.day_score > 0 || m.attended_sessions_count > 0);
        const teamAvg = teamMembers.length > 0 ? Number((teamTotal / teamMembers.length).toFixed(1)) : 0;

        return {
          id: team.id,
          name: team.name,
          name_ar: team.name_ar,
          color: team.color,
          leader_name: team.leader_name,
          rank: 0,
          day_total_score: teamTotal,
          day_average_score: teamAvg,
          active_members_count: activeMembers.length,
          members: teamMembers.map(m => ({
            id: m.id,
            full_name: m.full_name,
            participant_number: m.participant_number,
            day_score: m.day_score,
            attended_sessions_count: m.attended_sessions_count
          }))
        };
      });

      // Sort teams by day average/mean score descending to normalize for unequal team sizes
      teamScores.sort((a, b) => (b.day_average_score - a.day_average_score) || (b.day_total_score - a.day_total_score));
      const rankedTeams = teamScores.map((t, tIdx) => ({
        ...t,
        rank: tIdx + 1
      }));

      const topTeams = rankedTeams.slice(0, 3);
      const topParticipants = rankedParticipants.slice(0, 3);

      const totalDayPoints = rankedParticipants.reduce((sum, p) => sum + p.day_score, 0);
      const avgParticipantScore = rankedParticipants.length > 0 
        ? Number((totalDayPoints / rankedParticipants.length).toFixed(1))
        : 0;

      return {
        date: dateStr,
        day_number: labels.day_number,
        day_label: labels.day_label,
        day_label_ar: labels.day_label_ar,
        events: eventSummaries,
        participants: rankedParticipants,
        teams: rankedTeams,
        top_teams: topTeams,
        top_participants: topParticipants,
        total_day_points: totalDayPoints,
        average_participant_score: avgParticipantScore
      };
    });

    // Select the requested day or default to today's date if present, or first date
    let selectedDay: DayScoresData | null = null;
    if (requestedDate) {
      selectedDay = allDaysData.find(d => d.date === requestedDate) || null;
    }
    if (!selectedDay && allDaysData.length > 0) {
      // Try to find today's date (e.g. 2026-09-16)
      const todayStr = new Date().toISOString().split('T')[0];
      selectedDay = allDaysData.find(d => d.date === todayStr) || allDaysData[0];
    }

    // Conference date tabs summary
    const conferenceDates = allDaysData.map(d => ({
      date: d.date,
      day_number: d.day_number,
      day_label: d.day_label,
      day_label_ar: d.day_label_ar,
      events_count: d.events.length,
      total_day_points: d.total_day_points,
      top_team_name: d.top_teams[0]?.name,
      top_participant_name: d.top_participants[0]?.full_name
    }));

    // Overall conference top team & participant across all days
    const totalParticipantScores = participants.map(p => {
      const pAtts = attendances.filter(a => a.participant_id === p.id);
      const score = pAtts.reduce((sum, a) => sum + (a.final_score || 0), 0);
      const team = teams.find(t => t.id === p.team_id);
      return { full_name: p.full_name, total_score: score, team_name: team?.name };
    }).sort((a, b) => b.total_score - a.total_score);

    const totalTeamScores = teams.map(team => {
      const teamParticipants = participants.filter(p => p.team_id === team.id);
      const pIds = new Set(teamParticipants.map(p => p.id));
      const tAtts = attendances.filter(a => pIds.has(a.participant_id));
      const totalScore = tAtts.reduce((sum, a) => sum + (a.final_score || 0), 0);
      const avgScore = teamParticipants.length > 0 ? Number((totalScore / teamParticipants.length).toFixed(1)) : 0;
      return { 
        name: team.name, 
        name_ar: team.name_ar, 
        total_score: totalScore, 
        average_score: avgScore,
        color: team.color 
      };
    }).sort((a, b) => (b.average_score - a.average_score) || (b.total_score - a.total_score));

    return {
      conference_dates: conferenceDates,
      selected_day: selectedDay,
      overall_conference: {
        total_days: sortedDates.length,
        total_events: events.length,
        total_attendances: attendances.length,
        top_team: totalTeamScores[0],
        top_participant: totalParticipantScores[0]
      }
    };
  }
}
