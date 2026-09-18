import React, { useState } from 'react';
import { 
  Scan, 
  LayoutDashboard, 
  ClipboardList, 
  Trophy, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Languages, 
  RotateCcw,
  Trash2,
  Shield,
  Sliders,
  Menu,
  X,
  KeyRound,
  LogOut,
  Eye
} from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import { CopticCross } from './CopticCross';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: Language;
  onToggleLang: () => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  userRole: 'admin' | 'servant' | 'supervisor' | 'viewer';
  onSelectRole: (role: 'admin' | 'servant' | 'supervisor') => void;
  onResetData: () => void;
  onClearData: () => void;
  outsideCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  isAdmin,
  onOpenLogin,
  onLogout,
  userRole,
  onSelectRole,
  onResetData,
  onClearData,
  outsideCount
}) => {
  const t = translations[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Viewer items: Clean, public view of scores, rankings, team rosters, and conference schedule
  const viewerNavItems = [
    { id: 'leaderboard', label: t.nav_leaderboard, icon: Trophy, highlight: true },
    { id: 'daily-scores', label: t.nav_daily_scores, icon: Calendar, badge: lang === 'ar' ? 'يومي' : 'Daily' },
    { id: 'teams', label: t.nav_teams, icon: Shield },
    { id: 'events', label: t.schedule_nav, icon: Calendar },
  ];

  // Admin items: Full suite including Scanner, Dashboard, Attendance, Rules, Audits
  const adminNavItems = [
    { id: 'scanner', label: t.nav_scanner, icon: Scan, highlight: true },
    { id: 'dashboard', label: t.nav_dashboard, icon: LayoutDashboard },
    { id: 'attendance', label: t.nav_attendance, icon: ClipboardList, badge: outsideCount > 0 ? outsideCount : null },
    { id: 'daily-scores', label: t.nav_daily_scores, icon: Calendar, badge: lang === 'ar' ? 'يومي' : 'Daily' },
    { id: 'leaderboard', label: t.nav_leaderboard, icon: Trophy },
    { id: 'teams', label: t.nav_teams, icon: Shield },
    { id: 'participants', label: t.nav_participants, icon: Users },
    { id: 'events', label: t.nav_events, icon: Calendar },
    { id: 'scoring-rules', label: t.nav_scoring_rules, icon: Sliders },
    { id: 'audit', label: t.nav_audit_log, icon: ShieldCheck },
  ];

  const activeNavItems = isAdmin ? adminNavItems : viewerNavItems;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-white shadow-md">
      {/* Top Meta Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between border-b border-stone-800/80 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <CopticCross size={18} />
          <span className="font-serif tracking-wide text-amber-300 hidden sm:inline">
            {t.church_name}
          </span>
          <span className="text-stone-500 hidden sm:inline">•</span>
          
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              {t.admin_portal}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 text-[11px]">
              <Eye className="w-3 h-3 text-amber-400" />
              {t.viewer_mode_badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Controls when authenticated */}
          {isAdmin ? (
            <>
              {/* Role selector */}
              <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-[11px]">
                <span className="px-2 text-stone-400 hidden sm:inline flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  {t.switch_role}:
                </span>
                <button
                  id="role-btn-admin"
                  type="button"
                  onClick={() => onSelectRole('admin')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition font-medium ${
                    userRole === 'admin' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {t.role_admin}
                </button>
                <button
                  id="role-btn-servant"
                  type="button"
                  onClick={() => onSelectRole('servant')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition font-medium ${
                    userRole === 'servant' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {t.role_servant}
                </button>
                <button
                  id="role-btn-supervisor"
                  type="button"
                  onClick={() => onSelectRole('supervisor')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition font-medium ${
                    userRole === 'supervisor' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {t.role_supervisor}
                </button>
              </div>

              {/* Reset Sample Data Button */}
              <button
                id="btn-reset-demo-data"
                type="button"
                onClick={onResetData}
                title={t.reset_demo}
                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-300 border border-stone-700 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Clear All Data Button */}
              <button
                id="btn-clear-all-data"
                type="button"
                onClick={onClearData}
                title={t.clear_all_data}
                className="p-1 rounded bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 border border-stone-700 hover:border-rose-700/60 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Exit Admin Mode */}
              <button
                id="btn-admin-logout-top"
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-800/60 font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.admin_logout}</span>
              </button>
            </>
          ) : (
            /* Viewer Mode: Prominent Admin Login Button */
            <button
              id="btn-open-admin-login"
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm border border-amber-500/50 text-[11px] cursor-pointer transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-200" />
              <span>{t.admin_login}</span>
            </button>
          )}

          {/* Lang toggle */}
          <button
            id="btn-toggle-lang"
            type="button"
            onClick={onToggleLang}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 flex items-center gap-1 font-bold cursor-pointer transition"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Primary Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md">
            <CopticCross size={22} color="#ffffff" />
          </div>
          <div 
            className="cursor-pointer" 
            onClick={() => onSelectTab(isAdmin ? 'scanner' : 'leaderboard')}
          >
            <h1 className="font-extrabold text-white text-base tracking-tight leading-none font-serif">
              {t.app_title}
            </h1>
            <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase block mt-0.5">
              {isAdmin ? 'Attendance & Scoring Engine' : 'Live Youth Conference Scores'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {activeNavItems.map(item => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isSelected 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : item.highlight
                    ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile menu toggle & Quick Actions */}
        <div className="lg:hidden flex items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onSelectTab('scanner')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Scan className="w-4 h-4" />
              <span>{t.nav_scanner}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab('leaderboard')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>{t.nav_leaderboard}</span>
            </button>
          )}
          
          <button
            id="btn-mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-t border-stone-800 px-4 py-3 space-y-1">
          {activeNavItems.map(item => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between ${
                  isSelected ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Mobile Utilities */}
          {isAdmin ? (
            <div className="pt-2 mt-2 border-t border-stone-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-mobile-reset-data"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onResetData();
                  }}
                  className="px-2.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.reset_demo}</span>
                </button>
                <button
                  id="btn-mobile-clear-data"
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onClearData();
                  }}
                  className="px-2.5 py-2 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.clear_all_data}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 bg-rose-950/90 text-rose-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-rose-800/60"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.admin_logout}</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 mt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.admin_login}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
