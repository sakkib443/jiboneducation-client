"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    FaCheck,
    FaVolumeUp,
    FaPause,
    FaPlay,
    FaTimes,
    FaSpinner,
    FaArrowRight,
    FaArrowLeft,
    FaHeadphones
} from "react-icons/fa";
import { listeningAPI, studentsAPI } from "@/lib/api";
import { getPrefetched, fetchModuleData } from "@/lib/examPrefetch";
import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";
import ExamSecurity from "@/components/ExamSecurity";
import DomHighlighter from "@/components/DomHighlighter";

const QUESTIONS_PER_PAGE = 10;

// ── Component: Renders Instruction with Embedded Question Inputs ──
// Uses direct DOM manipulation. React.memo prevents re-renders from answer state changes
// which would destroy the DOM inputs via dangerouslySetInnerHTML.
const InstructionWithPortals = React.memo(function InstructionWithPortals({ content, answers, handleAnswer, imageUrl, textColor = '#000', bgColor = '#fff' }) {
    const containerRef = useRef(null);
    const handleAnswerRef = useRef(handleAnswer);
    handleAnswerRef.current = handleAnswer;

    // Process HTML: replace [N] with actual inline input elements
    const processedHtml = React.useMemo(() => {
        return (content || "").replace(
            /(?:<strong>\s*)?\[(\d+)\](?:\s*<\/strong>)?/g,
            (match, qNum) => {
                return `<span class="embedded-q-wrapper" style="display: inline-flex; align-items: center; justify-content: center; margin: 0 6px; vertical-align: middle; position: relative; border: 1.5px solid currentColor; background: transparent; width: 190px; height: 32px; border-radius: 4px;">` +
                    `<span class="embedded-q-num" data-for="${qNum}" style="position: absolute; font-weight: bold; font-size: 15px; color: inherit; pointer-events: none; user-select: none;">${qNum}</span>` +
                    `<input type="text" data-qnum="${qNum}" class="embedded-q-input" ` +
                    `style="border: none; width: 100%; height: 100%; font-size: 15px; outline: none; background: transparent; color: inherit; padding: 0 8px; text-align: center; font-family: Arial, sans-serif;" />` +
                    `</span>`;
            }
        );
    }, [content]);

    // Attach event listeners + set initial values from state (runs on mount)
    useEffect(() => {
        if (!containerRef.current) return;
        const inputs = containerRef.current.querySelectorAll('.embedded-q-input');
        if (inputs.length === 0) return;

        const handlers = [];
        inputs.forEach(input => {
            const qNum = input.getAttribute('data-qnum');

            // Set initial value from answers state (for when user navigates back)
            const initialValue = answers[qNum] || answers[parseInt(qNum)] || '';
            if (initialValue) input.value = initialValue;

            // Attach input event listener
            // Hide the number label when user types
            const numLabel = containerRef.current.querySelector(`.embedded-q-num[data-for="${qNum}"]`);
            if (initialValue && numLabel) numLabel.style.display = 'none';

            const handler = (e) => {
                handleAnswerRef.current(parseInt(qNum), e.target.value);
                if (numLabel) numLabel.style.display = e.target.value ? 'none' : '';
            };
            input.addEventListener('input', handler);
            handlers.push({ input, handler });
        });

        return () => {
            handlers.forEach(({ input, handler }) => {
                input.removeEventListener('input', handler);
            });
        };
    }, [processedHtml]); // Only re-run when HTML changes (not on answer changes)

    // ── Smart spacing: Detect block type from HTML content ──
    const raw = (content || '').trim();
    const isMainHeading = /^<strong[^>]*>[^<]+<\/strong>(<br\/?><strong[^>]*>[^<]+<\/strong>)?$/.test(raw);
    const isSubHeading = !isMainHeading && raw.startsWith('<strong') && !raw.startsWith('<ul');
    const isPureList = raw.startsWith('<ul');

    const topMargin = isMainHeading ? '32px' : isSubHeading ? '18px' : isPureList ? '0px' : '6px';
    const bottomMargin = isMainHeading ? '5px' : isSubHeading ? '4px' : isPureList ? '2px' : '4px';

    return (
        <div style={{ marginTop: topMargin, marginBottom: bottomMargin, lineHeight: '1.6', color: textColor }}>
            <div
                ref={containerRef}
                className="instruction-html-container"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
                style={{ overflowX: 'auto' }}
            />

            {imageUrl && (
                <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <img src={imageUrl} alt="Map/Diagram" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                </div>
            )}

            <style jsx global>{`
                .instruction-html-container table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 20px;
                    border: 1px solid currentColor !important;
                }
                .instruction-html-container th, 
                .instruction-html-container td {
                    border: 1px solid currentColor !important;
                    padding: 12px !important;
                    text-align: left;
                    vertical-align: middle;
                    color: inherit !important;
                }
                .instruction-html-container th {
                    background-color: transparent;
                }
                .instruction-html-container ul {
                    list-style: disc;
                    padding-left: 22px;
                    margin: 6px 0;
                }
                .instruction-html-container li {
                    margin-bottom: 5px;
                    font-size: 14px;
                    line-height: 1.8;
                    color: inherit !important;
                }
                /* IELTS form (form-completion) rows: add vertical gap so the
                   answer boxes don't touch the row above/below. */
                .instruction-html-container .ielts-form-row {
                    margin-bottom: 10px;
                }
                .instruction-html-container .ielts-form-box ul li {
                    margin-bottom: 10px;
                }
                .instruction-html-container p,
                .instruction-html-container span,
                .instruction-html-container strong,
                .instruction-html-container b,
                .instruction-html-container em,
                .instruction-html-container h1,
                .instruction-html-container h2,
                .instruction-html-container h3,
                .instruction-html-container h4 {
                    color: inherit !important;
                }
            `}</style>
        </div>
    );
}, (prevProps, nextProps) => {
    // Re-render when content, imageUrl, or contrast colors change — NOT when answers/handleAnswer change.
    // This prevents dangerouslySetInnerHTML from destroying DOM inputs on every keystroke.
    return prevProps.content === nextProps.content && prevProps.imageUrl === nextProps.imageUrl && prevProps.textColor === nextProps.textColor && prevProps.bgColor === nextProps.bgColor;
});

function ListeningExamPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const adminPreviewTestNumber = searchParams.get('adminPreview');
    const isAdminPreview = !!adminPreviewTestNumber;

    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(40 * 60);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSoundTest, setShowSoundTest] = useState(!isAdminPreview);  // Skip sound test in admin preview
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const [soundTestPlaying, setSoundTestPlaying] = useState(false);
    const [soundTestResult, setSoundTestResult] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [adminScoreResult, setAdminScoreResult] = useState(null); // For admin preview score popup
    const [focusedQuestion, setFocusedQuestion] = useState(1); // currently focused question number

    // Options menu states
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [optionsView, setOptionsView] = useState('main'); // 'main' | 'contrast' | 'textsize'
    const [contrastMode, setContrastMode] = useState('black-on-white'); // 'black-on-white' | 'white-on-black' | 'yellow-on-black'
    const [textSizeMode, setTextSizeMode] = useState('regular'); // 'regular' | 'large' | 'extra-large'

    // Contrast & text size derived styles
    const contrastStyles = {
        'black-on-white': { bg: '#fff', text: '#000', partBg: '#F1F2EC', partBorder: '#d6d0c4' },
        'white-on-black': { bg: '#000', text: '#fff', partBg: '#000', partBorder: '#555' },
        'yellow-on-black': { bg: '#000', text: '#ffff00', partBg: '#000', partBorder: '#555' }
    };
    const textSizeScale = { 'regular': 1, 'large': 1.2, 'extra-large': 1.45 };
    const cs = contrastStyles[contrastMode];
    const tScale = textSizeScale[textSizeMode];

    // Data states
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [questionSet, setQuestionSet] = useState(null);
    const [session, setSession] = useState(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(null);
    const soundTestAudioRef = useRef(null);
    const hasStarted = useRef(false);

    // ── Auto-save key for crash recovery ──────────────────────────────────
    const autoSaveKey = `exam_draft_listening_${params.examId}`;

    // ── Restore saved answers on mount ─────────────────────────────────────
    useEffect(() => {
        if (isAdminPreview) return;
        try {
            const saved = localStorage.getItem(autoSaveKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.answers && Object.keys(parsed.answers).length > 0) {
                    setAnswers(parsed.answers);
                }
                if (parsed.timeLeft && parsed.timeLeft > 0) {
                    setTimeLeft(parsed.timeLeft);
                }
                if (parsed.currentPage != null) {
                    setCurrentPage(parsed.currentPage);
                }
                console.log('[AutoSave] Restored listening answers from localStorage');
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
                    answers, timeLeft, currentPage, savedAt: Date.now()
                }));
            } catch (e) { /* ignore quota errors */ }
        }, 15000);
        return () => clearInterval(interval);
    }, [answers, timeLeft, currentPage, isAdminPreview, isLoading]);

    // ── Save on every answer change (debounced) ───────────────────────────
    useEffect(() => {
        if (isAdminPreview || Object.keys(answers).length === 0) return;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(autoSaveKey, JSON.stringify({
                    answers, timeLeft, currentPage, savedAt: Date.now()
                }));
            } catch (e) { /* ignore */ }
        }, 2000);
        return () => clearTimeout(t);
    }, [answers]);

    // ── Emergency auto-submit on tab/browser close (5+ answers) ─────────
    const submittedRef = useRef(false);

    useEffect(() => {
        if (isAdminPreview) return;

        const emergencySubmit = () => {
            if (submittedRef.current) return;
            const answeredKeys = Object.keys(answers).filter(k => answers[k] !== "");
            if (answeredKeys.length < 5) return; // Less than 5 answers, don't auto-submit

            const storedSession = localStorage.getItem("examSession");
            if (!storedSession) return;
            const sd = JSON.parse(storedSession);
            const examId = sd?.examId;
            if (!examId) return;

            const currentSetNumber = sd?.currentSetNumber;
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/students/save-module-score";

            // Build minimal answer data
            const answerEntries = answeredKeys.map(qNum => ({
                questionNumber: parseInt(qNum),
                studentAnswer: answers[qNum]?.toString().trim() || "",
                questionType: "auto-submitted"
            }));

            const payload = {
                examId,
                module: "listening",
                scoreData: {
                    score: 0, total: 40, band: 0,
                    answers: answerEntries,
                    setNumber: currentSetNumber,
                    autoSubmitted: true,
                    answeredCount: answeredKeys.length
                }
            };

            // sendBeacon guarantees delivery even during page unload
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            navigator.sendBeacon(apiUrl, blob);

            // Mark module as completed in localStorage
            sd.completedModules = [...(sd.completedModules || []), currentSetNumber ? `listening:${currentSetNumber}` : "listening"];
            sd.scores = { ...(sd.scores || {}), listening: { band: 0, raw: 0, autoSubmitted: true } };
            localStorage.setItem("examSession", JSON.stringify(sd));

            // Clear auto-save draft
            try { localStorage.removeItem(autoSaveKey); } catch (e) { /* ignore */ }
            submittedRef.current = true;
        };

        const handlePageHide = (e) => {
            if (!e.persisted) emergencySubmit(); // Page is actually being unloaded
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") emergencySubmit();
        };

        window.addEventListener("pagehide", handlePageHide);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("pagehide", handlePageHide);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [answers, isAdminPreview]);

    // Mark as submitted when normal submit happens
    useEffect(() => {
        // This is set in handleSubmit to prevent double-submit
    }, []);

    // ── Load exam data ───────────────────────────────────────────────────
    // Optimized: uses prefetch cache (populated when the instruction video opened)
    // and skips the redundant verifyExamId call — completion check is done via
    // the localStorage `completedModules` field that was refreshed on the
    // selection page (/exam/[examId]). No behavior change.
    useEffect(() => {
        const loadData = async () => {
            try {
                // ═══ ADMIN PREVIEW MODE ═══
                if (isAdminPreview) {
                    const cached = getPrefetched("listening", adminPreviewTestNumber);
                    if (cached) {
                        setQuestionSet(cached);
                        setIsLoading(false);
                        return;
                    }
                    const response = await listeningAPI.getForExam(adminPreviewTestNumber);
                    if (response.success && response.data) {
                        setQuestionSet(response.data);
                    } else {
                        setLoadError("Failed to load listening test.");
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

                // Completion check from localStorage (already refreshed on selection page)
                const setNum = parsed.currentSetNumber;
                const isThisSetDone = setNum
                    ? (parsed.completedModules?.includes(`listening:${setNum}`) || parsed.completedModules?.includes("listening"))
                    : parsed.completedModules?.includes("listening");
                if (isThisSetDone) {
                    router.push(`/exam/${params.examId}`);
                    return;
                }

                const listeningSetNumber = parsed.currentSetNumber || parsed.assignedSets?.listeningSetNumber;
                if (!listeningSetNumber) {
                    setLoadError("No listening test assigned for this exam.");
                    setIsLoading(false);
                    return;
                }

                // Use prefetched data if available (set when video popup opened);
                // otherwise fetch (will also cache for future).
                const data = await fetchModuleData("listening", listeningSetNumber);
                if (data) {
                    setQuestionSet(data);
                } else {
                    setLoadError("Failed to load listening test questions.");
                }
            } catch (err) {
                setLoadError(err.message || "Failed to load exam data.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [params.examId, isAdminPreview, adminPreviewTestNumber]);

    // ── Build flat question list ──────────────────────────────────────────
    const sections = questionSet?.sections || [];
    const audioUrl = questionSet?.mainAudioUrl || "/audio/Listening-1.mpeg";

    // Flatten all non-instruction blocks across sections, assign global displayNumber
    const allBlocks = []; // each item: { ...block, _sectionIndex, _isInstruction, displayNumber? }
    let qCounter = 0;
    sections.forEach((sec, sIdx) => {
        (sec.questions || []).forEach(b => {
            if (b.blockType === 'instruction') {
                allBlocks.push({ ...b, _sectionIndex: sIdx, _isInstruction: true });
            } else {
                qCounter++;
                allBlocks.push({ ...b, _sectionIndex: sIdx, _isInstruction: false, displayNumber: qCounter });
            }
        });
    });

    const allRealQuestions = allBlocks.filter(b => !b._isInstruction);
    const totalQuestions = allRealQuestions.length;
    const totalMarks = allRealQuestions.reduce((s, q) => s + (q.marks || 1), 0);

    // ── Pagination: 10 questions per page ─────────────────────────────────
    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);

    // which displayNumbers are on currentPage?
    const pageStartQNum = currentPage * QUESTIONS_PER_PAGE + 1;  // e.g. 1, 11, 21
    const pageEndQNum = Math.min(pageStartQNum + QUESTIONS_PER_PAGE - 1, totalQuestions); // e.g. 10, 20

    // blocks to render on this page: keep instruction blocks that precede qs on this page,
    // and all non-instruction blocks with displayNumber in [pageStartQNum, pageEndQNum]
    function getBlocksForPage(startQ, endQ) {
        const result = [];
        let lastInstructionIdx = -1;
        for (let i = 0; i < allBlocks.length; i++) {
            const b = allBlocks[i];
            if (b._isInstruction) {
                // include if the next non-instruction block is in this page range
                // check forward to see if any following q is in range
                let hasRelatedQ = false;
                for (let j = i + 1; j < allBlocks.length; j++) {
                    if (!allBlocks[j]._isInstruction) {
                        if (allBlocks[j].displayNumber >= startQ && allBlocks[j].displayNumber <= endQ) {
                            hasRelatedQ = true;
                        }
                        break;
                    }
                }
                if (hasRelatedQ) result.push(b);
            } else {
                if (b.displayNumber >= startQ && b.displayNumber <= endQ) {
                    result.push(b);
                }
            }
        }
        return result;
    }

    const pageBlocks = getBlocksForPage(pageStartQNum, pageEndQNum);

    // Section info for current page (first block's section)
    const firstPageBlock = pageBlocks.find(b => !b._isInstruction);
    const currentSectionIndex = firstPageBlock?._sectionIndex ?? 0;
    const currentSec = sections[currentSectionIndex] || {};

    // ── Timer ─────────────────────────────────────────────────────────────
    const formatTime = (s) => {
        if (!s || isNaN(s)) return "00:00";
        return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    };

    useEffect(() => {
        if (showSoundTest || showPlayOverlay || isLoading) return;
        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(t); handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [showSoundTest, showPlayOverlay, isLoading]);

    // ── Audio ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', onEnded);
        return () => audio.removeEventListener('ended', onEnded);
    }, []);

    useEffect(() => {
        if (audioRef.current && !showSoundTest && !showPlayOverlay && audioUrl && !hasStarted.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.load();
            audioRef.current.play().catch(err => console.log("Auto-play blocked:", err));
            setIsPlaying(true);
            hasStarted.current = true;
        }
    }, [showSoundTest, showPlayOverlay, audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
        setIsPlaying(p => !p);
    };

    const handleVolumeChange = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    // ── Answer ────────────────────────────────────────────────────────────
    const handleAnswer = (qId, value) => setAnswers(prev => ({ ...prev, [qId]: value }));

    // ── Navigation ────────────────────────────────────────────────────────
    const goToPage = (pg) => {
        setCurrentPage(pg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const goNext = () => {
        if (currentPage < totalPages - 1) { goToPage(currentPage + 1); }
        else { setShowSubmitModal(true); }
    };
    const goPrev = () => { if (currentPage > 0) goToPage(currentPage - 1); };

    // Per-question navigation (arrow buttons)
    const goNextQuestion = () => {
        if (focusedQuestion < totalQuestions) {
            const nextQ = focusedQuestion + 1;
            setFocusedQuestion(nextQ);
            const targetPage = Math.floor((nextQ - 1) / QUESTIONS_PER_PAGE);
            if (targetPage !== currentPage) goToPage(targetPage);
            setTimeout(() => {
                const el = document.getElementById(`q-${nextQ}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const input = el.querySelector('input');
                    if (input) input.focus();
                }
                // Highlight question number box
                const qnumEl = document.getElementById(`qnum-${nextQ}`);
                if (qnumEl) { qnumEl.style.border = '2px solid #2563eb'; qnumEl.style.borderRadius = '4px'; }
                // Remove highlight from previous
                const prevQnum = document.getElementById(`qnum-${nextQ - 1}`);
                if (prevQnum) { prevQnum.style.border = ''; prevQnum.style.borderRadius = ''; }
            }, 150);
        }
    };
    const goPrevQuestion = () => {
        if (focusedQuestion > 1) {
            const prevQ = focusedQuestion - 1;
            setFocusedQuestion(prevQ);
            const targetPage = Math.floor((prevQ - 1) / QUESTIONS_PER_PAGE);
            if (targetPage !== currentPage) goToPage(targetPage);
            setTimeout(() => {
                const el = document.getElementById(`q-${prevQ}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const input = el.querySelector('input');
                    if (input) input.focus();
                }
                // Highlight question number box
                const qnumEl = document.getElementById(`qnum-${prevQ}`);
                if (qnumEl) { qnumEl.style.border = '2px solid #2563eb'; qnumEl.style.borderRadius = '4px'; }
                // Remove highlight from next
                const nextQnum = document.getElementById(`qnum-${prevQ + 1}`);
                if (nextQnum) { nextQnum.style.border = ''; nextQnum.style.borderRadius = ''; }
            }, 150);
        }
    };

    // ── Score & Submit ────────────────────────────────────────────────────
    const getBandScore = (raw) => {
        if (raw >= 39) return 9.0; if (raw >= 37) return 8.5; if (raw >= 35) return 8.0;
        if (raw >= 32) return 7.5; if (raw >= 30) return 7.0; if (raw >= 26) return 6.5;
        if (raw >= 23) return 6.0; if (raw >= 18) return 5.5; if (raw >= 16) return 5.0;
        if (raw >= 13) return 4.5; if (raw >= 11) return 4.0; if (raw >= 8) return 3.5;
        if (raw >= 6) return 3.0; if (raw >= 4) return 2.5; return 2.0;
    };

    const calculateScore = () => {
        let score = 0;
        allRealQuestions.forEach(q => {
            const ua = answers[q.displayNumber];
            if (ua && ua.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase()) {
                score += q.marks || 1;
            }
        });
        return score;
    };

    const handleSubmit = async () => {
        submittedRef.current = true; // Prevent emergency submit from firing
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1200));
        const score = calculateScore();
        const band = getBandScore(score);

        // ═══ ADMIN PREVIEW: Show score popup, don't save to DB ═══
        if (isAdminPreview) {
            setIsSubmitting(false);
            setShowSubmitModal(false);
            setAdminScoreResult({ score, total: totalMarks, band, answered: answeredCount });
            return;
        }

        // ═══ NORMAL STUDENT: Save to DB ═══
        const detailedAnswers = allRealQuestions.map(q => {
            const ua = answers[q.displayNumber] || "";
            let cmp = ua.toString().trim();
            if ((q.questionType === "multiple-choice" || q.questionType === "matching") && ua) {
                const m = ua.toString().match(/^([A-Za-z])\./);
                if (m) cmp = m[1].toUpperCase();
            }
            return { questionNumber: q.displayNumber, questionText: q.questionText || "", questionType: q.questionType || "fill-in-blank", studentAnswer: cmp, studentAnswerFull: ua, correctAnswer: q.correctAnswer, isCorrect: false };
        });

        const storedSession = localStorage.getItem("examSession");
        let sd = storedSession ? JSON.parse(storedSession) : session;
        const examId = sd?.examId || session?.examId;

        try {
            const currentSetNumber = sd?.currentSetNumber;
            const res = await studentsAPI.saveModuleScore(examId, "listening", { score, total: totalMarks, band, answers: detailedAnswers, setNumber: currentSetNumber });
            if (res.success && sd) {
                sd.completedModules = res.data?.completedModules || [...(sd.completedModules || []), currentSetNumber ? `listening:${currentSetNumber}` : "listening"];
                sd.scores = res.data?.scores || { ...(sd.scores || {}), listening: { band, raw: score, correctAnswers: score, totalQuestions: totalMarks } };
                localStorage.setItem("examSession", JSON.stringify(sd));
            }
        } catch {
            if (sd) {
                const currentSetNumber = sd?.currentSetNumber;
                sd.completedModules = [...(sd.completedModules || []), currentSetNumber ? `listening:${currentSetNumber}` : "listening"];
                sd.scores = { ...(sd.scores || {}), listening: { band, raw: score, correctAnswers: score, totalQuestions: totalMarks } };
                localStorage.setItem("examSession", JSON.stringify(sd));
            }
        }
        // Clear auto-save after successful submit
        try { localStorage.removeItem(autoSaveKey); } catch (e) { /* ignore */ }
        router.push(`/exam/${params.examId}`);
    };

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== "").length;

    // ─────────────────────────────────────────────────────────────────────
    // RENDER: Loading
    // ─────────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <ExamLoadingOverlay
            active={true}
            done={false}
            label="Preparing Listening Test"
            subLabel="Loading questions and audio..."
        />
    );

    if (loadError) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaTimes className="text-xl text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Cannot Load Test</h2>
                <p className="text-gray-600 text-sm mb-4">{loadError}</p>
                <button onClick={() => router.push("/")} className="bg-gray-800 text-white px-5 py-2 text-sm hover:bg-gray-900 cursor-pointer">Go Home</button>
            </div>
        </div>
    );

    // ── Sound Test: play a beep tone using Web Audio API ──
    const playSoundTest = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();

            // Create a pleasant test tone sequence (3 beeps)
            const playBeep = (startTime, frequency, duration) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, startTime);
                gainNode.gain.setValueAtTime(volume * 0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioCtx.currentTime;
            playBeep(now, 523.25, 0.4);        // C5
            playBeep(now + 0.5, 659.25, 0.4);   // E5
            playBeep(now + 1.0, 783.99, 0.6);   // G5

            setSoundTestPlaying(true);
            setSoundTestResult(null);
            setTimeout(() => {
                setSoundTestPlaying(false);
                setSoundTestResult('ask'); // show Yes/No buttons after sound finishes
            }, 2000);
        } catch (e) {
            console.error('Audio test failed:', e);
        }
    };


    // ─────────────────────────────────────────────────────────────────────
    // RENDER: Step 2 — Audio / Sound Test
    // ─────────────────────────────────────────────────────────────────────
    if (showSoundTest) return (
        <div className="min-h-screen" style={{ backgroundColor: '#4b4b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', maxWidth: '520px', padding: '0 20px', color: 'white' }}>
                {/* Sound Icon */}
                <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: soundTestPlaying ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}>
                        <FaVolumeUp size={50} style={{ color: soundTestPlaying ? '#4ade80' : 'white', transition: 'color 0.3s' }} />
                    </div>
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
                    Sound Check
                </h2>

                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '28px', color: '#d1d5db' }}>
                    Put on your headphones and click the button below to play a test sound.
                </p>

                {/* Play Test Sound Button */}
                <button
                    onClick={playSoundTest}
                    disabled={soundTestPlaying}
                    style={{
                        backgroundColor: soundTestPlaying ? '#16a34a' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        fontSize: '15px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: soundTestPlaying ? 'default' : 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        marginBottom: '24px'
                    }}
                >
                    {soundTestPlaying ? (
                        <>
                            <FaVolumeUp size={16} />
                            Playing...
                        </>
                    ) : (
                        <>
                            <FaPlay size={12} />
                            Play Test Sound
                        </>
                    )}
                </button>

                {/* Volume Slider */}
                <div style={{ marginBottom: '28px' }}>
                    <label style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '10px' }}>
                        Volume: {Math.round(volume * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        style={{
                            width: '250px',
                            height: '6px',
                            appearance: 'auto',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                        }}
                    />
                </div>

                {/* ── After sound plays: Ask "Can you hear?" ── */}
                {soundTestResult === 'ask' && (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#fbbf24' }}>
                            Can you hear the sound?
                        </p>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            {/* YES Button */}
                            <button
                                onClick={() => {
                                    setSoundTestResult('yes');
                                    setShowSoundTest(false);
                                }}
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 35px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FaCheck size={14} />
                                Yes
                            </button>
                            {/* NO Button */}
                            <button
                                onClick={() => setSoundTestResult('no')}
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 35px',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FaTimes size={14} />
                                No
                            </button>
                        </div>
                    </div>
                )}

                {/* ── If NO: Show troubleshooting options ── */}
                {soundTestResult === 'no' && (
                    <div style={{
                        marginTop: '10px',
                        padding: '20px',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239,68,68,0.3)'
                    }}>
                        <p style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '16px', lineHeight: '1.6' }}>
                            Please check your headphones/speakers and make sure they are connected properly. Then try again.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => {
                                    setSoundTestResult(null);
                                    playSoundTest();
                                }}
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 25px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '6px'
                                }}
                            >
                                <FaPlay size={10} />
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push(`/exam/${params.examId}`)}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#f87171',
                                    border: '1px solid #f87171',
                                    padding: '10px 25px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '6px'
                                }}
                            >
                                <FaTimes size={12} />
                                Exit Test
                            </button>
                        </div>
                    </div>
                )}

                {/* Default hint when no result yet */}
                {!soundTestResult && !soundTestPlaying && (
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                        Click "Play Test Sound" to check your audio.
                    </p>
                )}
            </div>
        </div>
    );


    // ─────────────────────────────────────────────────────────────────────
    // RENDER: Main Exam — Official IELTS Interface
    // ─────────────────────────────────────────────────────────────────────

    // Group consecutive non-instruction blocks for smarter rendering
    function buildRenderGroups(blocks) {
        const groups = [];
        let i = 0;
        while (i < blocks.length) {
            const b = blocks[i];
            if (b._isInstruction) {
                groups.push({ type: 'instruction', block: b }); i++; continue;
            }
            const qType = b.questionType || 'fill-in-blank';
            const group = [b];
            let j = i + 1;
            // Group matching (they share options) or multi-select MC (they share question text)
            if (qType === 'matching' || qType === 'multiple-choice-multi' || qType === 'matching-features' || qType === 'matching-headings' || qType === 'map-labeling' || qType === 'diagram-labeling') {
                while (j < blocks.length && !blocks[j]._isInstruction && blocks[j].questionType === qType) {
                    group.push(blocks[j]); j++;
                }
            }
            // regular Multiple Choice or Note Completion are rendered as individual/adjacent blocks but not "grouped" under one header
            groups.push({ type: qType, blocks: group });
            i = j;
        }
        return groups;
    }

    const renderGroups = buildRenderGroups(pageBlocks);

    // Pre-scan: find question numbers embedded as [N] placeholders in instruction blocks
    const embeddedQNums = new Set();
    renderGroups.forEach(grp => {
        if (grp.type === 'instruction' && grp.block.content) {
            const matches = grp.block.content.match(/\[(\d+)\]/g);
            if (matches) {
                matches.forEach(m => {
                    const num = parseInt(m.replace(/[\[\]]/g, ''));
                    if (num >= 1 && num <= 40) embeddedQNums.add(num);
                });
            }
        }
    });

    // Which part does this page belong to? (for part banner)
    // Determine which parts are covered by this page
    const partCovered = new Set(pageBlocks.filter(b => !b._isInstruction).map(b => b._sectionIndex));

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Arial', sans-serif", fontSize: '14px', backgroundColor: cs.bg }}>

            <ExamSecurity examId={session?.examId} onViolationLimit={() => handleSubmit()} />
            <audio ref={audioRef} preload="auto" />

            {/* ══════════════════════════════════════
                PLAY OVERLAY — shown after sound test passes
            ══════════════════════════════════════ */}
            {showPlayOverlay && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(75, 75, 75, 0.92)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '800px', padding: '0 20px', color: 'white' }}>
                        {/* Headphones Icon */}
                        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
                            <FaHeadphones size={100} style={{ color: 'white', opacity: 0.9 }} />
                        </div>

                        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '25px', fontWeight: '400' }}>
                            You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.
                        </p>

                        <p style={{ fontSize: '15px', marginBottom: '30px', fontWeight: '400' }}>
                            To continue, click Play.
                        </p>

                        {/* Play Button */}
                        <button
                            onClick={() => setShowPlayOverlay(false)}
                            style={{
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                padding: '10px 25px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingLeft: '2px'
                            }}>
                                <FaPlay size={10} style={{ color: 'black' }} />
                            </div>
                            Play
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                TOP HEADER — Inspera IELTS Clone
            ══════════════════════════════════════ */}
            <header style={{ backgroundColor: cs.bg, borderBottom: `1px solid ${contrastMode === 'black-on-white' ? '#ccc' : '#555'}`, height: '56px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 16px' }}>
                    {/* Left: IELTS logo + Test taker ID + audio status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <span style={{ fontWeight: '900', color: '#cc0000', fontSize: '32px', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>IELTS</span>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                            <span style={{ fontSize: '16px', fontWeight: '600', color: cs.text }}>Test taker ID</span>
                            <span style={{ fontSize: '13px', color: contrastMode === 'black-on-white' ? '#6b7280' : cs.text }}>{Math.floor(timeLeft / 60)} minutes remaining</span>
                        </div>
                    </div>
                    {/* Right: WiFi + Bell + Menu icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Exam Timer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', border: `1px solid ${contrastMode === 'black-on-white' ? '#d1d5db' : cs.text}`, borderRadius: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
                            </svg>
                            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: '700', color: cs.text, minWidth: '52px', textAlign: 'center' }}>{formatTime(timeLeft)}</span>
                        </div>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <line x1="12" y1="20" x2="12.01" y2="20" />
                        </svg>
                        {/* Bell icon */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {/* Hamburger menu — opens Options panel */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={contrastMode === 'black-on-white' ? '#374151' : cs.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }} onClick={() => { setShowOptionsMenu(true); setOptionsView('main'); }}>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════
                PART BANNER — Inspera Style
            ══════════════════════════════════════ */}
            <div style={{ margin: '26px 15px 0', backgroundColor: cs.partBg, border: `1px solid ${cs.partBorder}`, padding: '12px 24px', flexShrink: 0, fontFamily: 'Arial, sans-serif', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: `${16 * tScale}px`, color: cs.text, marginBottom: '2px' }}>
                    Part {currentSectionIndex + 1}
                </div>
                <div style={{ fontSize: `${16 * tScale}px`, color: cs.text }}>
                    {(() => {
                        const partQs = pageBlocks.filter(b => !b._isInstruction);
                        const first = partQs[0]?.displayNumber;
                        const last = partQs[partQs.length - 1]?.displayNumber;
                        return (first && last ? `Listen and answer questions ${first}–${last}.` : '');
                    })()}
                </div>
            </div>

            {/* ══════════════════════════════════════
                SCROLLABLE CONTENT
            ══════════════════════════════════════ */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px', fontFamily: 'Arial, sans-serif', backgroundColor: cs.bg, color: cs.text, fontSize: `${16 * tScale}px` }}>
                <div style={{ maxWidth: '1000px', padding: '20px 20px' }}>

                    {/* Section image if any */}
                    {currentSec.imageUrl && (
                        <div style={{ marginBottom: '25px' }}>
                            <img src={currentSec.imageUrl} alt="Section diagram" style={{ maxWidth: '100%', maxHeight: '420px' }} />
                        </div>
                    )}

                    {/* ── Render groups (wrapped in DomHighlighter — highlights rendered DOM incl. HTML notes) ── */}
                    <DomHighlighter passageId={`listening_section_${currentSectionIndex}`} contrastMode={contrastMode}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {renderGroups.map((grp, gIdx) => {

                            // ── Instruction block ──
                            if (grp.type === 'instruction') {
                                return (
                                    <div key={gIdx}>
                                        <InstructionWithPortals
                                            content={grp.block.content}
                                            imageUrl={grp.block.imageUrl}
                                            answers={answers}
                                            handleAnswer={handleAnswer}
                                            qNumsSet={embeddedQNums}
                                            textColor={cs.text}
                                            bgColor={cs.bg}
                                        />
                                    </div>
                                );
                            }

                            const blocks = grp.blocks;
                            const firstB = blocks[0];

                            // Skip question groups whose questions are already embedded as [N] inputs in instruction blocks
                            if (grp.type !== 'instruction') {
                                const allEmbedded = blocks.every(b => embeddedQNums.has(b.displayNumber));
                                if (allEmbedded) return null;
                            }

                            if (grp.type === 'fill-in-blank' || grp.type === 'note-completion' || grp.type === 'sentence-completion' || grp.type === 'form-completion' || grp.type === 'flow-chart-completion' || grp.type === 'summary-completion' || grp.type === 'short-answer' || grp.type === 'table-completion') {
                                const firstQNum = blocks[0].displayNumber;
                                const lastQNum = blocks[blocks.length - 1].displayNumber;
                                return (
                                    <div key={gIdx}>
                                        {/* Instruction: support bold text markers like **ONE WORD** */}
                                        {firstB.instruction && (
                                            <p style={{
                                                marginBottom: '20px',
                                                color: cs.text,
                                                fontSize: '15.5px',
                                                lineHeight: '1.4',
                                                fontFamily: 'Arial, sans-serif'
                                            }} dangerouslySetInnerHTML={{
                                                __html: firstB.instruction.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                            }} />
                                        )}

                                        {/* Question rows */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {blocks.map(q => (
                                                <NoteCompletionRow key={q.displayNumber} q={q} answers={answers} handleAnswer={handleAnswer} textColor={cs.text} isFocused={focusedQuestion === q.displayNumber} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // ── Multiple Choice ──
                            if (grp.type === 'multiple-choice' || grp.type === 'multiple-choice-multi') {
                                const isMultiSelect = grp.type === 'multiple-choice-multi';
                                const firstB = blocks[0];
                                const qNumbers = blocks.map(b => b.displayNumber);

                                const handleSel = (qNum, label) => {
                                    if (isMultiSelect) {
                                        const cur = qNumbers.map(n => answers[n]).filter(Boolean);
                                        if (cur.includes(label)) {
                                            const toClear = qNumbers.find(n => answers[n] === label);
                                            if (toClear) handleAnswer(toClear, '');
                                        } else if (cur.length < qNumbers.length) {
                                            const emp = qNumbers.find(n => !answers[n]);
                                            if (emp) handleAnswer(emp, label);
                                        }
                                    } else {
                                        handleAnswer(qNum, label);
                                    }
                                };

                                // ── Multi-Select: ONE block with multiple number boxes ──
                                if (isMultiSelect) {
                                    return (
                                        <div key={gIdx} style={{ marginBottom: '24px' }} id={`q-${qNumbers[0]}`}>
                                            {firstB.mainInstruction && <p style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '15px', color: cs.text }}>{firstB.mainInstruction}</p>}

                                            {/* Number boxes [21] [22] + question text */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                {qNumbers.map(n => (
                                                    <span key={n} id={`qnum-${n}`} style={{
                                                        border: `1px solid ${cs.text}`, fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: cs.text, background: cs.bg,
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px', marginTop: '2px'
                                                    }}>{n}</span>
                                                ))}
                                                <span style={{ color: cs.text, fontSize: '15px', lineHeight: '1.5' }}>{firstB.questionText}</span>
                                            </div>

                                            {/* Shared options */}
                                            <div style={{ marginLeft: '34px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {(firstB.options || []).map((opt, oIdx) => {
                                                    const letter = String.fromCharCode(65 + oIdx);
                                                    const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                    const isSel = qNumbers.some(n => answers[n] === letter);
                                                    return (
                                                        <div key={oIdx} onClick={() => handleSel(qNumbers[0], letter)}
                                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                            <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0, fontSize: '14px', color: cs.text }}>{letter}</span>
                                                            <div style={{
                                                                width: '18px', height: '18px', border: `1px solid ${isSel ? '#1f2937' : '#d1d5db'}`,
                                                                background: isSel ? '#1f2937' : 'white', flexShrink: 0, marginTop: '1px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                borderRadius: isMultiSelect ? '3px' : '50%'
                                                            }}>
                                                                {isSel && <div style={{ width: '10px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" fill="none" /></svg>
                                                                </div>}
                                                            </div>
                                                            <span style={{ color: cs.text, fontWeight: isSel ? '600' : '400', fontSize: '14px' }}>{text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                // ── Single-Select: each question separately ──
                                return (
                                    <div key={gIdx} style={{ marginBottom: '24px' }}>
                                        {firstB.mainInstruction && <p style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '15px', color: cs.text }}>{firstB.mainInstruction}</p>}

                                        {blocks.map((q, qidx) => (
                                            <div key={qidx} style={{ marginBottom: '20px' }} id={`q-${q.displayNumber}`}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                                    {/* [N] box */}
                                                    <span id={`qnum-${q.displayNumber}`} style={{
                                                        border: `1px solid ${cs.text}`, fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: cs.text, background: cs.bg,
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px', marginTop: '2px'
                                                    }}>{q.displayNumber}</span>
                                                    <span style={{ color: cs.text, fontSize: '15px', lineHeight: '1.5' }}>{q.questionText}</span>
                                                </div>

                                                <div style={{ marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {(q.options || []).map((opt, oIdx) => {
                                                        const letter = String.fromCharCode(65 + oIdx);
                                                        const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                        const isSel = answers[q.displayNumber] === letter;
                                                        return (
                                                            <div key={oIdx} onClick={() => handleSel(q.displayNumber, letter)}
                                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                                <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0, fontSize: '14px', color: cs.text }}>{letter}</span>
                                                                <div style={{
                                                                    width: '18px', height: '18px', border: `1px solid ${isSel ? '#1f2937' : '#d1d5db'}`,
                                                                    background: isSel ? '#1f2937' : 'white', flexShrink: 0, marginTop: '1px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                                                }}>
                                                                    {isSel && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
                                                                </div>
                                                                <span style={{ color: cs.text, fontWeight: isSel ? '600' : '400', fontSize: '14px' }}>{text}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            // ── Matching ──
                            if (grp.type === 'matching' || grp.type === 'matching-features' || grp.type === 'matching-headings') {
                                const firstQNum = blocks[0].displayNumber;
                                const lastQNum = blocks[blocks.length - 1].displayNumber;
                                const hasLongOpts = (firstB.options || []).some(o => (o || '').length > 4);
                                return (
                                    <div key={gIdx} style={{ marginBottom: '12px' }}>
                                        {/* Instruction text */}
                                        {firstB.instruction && <p style={{ marginBottom: '4px', fontWeight: 'bold' }}>{firstB.instruction}</p>}
                                        {firstB.subInstruction && <p style={{ marginBottom: '8px', fontStyle: 'italic', color: '#4b5563', fontSize: '13px' }}>{firstB.subInstruction}</p>}
                                        {hasLongOpts && (
                                            <div style={{ border: '1px solid #d1d5db', marginBottom: '12px', maxWidth: '480px' }}>
                                                {(firstB.options || []).map((opt, oIdx) => {
                                                    const letter = (opt || '').match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + oIdx);
                                                    const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                    return (
                                                        <div key={oIdx} style={{ display: 'flex', gap: '12px', padding: '5px 10px', borderBottom: oIdx < (firstB.options.length - 1) ? '1px solid #e5e7eb' : 'none', fontSize: '13px' }}>
                                                            <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0 }}>{letter}</span>
                                                            <span style={{ color: cs.text }}>{text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
                                            {blocks.map(q => (
                                                <div key={q.displayNumber} id={`q-${q.displayNumber}`}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {/* [N] box */}
                                                    <span id={`qnum-${q.displayNumber}`} style={{
                                                        border: `1px solid ${cs.text}`, fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: cs.text, background: cs.bg,
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px'
                                                    }}>{q.displayNumber}</span>
                                                    <span style={{ flex: 1, color: cs.text, fontSize: '15px' }}>{q.questionText}</span>
                                                    <select value={answers[q.displayNumber] || ""} onChange={e => handleAnswer(q.displayNumber, e.target.value)}
                                                        style={{ border: `1px solid ${cs.text}`, padding: '4px 8px', fontSize: '14px', background: cs.bg, color: cs.text, cursor: 'pointer', width: '70px', textAlign: 'center', borderRadius: '2px' }}>
                                                        <option value=""></option>
                                                        {(firstB.options || []).map((_, oIdx) => (
                                                            <option key={oIdx} value={String.fromCharCode(65 + oIdx)}>{String.fromCharCode(65 + oIdx)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // ── Map / Diagram Labeling ──
                            if (grp.type === 'map-labeling' || grp.type === 'diagram-labeling') {
                                return (
                                    <div key={gIdx} style={{ marginBottom: '20px' }}>
                                        {/* Section image for map/diagram */}
                                        {firstB.imageUrl && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <img src={firstB.imageUrl} alt="Map/Diagram" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #d1d5db' }} />
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
                                            {blocks.map(q => (
                                                <div key={q.displayNumber} id={`q-${q.displayNumber}`}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {/* [N] box */}
                                                    <span id={`qnum-${q.displayNumber}`} style={{
                                                        border: `1px solid ${cs.text}`, fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: cs.text, background: cs.bg,
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px'
                                                    }}>{q.displayNumber}</span>
                                                    <span style={{ flex: 1, color: cs.text, fontSize: '15px' }}>{q.questionText}</span>
                                                    <select value={answers[q.displayNumber] || ""}
                                                        onChange={e => handleAnswer(q.displayNumber, e.target.value)}
                                                        style={{
                                                            border: `1px solid ${cs.text}`, padding: '4px 8px', fontSize: '14px',
                                                            background: cs.bg, color: cs.text, cursor: 'pointer', width: '80px',
                                                            textAlign: 'center', borderRadius: '2px'
                                                        }}>
                                                        <option value=""></option>
                                                        {(q.options || []).map((opt, oIdx) => (
                                                            <option key={oIdx} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                    </DomHighlighter>
                </div>

                {/* ══════════════════════════════════════
                PAGE NAVIGATION ARROWS — floating in content area (Inspera style)
            ══════════════════════════════════════ */}
                <div style={{
                    position: 'fixed', bottom: '140px', right: '16px',
                    display: 'flex', gap: '4px', zIndex: 99
                }}>
                    <button onClick={goPrevQuestion} disabled={focusedQuestion <= 1}
                        style={{
                            width: '56px', height: '56px', cursor: focusedQuestion <= 1 ? 'not-allowed' : 'pointer',
                            background: focusedQuestion <= 1 ? '#c8c8c8' : '#4a4a4a', color: 'white',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '3px'
                        }}>
                        <FaArrowLeft size={24} />
                    </button>
                    <button onClick={goNextQuestion} disabled={focusedQuestion >= totalQuestions}
                        style={{
                            width: '56px', height: '56px', cursor: focusedQuestion >= totalQuestions ? 'not-allowed' : 'pointer',
                            background: focusedQuestion >= totalQuestions ? '#c8c8c8' : '#1a1a1a', color: 'white',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '3px'
                        }}>
                        <FaArrowRight size={24} />
                    </button>
                </div>

                {/* ══════════════════════════════════════
                FIXED BOTTOM NAV — Reading Page Style (Part labels + question nums)
            ══════════════════════════════════════ */}
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: cs.bg,
                    display: 'flex', alignItems: 'center',
                    height: '44px', padding: '0', zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, height: '100%' }}>
                        {sections.map((sec, sIdx) => {
                            const isActivePart = sIdx === currentSectionIndex;
                            const sectionQuestions = allRealQuestions.filter(q => q._sectionIndex === sIdx);
                            const sectionAnswered = sectionQuestions.filter(q => answers[q.displayNumber] && answers[q.displayNumber] !== '').length;

                            return (
                                <div key={sIdx} style={{
                                    flex: 1, display: 'flex', alignItems: 'center',
                                    gap: '6px', height: '100%', padding: '0 12px',
                                    cursor: 'pointer', borderRadius: '4px', overflow: 'hidden'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                        const firstQ = sectionQuestions[0];
                                        if (firstQ) {
                                            const targetPage = Math.floor((firstQ.displayNumber - 1) / QUESTIONS_PER_PAGE);
                                            goToPage(targetPage);
                                            setFocusedQuestion(firstQ.displayNumber);
                                        }
                                    }}
                                >
                                    {/* Part label */}
                                    <span style={{
                                        fontSize: '14px', fontWeight: 'bold', color: isActivePart ? cs.text : '#888',
                                        fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap', flexShrink: 0
                                    }}>
                                        Part {sIdx + 1}
                                    </span>

                                    {/* Active: question numbers | Inactive: answered count */}
                                    {isActivePart ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap' }}>
                                            {sectionQuestions.map(q => {
                                                const isAnswered = answers[q.displayNumber] && answers[q.displayNumber] !== '';
                                                const isFocused = focusedQuestion === q.displayNumber;
                                                return (
                                                    <div key={q.displayNumber}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFocusedQuestion(q.displayNumber);
                                                            const el = document.getElementById(`q-${q.displayNumber}`);
                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }}
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div style={{ width: '18px', height: '3px', background: isAnswered ? '#2563eb' : '#c0c0c0', marginBottom: '3px', borderRadius: '1px' }}></div>
                                                        <span style={{
                                                            fontSize: '14px', fontWeight: '400',
                                                            color: cs.text,
                                                            fontFamily: 'Arial, sans-serif',
                                                            padding: '2px 3px',
                                                            border: isFocused ? '1.5px solid #2563eb' : '1.5px solid transparent',
                                                            borderRadius: '3px',
                                                            lineHeight: '1'
                                                        }}>
                                                            {q.displayNumber}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: '13px', fontWeight: '400', color: '#aaa',
                                            fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap'
                                        }}>
                                            {sectionAnswered} of {sectionQuestions.length}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit checkmark button */}
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        onMouseEnter={e => e.currentTarget.style.background = '#c8c8c8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
                        style={{
                            width: '48px', height: '44px', cursor: 'pointer',
                            background: '#e5e7eb', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, borderRadius: 0
                        }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                </div>

                {/* ══════════════════════════════════════
                SUBMIT MODAL
            ══════════════════════════════════════ */}
                {
                    showSubmitModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
                            <div style={{ background: 'white', padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>Submit Listening Test?</h3>
                                    <button onClick={() => setShowSubmitModal(false)} style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>
                                        <FaTimes />
                                    </button>
                                </div>
                                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{answeredCount}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/{totalQuestions}</span></p>
                                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>questions answered</p>
                                </div>
                                {totalQuestions - answeredCount > 0 && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '10px', marginBottom: '16px', textAlign: 'center' }}>
                                        <p style={{ color: '#92400e', fontSize: '13px', fontWeight: '600' }}>
                                            {totalQuestions - answeredCount} question{totalQuestions - answeredCount > 1 ? 's' : ''} unanswered
                                        </p>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowSubmitModal(false)}
                                        style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer', background: 'white' }}>
                                        Review
                                    </button>
                                    <button onClick={handleSubmit} disabled={isSubmitting}
                                        style={{ flex: 1, padding: '10px', background: '#1f2937', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none', opacity: isSubmitting ? 0.7 : 1 }}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ══════════════════════════════════════
                    ADMIN PREVIEW SCORE POPUP
                ══════════════════════════════════════ */}
                {
                    adminScoreResult && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
                            <div style={{ background: 'white', padding: '32px', maxWidth: '400px', width: '100%', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <FaCheck style={{ fontSize: '28px', color: '#10b981' }} />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>Admin Preview Result</h2>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>This is a preview — no data was saved.</p>

                                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '42px', fontWeight: 'bold', color: '#1f2937' }}>
                                        {adminScoreResult.score}<span style={{ fontSize: '20px', color: '#9ca3af' }}>/{adminScoreResult.total}</span>
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Correct Answers</p>
                                    <div style={{ marginTop: '12px', padding: '8px 16px', background: '#eef2ff', borderRadius: '6px', display: 'inline-block' }}>
                                        <span style={{ fontSize: '14px', color: '#4338ca', fontWeight: '600' }}>Band Score: {adminScoreResult.band}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280', justifyContent: 'center', marginBottom: '16px' }}>
                                    <span>Answered: {adminScoreResult.answered}/{adminScoreResult.total}</span>
                                    <span>•</span>
                                    <span>Unanswered: {adminScoreResult.total - adminScoreResult.answered}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setAdminScoreResult(null)}
                                        style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer', background: 'white' }}>
                                        Continue Reviewing
                                    </button>
                                    <button onClick={() => window.close()}
                                        style={{ flex: 1, padding: '10px', background: '#4f46e5', color: 'white', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none' }}>
                                        Close Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ══════════════════════════════════════
                    OPTIONS MENU — Inspera Style
                ══════════════════════════════════════ */}
                {
                    showOptionsMenu && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, paddingTop: '60px' }}>
                            <div style={{ background: 'white', maxWidth: '520px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', borderRadius: '4px', overflow: 'hidden' }}>

                                {/* ── MAIN OPTIONS VIEW ── */}
                                {optionsView === 'main' && (
                                    <div>
                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <div></div>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', fontFamily: 'Arial, sans-serif', margin: 0 }}>Options</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#000', padding: '4px' }}>✕</button>
                                        </div>

                                        {/* Go to submission page */}
                                        <div style={{ padding: '0 24px 20px' }}>
                                            <button onClick={() => { setShowOptionsMenu(false); setShowSubmitModal(true); }}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '16px 20px', background: '#e41e2b', color: 'white', border: 'none',
                                                    borderRadius: '6px', fontSize: '16px', fontWeight: '500', cursor: 'pointer',
                                                    fontFamily: 'Arial, sans-serif'
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                                    <span>Go to submission page</span>
                                                </div>
                                                <span style={{ fontSize: '20px' }}>›</span>
                                            </button>
                                        </div>

                                        {/* Contrast option */}
                                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 24px' }}></div>
                                        <button onClick={() => setOptionsView('contrast')}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
                                                fontFamily: 'Arial, sans-serif'
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#666"><circle cx="12" cy="12" r="10" fill="none" stroke="#666" strokeWidth="2" /><path d="M12 2a10 10 0 0 1 0 20z" fill="#666" /></svg>
                                                <span style={{ fontSize: '16px', color: '#000' }}>Contrast</span>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#666' }}>›</span>
                                        </button>

                                        {/* Text size option */}
                                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 24px' }}></div>
                                        <button onClick={() => setOptionsView('textsize')}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
                                                fontFamily: 'Arial, sans-serif'
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#666"><circle cx="11" cy="11" r="7" fill="none" stroke="#666" strokeWidth="2" /><line x1="16" y1="16" x2="21" y2="21" stroke="#666" strokeWidth="2" /><text x="8" y="14" fontSize="10" fill="#666" fontWeight="bold">A</text></svg>
                                                <span style={{ fontSize: '16px', color: '#000' }}>Text size</span>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#666' }}>›</span>
                                        </button>
                                        <div style={{ height: '16px' }}></div>
                                    </div>
                                )}

                                {/* ── CONTRAST SUB-PANEL ── */}
                                {optionsView === 'contrast' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <button onClick={() => setOptionsView('main')} style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', color: '#000' }}>Options</button>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', fontFamily: 'Arial, sans-serif', margin: 0 }}>Contrast</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#000', padding: '4px' }}>✕</button>
                                        </div>
                                        <div style={{ margin: '8px 24px 24px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                            {[
                                                { key: 'black-on-white', label: 'Black on white' },
                                                { key: 'white-on-black', label: 'White on black' },
                                                { key: 'yellow-on-black', label: 'Yellow on black' }
                                            ].map((opt, idx) => (
                                                <button key={opt.key}
                                                    onClick={() => setContrastMode(opt.key)}
                                                    style={{
                                                        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                                                        padding: '16px 20px', background: 'none', border: 'none',
                                                        borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none',
                                                        cursor: 'pointer', fontFamily: 'Arial, sans-serif'
                                                    }}>
                                                    {contrastMode === opt.key ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#333"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                                                    ) : (
                                                        <span style={{ width: '20px' }}></span>
                                                    )}
                                                    <span style={{ fontSize: '16px', color: '#000' }}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── TEXT SIZE SUB-PANEL ── */}
                                {optionsView === 'textsize' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' }}>
                                            <button onClick={() => setOptionsView('main')} style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', color: '#000' }}>Options</button>
                                            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#000', fontFamily: 'Arial, sans-serif', margin: 0 }}>Text size</h2>
                                            <button onClick={() => setShowOptionsMenu(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#000', padding: '4px' }}>✕</button>
                                        </div>
                                        <div style={{ margin: '8px 24px 24px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                                            {[
                                                { key: 'regular', label: 'Regular' },
                                                { key: 'large', label: 'Large' },
                                                { key: 'extra-large', label: 'Extra large' }
                                            ].map((opt, idx) => (
                                                <button key={opt.key}
                                                    onClick={() => setTextSizeMode(opt.key)}
                                                    style={{
                                                        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                                                        padding: '16px 20px', background: 'none', border: 'none',
                                                        borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none',
                                                        cursor: 'pointer', fontFamily: 'Arial, sans-serif'
                                                    }}>
                                                    {textSizeMode === opt.key ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#333"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                                                    ) : (
                                                        <span style={{ width: '20px' }}></span>
                                                    )}
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
        </div >
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteCompletionRow — IELTS Integrated Box Style
// ─────────────────────────────────────────────────────────────────────────────
function NoteCompletionRow({ q, answers, handleAnswer, textColor = '#000', isFocused = false }) {
    const rawText = q.questionText || '';

    // If text starts with ~ then suppress bullets (used for plain sentences like dentistry history)
    const noBullet = rawText.startsWith('~');
    const displayText = noBullet ? rawText.slice(1).trimStart() : rawText;

    // Handle header rows (e.g. "**Dining table**")
    const isHeader = displayText.startsWith('**') && displayText.endsWith('**');
    if (isHeader) {
        return (
            <div style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginTop: '18px',
                marginBottom: '8px',
                color: textColor,
                fontFamily: 'Arial, sans-serif'
            }}>
                {displayText.replace(/\*\*/g, '')}
            </div>
        );
    }

    // Normalize: replace {blank} with ________
    const normalizedText = displayText.replace(/\{blank\}/g, '________');
    const cleanedText = normalizedText.replace(/\[\d+\]/g, '').trim();

    // Single box input — number shows centered when empty, answer replaces it
    const answerValue = answers[q.displayNumber] || '';
    const InlineInput = (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            verticalAlign: 'middle',
            margin: '0 6px',
            position: 'relative',
            border: isFocused ? '2px solid #2563eb' : `1.5px solid ${textColor}`,
            background: 'transparent',
            width: '190px',
            height: '32px',
            borderRadius: '4px'
        }}>
            {/* Question number — centered, visible only when input is empty */}
            {!answerValue && (
                <span style={{
                    position: 'absolute',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    color: textColor,
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>{q.displayNumber}</span>
            )}
            <input
                type="text"
                value={answerValue}
                onChange={e => handleAnswer(q.displayNumber, e.target.value)}
                autoComplete="off"
                style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'transparent',
                    color: textColor,
                    padding: '0 8px',
                    textAlign: 'center',
                    fontFamily: 'Arial, sans-serif'
                }}
            />
        </span>
    );

    const blankPattern = /_{3,}/;
    const parts = cleanedText.split(blankPattern);

    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1px',
        fontSize: '15.5px',
        color: textColor,
        lineHeight: '1.5',
        fontFamily: 'Arial, sans-serif',
        paddingLeft: '15px'
    };

    if (parts.length >= 2) {
        return (
            <div id={`q-${q.displayNumber}`} style={rowStyle}>
                {!noBullet && <span style={{ color: textColor, fontSize: '18px', marginRight: '10px' }}>•</span>}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ verticalAlign: 'middle' }}>{parts[0]}</span>
                    {InlineInput}
                    <span style={{ verticalAlign: 'middle' }}>{parts[1]}</span>
                </div>
            </div>
        );
    }

    return (
        <div id={`q-${q.displayNumber}`} style={rowStyle}>
            {!noBullet && <span style={{ color: textColor, fontSize: '18px', marginRight: '10px' }}>•</span>}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ verticalAlign: 'middle' }}>{cleanedText}</span>
                {InlineInput}
            </div>
        </div>
    );
}

// ═══ Suspense wrapper for useSearchParams ═══
export default function ListeningExamPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-gray-500" />
            </div>
        }>
            <ListeningExamPageContent />
        </Suspense>
    );
}
