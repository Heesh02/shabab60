import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface LiveTimerProps {
  exitTimeIso: string;
  className?: string;
  showIcon?: boolean;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ 
  exitTimeIso, 
  className = '', 
  showIcon = true 
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calc = () => {
      const exitMs = new Date(exitTimeIso).getTime();
      const nowMs = Date.now();
      const diff = Math.max(0, Math.floor((nowMs - exitMs) / 1000));
      setElapsedSeconds(diff);
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [exitTimeIso]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = minutes >= 5; // Highlight after 5 minutes

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold px-2.5 py-1 rounded-md transition-colors ${
        isWarning 
          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
          : 'bg-amber-100 text-amber-900 border border-amber-200'
      } ${className}`}
    >
      {showIcon && (isWarning ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />)}
      <span>{formatted}</span>
    </span>
  );
};
