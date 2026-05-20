"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Exam Security — Seamless Fullscreen Lock
 * 
 * ✅ Auto-enters fullscreen silently on mount (no overlay on first load)
 * ✅ Only shows overlay if user actively exits fullscreen
 * ✅ Click anywhere or keypress to re-enter fullscreen
 * ✅ Works seamlessly when navigating between exam parts
 */
export default function ExamSecurity({ examId, onViolationLimit = () => { } }) {
    const [showOverlay, setShowOverlay] = useState(false);
    const retryTimerRef = useRef(null);
    const hasBeenFullscreenRef = useRef(false);
    const mountedRef = useRef(false);

    // Request fullscreen
    const requestFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (document.fullscreenElement || document.webkitFullscreenElement) return true;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            return true;
        } catch (err) {
            return false;
        }
    }, []);

    // Track fullscreen changes
    const handleFullscreenChange = useCallback(() => {
        const isNowFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement
        );

        if (isNowFullscreen) {
            hasBeenFullscreenRef.current = true;
            setShowOverlay(false);
        } else if (hasBeenFullscreenRef.current && mountedRef.current) {
            // User actively exited fullscreen — try auto re-enter first
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(async () => {
                const success = await requestFullscreen();
                if (!success) {
                    setShowOverlay(true); // Only show overlay if auto re-enter failed
                }
            }, 100);
        }
    }, [requestFullscreen]);

    // Auto-enter fullscreen on mount (silently, no overlay)
    useEffect(() => {
        mountedRef.current = true;

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        // Silent fullscreen entry — retry a few times if needed
        const tryFullscreen = async (attempts = 0) => {
            if (document.fullscreenElement || document.webkitFullscreenElement) return;
            const success = await requestFullscreen();
            if (!success && attempts < 3) {
                setTimeout(() => tryFullscreen(attempts + 1), 500);
            }
        };

        // Small delay to let page render first
        const timer = setTimeout(() => tryFullscreen(), 200);

        return () => {
            mountedRef.current = false;
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            clearTimeout(timer);
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [handleFullscreenChange, requestFullscreen]);

    // When overlay is showing: any keypress re-enters fullscreen
    useEffect(() => {
        if (!showOverlay) return;

        const handleKeyDown = (e) => {
            e.preventDefault();
            requestFullscreen();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showOverlay, requestFullscreen]);

    // Prevent page close / refresh
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "Your exam is in progress. Are you sure you want to leave?";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Only show overlay when user actively exited fullscreen
    if (!showOverlay) return null;

    return (
        <div
            onClick={requestFullscreen}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                backgroundColor: "rgba(0, 0, 0, 0.97)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
            }}
        >
            <div style={{ textAlign: "center", color: "white", pointerEvents: "none" }}>
                <div style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}>
                    🔒
                </div>
                <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                    Click anywhere to continue exam
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Fullscreen mode is required during the exam
                </p>
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
