export type Role = 'admin' | 'servant' | 'supervisor' | 'viewer';

export interface Participant {
  id: string;
  full_name: string;
  participant_number: string;
  qr_code_id: string;
  team_id: string;
  team_name?: string;
  phone?: string;
  gender?: 'male' | 'female';
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberSummary {
  id: string;
  full_name: string;
  participant_number: string;
  phone?: string;
  total_score: number;
  attended_events_count: number;
}

export interface Team {
  id: string;
  name: string;
  name_ar: string;
  color: string;
  leader_name?: string;
  participant_count?: number;
  total_score?: number;
  average_score?: number;
  rank?: number;
  members?: TeamMemberSummary[];
}

export interface ArrivalRule {
  max_late_minutes: number; // e.g. 5, 15, 30, 9999
  score: number;            // e.g. 100, 80, 50, 0
  label?: string;
  label_ar?: string;
}

export type EventType = 'meeting' | 'mass' | 'activity' | 'talk' | 'hymns' | 'bible_study' | 'other';
export type EventStatus = 'draft' | 'active' | 'completed';

export interface Event {
  id: string;
  name: string;
  name_ar: string;
  type: EventType;
  start_time: string; // ISO
  end_time: string;   // ISO
  maximum_score: number;
  status: EventStatus;
  grace_period_minutes: number;
  exit_deduction_rate: number;
  minimum_score: number;
  arrival_rules: ArrivalRule[];
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'NOT_ATTENDED' | 'PRESENT' | 'TEMPORARILY_OUT' | 'COMPLETED';
export type AttendanceExitStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED';

export interface AttendanceExit {
  id: string;
  attendance_id: string;
  exit_time: string;
  return_time: string | null;
  duration_minutes: number;
  status: AttendanceExitStatus;
  auto_closed?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  participant_id: string;
  participant_name?: string;
  participant_number?: string;
  team_id?: string;
  team_name?: string;
  team_name_ar?: string;
  event_id: string;
  event_name?: string;
  event_name_ar?: string;
  arrival_time: string;
  base_score: number;
  total_time_out_minutes: number;
  grace_period_minutes: number;
  deductible_minutes: number;
  deduction_rate: number;
  total_deduction: number;
  final_score: number;
  status: AttendanceStatus;
  override_score: number | null;
  override_reason: string | null;
  override_by: string | null;
  override_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  exits?: AttendanceExit[];
  active_exit?: AttendanceExit | null;
}

export type ScanResultType = 
  | 'CHECKED_IN'
  | 'RETURNED'
  | 'ALREADY_PRESENT'
  | 'ALREADY_OUT'
  | 'NO_ACTIVE_EVENT'
  | 'INVALID_QR'
  | 'ERROR';

export interface ScanResponse {
  type: ScanResultType;
  message: string;
  message_ar: string;
  participant?: Participant;
  attendance?: Attendance;
  exit?: AttendanceExit;
  event?: Event;
  time_outside_minutes?: number;
  total_time_out_minutes?: number;
  deduction?: number;
  final_score?: number;
  base_score?: number;
  arrival_time?: string;
}

export interface AuditLog {
  id: string;
  action: 'CHECK_IN' | 'EXIT' | 'RETURN' | 'SCORE_OVERRIDE' | 'STATUS_CHANGE' | 'EVENT_CLOSED' | 'PARTICIPANT_CREATED' | 'SCORING_RULES_UPDATED' | 'EVENT_CREATED' | 'EVENT_DELETED' | 'TEAM_CREATED' | 'TEAM_UPDATED' | 'TEAM_DELETED' | 'CLEAR_DATA' | 'RESET_DATA';
  attendance_id?: string;
  participant_id?: string;
  participant_name?: string;
  event_id?: string;
  event_name?: string;
  performed_by: string;
  role: string;
  details: string;
  details_ar?: string;
  previous_score?: number | null;
  new_score?: number | null;
  timestamp: string;
}

export interface DashboardStats {
  active_event: Event | null;
  total_participants: number;
  present_count: number;
  temporarily_out_count: number;
  not_attended_count: number;
  average_score: number;
}

export interface ScoringConfig {
  maximum_score: number;
  grace_period_minutes: number;
  exit_deduction_rate: number;
  minimum_score: number;
  arrival_rules: ArrivalRule[];
  updated_at?: string;
  updated_by?: string;
}

export type ScoringApplyScope = 'future' | 'active' | 'all' | 'selected';

export interface ApplyScoringOptions {
  scope: ScoringApplyScope;
  target_event_ids?: string[];
  recalculate_attendances: boolean;
  performed_by?: string;
}

export interface ApplyScoringResponse {
  success: boolean;
  config: ScoringConfig;
  updated_events_count: number;
  recalculated_attendances_count: number;
  message: string;
  message_ar: string;
}

// Day-by-Day Score Monitor Types
export interface DayEventSummary {
  id: string;
  name: string;
  name_ar: string;
  type: EventType;
  start_time: string;
  end_time: string;
  status: EventStatus;
  maximum_score: number;
  attended_count: number;
}

export interface DayParticipantSessionScore {
  event_id: string;
  event_name: string;
  event_name_ar: string;
  score: number;
  base_score: number;
  deductions: number;
  status: AttendanceStatus;
  arrival_time?: string;
  has_override?: boolean;
}

export interface DayParticipantScore {
  id: string;
  team_id: string;
  full_name: string;
  participant_number: string;
  qr_code_id: string;
  team_name?: string;
  team_name_ar?: string;
  team_color?: string;
  rank: number;
  day_score: number;
  attended_sessions_count: number;
  session_scores: DayParticipantSessionScore[];
}

export interface DayTeamScore {
  id: string;
  name: string;
  name_ar: string;
  color: string;
  leader_name?: string;
  rank: number;
  day_total_score: number;
  day_average_score: number;
  active_members_count: number;
  members: {
    id: string;
    full_name: string;
    participant_number: string;
    day_score: number;
    attended_sessions_count: number;
  }[];
}

export interface DayScoresData {
  date: string; // YYYY-MM-DD
  day_number: number;
  day_label: string;
  day_label_ar: string;
  events: DayEventSummary[];
  participants: DayParticipantScore[];
  teams: DayTeamScore[];
  top_teams: DayTeamScore[]; // top 3 winners of the day
  top_participants: DayParticipantScore[]; // top 3 winners of the day
  total_day_points: number;
  average_participant_score: number;
}

export interface DailyMonitorResponse {
  conference_dates: {
    date: string;
    day_number: number;
    day_label: string;
    day_label_ar: string;
    events_count: number;
    total_day_points: number;
    top_team_name?: string;
    top_participant_name?: string;
  }[];
  selected_day: DayScoresData | null;
  overall_conference?: {
    total_days: number;
    total_events: number;
    total_attendances: number;
    top_team?: { name: string; name_ar: string; total_score: number; color: string };
    top_participant?: { full_name: string; total_score: number; team_name?: string };
  };
}

