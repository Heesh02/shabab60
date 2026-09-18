import fs from 'fs';
import path from 'path';
import { 
  Participant, 
  Team, 
  Event, 
  Attendance, 
  AttendanceExit, 
  AuditLog, 
  ArrivalRule,
  ScoringConfig 
} from '../src/types.js';

import { seedInitialData, DEFAULT_ARRIVAL_RULES, DBData } from "./seedData.js";

const DATA_FILE = path.join(process.cwd(), ".data_store.json");

export class Database {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DBData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.scoring_config) {
          parsed.scoring_config = {
            maximum_score: 100,
            grace_period_minutes: 2,
            exit_deduction_rate: 2,
            minimum_score: 0,
            arrival_rules: DEFAULT_ARRIVAL_RULES,
            updated_at: new Date().toISOString(),
            updated_by: 'System Administrator'
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to read data file, initializing default seed data:', e);
    }
    const initial = seedInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DBData): void {
    try {
      const d = dataToSave || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write data file:', e);
    }
  }

  // Participants
  getParticipants(): Participant[] {
    return this.data.participants;
  }

  getParticipantById(id: string): Participant | undefined {
    return this.data.participants.find(p => p.id === id);
  }

  getParticipantByQr(qrCodeId: string): Participant | undefined {
    const clean = qrCodeId.trim().toUpperCase();
    return this.data.participants.find(p => 
      p.qr_code_id.toUpperCase() === clean || 
      p.participant_number.toUpperCase() === clean ||
      p.id.toUpperCase() === clean
    );
  }

  addParticipant(p: Omit<Participant, 'id' | 'created_at' | 'updated_at'>): Participant {
    const now = new Date().toISOString();
    const newId = 'p-' + String(this.data.participants.length + 1).padStart(3, '0');
    const newParticipant: Participant = {
      ...p,
      id: newId,
      created_at: now,
      updated_at: now
    };
    this.data.participants.push(newParticipant);
    this.saveData();
    return newParticipant;
  }

  updateParticipant(id: string, updates: Partial<Participant>): Participant | undefined {
    const index = this.data.participants.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.data.participants[index] = {
      ...this.data.participants[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.participants[index];
  }

  deleteParticipant(id: string): boolean {
    const initialLen = this.data.participants.length;
    this.data.participants = this.data.participants.filter(p => p.id !== id);
    if (this.data.participants.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Teams
  getTeams(): Team[] {
    return this.data.teams;
  }

  getTeamById(id: string): Team | undefined {
    return this.data.teams.find(t => t.id === id);
  }

  addTeam(team: Omit<Team, 'id'>): Team {
    // Generate clean unique ID
    let newId = 'team-' + Date.now();
    if (this.data.teams.some(t => t.id === newId)) {
      newId = 'team-' + Math.random().toString(36).substring(2, 8);
    }
    const newTeam: Team = {
      ...team,
      id: newId,
      name: team.name?.trim() || 'New Team',
      name_ar: team.name_ar?.trim() || team.name?.trim() || 'فريق جديد',
      color: team.color?.trim() || '#d97706',
      leader_name: team.leader_name?.trim() || ''
    };
    this.data.teams.push(newTeam);
    this.saveData();
    return newTeam;
  }

  updateTeam(id: string, updates: Partial<Team>): Team | undefined {
    const index = this.data.teams.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.data.teams[index] = {
      ...this.data.teams[index],
      ...updates,
      id // preserve id
    };
    this.saveData();
    return this.data.teams[index];
  }

  deleteTeam(id: string, reassignToTeamId?: string): { success: boolean; reassignedCount: number; deletedTeam?: Team } {
    const index = this.data.teams.findIndex(t => t.id === id);
    if (index === -1) return { success: false, reassignedCount: 0 };
    
    const [deletedTeam] = this.data.teams.splice(index, 1);
    
    // Find target team for any participants belonging to this team
    let targetTeamId = reassignToTeamId;
    if (!targetTeamId || !this.data.teams.some(t => t.id === targetTeamId)) {
      targetTeamId = this.data.teams[0]?.id || '';
    }

    let reassignedCount = 0;
    if (targetTeamId) {
      this.data.participants.forEach(p => {
        if (p.team_id === id) {
          p.team_id = targetTeamId!;
          p.updated_at = new Date().toISOString();
          reassignedCount++;
        }
      });
    }

    this.saveData();
    return { success: true, reassignedCount, deletedTeam };
  }

  // Events
  getEvents(): Event[] {
    return this.data.events;
  }

  getEventById(id: string): Event | undefined {
    return this.data.events.find(e => e.id === id);
  }

  getActiveEvent(): Event | undefined {
    return this.data.events.find(e => e.status === 'active');
  }

  addEvent(e: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
    const now = new Date().toISOString();
    const defaultConfig = this.getScoringConfig();
    const newEvent: Event = {
      ...e,
      maximum_score: e.maximum_score !== undefined ? e.maximum_score : defaultConfig.maximum_score,
      grace_period_minutes: e.grace_period_minutes !== undefined ? e.grace_period_minutes : defaultConfig.grace_period_minutes,
      exit_deduction_rate: e.exit_deduction_rate !== undefined ? e.exit_deduction_rate : defaultConfig.exit_deduction_rate,
      minimum_score: e.minimum_score !== undefined ? e.minimum_score : defaultConfig.minimum_score,
      arrival_rules: e.arrival_rules && e.arrival_rules.length > 0 ? e.arrival_rules : defaultConfig.arrival_rules,
      id: 'event-' + Date.now(),
      created_at: now,
      updated_at: now
    };
    // If setting to active, mark other active events to draft/completed if needed or keep only one active
    if (newEvent.status === 'active') {
      this.data.events.forEach(ev => {
        if (ev.status === 'active') ev.status = 'completed';
      });
    }
    this.data.events.push(newEvent);
    this.saveData();
    return newEvent;
  }

  // Scoring Configuration
  getScoringConfig(): ScoringConfig {
    if (!this.data.scoring_config) {
      this.data.scoring_config = {
        maximum_score: 100,
        grace_period_minutes: 2,
        exit_deduction_rate: 2,
        minimum_score: 0,
        arrival_rules: DEFAULT_ARRIVAL_RULES,
        updated_at: new Date().toISOString(),
        updated_by: 'System Administrator'
      };
      this.saveData();
    }
    return this.data.scoring_config;
  }

  saveScoringConfig(config: ScoringConfig): ScoringConfig {
    this.data.scoring_config = {
      ...config,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.scoring_config;
  }

  updateEvent(id: string, updates: Partial<Event>): Event | undefined {
    const index = this.data.events.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    if (updates.status === 'active') {
      this.data.events.forEach(ev => {
        if (ev.id !== id && ev.status === 'active') ev.status = 'completed';
      });
    }
    this.data.events[index] = {
      ...this.data.events[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.events[index];
  }

  deleteEvent(id: string): boolean {
    const initialLen = this.data.events.length;
    this.data.events = this.data.events.filter(e => e.id !== id);
    if (this.data.events.length !== initialLen) {
      this.data.attendances = this.data.attendances.filter(a => a.event_id !== id);
      this.saveData();
      return true;
    }
    return false;
  }

  // Attendances
  getAttendances(eventId?: string): Attendance[] {
    let list = this.data.attendances;
    if (eventId) {
      list = list.filter(a => a.event_id === eventId);
    }
    // Enrich with participant, team, and active exits
    return list.map(a => this.enrichAttendance(a));
  }

  getAttendanceById(id: string): Attendance | undefined {
    const a = this.data.attendances.find(att => att.id === id);
    return a ? this.enrichAttendance(a) : undefined;
  }

  getAttendanceByParticipantAndEvent(participantId: string, eventId: string): Attendance | undefined {
    const a = this.data.attendances.find(att => att.participant_id === participantId && att.event_id === eventId);
    return a ? this.enrichAttendance(a) : undefined;
  }

  saveAttendance(a: Attendance): Attendance {
    const index = this.data.attendances.findIndex(att => att.id === a.id);
    const cleanToSave = { ...a };
    delete cleanToSave.exits;
    delete cleanToSave.active_exit;
    delete cleanToSave.participant_name;
    delete cleanToSave.participant_number;
    delete cleanToSave.team_id;
    delete cleanToSave.team_name;
    delete cleanToSave.team_name_ar;
    delete cleanToSave.event_name;
    delete cleanToSave.event_name_ar;

    if (index >= 0) {
      this.data.attendances[index] = {
        ...cleanToSave,
        updated_at: new Date().toISOString()
      };
    } else {
      this.data.attendances.push({
        ...cleanToSave,
        created_at: cleanToSave.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.saveData();
    return this.enrichAttendance(this.data.attendances[index >= 0 ? index : this.data.attendances.length - 1]);
  }

  // Exits
  getExitsForAttendance(attendanceId: string): AttendanceExit[] {
    return this.data.attendance_exits.filter(e => e.attendance_id === attendanceId);
  }

  getOpenExitForAttendance(attendanceId: string): AttendanceExit | undefined {
    return this.data.attendance_exits.find(e => e.attendance_id === attendanceId && e.status === 'OPEN');
  }

  saveExit(exit: AttendanceExit): AttendanceExit {
    const index = this.data.attendance_exits.findIndex(e => e.id === exit.id);
    if (index >= 0) {
      this.data.attendance_exits[index] = {
        ...exit,
        updated_at: new Date().toISOString()
      };
    } else {
      this.data.attendance_exits.push({
        ...exit,
        created_at: exit.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.saveData();
    return this.data.attendance_exits[index >= 0 ? index : this.data.attendance_exits.length - 1];
  }

  // Audit Logs
  getAuditLogs(limit: number = 50): AuditLog[] {
    return [...this.data.audit_logs].reverse().slice(0, limit);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString()
    };
    this.data.audit_logs.push(newLog);
    this.saveData();
    return newLog;
  }

  // Helper to enrich Attendance with relations
  private enrichAttendance(a: Attendance): Attendance {
    const participant = this.getParticipantById(a.participant_id);
    const event = this.getEventById(a.event_id);
    const team = participant ? this.data.teams.find(t => t.id === participant.team_id) : undefined;
    const exits = this.getExitsForAttendance(a.id);
    const active_exit = exits.find(e => e.status === 'OPEN') || null;

    return {
      ...a,
      participant_name: participant?.full_name,
      participant_number: participant?.participant_number,
      team_id: participant?.team_id,
      team_name: team?.name,
      team_name_ar: team?.name_ar,
      event_name: event?.name,
      event_name_ar: event?.name_ar,
      exits,
      active_exit
    };
  }

  clearAttendanceAndScores(performedBy: string = 'Administrator') {
    this.data.attendances = [];
    this.data.attendance_exits = [];
    this.data.audit_logs = [
      {
        id: 'audit-clear-att-' + Date.now(),
        action: 'CLEAR_DATA',
        performed_by: performedBy,
        role: 'admin',
        details: 'Attendance records and scores have been cleared. All sessions remain scheduled.',
        details_ar: 'تم مسح سجلات الحضور والدرجات مع الإبقاء على الجلسات مجدولة.',
        timestamp: new Date().toISOString()
      }
    ];
    this.data.events.forEach(ev => {
      ev.status = 'draft';
    });
    this.saveData();
  }

  resetToDefault() {
    this.data = seedInitialData();
    this.saveData();
  }

  clearAllData() {
    this.data = {
      participants: [],
      teams: [],
      events: [],
      attendances: [],
      attendance_exits: [],
      audit_logs: [
        {
          id: 'audit-clear-' + Date.now(),
          action: 'CLEAR_DATA',
          performed_by: 'Administrator',
          role: 'admin',
          details: 'All conference data (participants, teams, events, attendances, and exits) has been cleared.',
          details_ar: 'تم مسح كافة بيانات المؤتمر (المشاركون، الفرق، الفعاليات، وسجلات الحضور والخصومات).',
          timestamp: new Date().toISOString()
        }
      ],
      scoring_config: {
        maximum_score: 100,
        grace_period_minutes: 2,
        exit_deduction_rate: 2,
        minimum_score: 0,
        arrival_rules: DEFAULT_ARRIVAL_RULES,
        updated_at: new Date().toISOString(),
        updated_by: 'System Administrator'
      }
    };
    this.saveData();
  }
}

export const db = new Database();
