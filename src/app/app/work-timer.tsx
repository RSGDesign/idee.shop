"use client";
import { useState, useEffect, useRef } from "react";

export default function WorkTimer({
  onAddMinutes,
  label = "Sesiune de lucru",
}: {
  onAddMinutes: (minutes: number) => boolean;
  label?: string;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startTimestampRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (running) {
      const start = startTimestampRef.current ?? Date.now();
      const base = accumulatedRef.current;
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setSeconds(base + elapsed);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running]);

  function handleStart() {
    startTimestampRef.current = Date.now();
    setRunning(true);
  }

  function handlePause() {
    if (startTimestampRef.current) {
      const elapsed = Math.floor(
        (Date.now() - startTimestampRef.current) / 1000,
      );
      accumulatedRef.current += elapsed;
      setSeconds(accumulatedRef.current);
    }
    startTimestampRef.current = null;
    setRunning(false);
  }

  function handleReset() {
    startTimestampRef.current = null;
    accumulatedRef.current = 0;
    setSeconds(0);
    setRunning(false);
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const timeFormatted = `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const minutesToAdd = Math.ceil(seconds / 60);

  return (
    <div className="work-timer">
      <div className="timer-header">
        <span className="timer-label">⏱ {label}</span>
        <strong
          className="timer-display"
          aria-label={`Timp scurs: ${timeFormatted}`}
        >
          {timeFormatted}
        </strong>
      </div>
      <div className="timer-actions">
        {!running ? (
          <button
            type="button"
            className="timer-btn primary"
            onClick={handleStart}
          >
            ▶ Pornește
          </button>
        ) : (
          <button type="button" className="timer-btn" onClick={handlePause}>
            ⏸ Pauză
          </button>
        )}
        {seconds > 0 && (
          <>
            <button
              type="button"
              className="timer-btn add"
              onClick={() => {
                const elapsed =
                  startTimestampRef.current === null
                    ? 0
                    : Math.floor(
                        (Date.now() - startTimestampRef.current) / 1000,
                      );
                const minutes = Math.ceil(
                  (accumulatedRef.current + elapsed) / 60,
                );
                if (minutes > 0 && onAddMinutes(minutes)) handleReset();
              }}
            >
              ✓ Adaugă {minutesToAdd} min la efortul efectiv
            </button>
            <button
              type="button"
              className="timer-btn ghost"
              onClick={handleReset}
            >
              Resetează
            </button>
          </>
        )}
      </div>
    </div>
  );
}
