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

export interface DBData {
  participants: Participant[];
  teams: Team[];
  events: Event[];
  attendances: Attendance[];
  attendance_exits: AttendanceExit[];
  audit_logs: AuditLog[];
  scoring_config: ScoringConfig;
}

export const DEFAULT_ARRIVAL_RULES: ArrivalRule[] = [
  { max_late_minutes: 5, score: 100, label: 'On time / Early arrival (0-5 min)', label_ar: 'حضور مبكر أو في الموعد (0 - 5 دقائق)' },
  { max_late_minutes: 15, score: 80, label: 'Slight delay (6-15 min)', label_ar: 'تأخير بسيط (6 - 15 دقيقة)' },
  { max_late_minutes: 30, score: 50, label: 'Moderate delay (16-30 min)', label_ar: 'تأخير متوسط (16 - 30 دقيقة)' },
  { max_late_minutes: 9999, score: 0, label: 'Late after 30 min', label_ar: 'تأخير كبير بعد 30 دقيقة' },
];

export function seedInitialData(): DBData {
  const now = new Date();

  // 4 Teams
  const teams: Team[] = [
    { 
      id: 'team-1', 
      name: 'Team 1 (St. Mark)', 
      name_ar: 'الفريق الأول (مارمرقس)', 
      color: '#2563EB', 
      leader_name: 'Bola Esak' 
    },
    { 
      id: 'team-2', 
      name: 'Team 2 (St. George)', 
      name_ar: 'الفريق الثاني (مارجرجس)', 
      color: '#DC2626', 
      leader_name: 'Philopatir Medhat' 
    },
    { 
      id: 'team-3', 
      name: 'Team 3 (Pope Kyrillos)', 
      name_ar: 'الفريق الثالث (البابا كيرلس)', 
      color: '#D97706', 
      leader_name: 'Mina Magdy' 
    },
    { 
      id: 'team-4', 
      name: 'Team 4 (St. Athanasius)', 
      name_ar: 'الفريق الرابع (أثناسيوس)', 
      color: '#059669', 
      leader_name: 'Mathew Edward' 
    },
  ];

  // Final Participants for all 4 Teams (54 total participants)
  const team1Names = [
    { name: 'Bola Esak', gender: 'male' },
    { name: 'Maria Waheed', gender: 'female' },
    { name: 'Veronia Kamel', gender: 'female' },
    { name: 'Mariam Ramsis', gender: 'female' },
    { name: 'Malak Atef', gender: 'female' },
    { name: 'Yostina Botros', gender: 'female' },
    { name: 'Karim Sherif', gender: 'male' },
    { name: 'Phelobater Hany', gender: 'male' },
    { name: 'Bishoy Emad', gender: 'male' },
    { name: 'Mina Ehab', gender: 'male' },
    { name: 'Mina Hisham', gender: 'male' },
    { name: 'Mina Milad', gender: 'male' },
    { name: 'Kerolos Botros', gender: 'male' },
    { name: 'Kerolos Samir', gender: 'male' },
  ];

  const team2Names = [
    { name: 'Philopatir Medhat', gender: 'male' },
    { name: 'Kerya Emad', gender: 'female' },
    { name: 'Marina Gamil', gender: 'female' },
    { name: 'Rose Reda', gender: 'female' },
    { name: 'Sara Sherif', gender: 'female' },
    { name: 'Mina Adel', gender: 'male' },
    { name: 'Abanoub Sameh', gender: 'male' },
    { name: 'Mina Mehawed', gender: 'male' },
    { name: 'Paula Elia', gender: 'male' },
    { name: 'Bishoy Reda', gender: 'male' },
    { name: 'David Ehab', gender: 'male' },
    { name: 'Bavly Dawod', gender: 'male' },
    { name: 'Poula Hisham', gender: 'male' },
    { name: 'Tony Adel', gender: 'male' },
  ];

  const team3Names = [
    { name: 'Mina Magdy', gender: 'male' },
    { name: 'Helana Ashraf', gender: 'female' },
    { name: 'Ely Emad', gender: 'male' },
    { name: 'Marina Nabil', gender: 'female' },
    { name: 'Mira Samy', gender: 'female' },
    { name: 'Kerolos Samy Aziz', gender: 'male' },
    { name: 'Bishoy Hany', gender: 'male' },
    { name: 'Maher Magdy', gender: 'male' },
    { name: 'Kerolos Magdy', gender: 'male' },
    { name: 'Luka Bassem', gender: 'male' },
    { name: 'Kirlos Emad Farag', gender: 'male' },
    { name: 'Youssef Nabil', gender: 'male' },
    { name: 'Eshaq Nabil', gender: 'male' },
  ];

  const team4Names = [
    { name: 'Mathew Edward', gender: 'male' },
    { name: 'Jomana Atef', gender: 'female' },
    { name: 'Remonda Azmy', gender: 'female' },
    { name: 'Veronia Azmy', gender: 'female' },
    { name: 'Maria Remon', gender: 'female' },
    { name: 'Marco Maged', gender: 'male' },
    { name: 'Abader Ayman', gender: 'male' },
    { name: 'Tomas Malak', gender: 'male' },
    { name: 'Bishoy Ashraf', gender: 'male' },
    { name: 'Youhana Basem', gender: 'male' },
    { name: 'Thomas Marco', gender: 'male' },
    { name: 'Mark Atef', gender: 'male' },
    { name: 'Kerolos Amir', gender: 'male' },
  ];

  const participants: Participant[] = [];
  let pIndex = 1;

  const addTeamParticipants = (teamId: string, list: { name: string; gender: string }[], prefixNum: number) => {
    list.forEach((item, idx) => {
      const pNum = `P-${String(prefixNum * 100 + idx + 1).padStart(6, '0')}`;
      const id = `p-${String(pIndex).padStart(3, '0')}`;
      pIndex++;
      participants.push({
        id,
        full_name: item.name,
        participant_number: pNum,
        qr_code_id: pNum,
        team_id: teamId,
        phone: `+20 1${(idx % 3 === 0 ? '0' : idx % 3 === 1 ? '1' : '2')}${Math.floor(10000000 + Math.random() * 89999999)}`,
        gender: item.gender as 'male' | 'female',
        active: true,
        notes: `Merryland Youth Conference 2026 - ${teams.find(t => t.id === teamId)?.name}`,
        created_at: new Date(now.getTime() - 86400000 * 3).toISOString(),
        updated_at: new Date(now.getTime() - 86400000 * 3).toISOString()
      });
    });
  };

  addTeamParticipants('team-1', team1Names, 1);
  addTeamParticipants('team-2', team2Names, 2);
  addTeamParticipants('team-3', team3Names, 3);
  addTeamParticipants('team-4', team4Names, 4);

  // 30 Events & Sessions across the 3 conference days (20/09, 21/09, 22/09)
  const events: Event[] = [
    // ---------------- DAY 1: 20/09/2026 (Sunday) ----------------
    {
      id: 'event-d1-01',
      name: 'Arrival & Reception',
      name_ar: 'الوصول',
      type: 'meeting',
      start_time: '2026-09-20T10:00:00.000Z',
      end_time: '2026-09-20T10:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T09:00:00.000Z',
      updated_at: '2026-09-20T10:30:00.000Z'
    },
    {
      id: 'event-d1-02',
      name: 'Spiritual Talk 1',
      name_ar: 'كلمة ١',
      type: 'talk',
      start_time: '2026-09-20T10:30:00.000Z',
      end_time: '2026-09-20T13:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T09:30:00.000Z',
      updated_at: '2026-09-20T13:00:00.000Z'
    },
    {
      id: 'event-d1-03',
      name: 'Room Assignment & Check-in',
      name_ar: 'التسكين',
      type: 'meeting',
      start_time: '2026-09-20T13:00:00.000Z',
      end_time: '2026-09-20T13:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T12:00:00.000Z',
      updated_at: '2026-09-20T13:30:00.000Z'
    },
    {
      id: 'event-d1-04',
      name: 'Pool & Recreation',
      name_ar: 'Pool',
      type: 'activity',
      start_time: '2026-09-20T13:00:00.000Z',
      end_time: '2026-09-20T15:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T12:00:00.000Z',
      updated_at: '2026-09-20T15:00:00.000Z'
    },
    {
      id: 'event-d1-05',
      name: 'Lunch',
      name_ar: 'وجبة الغداء',
      type: 'meeting',
      start_time: '2026-09-20T15:30:00.000Z',
      end_time: '2026-09-20T16:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T14:30:00.000Z',
      updated_at: '2026-09-20T16:00:00.000Z'
    },
    {
      id: 'event-d1-06',
      name: 'Rest & Free Time',
      name_ar: 'راحة',
      type: 'activity',
      start_time: '2026-09-20T16:00:00.000Z',
      end_time: '2026-09-20T18:00:00.000Z',
      maximum_score: 0,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 0,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T15:00:00.000Z',
      updated_at: '2026-09-20T18:00:00.000Z'
    },
    {
      id: 'event-d1-07',
      name: 'Spiritual Talk 2',
      name_ar: 'كلمة ٢',
      type: 'talk',
      start_time: '2026-09-20T18:00:00.000Z',
      end_time: '2026-09-20T18:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T17:00:00.000Z',
      updated_at: '2026-09-20T18:30:00.000Z'
    },
    {
      id: 'event-d1-08',
      name: 'Workshop 1',
      name_ar: 'ورشة عمل ١',
      type: 'activity',
      start_time: '2026-09-20T18:30:00.000Z',
      end_time: '2026-09-20T19:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T17:30:00.000Z',
      updated_at: '2026-09-20T19:30:00.000Z'
    },
    {
      id: 'event-d1-09',
      name: 'Prayer Meeting',
      name_ar: 'اجتماع الصلاة',
      type: 'meeting',
      start_time: '2026-09-20T19:30:00.000Z',
      end_time: '2026-09-20T20:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T18:30:00.000Z',
      updated_at: '2026-09-20T20:30:00.000Z'
    },
    {
      id: 'event-d1-10',
      name: 'Dinner',
      name_ar: 'العشاء',
      type: 'meeting',
      start_time: '2026-09-20T20:30:00.000Z',
      end_time: '2026-09-20T21:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T19:30:00.000Z',
      updated_at: '2026-09-20T21:00:00.000Z'
    },
    {
      id: 'event-d1-11',
      name: 'Handicrafts Session',
      name_ar: 'عمل يدوي',
      type: 'activity',
      start_time: '2026-09-20T21:00:00.000Z',
      end_time: '2026-09-20T22:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T20:00:00.000Z',
      updated_at: '2026-09-20T22:00:00.000Z'
    },
    {
      id: 'event-d1-12',
      name: 'Games & Team Challenges (Day 1)',
      name_ar: 'فقرة ألعاب',
      type: 'activity',
      start_time: '2026-09-20T22:00:00.000Z',
      end_time: '2026-09-21T00:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 3,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-20T21:00:00.000Z',
      updated_at: '2026-09-21T00:00:00.000Z'
    },

    // ---------------- DAY 2: 21/09/2026 (Monday) ----------------
    {
      id: 'event-d2-01',
      name: 'Holy Divine Liturgy',
      name_ar: 'القداس',
      type: 'mass',
      start_time: '2026-09-21T07:00:00.000Z',
      end_time: '2026-09-21T09:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T06:00:00.000Z',
      updated_at: '2026-09-21T09:00:00.000Z'
    },
    {
      id: 'event-d2-02',
      name: 'Breakfast',
      name_ar: 'وجبة الفطار',
      type: 'meeting',
      start_time: '2026-09-21T09:00:00.000Z',
      end_time: '2026-09-21T09:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T08:00:00.000Z',
      updated_at: '2026-09-21T09:30:00.000Z'
    },
    {
      id: 'event-d2-03',
      name: 'Morning Games Session',
      name_ar: 'فقرة ألعاب',
      type: 'activity',
      start_time: '2026-09-21T10:00:00.000Z',
      end_time: '2026-09-21T12:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T09:00:00.000Z',
      updated_at: '2026-09-21T12:00:00.000Z'
    },
    {
      id: 'event-d2-04',
      name: 'Pool & Recreation (Day 2)',
      name_ar: 'Pool',
      type: 'activity',
      start_time: '2026-09-21T12:00:00.000Z',
      end_time: '2026-09-21T14:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T11:00:00.000Z',
      updated_at: '2026-09-21T14:00:00.000Z'
    },
    {
      id: 'event-d2-05',
      name: 'Lunch',
      name_ar: 'الغداء',
      type: 'meeting',
      start_time: '2026-09-21T15:00:00.000Z',
      end_time: '2026-09-21T15:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T14:00:00.000Z',
      updated_at: '2026-09-21T15:30:00.000Z'
    },
    {
      id: 'event-d2-06',
      name: 'Rest & Free Time',
      name_ar: 'راحة',
      type: 'activity',
      start_time: '2026-09-21T15:30:00.000Z',
      end_time: '2026-09-21T17:00:00.000Z',
      maximum_score: 0,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 0,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T14:30:00.000Z',
      updated_at: '2026-09-21T17:00:00.000Z'
    },
    {
      id: 'event-d2-07',
      name: 'Spiritual Talk 3',
      name_ar: 'كلمة ٣',
      type: 'talk',
      start_time: '2026-09-21T17:00:00.000Z',
      end_time: '2026-09-21T17:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T16:00:00.000Z',
      updated_at: '2026-09-21T17:30:00.000Z'
    },
    {
      id: 'event-d2-08',
      name: 'Tasbeha & Prayer',
      name_ar: 'تسبحة+صلاة',
      type: 'meeting',
      start_time: '2026-09-21T17:30:00.000Z',
      end_time: '2026-09-21T19:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 3,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T16:30:00.000Z',
      updated_at: '2026-09-21T19:00:00.000Z'
    },
    {
      id: 'event-d2-09',
      name: 'Evening Games Session',
      name_ar: 'فقرة ألعاب',
      type: 'activity',
      start_time: '2026-09-21T19:00:00.000Z',
      end_time: '2026-09-21T21:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T18:00:00.000Z',
      updated_at: '2026-09-21T21:00:00.000Z'
    },
    {
      id: 'event-d2-10',
      name: 'Dinner',
      name_ar: 'العشاء',
      type: 'meeting',
      start_time: '2026-09-21T21:00:00.000Z',
      end_time: '2026-09-21T21:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T20:00:00.000Z',
      updated_at: '2026-09-21T21:30:00.000Z'
    },
    {
      id: 'event-d2-11',
      name: 'Samar (Talent Show) Preparation',
      name_ar: 'تحضير لفقرة السمر',
      type: 'activity',
      start_time: '2026-09-21T21:30:00.000Z',
      end_time: '2026-09-21T22:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T20:30:00.000Z',
      updated_at: '2026-09-21T22:00:00.000Z'
    },
    {
      id: 'event-d2-12',
      name: 'Samar Night & Celebration',
      name_ar: 'حفلة السمر',
      type: 'activity',
      start_time: '2026-09-21T22:00:00.000Z',
      end_time: '2026-09-22T00:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 3,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-21T21:00:00.000Z',
      updated_at: '2026-09-22T00:00:00.000Z'
    },

    // ---------------- DAY 3: 22/09/2026 (Tuesday) ----------------
    {
      id: 'event-d3-01',
      name: 'Wake Up & Morning Prayer',
      name_ar: 'استيقاظ+صلاة باكر',
      type: 'meeting',
      start_time: '2026-09-22T08:00:00.000Z',
      end_time: '2026-09-22T09:00:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T07:00:00.000Z',
      updated_at: '2026-09-22T09:00:00.000Z'
    },
    {
      id: 'event-d3-02',
      name: 'Breakfast',
      name_ar: 'وجبة الفطار',
      type: 'meeting',
      start_time: '2026-09-22T09:00:00.000Z',
      end_time: '2026-09-22T09:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T08:00:00.000Z',
      updated_at: '2026-09-22T09:30:00.000Z'
    },
    {
      id: 'event-d3-03',
      name: 'Room Checkout',
      name_ar: 'تسليم الغرف',
      type: 'meeting',
      start_time: '2026-09-22T09:30:00.000Z',
      end_time: '2026-09-22T10:00:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 1,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T08:30:00.000Z',
      updated_at: '2026-09-22T10:00:00.000Z'
    },
    {
      id: 'event-d3-04',
      name: 'Talk 4 + Closing Session',
      name_ar: 'كلمة ٤ + end session',
      type: 'talk',
      start_time: '2026-09-22T10:00:00.000Z',
      end_time: '2026-09-22T11:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T09:00:00.000Z',
      updated_at: '2026-09-22T11:30:00.000Z'
    },
    {
      id: 'event-d3-05',
      name: 'Photo Session',
      name_ar: 'Photo session',
      type: 'activity',
      start_time: '2026-09-22T11:30:00.000Z',
      end_time: '2026-09-22T12:30:00.000Z',
      maximum_score: 100,
      minimum_score: 0,
      status: 'draft', // Active event for live testing & QR scanning!
      grace_period_minutes: 2,
      exit_deduction_rate: 2,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T10:30:00.000Z',
      updated_at: '2026-09-22T11:30:00.000Z'
    },
    {
      id: 'event-d3-06',
      name: 'Departure',
      name_ar: 'التحرك',
      type: 'meeting',
      start_time: '2026-09-22T12:30:00.000Z',
      end_time: '2026-09-22T13:30:00.000Z',
      maximum_score: 50,
      minimum_score: 0,
      status: 'draft',
      grace_period_minutes: 5,
      exit_deduction_rate: 0,
      arrival_rules: DEFAULT_ARRIVAL_RULES,
      created_at: '2026-09-22T11:00:00.000Z',
      updated_at: '2026-09-22T11:00:00.000Z'
    }
  ];

  // Clean conference state: all attendance records, temporary exits, and audit logs cleared.
  // All 30 sessions across the 3 days remain scheduled and ready for live check-ins.
  const attendances: Attendance[] = [];
  const attendance_exits: AttendanceExit[] = [];
  const audit_logs: AuditLog[] = [];

  const scoring_config: ScoringConfig = {
    maximum_score: 100,
    grace_period_minutes: 2,
    exit_deduction_rate: 2,
    minimum_score: 0,
    arrival_rules: DEFAULT_ARRIVAL_RULES,
    updated_at: now.toISOString(),
    updated_by: 'System Administrator'
  };

  return {
    participants,
    teams,
    events,
    attendances,
    attendance_exits,
    audit_logs,
    scoring_config
  };
}
