import { db } from './db.js';
import { 
  Event, 
  Attendance, 
  AttendanceExit, 
  ScanResponse,
  ScanResultType,
  ScoringConfig,
  ApplyScoringOptions,
  ApplyScoringResponse
} from '../src/types.js';

export class ScoringService {
  /**
   * Calculates the arrival base score using the event's configured arrival rules.
   * If arrival is on or before start_time, baseScore = maximum_score.
   * Otherwise, calculate late minutes and find applicable tier.
   */
  static calculateArrivalScore(event: Event, arrivalTime: Date): number {
    const startTime = new Date(event.start_time);
    const arrivalMs = arrivalTime.getTime();
    const startMs = startTime.getTime();

    // Arrived early or right on time
    if (arrivalMs <= startMs) {
      return event.maximum_score;
    }

    const lateMinutes = Math.floor((arrivalMs - startMs) / 60000);
    const rules = [...event.arrival_rules].sort((a, b) => a.max_late_minutes - b.max_late_minutes);

    for (const rule of rules) {
      if (lateMinutes <= rule.max_late_minutes) {
        return Math.min(event.maximum_score, Math.max(0, rule.score));
      }
    }

    return 0; // Exceeded all tiers
  }

  /**
   * Authoritative calculation of an attendance score based on completed exits.
   * Follows:
   * TotalTimeOut = SUM(completed exit durations)
   * DeductibleTime = MAX(0, TotalTimeOut - GracePeriod)
   * Deduction = DeductibleTime * DeductionRate
   * CalculatedScore = MAX(0, BaseScore - Deduction)
   * FinalScore = OverrideScore !== null ? OverrideScore : CalculatedScore
   */
  static calculateAttendanceScore(attendanceId: string): Attendance {
    const attendance = db.getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error(`Attendance ${attendanceId} not found`);
    }

    const event = db.getEventById(attendance.event_id);
    if (!event) {
      throw new Error(`Event ${attendance.event_id} not found`);
    }

    const exits = db.getExitsForAttendance(attendanceId);
    const completedExits = exits.filter(e => e.status === 'COMPLETED');

    const totalTimeOutMinutes = completedExits.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const gracePeriodMinutes = event.grace_period_minutes;
    const deductibleMinutes = Math.max(0, totalTimeOutMinutes - gracePeriodMinutes);
    const totalDeduction = deductibleMinutes * event.exit_deduction_rate;
    const calculatedScore = Math.max(event.minimum_score ?? 0, attendance.base_score - totalDeduction);

    const finalScore = attendance.override_score !== null && attendance.override_score !== undefined
      ? attendance.override_score
      : calculatedScore;

    const updated: Attendance = {
      ...attendance,
      total_time_out_minutes: totalTimeOutMinutes,
      grace_period_minutes: gracePeriodMinutes,
      deductible_minutes: deductibleMinutes,
      deduction_rate: event.exit_deduction_rate,
      total_deduction: totalDeduction,
      final_score: finalScore
    };

