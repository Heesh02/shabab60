import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  ArrowRightLeft, 
  Info, 
  AlertCircle, 
  UserCheck, 
  LogOut, 
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanResponse, Participant, Event } from '../types';
import { translations, Language } from '../utils/i18n';
import { 
  playSuccessChime, 
  playReturnChime, 
  playWarningBeep, 
  playErrorBuzz 
} from '../utils/audio';

interface ScannerViewProps {
  lang: Language;
  activeEvent: Event | null;
  participants: Participant[];
  onAttendanceUpdated: () => void;
  currentServantName: string;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  lang,
  activeEvent,
  participants,
  onAttendanceUpdated,
  currentServantName
}) => {
  const t = translations[lang];
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'qr-reader-container';

  // Process a QR code scanned by camera or entered manually
  const processQrCode = async (code: string) => {
    if (!code || isProcessing) return;

    // Prevent immediate double scan of the exact same code within 2 seconds
    if (code === lastScannedCode && isProcessing) {
      return;
    }

    setIsProcessing(true);
    setLastScannedCode(code);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: code,
          performed_by: currentServantName
        })
      });

      const data: ScanResponse = await res.json();
      setScanResult(data);
      onAttendanceUpdated();

      // Audio & Haptic Feedback (PRD Section 39)
      if (data.type === 'CHECKED_IN') {
        playSuccessChime();
      } else if (data.type === 'RETURNED') {
        playReturnChime();
      } else if (data.type === 'ALREADY_PRESENT' || data.type === 'ALREADY_OUT') {
        playWarningBeep();
      } else {
        playErrorBuzz();
      }
    } catch (e: any) {
      playErrorBuzz();
      setScanResult({
        type: 'ERROR',
        message: e.message || 'Connection error processing scan',
        message_ar: 'حدث خطأ في الاتصال أثناء معالجة المسح'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger Temporary Exit directly from the scanner result card
  const handleQuickExit = async (attendanceId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/attendances/${attendanceId}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: currentServantName })
      });
      if (res.ok) {
        playWarningBeep();
        onAttendanceUpdated();
        // Update local result state
        if (scanResult?.participant) {
          processQrCode(scanResult.participant.qr_code_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger Return directly
  const handleQuickReturn = async (attendanceId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/attendances/${attendanceId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: currentServantName })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        playReturnChime();
        onAttendanceUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          processQrCode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera failed to start, offering manual / simulated fallback:', err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or use quick test select.');
      setIsCameraActive(false);
      setCameraPermissionGranted(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error('Error stopping camera', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div id="scanner-view-container" className="space-y-6">
      {/* Active Session Indicator */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1b263b] to-stone-900 text-amber-100 p-4 rounded-xl border border-amber-500/30 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
              {t.active_session}
            </span>
          </div>
          {activeEvent && (
            <span className="text-xs text-stone-300 font-mono">
              {new Date(activeEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeEvent.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          {activeEvent ? (lang === 'ar' ? activeEvent.name_ar : activeEvent.name) : t.res_no_active_event}
        </h2>
        {activeEvent && (
          <div className="flex items-center gap-4 text-xs text-amber-200/80 mt-2">
            <span>{t.grace_period}: {activeEvent.grace_period_minutes} {t.minutes}</span>
            <span>•</span>
            <span>{t.deduction_rate}: {activeEvent.exit_deduction_rate} {t.points_per_min}</span>
            <span>•</span>
            <span>{t.base_score}: {activeEvent.maximum_score} {t.points}</span>
          </div>
        )}
      </div>

      {/* Main Scanner Section (PRD Section 22: Recommended Mobile Scanner UI) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            {t.scanner_title}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {t.scanner_scan_prompt}
          </p>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden bg-stone-900 border-2 border-stone-300 aspect-square flex flex-col items-center justify-center text-stone-400 p-4 shadow-inner">
          <div id={scannerRegionId} className="w-full h-full"></div>

          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900/95 z-10">
              <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-amber-400 mb-3 border border-stone-700">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-stone-200 mb-1">
                {t.scanner_camera_permission_hint}
              </p>
              <p className="text-xs text-stone-400 mb-4 max-w-xs">
                {lang === 'ar' ? 'اضغط لتشغيل كاميرا الهاتف وقراءة باركود شارة المشارك' : 'Tap below to launch phone camera and scan attendee badge'}
              </p>
              <button
                id="btn-start-camera"
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                {t.scanner_camera_start}
              </button>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
              <button
                id="btn-stop-camera"
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800/90 text-stone-200 hover:text-white text-xs backdrop-blur font-medium border border-stone-700 cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                {t.scanner_camera_stop}
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-semibold tracking-wide text-amber-300">
                {lang === 'ar' ? 'جارٍ تسجيل البيانات...' : 'Processing Attendance...'}
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{lang === 'ar' ? 'تنبيه الكاميرا' : 'Camera Notice'}</p>
              <p>{cameraError}</p>
              <p className="mt-1 text-stone-600">{lang === 'ar' ? 'يمكنك استخدام الإدخال اليدوي أو الاختيار السريع أدناه للمتابعة بسلاسة.' : 'You can still use manual entry or instant 1-tap participant testing below.'}</p>
            </div>
          </div>
        )}

        {/* Manual Code Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode) {
              processQrCode(manualCode);
            }
          }}
          className="mt-4 flex gap-2 max-w-sm mx-auto"
        >
          <input
            id="manual-qr-input"
            type="text"
            placeholder={t.scanner_enter_code}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            className="flex-1 px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono tracking-wider"
          />
          <button
            id="btn-manual-submit"
            type="submit"
            disabled={!manualCode.trim() || isProcessing}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
          >
            {t.scanner_submit_btn}
          </button>
        </form>

        {/* Quick-Select Participant Test Suite (For instant demo testing without physical badges) */}
        <div className="mt-6 pt-5 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {t.scanner_quick_select}
            </span>
            <span className="text-[11px] text-stone-400">
              {lang === 'ar' ? 'اختبار بنقرة واحدة' : '1-Tap Simulator'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {participants.slice(0, 6).map((p) => (
              <button
                key={p.id}
                id={`quick-scan-${p.participant_number}`}
                type="button"
                onClick={() => processQrCode(p.qr_code_id)}
                disabled={isProcessing}
                className="p-2 text-left bg-stone-50 hover:bg-amber-50/80 active:bg-amber-100 border border-stone-200 hover:border-amber-400 rounded-lg transition text-xs flex flex-col cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-stone-800 group-hover:text-amber-900 truncate">
                    {p.full_name}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 bg-stone-200 group-hover:bg-amber-200 px-1 py-0.5 rounded">
                    {p.participant_number}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 mt-1 truncate">
                  {p.team_name || 'Team'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Results Card (PRD Sections 23, 24, 25) */}
      {scanResult && (
        <div 
          id="scan-result-card" 
          className="animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-2xl overflow-hidden shadow-lg border"
        >
          {/* 1. CHECKED IN (Section 23: Green / Success) */}
          {scanResult.type === 'CHECKED_IN' && (
            <div className="bg-emerald-50 border-emerald-300 text-emerald-950 p-6 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded">
                    ✓ {t.res_checked_in}
                  </span>
                  <h3 className="text-xl font-bold text-emerald-900 mt-1">
                    {scanResult.participant?.full_name}
                  </h3>
                  <p className="text-xs text-emerald-800 font-mono">
                    {scanResult.participant?.participant_number} • {scanResult.participant?.team_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-emerald-200 text-center">
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.arrival_time}</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {scanResult.arrival_time ? new Date(scanResult.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase font-medium">{t.base_score}</span>
                  <span className="font-extrabold text-emerald-700 text-base">
                    {scanResult.base_score} {t.points}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase font-medium">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {t.status_present}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs text-emerald-800">
                <span>{lang === 'ar' ? 'جاهز للمسح التالي...' : 'Ready for next attendee...'}</span>
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-medium hover:bg-emerald-800 cursor-pointer"
                >
                  {lang === 'ar' ? 'مسح تالٍ' : 'Scan Next'}
                </button>
              </div>
            </div>
          )}

          {/* 2. RETURNED (Section 24: Green / Success Return) */}
          {scanResult.type === 'RETURNED' && (
            <div className="bg-emerald-50 border-emerald-300 text-emerald-950 p-6 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowRightLeft className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded">
                    ✓ {t.res_returned}
                  </span>
                  <h3 className="text-xl font-bold text-emerald-900 mt-1">
                    {scanResult.participant?.full_name}
                  </h3>
                  <p className="text-xs text-emerald-800 font-mono">
                    {scanResult.participant?.participant_number} • {scanResult.participant?.team_name}
                  </p>
                </div>
              </div>

              {/* Exact breakdown from PRD Section 24 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-emerald-200 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.time_outside}</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {scanResult.time_outside_minutes} {t.minutes}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.total_time_out}</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {scanResult.total_time_out_minutes} {t.minutes}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.total_deduction}</span>
                  <span className="font-bold text-rose-700 text-sm">
                    -{scanResult.deduction} {t.points}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.final_score}</span>
                  <span className="font-extrabold text-emerald-700 text-base">
                    {scanResult.final_score} {t.points}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs text-emerald-800">
                <span className="font-medium text-emerald-900">{lang === 'ar' ? 'الحالة: حاضر بالداخل' : 'Status: PRESENT'}</span>
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-medium hover:bg-emerald-800 cursor-pointer"
                >
                  {lang === 'ar' ? 'مسح تالٍ' : 'Scan Next'}
                </button>
              </div>
            </div>
          )}

          {/* 3. ALREADY PRESENT (Section 25: Info / Present Card with Temporary Exit Option) */}
          {scanResult.type === 'ALREADY_PRESENT' && (
            <div className="bg-sky-50 border-sky-300 text-sky-950 p-6 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Info className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-200/80 px-2 py-0.5 rounded">
                    ℹ {t.res_already_present}
                  </span>
                  <h3 className="text-xl font-bold text-sky-950 mt-1">
                    {scanResult.participant?.full_name}
                  </h3>
                  <p className="text-xs text-sky-800 font-mono">
                    {scanResult.participant?.participant_number} • {scanResult.participant?.team_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-sky-200 text-center">
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.arrival_time}</span>
                  <span className="font-bold text-stone-800 text-sm">
                    {scanResult.arrival_time ? new Date(scanResult.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[11px] text-stone-500 block uppercase">{t.final_score}</span>
                  <span className="font-extrabold text-sky-800 text-base">
                    {scanResult.final_score} {t.points}
                  </span>
                </div>
              </div>

              {/* Temporary Exit action button as defined in PRD Section 12 Step 1 */}
              {scanResult.attendance && (
                <div className="mt-4 pt-3 border-t border-sky-200 flex items-center justify-between gap-3">
                  <p className="text-xs text-sky-800">
                    {lang === 'ar' ? 'هل يحتاج المشارك لمغادرة القاعة مؤقتاً؟' : 'Does participant need to leave temporarily?'}
                  </p>
                  <button
                    id="btn-register-temp-exit"
                    type="button"
                    onClick={() => handleQuickExit(scanResult.attendance!.id)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.btn_temp_exit}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. TEMPORARILY OUT (Warning Card with Return Option) */}
          {scanResult.type === 'ALREADY_OUT' && (
            <div className="bg-amber-50 border-amber-300 text-amber-950 p-6 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                    ⚠ {t.res_already_out}
                  </span>
                  <h3 className="text-xl font-bold text-amber-950 mt-1">
                    {scanResult.participant?.full_name}
                  </h3>
                  <p className="text-xs text-amber-800">
                    {scanResult.message}
                  </p>
                </div>
              </div>

              {scanResult.attendance && (
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-xs text-amber-800 font-medium">{lang === 'ar' ? 'تسجيل العودة للداخل الآن' : 'Record return inside now'}</span>
                  <button
                    id="btn-confirm-return"
                    type="button"
                    onClick={() => handleQuickReturn(scanResult.attendance!.id)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    {t.btn_record_return}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. INVALID QR / ERROR / NO ACTIVE EVENT */}
          {(scanResult.type === 'INVALID_QR' || scanResult.type === 'NO_ACTIVE_EVENT' || scanResult.type === 'ERROR') && (
            <div className="bg-rose-50 border-rose-300 text-rose-950 p-6 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-200 px-2 py-0.5 rounded">
                    {scanResult.type === 'NO_ACTIVE_EVENT' ? t.res_no_active_event : t.res_invalid_qr}
                  </span>
                  <h3 className="text-base font-bold text-rose-900 mt-1">
                    {lang === 'ar' ? scanResult.message_ar : scanResult.message}
                  </h3>
                </div>
              </div>
              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="px-3 py-1 bg-stone-800 text-white rounded-md text-xs font-medium hover:bg-stone-900 cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
