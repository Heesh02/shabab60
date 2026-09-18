import React, { useState } from 'react';
import { 
  Users, 
  QrCode, 
  Search, 
  Plus, 
  Printer, 
  X, 
  Download, 
  Check, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Participant, Team } from '../types';
import { translations, Language } from '../utils/i18n';
import { CopticCross } from './CopticCross';

interface ParticipantsViewProps {
  lang: Language;
  participants: Participant[];
  teams: Team[];
  onAddParticipant: (p: { full_name: string; team_id: string; phone?: string }) => Promise<void>;
  userRole: string;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  lang,
  participants,
  teams,
  onAddParticipant,
  userRole
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [activeBadgeParticipant, setActiveBadgeParticipant] = useState<Participant | null>(null);

  // New Participant Form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeamId, setNewTeamId] = useState(teams[0]?.id || '');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = participants.filter(p => {
    if (selectedTeamFilter !== 'all' && p.team_id !== selectedTeamFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return p.full_name.toLowerCase().includes(q) || p.participant_number.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddParticipant({
        full_name: newName.trim(),
        team_id: newTeamId,
        phone: newPhone.trim()
      });
      setNewName('');
      setNewPhone('');
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div id="participants-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>{t.nav_participants}</span>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
              {participants.length} {lang === 'ar' ? 'مشارك' : 'youth'}
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'ar' ? 'إدارة بيانات شباب المؤتمر وإصدار الباركود الدائم للبادج' : 'Participant management and permanent QR code badge generator'}
          </p>
        </div>

        {userRole !== 'supervisor' && (
          <button
            id="btn-open-add-participant"
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مشارك جديد' : 'New Participant'}</span>
          </button>
        )}
      </div>

      {/* Add Participant Modal / Form */}
      {isAdding && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-amber-950 text-sm">
              {lang === 'ar' ? 'تسجيل مشارك جديد وتوليد باركود دائم' : 'Register New Participant & Generate Permanent QR'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                {lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Peter George"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                {lang === 'ar' ? 'الفريق' : 'Team'} *
              </label>
              <select
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {teams.map(tm => (
                  <option key={tm.id} value={tm.id}>
                    {lang === 'ar' ? tm.name_ar : tm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                {lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}
              </label>
              <input
                type="tel"
                placeholder="012xxxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (lang === 'ar' ? 'إنشاء الشارة والباركود' : 'Create & Generate Badge')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
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
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase">
              <th className="py-3 px-4">{lang === 'ar' ? 'كود المشارك' : 'Code'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</th>
              <th className="py-3 px-4">{lang === 'ar' ? 'الفريق' : 'Team'}</th>
              <th className="py-3 px-4 text-right">{lang === 'ar' ? 'الشارة الدائمة (QR)' : 'Permanent Badge'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-amber-50/30 transition">
                <td className="py-3 px-4 font-mono font-bold text-stone-600">
                  {p.participant_number}
                </td>
                <td className="py-3 px-4 font-bold text-stone-900">
                  {p.full_name}
                </td>
                <td className="py-3 px-4 text-stone-600">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700">
                    {lang === 'ar' ? (p.team_name_ar || p.team_name) : p.team_name}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveBadgeParticipant(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.print_badge}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permanent QR Code Badge Modal (PRD Section 6) */}
      {activeBadgeParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {t.badge_permanent_qr}
              </span>
              <button
                type="button"
                onClick={() => setActiveBadgeParticipant(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Badge Card Layout */}
            <div id="printable-badge" className="p-5 rounded-2xl bg-gradient-to-b from-stone-900 to-[#1b263b] text-white border-2 border-amber-400 text-center shadow-md relative overflow-hidden">
              <div className="flex justify-center mb-2">
                <CopticCross size={32} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                {t.church_name}
              </p>
              <h3 className="text-sm font-bold text-amber-100 mt-0.5 mb-3">
                {t.conference_system}
              </h3>

              {/* QR Code Container */}
              <div className="bg-white p-3.5 rounded-xl inline-block shadow-inner mx-auto mb-3">
                <QRCodeSVG
                  value={activeBadgeParticipant.qr_code_id}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <h2 className="text-lg font-extrabold text-white">
                {activeBadgeParticipant.full_name}
              </h2>

              <div className="mt-1 flex items-center justify-center gap-2 text-xs">
                <span className="font-mono text-amber-300 bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700">
                  {activeBadgeParticipant.participant_number}
                </span>
                <span className="text-stone-300">
                  {lang === 'ar' ? (activeBadgeParticipant.team_name_ar || activeBadgeParticipant.team_name) : activeBadgeParticipant.team_name}
                </span>
              </div>

              <p className="text-[10px] text-stone-400 mt-4 px-2 leading-relaxed border-t border-stone-800 pt-2">
                {t.badge_instructions}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handlePrintBadge}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طباعة البادج' : 'Print Badge'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveBadgeParticipant(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
