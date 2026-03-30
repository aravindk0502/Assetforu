'use client';
import { useState, useEffect } from 'react';

interface CountdownProps {
  endTime: string;
  onExpire?: () => void;
}

export function CountdownTimer({ endTime, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime));

  useEffect(() => {
    const t = setInterval(() => {
      const left = getTimeLeft(endTime);
      setTimeLeft(left);
      if (left.total <= 0) {
        clearInterval(t);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endTime, onExpire]);

  if (timeLeft.total <= 0) {
    return <span className="text-red-500 font-bold text-sm">Campaign Ended</span>;
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-2">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-primary-700/8 border border-primary-700/10 text-2xl font-black text-primary-700 credit-number tabular-nums">
            {String(value).padStart(2, '0')}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

function getTimeLeft(endTime: string) {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