    return db.saveAttendance(updated);
  }

  /**
   * QR Scan Decision Engine (PRD Section 21)
   */
  static handleScan(qrCodeId: string, performedBy: string = 'Servant'): ScanResponse {
    // 1. Find participant
    const participant = db.getParticipantByQr(qrCodeId);
    if (!participant) {
      return {
        type: 'INVALID_QR',
        message: `Participant with QR "${qrCodeId}" not found in system.`,
        message_ar: `لم يتم العثور على مشارك بالرمز "${qrCodeId}".`
      };
    }

    if (!participant.active) {
      return {
        type: 'ERROR',
        message: `Participant "${participant.full_name}" is marked as inactive.`,
        message_ar: `المشارك "${participant.full_name}" غير مفعّل بالسيستم.`
      };
    }

    // 2. Is there an active event?
    const activeEvent = db.getActiveEvent();
    if (!activeEvent) {
      return {
        type: 'NO_ACTIVE_EVENT',
        participant,
        message: 'No active event session in progress.',
        message_ar: 'لا توجد جلسة أو اجتماع نشط حالياً.'
      };
    }

    // 3. Find Attendance record
    const existingAttendance = db.getAttendanceByParticipantAndEvent(participant.id, activeEvent.id);

    const now = new Date();

    if (!existingAttendance) {
      // 3A. CHECK IN
      const baseScore = this.calculateArrivalScore(activeEvent, now);
      const newAttendanceId = 'att-' + Date.now();
      
      const newAttendance: Attendance = {
        id: newAttendanceId,
        participant_id: participant.id,
        event_id: activeEvent.id,
        arrival_time: now.toISOString(),
        base_score: baseScore,
        total_time_out_minutes: 0,
        grace_period_minutes: activeEvent.grace_period_minutes,
        deductible_minutes: 0,
        deduction_rate: activeEvent.exit_deduction_rate,
        total_deduction: 0,
        final_score: baseScore,
        status: 'PRESENT',
        override_score: null,
        override_reason: null,
        override_by: null,
        override_date: null,
        created_by: performedBy,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      const savedAttendance = db.saveAttendance(newAttendance);

      db.addAuditLog({
        action: 'CHECK_IN',
        attendance_id: savedAttendance.id,
        participant_id: participant.id,
        participant_name: participant.full_name,
        event_id: activeEvent.id,
        event_name: activeEvent.name,
        performed_by: performedBy,
        role: 'servant',
        details: `Checked in at ${now.toLocaleTimeString()}. Base score: ${baseScore}. Status: PRESENT.`,
        details_ar: `تم تسجيل الحضور الساعة ${now.toLocaleTimeString()}. الدرجة: ${baseScore}. الحالة: حاضر.`,
        previous_score: null,
        new_score: baseScore
      });

      return {
        type: 'CHECKED_IN',
        message: `Checked in successfully: ${participant.full_name}`,
        message_ar: `تم تسجيل الحضور بنجاح: ${participant.full_name}`,
        participant,
        attendance: savedAttendance,
        event: activeEvent,
        base_score: baseScore,
        final_score: baseScore,
        arrival_time: now.toISOString()
      };
    }

    // 3B. Attendance exists. Check for OPEN exit
    const openExit = db.getOpenExitForAttendance(existingAttendance.id);

    if (openExit) {
      // PERFORM RETURN
      const exitTime = new Date(openExit.exit_time);
      const diffMs = now.getTime() - exitTime.getTime();
      // calculate duration in minutes, minimum 1 if > 25 seconds
      const durationMinutes = Math.max(1, Math.round(diffMs / 60000));

      openExit.return_time = now.toISOString();
      openExit.duration_minutes = durationMinutes;
      openExit.status = 'COMPLETED';
      openExit.updated_at = now.toISOString();
      db.saveExit(openExit);

      // Change status to PRESENT
      existingAttendance.status = 'PRESENT';
      db.saveAttendance(existingAttendance);

      // Recalculate score server-side
      const updatedAttendance = this.calculateAttendanceScore(existingAttendance.id);

      db.addAuditLog({
        action: 'RETURN',
        attendance_id: existingAttendance.id,
        participant_id: participant.id,
        participant_name: participant.full_name,
        event_id: activeEvent.id,
        event_name: activeEvent.name,
        performed_by: performedBy,
        role: 'servant',
        details: `Returned after ${durationMinutes} min. Total outside: ${updatedAttendance.total_time_out_minutes} min. Deduction: ${updatedAttendance.total_deduction}. Final: ${updatedAttendance.final_score}.`,
        details_ar: `عاد بعد ${durationMinutes} دقيقة. إجمالي الوقت بالخارج: ${updatedAttendance.total_time_out_minutes} دقيقة. الخصم: ${updatedAttendance.total_deduction}. النهائي: ${updatedAttendance.final_score}.`,
        previous_score: existingAttendance.final_score,
        new_score: updatedAttendance.final_score
      });

      return {
        type: 'RETURNED',
        message: `Welcome back, ${participant.full_name}! Exit closed.`,
        message_ar: `حمداً لله على سلامتك يا ${participant.full_name}! تم تسجيل العودة.`,
        participant,
        attendance: updatedAttendance,
        exit: openExit,
        event: activeEvent,
        time_outside_minutes: durationMinutes,
        total_time_out_minutes: updatedAttendance.total_time_out_minutes,
        deduction: updatedAttendance.total_deduction,
        final_score: updatedAttendance.final_score
      };
    }

    // 3C. No open exit
    if (existingAttendance.status === 'TEMPORARILY_OUT') {
      // Participant was marked out without exit record - repair state
      existingAttendance.status = 'PRESENT';
      const updatedAttendance = db.saveAttendance(existingAttendance);
      return {
        type: 'RETURNED',
        message: `Status restored to Present: ${participant.full_name}`,
        message_ar: `تمت استعادة الحالة إلى حاضر: ${participant.full_name}`,
        participant,
        attendance: updatedAttendance,
        event: activeEvent,
        final_score: updatedAttendance.final_score
      };
    }

    // Participant is already PRESENT
    return {
      type: 'ALREADY_PRESENT',
      message: `${participant.full_name} is already checked in and present.`,
      message_ar: `${participant.full_name} مسجل حضور بالفعل وموجود حالياً بالداخل.`,
      participant,
      attendance: existingAttendance,
      event: activeEvent,
      arrival_time: existingAttendance.arrival_time,
      base_score: existingAttendance.base_score,
      final_score: existingAttendance.final_score
    };
  }

  /**
   * Registers a temporary exit for an attendance record (PRD Section 11, 12, 19).
   */
  static registerTemporaryExit(attendanceId: string, performedBy: string = 'Servant'): { attendance: Attendance; exit: AttendanceExit } {
    const attendance = db.getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    if (attendance.status === 'TEMPORARILY_OUT') {
      throw new Error('Participant is already outside');
    }

    // Check constraint: At most one OPEN exit per attendance (PRD Section 19)
    const existingOpen = db.getOpenExitForAttendance(attendanceId);
    if (existingOpen) {
      throw new Error('Participant already has an active open exit');
    }

    const now = new Date();
    const newExit: AttendanceExit = {
      id: 'exit-' + Date.now(),
      attendance_id: attendanceId,
      exit_time: now.toISOString(),
      return_time: null,
      duration_minutes: 0,
      status: 'OPEN',
      created_by: performedBy,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const savedExit = db.saveExit(newExit);

    attendance.status = 'TEMPORARILY_OUT';
    const savedAttendance = db.saveAttendance(attendance);

    const participant = db.getParticipantById(attendance.participant_id);
    const event = db.getEventById(attendance.event_id);

    db.addAuditLog({
      action: 'EXIT',
      attendance_id: attendanceId,
      participant_id: attendance.participant_id,
      participant_name: participant?.full_name,
      event_id: attendance.event_id,
      event_name: event?.name,
      performed_by: performedBy,
      role: 'servant',
      details: `Temporary exit started at ${now.toLocaleTimeString()}`,
      details_ar: `بدأ خروج مؤقت في تمام الساعة ${now.toLocaleTimeString()}`
    });

    return { attendance: savedAttendance, exit: savedExit };
  }

  /**
   * Manual Score Override by Administrator (PRD Section 28).
   */
  static manualScoreOverride(
    attendanceId: string, 
    overrideScore: number, 
    overrideReason: string, 
    adminName: string = 'Administrator'
  ): Attendance {
    const attendance = db.getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error('Attendance not found');
    }

    if (!overrideReason || overrideReason.trim().length === 0) {
      throw new Error('Override reason is required');
    }

    const prevScore = attendance.final_score;
    const now = new Date();

    attendance.override_score = Math.max(0, overrideScore);
    attendance.override_reason = overrideReason.trim();
    attendance.override_by = adminName;
    attendance.override_date = now.toISOString();
    attendance.final_score = Math.max(0, overrideScore);

    const updated = db.saveAttendance(attendance);

    const participant = db.getParticipantById(attendance.participant_id);
    const event = db.getEventById(attendance.event_id);

    db.addAuditLog({
      action: 'SCORE_OVERRIDE',
      attendance_id: attendanceId,
      participant_id: attendance.participant_id,
      participant_name: participant?.full_name,
      event_id: attendance.event_id,
      event_name: event?.name,
      performed_by: adminName,
      role: 'admin',
      details: `Score overridden from ${prevScore} to ${overrideScore}. Reason: ${overrideReason}`,
      details_ar: `تم تعديل الدرجة من ${prevScore} إلى ${overrideScore}. السبب: ${overrideReason}`,
      previous_score: prevScore,
      new_score: overrideScore
    });

    return updated;
  }

  /**
   * Completes an Event and auto-closes any open exits (PRD Section 36).
   */
  static completeEvent(eventId: string, adminName: string = 'Administrator'): Event {
    const event = db.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const now = new Date();
    const eventEndTime = new Date(event.end_time);
    const autoCloseTime = now.getTime() < eventEndTime.getTime() ? now : eventEndTime;

    // Find all attendances for this event
    const attendances = db.getAttendances(eventId);

    for (const att of attendances) {
      const openExit = db.getOpenExitForAttendance(att.id);
      if (openExit) {
        const exitTime = new Date(openExit.exit_time);
        const duration = Math.max(1, Math.round((autoCloseTime.getTime() - exitTime.getTime()) / 60000));

        openExit.return_time = autoCloseTime.toISOString();
        openExit.duration_minutes = duration;
        openExit.status = 'COMPLETED';
        openExit.auto_closed = true;
        openExit.updated_at = now.toISOString();
        db.saveExit(openExit);

        db.addAuditLog({
          action: 'RETURN',
          attendance_id: att.id,
          participant_id: att.participant_id,
          participant_name: att.participant_name,
          event_id: eventId,
          event_name: event.name,
          performed_by: adminName,
          role: 'admin',
          details: `Automatically closed open exit at event end. Duration: ${duration} min.`,
          details_ar: `إغلاق الخروج المؤقت تلقائياً عند انتهاء الجلسة. المدة: ${duration} دقيقة.`
        });
      }

      // Finalize status to COMPLETED
      att.status = 'COMPLETED';
      db.saveAttendance(att);
      this.calculateAttendanceScore(att.id);
    }

    event.status = 'completed';
    event.updated_at = now.toISOString();
    const updatedEvent = db.updateEvent(eventId, { status: 'completed' });

    db.addAuditLog({
      action: 'EVENT_CLOSED',
      event_id: eventId,
      event_name: event.name,
      performed_by: adminName,
      role: 'admin',
      details: `Event "${event.name}" marked as completed. All open exits auto-closed.`,
      details_ar: `تم إنهاء الجلسة "${event.name_ar || event.name}". تم إغلاق جميع الخروج المفتوح.`
    });

    return updatedEvent || event;
  }

  /**
   * Recalculates attendance scores for all participants in a given event.
   * If recalculateArrivalScore is true, updates base_score based on attendance.arrival_time and event.arrival_rules.
   * Recomputes exit deductions based on event.grace_period_minutes and event.exit_deduction_rate.
   * Respects manual score overrides (preserves override_score).
   */
  static recalculateAttendanceScoresForEvent(
    eventId: string, 
    options: { recalculateArrivalScore?: boolean } = { recalculateArrivalScore: true }
  ): { count: number; recalculated: Attendance[] } {
    const event = db.getEventById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const attendances = db.getAttendances(eventId);
    const updatedAttendances: Attendance[] = [];

    for (const att of attendances) {
      let baseScore = att.base_score;
      if (options.recalculateArrivalScore && att.arrival_time) {
        baseScore = this.calculateArrivalScore(event, new Date(att.arrival_time));
      }

      // Calculate completed exits total
      const exits = db.getExitsForAttendance(att.id);
      const completedExits = exits.filter(e => e.status === 'COMPLETED');
      const totalTimeOut = completedExits.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
      const gracePeriod = event.grace_period_minutes;
      const deductibleMinutes = Math.max(0, totalTimeOut - gracePeriod);
      const totalDeduction = deductibleMinutes * event.exit_deduction_rate;
      const calculatedScore = Math.max(event.minimum_score ?? 0, baseScore - totalDeduction);

      const finalScore = (att.override_score !== null && att.override_score !== undefined)
        ? att.override_score
        : calculatedScore;

      const updated: Attendance = {
        ...att,
        base_score: baseScore,
        total_time_out_minutes: totalTimeOut,
        grace_period_minutes: gracePeriod,
        deductible_minutes: deductibleMinutes,
        deduction_rate: event.exit_deduction_rate,
        total_deduction: totalDeduction,
        final_score: finalScore
      };

      const saved = db.saveAttendance(updated);
      updatedAttendances.push(saved);
    }

    return { count: updatedAttendances.length, recalculated: updatedAttendances };
  }

  /**
   * Authoritatively updates scoring rules and applies them according to administrator options:
   * - Saves as global default template (applied to all future newly created events)
   * - Optionally updates active, scheduled, all, or specifically selected existing events
   * - Optionally recalculates all affected existing attendances and logs audit compliance
   */
  static applyScoringRules(
    config: ScoringConfig,
    options: ApplyScoringOptions
  ): ApplyScoringResponse {
    const performedBy = options.performed_by || 'Administrator';

    // 1. Save global default config
    const savedConfig = db.saveScoringConfig({
      ...config,
      updated_by: performedBy
    });

    // 2. Identify target events to update
    const allEvents = db.getEvents();
    let targetEvents: Event[] = [];

    if (options.scope === 'active') {
      const active = db.getActiveEvent();
      if (active) targetEvents.push(active);
    } else if (options.scope === 'all') {
      targetEvents = [...allEvents];
    } else if (options.scope === 'selected' && options.target_event_ids) {
      const idsSet = new Set(options.target_event_ids);
      targetEvents = allEvents.filter(e => idsSet.has(e.id));
    }
    // Note: if options.scope === 'future', targetEvents is empty (only saved as template)

    // 3. Update target events
    const updatedEvents: Event[] = [];
    for (const ev of targetEvents) {
      const updated = db.updateEvent(ev.id, {
        maximum_score: config.maximum_score,
        grace_period_minutes: config.grace_period_minutes,
        exit_deduction_rate: config.exit_deduction_rate,
        minimum_score: config.minimum_score,
        arrival_rules: config.arrival_rules
      });
      if (updated) updatedEvents.push(updated);
    }

    // 4. Optionally recalculate attendances
    let recalculatedAttendancesCount = 0;
    if (options.recalculate_attendances && updatedEvents.length > 0) {
      for (const ev of updatedEvents) {
        const res = this.recalculateAttendanceScoresForEvent(ev.id, { recalculateArrivalScore: true });
        recalculatedAttendancesCount += res.count;
      }
    }

    // 5. Audit log entry
    db.addAuditLog({
      action: 'SCORING_RULES_UPDATED',
      performed_by: performedBy,
      role: 'admin',
      details: `Scoring rules updated: Max=${config.maximum_score}pts, Grace=${config.grace_period_minutes}m, DeductionRate=${config.exit_deduction_rate}pts/m, ArrivalTiers=${config.arrival_rules.length}. Scope: ${options.scope} (${updatedEvents.length} events updated). Recalculated attendances: ${recalculatedAttendancesCount}.`,
      details_ar: `تم تحديث قواعد احتساب الدرجات: الدرجة العظمى=${config.maximum_score}، السماح=${config.grace_period_minutes}ق، معدل الخصم=${config.exit_deduction_rate}نقطة/ق، شرائح الحضور=${config.arrival_rules.length}. النطاق: ${options.scope} (تم تحديث ${updatedEvents.length} جلسات). إعادة حساب الحضور: ${recalculatedAttendancesCount}.`
    });

    return {
      success: true,
      config: savedConfig,
      updated_events_count: updatedEvents.length,
      recalculated_attendances_count: recalculatedAttendancesCount,
      message: `Scoring rules saved successfully. Applied to ${updatedEvents.length} event(s) and recalculated ${recalculatedAttendancesCount} attendance score(s).`,
      message_ar: `تم حفظ وتطبيق قواعد الدرجات بنجاح على ${updatedEvents.length} جلسة، وإعادة احتساب درجات ${recalculatedAttendancesCount} مشارك.`
    };
  }
}
