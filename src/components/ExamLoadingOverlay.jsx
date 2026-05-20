"use client";

import React, { useEffect, useRef, useState } from "react";

// ExamLoadingOverlay
// ==================
// A full-screen overlay that shows a smooth 0 → 100% progress bar while
// the exam page is loading. Matches the existing exam UI style (cyan accent).
//
// Behavior:
//   - When `active` is true, the bar animates 0 → 90% on a hybrid curve
//     (fast start, slow tail) so the user always sees motion.
//   - When `done` becomes true, the bar jumps to 100% and the overlay
//     fades out after a short pause.
//   - `label` is shown under the bar (e.g. "Preparing Listening...").
//
// This is a pure UI component — it adds zero behavior change to the exam.

const PHASES = [
    // [until percent, ms to take]
    [40, 600],   // 0 → 40 in 0.6s (snappy initial jump)
    [70, 1400],  // 40 → 70 in 1.4s
    [88, 2500],  // 70 → 88 in 2.5s
    [95, 5000],  // 88 → 95 in 5s (long tail if backend is slow)
];

export default function ExamLoadingOverlay({
    active = false,
    done = false,
    label = "Loading exam...",
    subLabel = "",
}) {
    const [percent, setPercent] = useState(0);
    const [visible, setVisible] = useState(false);
    const rafRef = useRef(null);
    const startedAtRef = useRef(null);

    // Show / hide
    useEffect(() => {
        if (active) {
            setVisible(true);
            setPercent(0);
            startedAtRef.current = performance.now();
        }
    }, [active]);

    // Animation loop
    useEffect(() => {
        if (!visible || done) return;

        const tick = () => {
            const elapsed = performance.now() - (startedAtRef.current || performance.now());
            let target = 0;
            let cumulativeMs = 0;
            let prevPct = 0;

            for (const [pct, ms] of PHASES) {
                if (elapsed <= cumulativeMs + ms) {
                    const phaseProgress = (elapsed - cumulativeMs) / ms;
                    target = prevPct + (pct - prevPct) * Math.min(1, Math.max(0, phaseProgress));
                    break;
                }
                cumulativeMs += ms;
                prevPct = pct;
                target = pct;
            }

            setPercent((prev) => (target > prev ? target : prev));
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [visible, done]);

    // Done → jump to 100% then fade out
    useEffect(() => {
        if (!visible) return;
        if (done) {
            setPercent(100);
            const t = setTimeout(() => setVisible(false), 350);
            return () => clearTimeout(t);
        }
    }, [done, visible]);

    if (!visible) return null;

    const display = Math.min(100, Math.round(percent));

    return (
        <div
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center"
            style={{
                transition: "opacity 300ms ease",
                opacity: done && display >= 100 ? 0 : 1,
            }}
        >
            <div className="w-full max-w-md mx-auto px-6 text-center">
                {/* Spinning ring */}
                <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                </div>

                {/* Label */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {label}
                </h3>
                {subLabel && (
                    <p className="text-sm text-gray-500 mb-6">{subLabel}</p>
                )}

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                        style={{
                            width: `${display}%`,
                            transition: "width 200ms ease-out",
                        }}
                    />
                </div>

                {/* Percent text */}
                <p className="text-sm font-mono font-semibold text-cyan-700">
                    {display}%
                </p>

                {/* Subtle hint */}
                <p className="text-xs text-gray-400 mt-4">
                    Please wait a moment...
                </p>
            </div>
        </div>
    );
}
