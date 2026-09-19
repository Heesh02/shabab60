import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { ScoringService } from './server/scoring.js';
import { DailyScoresService } from './server/dailyScoresService.js';
import { Participant, Event, Team } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API Routes
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Dashboard / Stats Overview
  app.get(['/api/dashboard', '/api/stats'], (req, res) => {
    try {
      const activeEvent = db.getActiveEvent() || null;
      const allParticipants = db.getParticipants();
      const activeParticipants = allParticipants.filter(p => p.active);

      let presentCount = 0;
      let outCount = 0;
      let totalScoreSum = 0;
      let attendedCount = 0;

      if (activeEvent) {
        const attendances = db.getAttendances(activeEvent.id);
        attendedCount = attendances.length;
        attendances.forEach(a => {
          if (a.status === 'PRESENT') presentCount++;
          if (a.status === 'TEMPORARILY_OUT') outCount++;
          if (a.status === 'COMPLETED') presentCount++; // counted as attended
          totalScoreSum += a.final_score;
        });
      }

      const notAttendedCount = Math.max(0, activeParticipants.length - attendedCount);
      const avgScore = attendedCount > 0 ? Number((totalScoreSum / attendedCount).toFixed(1)) : 0;

      res.json({
        active_event: activeEvent,
        total_participants: activeParticipants.length,
        present_count: presentCount,
        temporarily_out_count: outCount,
        not_attended_count: notAttendedCount,
        average_score: avgScore,
        recent_audits: db.getAuditLogs(10)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // QR Scan Decision Engine
  app.post('/api/scan', (req, res) => {
    try {
      const qr_code = req.body.qr_code || req.body.code;
      const performed_by = req.body.performed_by || req.body.scannedBy || 'Servant';
      if (!qr_code) {
        return res.status(400).json({ error: 'QR code identifier is required' });
      }

      const result = ScoringService.handleScan(qr_code, performed_by);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Temporary Exit
  app.post('/api/attendances/:id/exit', (req, res) => {
    try {
      const { id } = req.params;
      const { performed_by } = req.body;
      const result = ScoringService.registerTemporaryExit(id, performed_by || 'Servant');
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Manual Return trigger (servant alternative to QR scan)
  app.post('/api/attendances/:id/return', (req, res) => {
    try {
      const { id } = req.params;
      const { performed_by } = req.body;
      const attendance = db.getAttendanceById(id);
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }
      const participant = db.getParticipantById(attendance.participant_id);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      const result = ScoringService.handleScan(participant.qr_code_id, performed_by || 'Servant');
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Manual Score Override by Administrator
  app.post('/api/attendances/:id/override', (req, res) => {
    try {
      const { id } = req.params;
      const { override_score, override_reason, admin_name } = req.body;
      if (override_score === undefined || override_score === null) {
        return res.status(400).json({ error: 'Override score is required' });
      }
      if (!override_reason || !override_reason.trim()) {
        return res.status(400).json({ error: 'Override reason is required for audit compliance' });
      }

      const updated = ScoringService.manualScoreOverride(
        id, 
        Number(override_score), 
        override_reason, 
        admin_name || 'Administrator'
      );
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Attendances
  app.get('/api/attendances', (req, res) => {
    try {
      const eventId = req.query.event_id as string | undefined;
      const attendances = db.getAttendances(eventId);
      res.json(attendances);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/attendances/:id', (req, res) => {
    try {
      const attendance = db.getAttendanceById(req.params.id);
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Participants
  app.get('/api/participants', (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();
      let list = db.getParticipants();
      if (query) {
        list = list.filter(p => 
          p.full_name.toLowerCase().includes(query) ||
          p.participant_number.toLowerCase().includes(query) ||
          p.qr_code_id.toLowerCase().includes(query) ||
          (p.phone && p.phone.includes(query))
        );
      }
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/participants', (req, res) => {
    try {
      const pData = (req.body && req.body.participant) ? req.body.participant : req.body;
      const { full_name, team_id, phone, gender, notes, active } = pData;
      if (!full_name || !full_name.trim()) {
        return res.status(400).json({ error: 'Full name is required' });
      }

      const count = db.getParticipants().length + 125;
      const participantNumber = `P-${String(count + 1).padStart(6, '0')}`;
      const qrCodeId = participantNumber; // Unique permanent QR ID per PRD Section 6

      const newParticipant = db.addParticipant({
        full_name: full_name.trim(),
        participant_number: participantNumber,
        qr_code_id: qrCodeId,
        team_id: team_id || 'team-1',
        phone: phone || '',
        gender: gender || 'male',
        active: active !== undefined ? Boolean(active) : true,
        notes: notes || ''
      });

      db.addAuditLog({
        action: 'PARTICIPANT_CREATED',
        participant_id: newParticipant.id,
        participant_name: newParticipant.full_name,
        performed_by: req.body.performed_by || 'Admin',
        role: 'admin',
        details: `Created participant ${newParticipant.full_name} (${participantNumber})`
      });

      res.status(201).json(newParticipant);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/participants/:id', (req, res) => {
    try {
      const updated = db.updateParticipant(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/participants/:id', (req, res) => {
    try {
      const success = db.deleteParticipant(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Teams
  app.get('/api/teams', (req, res) => {
    try {
      const teams = db.getTeams();
      const participants = db.getParticipants();
      const attendances = db.getAttendances();

      // Aggregate team scores and members
      const enrichedTeams = teams.map(t => {
        const teamParticipants = participants.filter(p => p.team_id === t.id);
        
        let teamTotalScore = 0;
        const membersSummary = teamParticipants.map(tp => {
          const pAttendances = attendances.filter(a => a.participant_id === tp.id);
          const pScore = pAttendances.reduce((acc, a) => acc + a.final_score, 0);
          teamTotalScore += pScore;
          return {
            id: tp.id,
            full_name: tp.full_name,
            participant_number: tp.participant_number,
            phone: tp.phone,
            total_score: pScore,
            attended_events_count: pAttendances.length
          };
        });

        // Sort members by individual total score descending
        membersSummary.sort((a, b) => b.total_score - a.total_score);

        const avg = membersSummary.length > 0 ? Number((teamTotalScore / membersSummary.length).toFixed(1)) : 0;

        return {
          ...t,
          participant_count: teamParticipants.length,
          total_score: teamTotalScore,
          average_score: avg,
          members: membersSummary
        };
      });

      // Rank teams by average_score (mean score) descending to normalize for unequal team sizes
      enrichedTeams.sort((a, b) => (b.average_score || 0) - (a.average_score || 0) || (b.total_score || 0) - (a.total_score || 0));
      const rankedTeams = enrichedTeams.map((t, idx) => ({
        ...t,
        rank: idx + 1
      }));

      res.json(rankedTeams);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/teams', (req, res) => {
    try {
      const teamData = (req.body && req.body.team) ? req.body.team : req.body;
      const { name, name_ar, color, leader_name, performed_by, role } = teamData;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const newTeam = db.addTeam({
        name: name.trim(),
        name_ar: (name_ar && name_ar.trim()) ? name_ar.trim() : name.trim(),
        color: color?.trim() || '#d97706',
        leader_name: leader_name?.trim() || ''
      });

      db.addAuditLog({
        action: 'TEAM_CREATED',
        performed_by: performed_by || 'Admin',
        role: role || 'admin',
        details: `Created team "${newTeam.name}" (${newTeam.name_ar})`,
        details_ar: `إنشاء فريق جديد "${newTeam.name_ar || newTeam.name}"`
      });

      res.status(201).json(newTeam);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/teams/:id', (req, res) => {
    try {
      const teamData = (req.body && req.body.team) ? req.body.team : req.body;
      const { name, name_ar, color, leader_name, performed_by, role } = teamData;
      
      const existing = db.getTeamById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const updated = db.updateTeam(req.params.id, {
        name: name !== undefined ? name.trim() : existing.name,
        name_ar: name_ar !== undefined ? name_ar.trim() : existing.name_ar,
        color: color !== undefined ? color.trim() : existing.color,
        leader_name: leader_name !== undefined ? leader_name.trim() : existing.leader_name
      });

      db.addAuditLog({
        action: 'TEAM_UPDATED',
        performed_by: performed_by || 'Admin',
        role: role || 'admin',
        details: `Updated team "${updated?.name}" (${updated?.name_ar})`,
        details_ar: `تعديل بيانات الفريق "${updated?.name_ar || updated?.name}"`
      });

      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/teams/:id', (req, res) => {
    try {
      const reassignTo = req.query.reassign_to as string || req.body?.reassign_to as string;
      const performedBy = (req.body && req.body.performed_by) || (req.query.performed_by as string) || 'Admin';
      const role = (req.body && req.body.role) || (req.query.role as string) || 'admin';

      const result = db.deleteTeam(req.params.id, reassignTo);
      if (!result.success) {
        return res.status(404).json({ error: 'Team not found' });
      }

      db.addAuditLog({
        action: 'TEAM_DELETED',
        performed_by: performedBy,
        role: role,
        details: `Deleted team "${result.deletedTeam?.name}". Reassigned ${result.reassignedCount} youth participants.`,
        details_ar: `حذف الفريق "${result.deletedTeam?.name_ar || result.deletedTeam?.name}". تم نقل ${result.reassignedCount} مشارك إلى فريق آخر.`
      });

      res.json({ 
        success: true, 
        reassigned_count: result.reassignedCount, 
        deleted_team: result.deletedTeam 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Events
  app.get('/api/events', (req, res) => {
    try {
      res.json(db.getEvents());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/events', (req, res) => {
    try {
      const eventData = (req.body && req.body.event) ? req.body.event : req.body;
      const { 
        name, 
        name_ar, 
        type, 
        start_time, 
        end_time, 
        maximum_score, 
        grace_period_minutes, 
        exit_deduction_rate,
        arrival_rules,
        status 
      } = eventData;

      const finalName = (name || name_ar || '').trim();
      const finalNameAr = (name_ar || name || '').trim();

      if (!finalName) {
        return res.status(400).json({ error: 'Session name is required' });
      }

      // Default start and end times if not provided
      const finalStartTime = start_time || new Date().toISOString();
      const finalEndTime = end_time || new Date(Date.now() + 2 * 3600000).toISOString();

      const newEvent = db.addEvent({
        name: finalName,
        name_ar: finalNameAr,
        type: type || 'meeting',
        start_time: finalStartTime,
        end_time: finalEndTime,
        maximum_score: maximum_score !== undefined ? Number(maximum_score) : 100,
        status: status || 'scheduled',
        grace_period_minutes: grace_period_minutes !== undefined ? Number(grace_period_minutes) : 2,
        exit_deduction_rate: exit_deduction_rate !== undefined ? Number(exit_deduction_rate) : 2,
        minimum_score: 0,
        arrival_rules: arrival_rules || [
          { max_late_minutes: 5, score: 100, label: '≤ 5 min late' },
          { max_late_minutes: 15, score: 80, label: '6–15 min late' },
          { max_late_minutes: 30, score: 50, label: '16–30 min late' },
          { max_late_minutes: 9999, score: 0, label: '> 30 min late' }
        ]
      });

      db.addAuditLog({
        action: 'EVENT_CREATED',
        performed_by: req.body.performed_by || 'Admin',
        role: 'admin',
        details: `Created new session: ${newEvent.name} (${newEvent.name_ar})`,
        details_ar: `إنشاء جلسة جديدة: ${newEvent.name_ar} (${newEvent.name})`
      });

      res.status(201).json(newEvent);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/events/:id', (req, res) => {
    try {
      const updated = db.updateEvent(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/events/:id', (req, res) => {
    try {
      const event = db.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const success = db.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Event could not be deleted' });
      }

      db.addAuditLog({
        action: 'EVENT_DELETED',
        performed_by: req.body?.performed_by || 'Admin',
        role: 'admin',
        details: `Deleted session: ${event.name} (${event.name_ar})`,
        details_ar: `حذف الجلسة: ${event.name_ar} (${event.name})`
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Event Rules configuration & recalculation endpoint
  app.get('/api/events/:id/rules', (req, res) => {
    try {
      const event = db.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({
        id: event.id,
        name: event.name,
        name_ar: event.name_ar,
        maximum_score: event.maximum_score,
        grace_period_minutes: event.grace_period_minutes,
        exit_deduction_rate: event.exit_deduction_rate,
        minimum_score: event.minimum_score,
        arrival_rules: event.arrival_rules
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/events/:id/rules', (req, res) => {
    try {
      const event = db.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const { rules, recalculate_attendances, performed_by } = req.body;
      const adminName = performed_by || 'Administrator';

      const updated = db.updateEvent(req.params.id, {
        maximum_score: rules.maximum_score !== undefined ? Number(rules.maximum_score) : event.maximum_score,
        grace_period_minutes: rules.grace_period_minutes !== undefined ? Number(rules.grace_period_minutes) : event.grace_period_minutes,
        exit_deduction_rate: rules.exit_deduction_rate !== undefined ? Number(rules.exit_deduction_rate) : event.exit_deduction_rate,
        minimum_score: rules.minimum_score !== undefined ? Number(rules.minimum_score) : event.minimum_score,
        arrival_rules: rules.arrival_rules || event.arrival_rules
      });

      let recalculatedCount = 0;
      if (recalculate_attendances) {
        const recRes = ScoringService.recalculateAttendanceScoresForEvent(req.params.id, { recalculateArrivalScore: true });
        recalculatedCount = recRes.count;
      }

      db.addAuditLog({
        action: 'SCORING_RULES_UPDATED',
        event_id: event.id,
        event_name: event.name,
        performed_by: adminName,
        role: 'admin',
        details: `Updated session scoring rules for "${event.name}". Grace: ${updated?.grace_period_minutes}m, Rate: ${updated?.exit_deduction_rate}pts/m. Recalculated attendances: ${recalculatedCount}.`,
        details_ar: `تحديث قواعد الجلسة "${event.name_ar || event.name}". السماح: ${updated?.grace_period_minutes}ق، الخصم: ${updated?.exit_deduction_rate}نقطة/ق. تم إعادة حساب ${recalculatedCount} مشارك.`
      });

      res.json({ event: updated, recalculated_attendances_count: recalculatedCount });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Global Scoring Rules Configuration
  app.get('/api/scoring-rules', (req, res) => {
    try {
      const config = db.getScoringConfig();
      const events = db.getEvents();
      res.json({
        config,
        events: events.map(e => ({
          id: e.id,
          name: e.name,
          name_ar: e.name_ar,
          status: e.status,
          maximum_score: e.maximum_score,
          grace_period_minutes: e.grace_period_minutes,
          exit_deduction_rate: e.exit_deduction_rate,
          minimum_score: e.minimum_score,
          arrival_rules: e.arrival_rules
        }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put(['/api/scoring-rules', '/api/scoring-config'], (req, res) => {
    try {
      const { config, options, performed_by } = req.body;
      if (!config) {
        return res.status(400).json({ error: 'Config is required' });
      }

      const applyOptions = {
        scope: options?.scope || 'future',
        target_event_ids: options?.target_event_ids || [],
        recalculate_attendances: options?.recalculate_attendances ?? true,
        performed_by: performed_by || 'Administrator'
      };

      const result = ScoringService.applyScoringRules(config, applyOptions);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/events/:id/activate', (req, res) => {
    try {
      const updated = db.updateEvent(req.params.id, { status: 'active' });
      if (!updated) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/events/:id/complete', (req, res) => {
    try {
      const adminName = req.body.admin_name || 'Administrator';
      const updated = ScoringService.completeEvent(req.params.id, adminName);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Leaderboard (Overall or filtered by date)
  app.get('/api/leaderboard', (req, res) => {
    try {
      const targetDate = req.query.date as string | undefined;
      const participants = db.getParticipants().filter(p => p.active);
      const allAttendances = db.getAttendances();
      const events = db.getEvents();
      const teams = db.getTeams();

      // If date is provided, only include attendances for events on that date
      let filteredAttendances = allAttendances;
      if (targetDate) {
        const matchingEventIds = new Set(
          events.filter(e => e.start_time && e.start_time.startsWith(targetDate)).map(e => e.id)
        );
        filteredAttendances = allAttendances.filter(a => matchingEventIds.has(a.event_id));
      }

      // Aggregate participant points
      const participantScores = participants.map(p => {
        const pAttendances = filteredAttendances.filter(a => a.participant_id === p.id);
        const totalScore = pAttendances.reduce((sum, a) => sum + (a.final_score || 0), 0);
        const team = teams.find(t => t.id === p.team_id);
        return {
          id: p.id,
          team_id: p.team_id,
          full_name: p.full_name,
          participant_number: p.participant_number,
          qr_code_id: p.qr_code_id,
          team_name: team?.name,
          team_name_ar: team?.name_ar,
          team_color: team?.color,
          attended_events_count: pAttendances.length,
          total_score: totalScore
        };
      });

      participantScores.sort((a, b) => b.total_score - a.total_score);

      // Add ranks
      const rankedParticipants = participantScores.map((p, idx) => ({
        rank: idx + 1,
        ...p
      }));

      // Aggregate team scores
      const teamScores = teams.map(team => {
        const teamMembers = rankedParticipants.filter(p => p.team_id === team.id || p.team_name === team.name);
        const teamTotal = teamMembers.reduce((sum, m) => sum + m.total_score, 0);
        const teamAvg = teamMembers.length > 0 ? Number((teamTotal / teamMembers.length).toFixed(1)) : 0;
        return {
          id: team.id,
          name: team.name,
          name_ar: team.name_ar,
          color: team.color,
          leader_name: team.leader_name,
          member_count: teamMembers.length,
          total_score: teamTotal,
          average_score: teamAvg
        };
      });

      // Sort teams by average_score (mean score) descending to normalize for unequal team sizes
      teamScores.sort((a, b) => (b.average_score || 0) - (a.average_score || 0) || (b.total_score || 0) - (a.total_score || 0));

      const rankedTeams = teamScores.map((t, idx) => ({
        rank: idx + 1,
        ...t
      }));

      res.json({
        date: targetDate || null,
        participants: rankedParticipants,
        teams: rankedTeams
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Day-by-Day Score Monitor API
  app.get('/api/scores/daily', (req, res) => {
    try {
      const date = req.query.date as string | undefined;
      const data = DailyScoresService.getDailyMonitor(db, date);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    try {
      res.json(db.getAuditLogs(100));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Authentication Verification
  app.post(['/api/auth/login', '/api/login'], (req, res) => {
    try {
      const { password } = req.body || {};
      const ADMIN_PASSWORD = 'Conf26$';
      if (password === ADMIN_PASSWORD) {
        res.json({ 
          success: true, 
          role: 'admin',
          message: 'Admin authentication successful' 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          error: 'Incorrect admin password. Please try again.' 
        });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clear Attendance and Scores (leaving sessions scheduled)
  app.post(['/api/clear-attendance', '/api/clear-scores'], (req, res) => {
    try {
      const adminName = req.body?.performed_by || 'Administrator';
      db.clearAttendanceAndScores(adminName);
      res.json({ success: true, message: 'All attendance records and scores have been cleared. All sessions remain scheduled.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reset Demo Data
  app.post(['/api/reset-demo', '/api/reset-data'], (req, res) => {
    try {
      db.resetToDefault();
      res.json({ success: true, message: 'Database reset to default conference schedule and participants' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clear All Data
  app.post(['/api/clear-all-data', '/api/clear-data'], (req, res) => {
    try {
      db.clearAllData();
      res.json({ success: true, message: 'All conference data has been cleared' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // Vite Integration for SPA Development & Production
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Attendance Scoring Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
