"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaPlay,
    FaClock,
    FaQuestionCircle,
    FaArrowRight,
    FaLayerGroup,
    FaSpinner,
    FaUser,
    FaCheckCircle,
    FaLock,
    FaVideo,
    FaTimes,
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";
import { prefetchModule } from "@/lib/examPrefetch";
import Logo from "@/components/Logo";
import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";
import { useSiteContent, getVideoSrc, isYouTube } from "@/hooks/useSiteContent";

export default function ExamSelectionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.examId;

    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [completedModules, setCompletedModules] = useState([]);
    const [moduleScores, setModuleScores] = useState(null);
    const [showDemoVideo, setShowDemoVideo] = useState(false);
    const [showModuleVideo, setShowModuleVideo] = useState(null); // { moduleId, setNumber }
    // Shown immediately when the user clicks Skip/Continue, so the 0-100%
    // progress bar appears before the new exam route's chunk finishes loading.
    const [navigatingTo, setNavigatingTo] = useState(null); // { label, subLabel } | null

    // Dynamic videos (managed from Admin > Design > Videos)
    // NOTE: All hooks MUST be called before any early returns to satisfy React Rules of Hooks
    const VIDEO_KEYS = [
        "video.exam_intro",
        "video.listening_intro",
        "video.reading_intro",
        "video.writing_intro",
    ];
    const VIDEO_DEFAULTS = {
        "video.exam_intro": { videoSource: "local", videoUrl: "/video/IELTS on computer - Quick Guide.mp4" },
        "video.listening_intro": { videoSource: "local", videoUrl: "/video/listeining test instruction.mp4" },
        "video.reading_intro": { videoSource: "local", videoUrl: "/video/reading instruction.mp4" },
        "video.writing_intro": { videoSource: "local", videoUrl: "/video/writing instruction.mp4" },
    };
    const { data: dynamicVideos } = useSiteContent(VIDEO_KEYS, VIDEO_DEFAULTS);

    useEffect(() => {
        const loadSessionAndVerify = async () => {
            const storedSession = localStorage.getItem("examSession");
            if (!storedSession) {
                setError("No exam session found. Please start from the exam entry page.");
                setIsLoading(false);
                return;
            }

            try {
                const parsed = JSON.parse(storedSession);
                const isValidSession =
                    parsed.sessionId === sessionId ||
                    parsed.examId === sessionId ||
                    (parsed.sessionId && parsed.sessionId.includes(sessionId)) ||
                    (sessionId && sessionId.includes(parsed.examId));

                if (!isValidSession) {
                    setError("Invalid session. Please start again.");
                    setIsLoading(false);
                    return;
                }

                if (!parsed.studentName && parsed.name) {
                    parsed.studentName = parsed.name;
                }

                setSession(parsed);

                try {
                    const verifyResponse = await studentsAPI.verifyExamId(parsed.examId);
                    if (verifyResponse.success && verifyResponse.data) {
                        const dbCompletedModules = verifyResponse.data.completedModules || [];
                        const dbScores = verifyResponse.data.scores || null;

                        if (!verifyResponse.data.valid && dbCompletedModules.length < 3) {
                            setError(verifyResponse.data.message || "Invalid session. Please start again.");
                            setIsLoading(false);
                            return;
                        }

                        setCompletedModules(dbCompletedModules);
                        if (dbScores) setModuleScores(dbScores);

                        parsed.completedModules = dbCompletedModules;
                        parsed.scores = dbScores;
                        localStorage.setItem("examSession", JSON.stringify(parsed));
                    }
                } catch (apiError) {
                    console.error("Failed to verify from database, using localStorage:", apiError);
                    if (parsed.completedModules && Array.isArray(parsed.completedModules)) {
                        setCompletedModules(parsed.completedModules);
                    }
                    if (parsed.scores) {
                        setModuleScores(parsed.scores);
                    }
                }
            } catch (err) {
                setError("Session data corrupted. Please start again.");
            }
            setIsLoading(false);
        };
        loadSessionAndVerify();
    }, [sessionId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-cyan-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/start-exam")}
                        className="bg-cyan-600 text-white px-6 py-2 rounded hover:bg-cyan-700"
                    >
                        Go to Exam Entry
                    </button>
                </div>
            </div>
        );
    }

    // Support multi-set: assignedSets can have arrays (new) or single values (old format)
    const getSetsForModule = (moduleName) => {
        const sets = session?.assignedSets;
        if (!sets) return [];
        const key = `${moduleName}SetNumber`;
        const keysArr = `${moduleName}SetNumbers`;
        // Check for array format first (new multi-set)
        if (sets[keysArr] && Array.isArray(sets[keysArr]) && sets[keysArr].length > 0) {
            return sets[keysArr];
        }
        // Fallback to single value (old format)
        if (sets[key] != null) {
            return [sets[key]];
        }
        return [];
    };

    const examIntroEntry = dynamicVideos["video.exam_intro"];
    const examIntroSrc = getVideoSrc(examIntroEntry, "/video/IELTS on computer - Quick Guide.mp4");
    const examIntroIsYT = isYouTube(examIntroEntry);

    const MODULE_VIDEOS = {
        listening: {
            entry: dynamicVideos["video.listening_intro"],
            src: getVideoSrc(dynamicVideos["video.listening_intro"], "/video/listeining test instruction.mp4"),
            isYT: isYouTube(dynamicVideos["video.listening_intro"]),
            label: "Listening",
        },
        reading: {
            entry: dynamicVideos["video.reading_intro"],
            src: getVideoSrc(dynamicVideos["video.reading_intro"], "/video/reading instruction.mp4"),
            isYT: isYouTube(dynamicVideos["video.reading_intro"]),
            label: "Reading",
        },
        writing: {
            entry: dynamicVideos["video.writing_intro"],
            src: getVideoSrc(dynamicVideos["video.writing_intro"], "/video/writing instruction.mp4"),
            isYT: isYouTube(dynamicVideos["video.writing_intro"]),
            label: "Writing",
        },
    };

    // Exam modules configuration
    const examModules = [
        {
            id: "listening",
            name: "Listening",
            icon: <FaHeadphones />,
            duration: 40,
            questions: 40,
            sections: 4,
            description: "Audio-based comprehension",
            details: "4 recordings",
            color: "cyan",
            sets: getSetsForModule("listening"),
        },
        {
            id: "reading",
            name: "Reading",
            icon: <FaBook />,
            duration: 60,
            questions: 40,
            sections: 3,
            description: "Academic passage analysis",
            details: "3 passages",
            color: "blue",
            sets: getSetsForModule("reading"),
        },
        {
            id: "writing",
            name: "Writing",
            icon: <FaPen />,
            duration: 60,
            questions: 2,
            sections: 2,
            description: "Academic writing tasks",
            details: "Task 1 & 2",
            color: "green",
            sets: getSetsForModule("writing"),
        },
    ];

    const totalTime = examModules.reduce((sum, m) => sum + m.duration, 0);
    const totalQuestions = examModules.reduce((sum, m) => sum + m.questions, 0);



    const handleStartModule = (moduleId, setNumber) => {
        // Kick off background prefetch IMMEDIATELY when the instruction video opens.
        // By the time the user clicks "Skip"/"Continue", the exam data is usually
        // already cached → the module page can render almost instantly.
        // This call is fire-and-forget; it never throws.
        if (setNumber != null) {
            prefetchModule(moduleId, setNumber);
        }

        // Show module-specific instruction video before navigating
        setShowModuleVideo({ moduleId, setNumber });
    };

    const MODULE_LABELS = {
        listening: { label: "Preparing Listening Test", subLabel: "Loading questions and audio..." },
        reading: { label: "Preparing Reading Test", subLabel: "Loading passages and questions..." },
        writing: { label: "Preparing Writing Test", subLabel: "Loading tasks..." },
    };

    const proceedToModule = () => {
        if (!showModuleVideo) return;
        const { moduleId, setNumber } = showModuleVideo;
        // Store which set number to use
        if (setNumber != null) {
            const sessionData = JSON.parse(localStorage.getItem("examSession") || "{}");
            sessionData.currentSetNumber = setNumber;
            sessionData.currentModule = moduleId;
            localStorage.setItem("examSession", JSON.stringify(sessionData));
        }
        setShowModuleVideo(null);
        // Show the 0-100% loading overlay IMMEDIATELY so the user sees feedback
        // before Next.js finishes loading the new route's JS chunk.
        setNavigatingTo(MODULE_LABELS[moduleId] || { label: "Preparing exam...", subLabel: "" });
        router.push(`/exam/${sessionId}/${moduleId}`);
    };

    const handleStartFullExam = () => {
        setShowDemoVideo(true);
    };

    const proceedToFullExam = () => {
        setShowDemoVideo(false);
        setNavigatingTo({ label: "Preparing Full Exam", subLabel: "Loading exam modules..." });
        router.push(`/exam/${sessionId}/full`);
    };

    return (
        <div className="min-h-screen bg-white transition-colors duration-300">
            {/* Immediate transition overlay — shown the moment Skip/Continue
                is clicked, until the new route's loading.jsx (or the page
                itself) takes over. Prevents any blank-screen perception. */}
            {navigatingTo && (
                <ExamLoadingOverlay
                    active={true}
                    done={false}
                    label={navigatingTo.label}
                    subLabel={navigatingTo.subLabel}
                />
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-3 px-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowDemoVideo(true)}
                            className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                        >
                            <FaVideo className="text-xs" /> Exam Instruction
                        </button>
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <FaUser className="text-cyan-600 text-xs" />
                            <span>{session?.studentName || "Student"}</span>
                        </div>
                        <div className="text-gray-500 text-xs bg-gray-100 px-3 py-1.5 rounded font-mono">
                            {session?.examId}
                        </div>
                    </div>
                </div>
            </header>

            {/* Demo Video Modal */}
            {showDemoVideo && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <FaVideo className="text-red-500" />
                                <h3 className="font-semibold text-gray-800 text-sm">Exam Instruction — How It Works</h3>
                            </div>
                            <button
                                onClick={() => setShowDemoVideo(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                            {examIntroIsYT ? (
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src={examIntroSrc}
                                    title="Exam Instruction"
                                    frameBorder="0"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    className="absolute inset-0 w-full h-full"
                                    src={examIntroSrc}
                                    controls
                                    autoPlay
                                    playsInline
                                />
                            )}
                        </div>
                        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                            <p className="text-gray-500 text-xs">Watch this video to understand how the exam works</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDemoVideo(false)}
                                    className="px-4 py-1.5 bg-white text-gray-700 border border-gray-300 text-xs font-medium rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={proceedToFullExam}
                                    className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    Start Full Exam <FaArrowRight className="text-[10px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Module-specific Instruction Video Modal */}
            {showModuleVideo && (() => {
                const videoInfo = MODULE_VIDEOS[showModuleVideo.moduleId];
                return (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <FaVideo className="text-red-500" />
                                    <h3 className="font-semibold text-gray-800 text-sm">{videoInfo.label} Instruction</h3>
                                </div>
                                <button
                                    onClick={() => setShowModuleVideo(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                                {videoInfo.isYT ? (
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={videoInfo.src}
                                        title={`${videoInfo.label} Instruction`}
                                        frameBorder="0"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        className="absolute inset-0 w-full h-full"
                                        src={videoInfo.src}
                                        controls
                                        autoPlay
                                        playsInline
                                    />
                                )}
                            </div>
                            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                                <p className="text-gray-500 text-xs">Watch the {videoInfo.label.toLowerCase()} instruction before starting</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={proceedToModule}
                                        className="px-4 py-1.5 bg-white text-gray-700 border border-gray-300 text-xs font-medium rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={proceedToModule}
                                        className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        Continue <FaArrowRight className="text-[10px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="max-w-4xl mx-auto px-4 py-8">
                {(() => {
                    // Calculate total expected exams (multi-set aware)
                    const totalExpected = examModules.reduce((sum, m) => sum + Math.max(m.sets.length, 1), 0);
                    const allDone = completedModules.length >= totalExpected;
                    return allDone;
                })() ? (
                    /* ═══ All Done ═══ */
                    <div className="max-w-xl mx-auto text-center py-8 px-6 bg-white rounded-md border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-2xl" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h1>
                        <h2 className="text-sm font-medium text-green-600 mb-4">Examination Completed Successfully</h2>

                        <p className="text-gray-600 text-sm mb-4">
                            Thank you, <span className="font-semibold text-gray-800">{session?.studentName}</span>!
                            You have finished all modules.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5 text-left text-sm">
                            <p className="text-gray-800 font-semibold mb-2 text-xs uppercase tracking-tight">SUBMISSION CONFIRMED</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <FaUser className="text-xs text-cyan-600" />
                                    Login with Exam ID & Password for results
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <FaQuestionCircle className="text-xs text-green-600" />
                                    Contact support team for assistance
                                </div>
                            </div>
                            <p className="text-amber-600 text-[10px] border-t border-gray-200 pt-2 mt-3 italic">
                                * Writing results available in 24-48 hours.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem("examSession");
                                    localStorage.removeItem("systemCheckDone");
                                    router.push("/");
                                }}
                                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black flex items-center gap-2 cursor-pointer"
                            >
                                Go to Home <FaArrowRight className="text-xs" />
                            </button>
                            <button
                                onClick={() => router.push("/login")}
                                className="px-5 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer"
                            >
                                Student Login
                            </button>
                        </div>

                        <p className="mt-5 text-gray-400 text-[10px] uppercase tracking-widest font-mono">
                            ID: {session?.examId}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">IELTS Academic Test</h1>
                            <p className="text-gray-500 text-sm">
                                Welcome, {session?.studentName}! Select a module to begin.
                            </p>
                        </div>

                        {/* Stats Row — compact */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-cyan-600">{totalQuestions}</p>
                                <p className="text-gray-500 text-[10px]">Questions</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-amber-500">{totalTime}</p>
                                <p className="text-gray-500 text-[10px]">Minutes</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                                <p className="text-lg font-bold text-green-600">9.0</p>
                                <p className="text-gray-500 text-[10px]">Max Band</p>
                            </div>
                        </div>

                        {/* ═══ Full Set Grouped Sections ═══ */}
                        {(() => {
                            const assignedSets = session?.assignedSets || {};
                            const colorMap = {
                                listening: { bg: 'bg-cyan-100', text: 'text-cyan-600', btn: 'bg-red-600 hover:bg-red-700', icon: <FaHeadphones /> },
                                reading: { bg: 'bg-blue-100', text: 'text-blue-600', btn: 'bg-red-600 hover:bg-red-700', icon: <FaBook /> },
                                writing: { bg: 'bg-emerald-100', text: 'text-emerald-600', btn: 'bg-red-600 hover:bg-red-700', icon: <FaPen /> },
                            };
                            const moduleInfo = {
                                listening: { name: 'Listening', duration: 40, questions: 40, details: '4 recordings' },
                                reading: { name: 'Reading', duration: 60, questions: 40, details: '3 passages' },
                                writing: { name: 'Writing', duration: 60, questions: 2, details: 'Task 1 & 2' },
                            };

                            // Build Full Sets
                            const fullSets = assignedSets.fullSets && assignedSets.fullSets.length > 0
                                ? assignedSets.fullSets
                                : (assignedSets.listeningSetNumber || assignedSets.readingSetNumber || assignedSets.writingSetNumber)
                                    ? [{
                                        label: "Full Set 1",
                                        listeningSetNumber: assignedSets.listeningSetNumber,
                                        readingSetNumber: assignedSets.readingSetNumber,
                                        writingSetNumber: assignedSets.writingSetNumber,
                                    }]
                                    : [];
                            const extraSets = assignedSets.extraSets || [];

                            // Helper: is module:set completed
                            const isSetDone = (moduleId, setNum) => {
                                return completedModules.includes(`${moduleId}:${setNum}`) ||
                                    completedModules.includes(moduleId) ||
                                    completedModules.includes(moduleId.toUpperCase());
                            };

                            // Check if entire Full Set is complete
                            const isFullSetDone = (fs) => {
                                const lDone = !fs.listeningSetNumber || isSetDone('listening', fs.listeningSetNumber);
                                const rDone = !fs.readingSetNumber || isSetDone('reading', fs.readingSetNumber);
                                const wDone = !fs.writingSetNumber || isSetDone('writing', fs.writingSetNumber);
                                return lDone && rDone && wDone;
                            };

                            // Render a single module card
                            const renderCard = (moduleId, setNum) => {
                                const c = colorMap[moduleId];
                                const info = moduleInfo[moduleId];
                                if (!c || !info) return null;
                                const completed = isSetDone(moduleId, setNum);

                                return (
                                    <div key={`${moduleId}-${setNum}`}
                                        className={`bg-white border rounded-xl p-4 transition-all ${completed
                                            ? "border-green-200 bg-green-50/50" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}`}>
                                        {completed && (
                                            <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium w-fit mb-2 ml-auto">
                                                <FaCheckCircle className="text-[8px]" /> Done
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 ${completed ? 'bg-green-100 text-green-600' : `${c.bg} ${c.text}`} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                                                {completed ? <FaCheckCircle /> : c.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-gray-800 leading-tight">{info.name}</h3>
                                                <p className="text-gray-400 text-xs">{info.details}</p>
                                            </div>
                                        </div>
                                        {!completed && (
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                                <span className="flex items-center gap-1"><FaClock className="text-gray-400" /> {info.duration} min</span>
                                                <span className="flex items-center gap-1"><FaQuestionCircle className="text-gray-400" /> {info.questions}Q</span>
                                            </div>
                                        )}
                                        {completed ? (
                                            <div className="w-full flex items-center justify-center gap-1.5 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-medium">
                                                <FaLock className="text-[9px]" /> Completed
                                            </div>
                                        ) : (
                                            <button onClick={() => handleStartModule(moduleId, setNum)}
                                                className={`w-full flex items-center justify-center gap-2 ${c.btn} text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer group`}>
                                                <FaPlay className="text-[9px] group-hover:scale-110 transition-transform" />
                                                Start {info.name}
                                                <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                );
                            };

                            // Find first incomplete module in a Full Set for "Start Full Set"
                            const getNextModule = (fs) => {
                                if (fs.listeningSetNumber && !isSetDone('listening', fs.listeningSetNumber)) return { id: 'listening', set: fs.listeningSetNumber };
                                if (fs.readingSetNumber && !isSetDone('reading', fs.readingSetNumber)) return { id: 'reading', set: fs.readingSetNumber };
                                if (fs.writingSetNumber && !isSetDone('writing', fs.writingSetNumber)) return { id: 'writing', set: fs.writingSetNumber };
                                return null;
                            };

                            return (
                                <div className="space-y-10">
                                    {fullSets.map((fs, idx) => {
                                        const fsDone = isFullSetDone(fs);
                                        const nextMod = getNextModule(fs);

                                        return (
                                            <div key={idx}>
                                                {/* Full Set Header */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${fsDone ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <h2 className="text-sm font-bold text-gray-800">{fs.label || `Full Set ${idx + 1}`}</h2>
                                                    {fsDone && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold flex items-center gap-1">
                                                            <FaCheckCircle className="text-[8px]" /> All Done
                                                        </span>
                                                    )}
                                                    <div className="h-px flex-1 bg-gray-200"></div>
                                                </div>

                                                {/* Start Full Set Banner */}
                                                {!fsDone && nextMod && (
                                                    <div
                                                        className="bg-red-50 border-2 border-red-200 rounded-lg p-3.5 mb-3 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white">
                                                                    <FaLayerGroup />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-sm font-bold text-gray-800">Start Full Set Exam</h3>
                                                                    <p className="text-gray-500 text-[11px]">Listening → Reading → Writing</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleStartModule(nextMod.id, nextMod.set)} className="flex items-center gap-1.5 bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer">
                                                                <FaPlay className="text-[9px]" /> Start <FaArrowRight className="text-[9px]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Module Cards for this Full Set */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {fs.listeningSetNumber && renderCard('listening', fs.listeningSetNumber)}
                                                    {fs.readingSetNumber && renderCard('reading', fs.readingSetNumber)}
                                                    {fs.writingSetNumber && renderCard('writing', fs.writingSetNumber)}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Extra Individual Parts */}
                                    {extraSets.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                                                <h2 className="text-sm font-bold text-gray-800">Extra Exams</h2>
                                                <div className="h-px flex-1 bg-gray-200"></div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {extraSets.map((es, idx) => renderCard(es.module, es.setNumber))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            <footer className="bg-white border-t border-gray-200 py-3 px-4 mt-auto">
                <div className="max-w-4xl mx-auto text-center text-gray-400 text-xs">
                    © 2024 BAC IELTS ACADEMY • OFFICIAL EXAMINATION PORTAL
                </div>
            </footer>
        </div>
    );
}
