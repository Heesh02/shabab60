import React, { useState, useEffect, useCallback } from 'react';
import { 
  Scan, 
  LayoutDashboard, 
  ClipboardList, 
  Trophy, 
  Users, 
  Calendar, 
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock
} from 'lucide-react';
import { 
  Event, 
  Team, 
  Participant, 
  Attendance, 
  AuditLog, 
  DashboardStats 
} from './types';
import { Language, translations } from './utils/i18n';
import { Navbar } from './components/Navbar';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { AttendanceDetailModal } from './components/AttendanceDetailModal';
import { ScoreOverrideModal } from './components/ScoreOverrideModal';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LeaderboardView } from './components/LeaderboardView';
import { DailyScoreMonitorView } from './components/DailyScoreMonitorView';
import { TeamsView } from './components/TeamsView';
import { ParticipantsView } from './components/ParticipantsView';
import { EventsView } from './components/EventsView';
import { ScoringRulesView } from './components/ScoringRulesView';
import { AuditTrailView } from './components/AuditTrailView';

export function App() {
  const [lang, setLang] = useState<Language>('en');

  // Authentication State: Default to viewer-only for visiting participants
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('youth_conf_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Role: 'viewer' by default unless admin has logged in
  const [userRole, setUserRole] = useState<'admin' | 'servant' | 'supervisor' | 'viewer'>(() => {
    try {
      const isAuth = typeof window !== 'undefined' && localStorage.getItem('youth_conf_admin_auth') === 'true';
      return isAuth ? 'admin' : 'viewer';
    } catch {
      return 'viewer';
    }
  });

  // Default Tab: 'leaderboard' for participants (viewer only); 'scanner' for logged-in admin
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const isAuth = typeof window !== 'undefined' && localStorage.getItem('youth_conf_admin_auth') === 'true';
      return isAuth ? 'scanner' : 'leaderboard';
    } catch {
      return 'leaderboard';
    }
  });

  // Core Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Modals & Dialogs
  const [detailModalAttendance, setDetailModalAttendance] = useState<Attendance | null>(null);
  const [overrideModalAttendance, setOverrideModalAttendance] = useState<Attendance | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'clear' | null>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const t = translations[lang];

  // Update HTML direction and language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Tab boundary enforcement: If viewer attempts to access admin tabs, redirect to leaderboard
  useEffect(() => {
    const viewerAllowedTabs = ['leaderboard', 'daily-scores', 'teams', 'events'];
    if (!isAdminAuthenticated && !viewerAllowedTabs.includes(currentTab)) {
      setCurrentTab('leaderboard');
    }
  }, [isAdminAuthenticated, currentTab]);

  // Handle Admin Login Success (Password: YouthConf26$)
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminLoginModal(false);
    try {
      localStorage.setItem('youth_conf_admin_auth', 'true');
    } catch {}
    setUserRole('admin');
    setCurrentTab('scanner');
    setSuccessToast(lang === 'ar' ? 'تم تسجيل الدخول بنجاح كمسؤول للمؤتمر' : 'Logged in as Administrator successfully');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Handle Logout back to Participant Viewer mode
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('youth_conf_admin_auth');
    } catch {}
    setUserRole('viewer');
    setCurrentTab('leaderboard');
    setSuccessToast(lang === 'ar' ? 'تم الخروج إلى وضع المشاهدة' : 'Returned to Participant Viewer Mode');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Current servant / user display name
  const currentServantName = userRole === 'admin' ? 'Administrator (أمين المؤتمر)' : 
                             userRole === 'servant' ? 'Servant Mina (خادم الحضور)' : 
                             userRole === 'supervisor' ? 'Supervisor (مشرف)' :
                             'Participant Viewer (مشاهد)';

  // Data Fetching
  const fetchAllData = useCallback(async () => {
    try {
      // 1. Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const s: DashboardStats = await statsRes.json();
        setStats(s);
        if (!selectedEventId && s.active_event) {
          setSelectedEventId(s.active_event.id);
        }
      }

      // 2. Events
      const eventsRes = await fetch('/api/events');
      if (eventsRes.ok) {
        const evs: Event[] = await eventsRes.json();
        setEvents(evs);
        if (!selectedEventId && evs.length > 0) {
          const active = evs.find(e => e.status === 'active');
          setSelectedEventId(active ? active.id : evs[0].id);
        }
      }

      // 3. Teams
      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) {
        setTeams(await teamsRes.json());
      }

      // 4. Participants
      const partRes = await fetch('/api/participants');
      if (partRes.ok) {
        setParticipants(await partRes.json());
      }

      // 5. Leaderboard
      const lbRes = await fetch('/api/leaderboard');
      if (lbRes.ok) {
        setLeaderboardData(await lbRes.json());
      }

      // 6. Audit Logs
      const auditRes = await fetch('/api/audit-logs');
      if (auditRes.ok) {
        setAuditLogs(await auditRes.json());
      }
    } catch (err: any) {
      console.error('Error fetching data', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEventId]);

  // Fetch attendances for selected event
  const fetchAttendances = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/attendances?event_id=${selectedEventId}`);
      if (res.ok) {
        const atts: Attendance[] = await res.json();
        setAttendances(atts);
      }
    } catch (err) {
      console.error('Error fetching attendances', err);
    }
  }, [selectedEventId]);

  // Initial Load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refresh attendances whenever selectedEventId changes
  useEffect(() => {
    fetchAttendances();
  }, [selectedEventId, fetchAttendances]);

  // Periodic polling every 5 seconds to keep attendance timers & stats fresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendances();
      fetch('/api/stats')
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAttendances]);

  // Actions
  const handleRegisterExit = async (attendanceId: string) => {
    try {
      const res = await fetch(`/api/attendances/${attendanceId}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: currentServantName })
      });
      if (res.ok) {
        fetchAllData();
        fetchAttendances();
      }
    } catch (e: any) {
      setErrorBanner(e.message || 'Error registering temporary exit');
    }
  };

  const handleRegisterReturn = async (attendanceId: string) => {
    try {
      const res = await fetch(`/api/attendances/${attendanceId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: currentServantName })
      });
      if (res.ok) {
        fetchAllData();
        fetchAttendances();
      }
    } catch (e: any) {
      setErrorBanner(e.message || 'Error registering return');
    }
  };

  const handleSaveOverride = async (attendanceId: string, overrideScore: number, reason: string) => {
    const res = await fetch(`/api/attendances/${attendanceId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        override_score: overrideScore,
        override_reason: reason,
        performed_by: currentServantName
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save override');
    }
    fetchAllData();
    fetchAttendances();
  };

  const handleActivateEvent = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: currentServantName })
    });
    if (res.ok) {
      setSelectedEventId(eventId);
      fetchAllData();
      fetchAttendances();
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: currentServantName })
    });
    if (res.ok) {
      fetchAllData();
      fetchAttendances();
    }
  };

  const handleUpdateEventRules = async (eventId: string, rules: Partial<Event>, recalculate?: boolean) => {
    const res = await fetch(`/api/events/${eventId}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rules, 
        recalculate_attendances: recalculate ?? true,
        performed_by: currentServantName 
      })
    });
    if (res.ok) {
      fetchAllData();
      fetchAttendances();
    }
  };

  const handleCreateEvent = async (newEvent: Partial<Event>) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newEvent,
          event: newEvent, 
          performed_by: currentServantName 
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create session');
      }
      const created: Event = await res.json();
      await fetchAllData();
      if (created.status === 'active') {
        setSelectedEventId(created.id);
        fetchAttendances();
      }
      return created;
    } catch (e: any) {
      console.error('Failed to create event:', e);
      throw e;
    }
  };

  const handleAddParticipant = async (p: { full_name: string; team_id: string; phone?: string }) => {
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...p,
          participant: p, 
          performed_by: currentServantName 
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add participant');
      }
      await fetchAllData();
    } catch (e: any) {
      console.error('Failed to add participant:', e);
      throw e;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: currentServantName })
      });
      if (res.ok) {
        await fetchAllData();
        await fetchAttendances();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete event');
      }
    } catch (e: any) {
      console.error('Failed to delete event:', e);
      throw e;
    }
  };

  const handleCreateTeam = async (teamData: { name: string; name_ar: string; color: string; leader_name?: string }) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...teamData,
          performed_by: currentServantName,
          role: userRole
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create team');
      }
      await fetchAllData();
    } catch (e: any) {
      console.error('Failed to create team:', e);
      throw e;
    }
  };

  const handleUpdateTeam = async (id: string, updates: { name: string; name_ar: string; color: string; leader_name?: string }) => {
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          performed_by: currentServantName,
          role: userRole
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update team');
      }
      await fetchAllData();
    } catch (e: any) {
      console.error('Failed to update team:', e);
      throw e;
    }
  };

  const handleDeleteTeam = async (id: string, reassignToTeamId?: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reassign_to: reassignToTeamId,
          performed_by: currentServantName,
          role: userRole
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete team');
      }
      await fetchAllData();
    } catch (e: any) {
      console.error('Failed to delete team:', e);
      throw e;
    }
  };

  const handleOpenResetDialog = () => {
    setConfirmDialog('reset');
  };

  const handleOpenClearDialog = () => {
    setConfirmDialog('clear');
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsDialogLoading(true);
    try {
      const endpoint = confirmDialog === 'clear' ? '/api/clear-data' : '/api/reset-data';
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
        await fetchAttendances();
        const msg = confirmDialog === 'clear' ? t.clear_data_success : t.reset_data_success;
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorBanner(err.error || 'Operation failed');
      }
    } catch (e: any) {
      console.error('Data action failed:', e);
      setErrorBanner(e.message || 'Operation failed');
    } finally {
      setIsDialogLoading(false);
      setConfirmDialog(null);
    }
  };

  const outsideCount = stats?.temporarily_out_count || 0;
  const activeEvent = stats?.active_event || null;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'en' ? 'ar' : 'en')}
        isAdmin={isAdminAuthenticated}
        onOpenLogin={() => setShowAdminLoginModal(true)}
        onLogout={handleAdminLogout}
        userRole={userRole}
        onSelectRole={setUserRole}
        onResetData={handleOpenResetDialog}
        onClearData={handleOpenClearDialog}
        outsideCount={outsideCount}
      />

      {/* Success Toast Notification */}
      {successToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error alert if any */}
      {errorBanner && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs flex justify-between items-center shadow-xs">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="font-bold underline cursor-pointer">
            {t.cancel}
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Participant Viewer Mode Welcome Banner */}
        {!isAdminAuthenticated && (
          <div className="mb-6 bg-gradient-to-r from-stone-900 via-[#1c2833] to-stone-900 rounded-2xl p-4 sm:p-5 text-white border border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>{t.viewer_banner_title}</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                    {lang === 'ar' ? 'محدث تلقائياً' : 'Live Standings'}
                  </span>
                </h2>
                <p className="text-xs text-stone-300 mt-0.5 max-w-2xl leading-relaxed">
                  {t.viewer_banner_desc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                id="btn-viewer-admin-login-banner"
                type="button"
                onClick={() => setShowAdminLoginModal(true)}
                className="w-full sm:w-auto px-3.5 py-2 bg-stone-800/90 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.admin_login}</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-stone-500">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold uppercase tracking-wider">{lang === 'ar' ? 'جارٍ تحميل نظام المؤتمر...' : 'Loading Conference System...'}</p>
          </div>
        ) : (
          <>
            {/* View: Scanner (Default / Primary Servant View) */}
            {currentTab === 'scanner' && (
              <ScannerView
                lang={lang}
                activeEvent={activeEvent}
                participants={participants}
                onAttendanceUpdated={() => {
                  fetchAllData();
                  fetchAttendances();
                }}
                currentServantName={currentServantName}
              />
            )}

            {/* View: Dashboard */}
            {currentTab === 'dashboard' && (
              <DashboardView
                lang={lang}
                stats={stats}
                teams={teams}
                attendances={attendances}
                onNavigateTab={setCurrentTab}
                onOpenAttendanceDetail={att => setDetailModalAttendance(att)}
                onSelectQuickExit={handleRegisterExit}
                onSelectQuickReturn={handleRegisterReturn}
                userRole={userRole}
              />
            )}

            {/* View: Attendance Records */}
            {currentTab === 'attendance' && (
              <AttendanceView
                lang={lang}
                attendances={attendances}
                participants={participants}
                teams={teams}
                events={events}
                activeEventId={activeEvent?.id || null}
                selectedEventId={selectedEventId}
                onSelectEventId={setSelectedEventId}
                onOpenDetailModal={att => setDetailModalAttendance(att)}
                onOpenOverrideModal={att => setOverrideModalAttendance(att)}
                onRegisterExit={handleRegisterExit}
                onRegisterReturn={handleRegisterReturn}
                userRole={userRole}
              />
            )}

            {/* View: Leaderboard */}
            {currentTab === 'leaderboard' && (
              <LeaderboardView
                lang={lang}
                data={leaderboardData}
                onNavigateToTeams={() => setCurrentTab('teams')}
                onNavigateToDailyScores={() => setCurrentTab('daily-scores')}
              />
            )}

            {/* View: Day-by-Day Score Monitor */}
            {currentTab === 'daily-scores' && (
              <DailyScoreMonitorView
                lang={lang}
              />
            )}

            {/* View: Teams & Scoring Standings */}
            {currentTab === 'teams' && (
              <TeamsView
                lang={lang}
                teams={teams}
                onCreateTeam={handleCreateTeam}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
                userRole={userRole}
              />
            )}

            {/* View: Participants & Badges */}
            {currentTab === 'participants' && (
              <ParticipantsView
                lang={lang}
                participants={participants}
                teams={teams}
                onAddParticipant={handleAddParticipant}
                userRole={userRole}
              />
            )}

            {/* View: Sessions & Events */}
            {currentTab === 'events' && (
              <EventsView
                lang={lang}
                events={events}
                onActivateEvent={handleActivateEvent}
                onCompleteEvent={handleCompleteEvent}
                onUpdateEventRules={handleUpdateEventRules}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
                onNavigateToScoringRules={() => setCurrentTab('scoring-rules')}
                userRole={userRole}
              />
            )}

            {/* View: Scoring Rules Configuration (Admin) */}
            {currentTab === 'scoring-rules' && (
              <ScoringRulesView
                lang={lang}
                userRole={userRole}
                events={events}
                activeEvent={activeEvent}
                onRulesApplied={() => {
                  fetchAllData();
                  fetchAttendances();
                }}
              />
            )}

            {/* View: Audit Trail */}
            {currentTab === 'audit' && (
              <AuditTrailView
                lang={lang}
                logs={auditLogs}
              />
            )}
          </>
        )}
      </main>

      {/* Attendance Detail & Mathematical Breakdown Modal */}
      {detailModalAttendance && (
        <AttendanceDetailModal
          lang={lang}
          attendance={detailModalAttendance}
          onClose={() => setDetailModalAttendance(null)}
          onOpenOverride={att => setOverrideModalAttendance(att)}
          userRole={userRole}
        />
      )}

      {/* Manual Score Override Modal (Admin only) */}
      {overrideModalAttendance && (
        <ScoreOverrideModal
          lang={lang}
          attendance={overrideModalAttendance}
          onClose={() => setOverrideModalAttendance(null)}
          onSubmit={handleSaveOverride}
          currentAdminName={currentServantName}
        />
      )}

      {/* Confirmation Dialog for Reset or Clear Data */}
      <ConfirmDialogModal
        isOpen={confirmDialog !== null}
        type={confirmDialog || 'reset'}
        lang={lang}
        title={confirmDialog === 'clear' ? t.confirm_clear_title : t.confirm_reset_title}
        description={confirmDialog === 'clear' ? t.confirm_clear_desc : t.confirm_reset_desc}
        confirmLabel={confirmDialog === 'clear' ? t.confirm_clear_btn : t.confirm_reset_btn}
        cancelLabel={t.cancel}
        isLoading={isDialogLoading}
        onConfirm={handleConfirmAction}
        onClose={() => {
          if (!isDialogLoading) setConfirmDialog(null);
        }}
      />

      {/* Admin Login Modal (Password: YouthConf26$) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
        lang={lang}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.church_name} • {t.conference_system}</span>
          <span className="font-mono text-[11px] text-stone-400">
            Authoritative Server Scoring Engine • Dynamics 365 Architecture
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
