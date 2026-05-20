"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    FaPen,
    FaClock,
    FaCheck,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaPlay,
    FaArrowRight,
    FaArrowLeft,
    FaSearchPlus,
    FaSearchMinus,
    FaBars,
    FaEllipsisV,
    FaImage,
    FaLock,
    FaCheckCircle,
} from "react-icons/fa";
import { writingAPI, studentsAPI } from "@/lib/api";
import { getPrefetched, fetchModuleData } from "@/lib/examPrefetch";
import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";
import ExamSecurity from "@/components/ExamSecurity";
import TextHighlighter from "@/components/TextHighlighter";



function WritingExamPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const adminPreviewTestNumber = searchParams.get('adminPreview');
    const isAdminPreview = !!adminPreviewTestNumber;

    const [answers, setAnswers] = useState({ task1: "", task2: "" });
    const [showInstructions, setShowInstructions] = useState(!isAdminPreview);
    const [splitPercent, setSplitPercent] = useState(50);

    const [phase, setPhase] = useState("select");
    const [activePart, setActivePart] = useState(null);
    const [completedParts, setCompletedParts] = useState([]);

    const [part1Time, setPart1Time] = useState(20 * 60);
    const [part2Time, setPart2Time] = useState(40 * 60);

    const [showSubmitPartModal, setShowSubmitPartModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [questionSet, setQuestionSet] = useState(null);
    const [session, setSession] = useState(null);
    const [adminScoreResult, setAdminScoreResult] = useState(null);

    // Options menu
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [optionsView, setOptionsView] = useState('main');
    const [contrastMode, setContrastMode] = useState('black-on-white');
    const [textSizeMode, setTextSizeMode] = useState('regular');

    // Splitter
    const isDraggingRef = useRef(false);
    const containerRef = useRef(null);

    const onSplitterMouseDown = useCallback((e) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.min(Math.max((x / rect.width) * 100, 20), 80);
            setSplitPercent(pct);
        };
        const onMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    // Contrast schemes
    const contrastSchemes = {
        'black-on-white': { bg: '#ffffff', text: '#000000', partBg: '#f0f0f0', partBorder: '#d1d5db' },
        'white-on-black': { bg: '#1a1a1a', text: '#ffffff', partBg: '#2a2a2a', partBorder: '#555' },
        'yellow-on-black': { bg: '#1a1a1a', text: '#ffff00', partBg: '#2a2a2a', partBorder: '#555' }
    };
    const cs = contrastSchemes[contrastMode];
    const tScale = textSizeMode === 'large' ? 1.15 : textSizeMode === 'extra-large' ? 1.3 : 1;

    // ── Auto-save key for crash recovery ──────────────────────────────────
    const autoSaveKey = `exam_draft_writing_${params.examId}`;

    // ── Restore saved answers on mount ─────────────────────────────────────
    useEffect(() => {
        if (isAdminPreview) return;
        try {
            const saved = localStorage.getItem(autoSaveKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.answers) {
                    setAnswers(parsed.answers);
                }
                if (parsed.part1Time && parsed.part1Time > 0) {
                    setPart1Time(parsed.part1Time);
                }
                if (parsed.part2Time && parsed.part2Time > 0) {
                    setPart2Time(parsed.part2Time);
                }
                if (parsed.completedParts && parsed.completedParts.length > 0) {
                    setCompletedParts(parsed.completedParts);
                }
                console.log('[AutoSave] Restored writing answers from localStorage');
            }
        } catch (e) {
            console.error('[AutoSave] Failed to restore:', e);
        }
    }, []);

    // ── Auto-save answers every 15 seconds ─────────────────────────────────
    useEffect(() => {
        if (isAdminPreview || isLoading) return;
        const interval = setInterval(() => {
            try {
                localStorage.setItem(autoSaveKey, JSON.stringify({
                    answers, part1Time, part2Time, completedParts, savedAt: Date.now()
                }));
            } catch (e) { /* ignore quota errors */ }
        }, 15000);
        return () => clearInterval(interval);
    }, [answers, part1Time, part2Time, completedParts, isAdminPreview, isLoading]);

    // ── Save on every text change (debounced) ─────────────────────────────
    useEffect(() => {
        if (isAdminPreview) return;
        if (!answers.task1 && !answers.task2) return;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(autoSaveKey, JSON.stringify({
                    answers, part1Time, part2Time, completedParts, savedAt: Date.now()
                }));
            } catch (e) { /* ignore */ }
        }, 2000);
        return () => clearTimeout(t);
    }, [answers]);
    // ── Emergency auto-submit on tab/browser close (5+ words written) ────
    const submittedRef = useRef(false);

    useEffect(() => {
        if (isAdminPreview) return;

        const emergencySubmit = () => {
            if (submittedRef.current) return;
            const task1Words = answers.task1?.trim().split(/\s+/).filter(Boolean).length || 0;
            const task2Words = answers.task2?.trim().split(/\s+/).filter(Boolean).length || 0;
            if (task1Words + task2Words < 5) return; // Less than 5 words total, don't submit

            const storedSession = localStorage.getItem("examSession");
            if (!storedSession) return;
            const sd = JSON.parse(storedSession);
            const examId = sd?.examId;
            if (!examId) return;

            const currentSetNumber = sd?.currentSetNumber;
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/students/save-module-score";

            const payload = {
                examId,
                module: "writing",
                scoreData: {
                    band: 0, task1Words, task2Words,
                    answers: { task1: answers.task1, task2: answers.task2 },
                    setNumber: currentSetNumber,
                    autoSubmitted: true
                }
            };

            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            navigator.sendBeacon(apiUrl, blob);

            sd.completedModules = [...(sd.completedModules || []), currentSetNumber ? `writing:${currentSetNumber}` : "writing"];
            sd.scores = { ...(sd.scores || {}), writing: { overallBand: 0, autoSubmitted: true } };
            localStorage.setItem("examSession", JSON.stringify(sd));
            try { localStorage.removeItem(autoSaveKey); } catch (e) { /* ignore */ }
            submittedRef.current = true;
        };

        const handlePageHide = (e) => { if (!e.persisted) emergencySubmit(); };
        const handleVisibilityChange = () => { if (document.visibilityState === "hidden") emergencySubmit(); };

        window.addEventListener("pagehide", handlePageHide);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("pagehide", handlePageHide);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [answers, isAdminPreview]);

    // ===== LOAD DATA =====
    // Optimized: uses prefetched cache when available; redundant verifyExamId
    // call removed (completion check uses localStorage refreshed on selection page).
    useEffect(() => {
        const applyTaskTimes = (tasks) => {
            if (!Array.isArray(tasks)) return;
            if (tasks[0]?.recommendedTime) setPart1Time(tasks[0].recommendedTime * 60);
            if (tasks[1]?.recommendedTime) setPart2Time(tasks[1].recommendedTime * 60);
        };

        const loadData = async () => {
            try {
                // ═══ ADMIN PREVIEW MODE ═══
                if (isAdminPreview) {
                    const cached = getPrefetched("writing", adminPreviewTestNumber);
                    let data = cached;
                    if (!data) {
                        const response = await writingAPI.getForExam(adminPreviewTestNumber);
                        if (response.success && response.data) data = response.data;
                    }
                    if (data) {
                        setQuestionSet(data);
                        applyTaskTimes(data.tasks);
                    } else {
                        setLoadError("Failed to load writing test.");
                    }
                    setIsLoading(false);
                    return;
                }

                // ═══ NORMAL STUDENT MODE ═══
                const storedSession = localStorage.getItem("examSession");
                if (!storedSession) {
                    setLoadError("No exam session found. Please start from the home page.");
                    setIsLoading(false);
                    return;
                }
                const parsed = JSON.parse(storedSession);
                setSession(parsed);

                // Completion check from localStorage (already fresh from selection page)
                const setNum = parsed.currentSetNumber;
                const isThisSetDone = setNum
                    ? (parsed.completedModules?.includes(`writing:${setNum}`) || parsed.completedModules?.includes("writing"))
                    : parsed.completedModules?.includes("writing");
                if (isThisSetDone) {
                    router.push(`/exam/${params.examId}`);
                    return;
                }

                const writingSetNumber = parsed.currentSetNumber || parsed.assignedSets?.writingSetNumber;
                if (!writingSetNumber) {
                    setLoadError("No writing test assigned for this exam.");
                    setIsLoading(false);
                    return;
                }

                const data = await fetchModuleData("writing", writingSetNumber);
                if (data) {
                    setQuestionSet(data);
                    applyTaskTimes(data.tasks);
                } else {
                    setLoadError("Failed to load writing test questions.");
                }
            } catch (err) {
                setLoadError(err.message || "Failed to load exam data.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [params.examId, isAdminPreview, adminPreviewTestNumber]);

    // ===== BUILD TASKS =====
    const tasks = (questionSet?.tasks || []).map((task, index) => {
        const isTask1 = task.taskNumber === 1 || task.taskType?.startsWith("task1");
        return {
            id: `task${index + 1}`,
            partNumber: task.taskNumber || index + 1,
            title: `Part ${task.taskNumber || index + 1}`,
            timeMinutes: task.recommendedTime || (isTask1 ? 20 : 40),
            instruction: task.instructions || "",
            prompt: task.prompt || "",
            imageUrl: task.images?.[0]?.url || null,
            minWords: task.minWords || (isTask1 ? 150 : 250)
        };
    });

    const displayTasks = tasks.length > 0 ? tasks : [
        { id: "task1", partNumber: 1, title: "Part 1", timeMinutes: 20, instruction: "", prompt: "", minWords: 150 },
        { id: "task2", partNumber: 2, title: "Part 2", timeMinutes: 40, instruction: "", prompt: "", minWords: 250 }
    ];

    const currentTaskData = activePart ? displayTasks.find(t => t.partNumber === activePart) : null;
    const currentAnswer = activePart === 1 ? answers.task1 : answers.task2;
    const wordCount = currentAnswer?.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
    const meetsMinWords = wordCount >= (currentTaskData?.minWords || 150);
    const currentTime = activePart === 1 ? part1Time : part2Time;

    // ===== TIMER =====
    useEffect(() => {
        if (phase !== "writing" || !activePart) return;
        const timer = setInterval(() => {
            if (activePart === 1) {
                setPart1Time(prev => {
                    if (prev <= 1) { clearInterval(timer); handlePartTimeUp(1); return 0; }
                    return prev - 1;
                });
            } else {
                setPart2Time(prev => {
                    if (prev <= 1) { clearInterval(timer); handlePartTimeUp(2); return 0; }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, activePart]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // ===== HANDLERS =====
    const handleStartPart = (partNum) => { setActivePart(partNum); setPhase("writing"); };
    const handlePartTimeUp = (partNum) => { finishPart(partNum); };

    const finishPart = (partNum) => {
        const newCompleted = [...completedParts, partNum];
        setCompletedParts(newCompleted);
        if (newCompleted.includes(1) && newCompleted.includes(2)) {
            handleFinalSubmit();
        } else {
            setPhase("select");
            setActivePart(null);
        }
    };

    const handleTextChange = (value) => {
        if (activePart === 1) setAnswers(prev => ({ ...prev, task1: value }));
        else setAnswers(prev => ({ ...prev, task2: value }));
    };

    const getWritingBandScore = (task1Words, task2Words) => {
        let s1 = 0, s2 = 0;
        if (task1Words >= 150) s1 = 6.5; else if (task1Words >= 120) s1 = 5.5; else if (task1Words >= 80) s1 = 4.5; else if (task1Words >= 40) s1 = 3.5; else s1 = 2.5;
        if (task2Words >= 250) s2 = 6.5; else if (task2Words >= 200) s2 = 5.5; else if (task2Words >= 150) s2 = 4.5; else if (task2Words >= 80) s2 = 3.5; else s2 = 2.5;
        return Math.round(((s1 + s2 * 2) / 3) * 2) / 2;
    };

    const handleFinalSubmit = async () => {
        submittedRef.current = true; // Prevent emergency submit from firing
        setIsSubmitting(true);
        setPhase("done");
        const task1Words = answers.task1?.trim().split(/\s+/).filter(Boolean).length || 0;
        const task2Words = answers.task2?.trim().split(/\s+/).filter(Boolean).length || 0;
        const bandScore = getWritingBandScore(task1Words, task2Words);

        // ═══ ADMIN PREVIEW: Show score popup ═══
        if (isAdminPreview) {
            setIsSubmitting(false);
            setAdminScoreResult({ band: bandScore, task1Words, task2Words });
            return;
        }

        // ═══ NORMAL STUDENT: Save to DB ═══
        const storedSession = localStorage.getItem("examSession");
        const sessionData = storedSession ? JSON.parse(storedSession) : null;
        const examId = sessionData?.examId;

        try {
            const currentSetNumber = sessionData?.currentSetNumber;
            const response = await studentsAPI.saveModuleScore(examId, "writing", {
                band: bandScore, task1Words, task2Words,
                answers: { task1: answers.task1, task2: answers.task2 },
                setNumber: currentSetNumber
            });
            if (response.success && sessionData) {
                sessionData.completedModules = response.data?.completedModules || [...(sessionData.completedModules || []), currentSetNumber ? `writing:${currentSetNumber}` : "writing"];
                sessionData.scores = response.data?.scores || { ...(sessionData.scores || {}), writing: { overallBand: bandScore, task1Band: bandScore, task2Band: bandScore } };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        } catch (error) {
            if (sessionData) {
                const currentSetNumber = sessionData?.currentSetNumber;
                sessionData.completedModules = [...(sessionData.completedModules || []), currentSetNumber ? `writing:${currentSetNumber}` : "writing"];
                sessionData.scores = { ...(sessionData.scores || {}), writing: { overallBand: bandScore, task1Band: bandScore, task2Band: bandScore } };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        }
        // Clear auto-save after successful submit
        try { localStorage.removeItem(autoSaveKey); } catch (e) { /* ignore */ }
        router.push(`/exam/${params.examId}`);
    };

    // ==================== LOADING ====================
    if (isLoading) {
        return (
            <ExamLoadingOverlay
                active={true}
                done={false}
                label="Preparing Writing Test"
                subLabel="Loading tasks..."
            />
        );
    }

    // ==================== ERROR ====================
    if (loadError) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                    <FaTimes style={{ fontSize: '24px', color: '#ef4444', margin: '0 auto 12px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Cannot Load Test</h2>
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>{loadError}</p>
                    <button onClick={() => router.push("/")} style={{ backgroundColor: '#1f2937', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // ==================== INSTRUCTIONS ====================
    if (showInstructions) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ maxWidth: '640px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #2563eb' }}>
                        <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '28px' }}>IELTS</span>
                        <span style={{ color: '#6b7280', fontSize: '16px' }}>| Writing Test</span>
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Writing Test Instructions</h1>

                    <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                        <p style={{ color: '#374151', marginBottom: '12px' }}>
                            <strong>Set:</strong> {questionSet?.title || `Writing Set #${questionSet?.setNumber}`}
                        </p>
                        <p style={{ color: '#374151', marginBottom: '12px' }}>
                            <strong>Parts:</strong> 2 writing tasks
                        </p>
                        <p style={{ color: '#374151', marginBottom: '12px' }}>
                            <strong>Part 1:</strong> 20 minutes — Academic Report (min. 150 words)
                        </p>
                        <p style={{ color: '#374151', marginBottom: '12px' }}>
                            <strong>Part 2:</strong> 40 minutes — Essay (min. 250 words)
                        </p>
                        <p style={{ color: '#374151' }}>
                            <strong>Instructions:</strong> You choose which part to start first. Each part has its own timer.
                        </p>
                    </div>

                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Important:</p>
                        <ul style={{ color: '#92400e', fontSize: '13px', listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '4px' }}>• Task 2 contributes <strong>twice as much</strong> as Task 1 to your score.</li>
                            <li style={{ marginBottom: '4px' }}>• Writing below the minimum word count will lose marks.</li>
                            <li>• Once a part's timer runs out, you <strong>cannot go back</strong>.</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => { setShowInstructions(false); setPhase("select"); }}
                        style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                        <FaPlay style={{ fontSize: '14px' }} />
                        <span>Continue to Part Selection</span>
                        <FaArrowRight style={{ fontSize: '14px' }} />
                    </button>
                </div>
            </div>
        );
    }

    // ==================== PART SELECTION ====================
    if (phase === "select") {
        const part1Done = completedParts.includes(1);
        const part2Done = completedParts.includes(2);

        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Arial, sans-serif' }}>
                <ExamSecurity examId={session?.examId} onViolationLimit={() => handleFinalSubmit()} />

                <div style={{ maxWidth: '480px', width: '100%' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>IELTS Writing Test</h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af' }}>Select a part to begin writing.</p>
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <div style={{ height: '6px', flex: 1, borderRadius: '999px', backgroundColor: part1Done ? '#1f2937' : '#e5e7eb' }} />
                        <div style={{ height: '6px', flex: 1, borderRadius: '999px', backgroundColor: part2Done ? '#1f2937' : '#e5e7eb' }} />
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>{completedParts.length}/2</span>
                    </div>

                    {/* Part Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayTasks.map((task) => {
                            const isDone = completedParts.includes(task.partNumber);
                            const taskAnswer = task.partNumber === 1 ? answers.task1 : answers.task2;
                            const taskWords = taskAnswer?.trim().split(/\s+/).filter(Boolean).length || 0;
                            const remainingTime = task.partNumber === 1 ? part1Time : part2Time;

                            return (
                                <div key={task.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', opacity: isDone ? 0.7 : 1 }}>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDone ? '#16a34a' : '#1f2937', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                                    {isDone ? <FaCheck style={{ fontSize: '12px' }} /> : task.partNumber}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>{task.title}</p>
                                                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Min. {task.minWords} words</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {isDone ? (
                                                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#16a34a' }}>Completed</span>
                                                ) : (
                                                    <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#4b5563' }}>{formatTime(remainingTime)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {isDone ? (
                                            <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                                                <p style={{ fontSize: '14px', color: '#4b5563' }}>{taskWords} words written</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStartPart(task.partNumber)}
                                                style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#111827'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1f2937'}
                                            >
                                                <FaPlay style={{ fontSize: '10px' }} />
                                                Start {task.title}
                                                <span style={{ color: '#9ca3af', fontSize: '12px' }}>({task.timeMinutes} min)</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ==================== WRITING PHASE — Inspera Style ====================
    if (phase === "writing" && currentTaskData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: cs.bg, color: cs.text, userSelect: 'text' }}>
                <ExamSecurity examId={session?.examId} onViolationLimit={() => { finishPart(activePart); }} />

                {/* ═══════════════════════════════════
                    TOP HEADER — Inspera Style
                ═══════════════════════════════════ */}
                <header style={{ backgroundColor: cs.bg, borderBottom: `1px solid ${contrastMode === 'black-on-white' ? '#ccc' : '#555'}`, height: '56px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 16px' }}>
                        {/* Left */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <span style={{ fontWeight: '900', color: '#cc0000', fontSize: '32px', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>IELTS</span>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                <span style={{ fontSize: '16px', fontWeight: '600', color: cs.text }}>Test taker ID</span>
                            </div>
                        </div>
                        {/* Right */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            {/* WiFi */}
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                            </svg>
                            {/* Bell */}
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {/* Hamburger → Options */}
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }} onClick={() => { setShowOptionsMenu(true); setOptionsView('main'); }}>
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </div>
                    </div>
                </header>

                {/* ═══════════════════════════════════
                    PART BANNER
                ═══════════════════════════════════ */}
                <div style={{ backgroundColor: cs.partBg, borderBottom: `1px solid ${cs.partBorder}`, padding: '8px 40px', flexShrink: 0, fontFamily: 'Arial, sans-serif' }}>
                    <div style={{ fontWeight: 'bold', fontSize: `${15 * tScale}px`, color: cs.text, marginBottom: '2px' }}>
                        Academic Writing {currentTaskData.title}
                    </div>
                    <div style={{ fontSize: `${13 * tScale}px`, color: contrastMode === 'black-on-white' ? '#6b7280' : cs.text }}>
                        You should spend about {currentTaskData.timeMinutes} minutes on this task. Write at least {currentTaskData.minWords} words.
                    </div>
                </div>

                {/* ═══════════════════════════════════
                    MAIN CONTENT — Two Column Layout
                ═══════════════════════════════════ */}
                <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', marginBottom: '44px' }}>
                    {/* LEFT: Task Prompt + Image */}
                    <div style={{ width: `${splitPercent}%`, overflowY: 'auto', padding: '20px 30px', backgroundColor: cs.bg, color: cs.text, fontSize: `${16 * tScale}px`, fontFamily: 'Arial, sans-serif', flexShrink: 0 }}>
                        <TextHighlighter passageId={`writing_part_${activePart}`} contrastMode={contrastMode}>
                            {currentTaskData.prompt && (
                                <div style={{ color: cs.text, fontSize: `${16 * tScale}px`, lineHeight: '1.8', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                                    {currentTaskData.prompt}
                                </div>
                            )}
                            {currentTaskData.instruction && (
                                <p style={{ color: cs.text, fontSize: `${15 * tScale}px`, lineHeight: '1.6', whiteSpace: 'pre-line', fontStyle: 'italic', marginBottom: '16px' }}>
                                    {currentTaskData.instruction}
                                </p>
                            )}
                        </TextHighlighter>

                        {currentTaskData.imageUrl && (
                            <img src={currentTaskData.imageUrl} alt="Task reference" style={{ width: '100%', objectFit: 'contain', marginTop: '12px' }} />
                        )}
                    </div>

                    {/* SPLITTER — draggable resize handle */}
                    <div
                        onMouseDown={onSplitterMouseDown}
                        style={{
                            width: '18px', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: contrastMode === 'black-on-white' ? '#e5e7eb' : '#444', flexShrink: 0, zIndex: 10,
                            borderLeft: `1px solid ${contrastMode === 'black-on-white' ? '#d1d5db' : '#555'}`,
                            borderRight: `1px solid ${contrastMode === 'black-on-white' ? '#d1d5db' : '#555'}`
                        }}
                    >
                        <span style={{ fontSize: '22px', color: contrastMode === 'black-on-white' ? '#6b7280' : '#ccc', userSelect: 'none', fontWeight: 'bold', border: `1.5px solid ${contrastMode === 'black-on-white' ? '#9ca3af' : '#888'}`, borderRadius: '4px', padding: '2px 4px', lineHeight: '1', background: contrastMode === 'black-on-white' ? '#fff' : '#333' }}>↔</span>
                    </div>

                    {/* RIGHT: Writing Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: cs.bg, padding: '16px 16px 16px 16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `2px solid ${contrastMode === 'black-on-white' ? '#000' : '#555'}`, overflow: 'hidden' }}>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleTextChange(e.target.value)}
                                placeholder={`Enter your ${currentTaskData.title.toLowerCase()} answer...`}
                                autoFocus
                                style={{
                                    flex: 1, padding: '20px 24px', resize: 'none', outline: 'none',
                                    border: 'none',
                                    fontFamily: "'Times New Roman', Georgia, serif",
                                    fontSize: `${18 * tScale}px`, lineHeight: '1.8',
                                    color: cs.text, backgroundColor: cs.bg
                                }}
                            />
                            <div style={{ padding: '8px 16px', textAlign: 'right', flexShrink: 0, borderTop: `1px solid ${contrastMode === 'black-on-white' ? '#ccc' : '#555'}` }}>
                                <span style={{ fontSize: '14px', color: contrastMode === 'black-on-white' ? '#6b7280' : cs.text }}>
                                    Word Count: {wordCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════
                    BOTTOM NAV — Inspera Style
                ═══════════════════════════════════ */}
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: cs.bg,
                    display: 'flex', alignItems: 'center',
                    height: '44px', padding: '0', zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, height: '100%' }}>
                        {/* Review checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '100%', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', color: cs.text }}>Review</span>
                        </div>

                        {/* Part tabs */}
                        {displayTasks.map((task, idx) => {
                            const isActive = task.partNumber === activePart;
                            const isDone = completedParts.includes(task.partNumber);
                            return (
                                <div key={task.id}
                                    onClick={() => {
                                        if (!isDone && task.partNumber !== activePart) return;
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', height: '100%',
                                        cursor: 'default', borderRadius: '4px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'
                                    }}>
                                        <div style={{ width: '18px', height: '3px', background: isDone || isActive ? '#2563eb' : '#c0c0c0', marginBottom: '3px', borderRadius: '1px' }}></div>
                                        <span style={{
                                            fontSize: '14px', fontWeight: isActive ? 'bold' : '400',
                                            color: isActive ? cs.text : '#888',
                                            fontFamily: 'Arial, sans-serif',
                                            padding: '2px 3px',
                                            border: isActive ? '1.5px solid #2563eb' : '1.5px solid transparent',
                                            borderRadius: '3px',
                                            lineHeight: '1'
                                        }}>
                                            {task.partNumber}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>



                    {/* Submit checkmark button */}
                    <button
                        onClick={() => setShowSubmitPartModal(true)}
                        onMouseEnter={e => e.currentTarget.style.background = '#c8c8c8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
                        style={{
                            width: '72px', height: '44px', cursor: 'pointer',
                            background: '#e5e7eb', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, borderRadius: 0
                        }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                </div>



                {/* ═══════════════════════════════════
                    SUBMIT MODAL
                ═══════════════════════════════════ */}
                {
                    showSubmitPartModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
                            <div style={{ background: 'white', padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>Submit {currentTaskData.title}?</h3>
                                    <button onClick={() => setShowSubmitPartModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}><FaTimes /></button>
                                </div>

                                <div style={{ background: meetsMinWords ? '#f0fdf4' : '#fffbeb', border: `1px solid ${meetsMinWords ? '#bbf7d0' : '#fcd34d'}`, padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{wordCount}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/{currentTaskData.minWords}</span></p>
                                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>words written</p>
                                </div>

                                {!meetsMinWords && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '10px', marginBottom: '16px', textAlign: 'center' }}>
                                        <p style={{ color: '#92400e', fontSize: '13px', fontWeight: '600' }}>⚠ Below minimum word count. This may affect your score.</p>
                                    </div>
                                )}

                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                                    Time remaining: <strong>{formatTime(currentTime)}</strong>. You cannot return to this part after submitting.
                                </p>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowSubmitPartModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer', background: 'white' }}>Cancel</button>
                                    <button onClick={() => { setShowSubmitPartModal(false); finishPart(activePart); }} style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Submit</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ═══════════════════════════════════
                    OPTIONS MENU — Inspera Style
                ═══════════════════════════════════ */}
                {
                    showOptionsMenu && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, paddingTop: '60px' }}>
                            <div style={{ background: 'white', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', borderRadius: '4px', overflow: 'hidden' }}>

                                {optionsView === 'main' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <div></div>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', fontFamily: 'Arial, sans-serif', margin: 0 }}>Options</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><FaTimes size={18} color="#000" /></button>
                                        </div>
                                        <div style={{ padding: '0 24px 20px' }}>
                                            <button onClick={() => { setShowOptionsMenu(false); setShowSubmitPartModal(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#e41e2b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                                    <span>Go to submission page</span>
                                                </div>
                                                <span style={{ fontSize: '20px' }}>{'>'}</span>
                                            </button>
                                        </div>
                                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 24px' }}></div>
                                        <button onClick={() => setOptionsView('contrast')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#666"><circle cx="12" cy="12" r="10" fill="none" stroke="#666" strokeWidth="2" /><path d="M12 2a10 10 0 0 1 0 20z" fill="#666" /></svg>
                                                <span style={{ fontSize: '16px', color: '#000' }}>Contrast</span>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#666' }}>{'>'}</span>
                                        </button>
                                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 24px' }}></div>
                                        <button onClick={() => setOptionsView('textsize')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#666"><circle cx="11" cy="11" r="7" fill="none" stroke="#666" strokeWidth="2" /><line x1="16" y1="16" x2="21" y2="21" stroke="#666" strokeWidth="2" /><text x="8" y="14" fontSize="10" fill="#666" fontWeight="bold">A</text></svg>
                                                <span style={{ fontSize: '16px', color: '#000' }}>Text size</span>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#666' }}>{'>'}</span>
                                        </button>
                                        <div style={{ height: '16px' }}></div>
                                    </div>
                                )}

                                {optionsView === 'contrast' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <button onClick={() => setOptionsView('main')} style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', color: '#000' }}>Options</button>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', margin: 0 }}>Contrast</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: '4px' }}><FaTimes size={18} /></button>
                                        </div>
                                        <div style={{ margin: '8px 24px 24px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                            {[{ key: 'black-on-white', label: 'Black on white' }, { key: 'white-on-black', label: 'White on black' }, { key: 'yellow-on-black', label: 'Yellow on black' }].map((opt, idx) => (
                                                <button key={opt.key} onClick={() => setContrastMode(opt.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'none', border: 'none', borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer' }}>
                                                    {contrastMode === opt.key ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#333"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg> : <span style={{ width: '20px' }}></span>}
                                                    <span style={{ fontSize: '16px', color: '#000' }}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {optionsView === 'textsize' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <button onClick={() => setOptionsView('main')} style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', color: '#000' }}>Options</button>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', margin: 0 }}>Text size</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: '4px' }}><FaTimes size={18} /></button>
                                        </div>
                                        <div style={{ margin: '8px 24px 24px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                            {[{ key: 'regular', label: 'Regular' }, { key: 'large', label: 'Large' }, { key: 'extra-large', label: 'Extra large' }].map((opt, idx) => (
                                                <button key={opt.key} onClick={() => setTextSizeMode(opt.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'none', border: 'none', borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer' }}>
                                                    {textSizeMode === opt.key ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#333"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg> : <span style={{ width: '20px' }}></span>}
                                                    <span style={{ fontSize: '16px', color: '#000' }}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    // Fallback
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {adminScoreResult && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
                    <div style={{ background: 'white', padding: '32px', maxWidth: '400px', width: '100%', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <FaCheck style={{ fontSize: '28px', color: '#10b981' }} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>Admin Preview Result</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>This is a preview — no data was saved.</p>
                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                            <div style={{ marginBottom: '12px', padding: '8px 16px', background: '#eef2ff', borderRadius: '6px', display: 'inline-block' }}>
                                <span style={{ fontSize: '18px', color: '#4338ca', fontWeight: '600' }}>Band Score: {adminScoreResult.band}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
                                <div><p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{adminScoreResult.task1Words}</p><p style={{ color: '#6b7280', fontSize: '12px' }}>Task 1 Words</p></div>
                                <div><p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{adminScoreResult.task2Words}</p><p style={{ color: '#6b7280', fontSize: '12px' }}>Task 2 Words</p></div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { setAdminScoreResult(null); setPhase('select'); setCompletedParts([]); }} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer', background: 'white' }}>Restart Review</button>
                            <button onClick={() => window.close()} style={{ flex: 1, padding: '10px', background: '#4f46e5', color: 'white', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none' }}>Close Preview</button>
                        </div>
                    </div>
                </div>
            )}
            <FaSpinner style={{ fontSize: '24px', color: '#9ca3af', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function WritingExamPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaSpinner style={{ fontSize: '24px', color: '#9ca3af', animation: 'spin 1s linear infinite' }} /></div>}>
            <WritingExamPageContent />
        </Suspense>
    );
}
