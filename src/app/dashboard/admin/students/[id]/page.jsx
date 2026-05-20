"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaUser,
    FaArrowLeft,
    FaEye,
    FaEdit,
    FaTimes,
    FaSpinner,
    FaSave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaCheckCircle,
    FaExclamationTriangle,
    FaGlobe,
    FaClipboardCheck,
    FaUnlock,
    FaLock,
    FaStar,
    FaAward,
    FaRedo,
    FaVideo
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

// ==================== COMPONENTS ====================

// Band Score Display Component
const BandScoreCircle = ({ score, size = "normal", label }) => {
    const sizeClasses = {
        small: "w-12 h-12 text-lg",
        normal: "w-16 h-16 text-2xl",
        large: "w-24 h-24 text-4xl"
    };

    const getBandColor = (band) => {
        if (band >= 8) return "bg-emerald-600";
        if (band >= 7) return "bg-indigo-600";
        if (band >= 6) return "bg-blue-600";
        if (band >= 5) return "bg-amber-600";
        return "bg-slate-500";
    };

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`${sizeClasses[size]} rounded-md ${getBandColor(score)} flex items-center justify-center text-white font-bold`}>
                {score || "-"}
            </div>
            {label && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>}
        </div>
    );
};

// Module Score Card Component
const ModuleScoreCard = ({
    icon: Icon,
    title,
    band,
    subInfo,
    color,
    isCompleted,
    onView,
    onEdit,
    onReset,
    resetting
}) => {
    const colorClasses = {
        blue: "bg-blue-50 border-blue-100 hover:border-blue-200",
        green: "bg-emerald-50 border-emerald-100 hover:border-emerald-200",
        purple: "bg-violet-50 border-violet-100 hover:border-violet-200",
        orange: "bg-orange-50 border-orange-100 hover:border-orange-200",
    };

    const iconColorClasses = {
        blue: "bg-blue-500 text-white",
        green: "bg-emerald-500 text-white",
        purple: "bg-violet-500 text-white",
        orange: "bg-orange-500 text-white",
    };

    return (
        <div className={`relative p-5 rounded-md border ${colorClasses[color]} transition-all`}>
            {isCompleted && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-white text-[10px]" />
                </div>
            )}

            <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-md ${iconColorClasses[color]} flex items-center justify-center`}>
                    <Icon className="text-base" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subInfo}</p>
                </div>
                <BandScoreCircle score={band} size="small" />
            </div>

            <div className="flex gap-2">
                <button onClick={onView} className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer">
                    <FaEye className="text-slate-400 text-xs" /> View
                </button>
                <button onClick={onEdit} className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition-all cursor-pointer">
                    <FaEdit className="text-xs" /> Edit
                </button>
                {isCompleted && (
                    <button onClick={onReset} disabled={resetting} className="h-9 px-3 flex items-center justify-center bg-rose-500 text-white rounded-md text-sm font-medium hover:bg-rose-600 transition-all disabled:opacity-50 cursor-pointer" title="Reset module">
                        {resetting ? <FaSpinner className="animate-spin text-xs" /> : <FaRedo className="text-xs" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// View Answers Modal Component
const ViewAnswersModal = ({ show, onClose, module, answers, loading, scores, allSetsData }) => {
    const [activeSetTab, setActiveSetTab] = useState('latest');

    if (!show) return null;

    // Determine which answers to show based on active tab
    const getDisplayAnswers = () => {
        if (activeSetTab === 'latest' || !allSetsData) return answers;
        const setData = allSetsData[activeSetTab];
        return setData?.answers || answers;
    };

    const displayAnswers = getDisplayAnswers();

    const getProcessedAnswers = (answerData) => {
        if (!answerData || !Array.isArray(answerData)) return { processed: [], stats: { correct: 0, incorrect: 0, total: 0 } };
        const uniqueMap = new Map();
        answerData.forEach(ans => {
            if (ans && ans.questionNumber && !uniqueMap.has(ans.questionNumber)) {
                uniqueMap.set(ans.questionNumber, ans);
            }
        });
        const processed = Array.from(uniqueMap.values()).sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
        const correct = processed.filter(a => a.isCorrect).length;
        const incorrect = processed.filter(a => !a.isCorrect).length;
        return { processed, stats: { correct, incorrect, total: processed.length } };
    };

    const { processed: processedAnswers, stats } = getProcessedAnswers(displayAnswers);

    // Get set tabs if multi-set data exists
    const setTabs = allSetsData ? Object.keys(allSetsData).sort() : [];
    const hasMultipleSets = setTabs.length > 0;

    const countWords = (text) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md w-full max-w-3xl overflow-hidden shadow-md border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-800 text-white flex items-center justify-center">
                            {module?.toLowerCase() === 'listening' ? <FaHeadphones /> :
                                module?.toLowerCase() === 'reading' ? <FaBook /> :
                                    module?.toLowerCase() === 'speaking' ? <FaMicrophone /> :
                                        <FaPen />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{module} Review</h3>
                            <p className="text-slate-500 text-xs">Student submission history</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                        <FaTimes className="text-slate-400" />
                    </button>
                </div>

                {/* Multi-Set Tabs */}
                {hasMultipleSets && !loading && (
                    <div className="px-6 py-2 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveSetTab('latest')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${activeSetTab === 'latest' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Latest
                        </button>
                        {setTabs.map((key, idx) => {
                            const setData = allSetsData[key];
                            const setScore = setData?.scores;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveSetTab(key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${activeSetTab === key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Exam {idx + 1}
                                    {setScore?.band != null && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeSetTab === key ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {setScore.band}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Stats Bar for Listening/Reading */}
                {module?.toLowerCase() !== 'writing' && module?.toLowerCase() !== 'speaking' && !loading && answers?.length > 0 && (
                    <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Correct:</span>
                            <span className="text-sm font-bold text-emerald-600">{stats.correct}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Incorrect:</span>
                            <span className="text-sm font-bold text-rose-600">{stats.incorrect}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Total:</span>
                            <span className="text-sm font-bold text-slate-700">{stats.total}</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-16 text-center">
                            <FaSpinner className="animate-spin text-slate-400 text-3xl mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Loading answers...</p>
                        </div>
                    ) : module?.toLowerCase() === 'speaking' ? (
                        /* Speaking Module - Show Speaking Questions */
                        <div className="space-y-6">
                            {/* Recordings Section */}
                            {answers?.recordings && answers.recordings.length > 0 && (
                                <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <FaVideo className="text-indigo-500" />
                                        Recorded Video Responses
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {answers.recordings.map((rec, idx) => (
                                            <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                                    <p className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">{rec.questionLabel || `Recording ${idx + 1}`}</p>
                                                    <p className="text-sm text-slate-800 font-medium line-clamp-1">{rec.questionText}</p>
                                                </div>
                                                <div className="aspect-video bg-black flex items-center justify-center">
                                                    <video
                                                        src={rec.videoUrl}
                                                        controls
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                {rec.duration && (
                                                    <div className="p-2 text-right">
                                                        <span className="text-[10px] font-bold text-slate-400">Duration: {Math.round(rec.duration)}s</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Part 1 */}
                            {answers?.part1 && (
                                <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                                        Part 1 — Introduction & Interview
                                    </h4>
                                    {answers.part1.topics?.map((topic, tIdx) => (
                                        <div key={tIdx} className="mb-4">
                                            <p className="font-semibold text-orange-700 mb-2">{topic.topicName || topic.topic}</p>
                                            <ul className="space-y-1">
                                                {topic.questions?.map((q, qIdx) => (
                                                    <li key={qIdx} className="text-slate-700 text-sm pl-4 border-l-2 border-orange-200 py-1">
                                                        {typeof q === 'string' ? q : q.question || q.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Part 2 */}
                            {answers?.part2 && (
                                <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                                        Part 2 — Cue Card
                                    </h4>
                                    <p className="font-semibold text-amber-800 mb-2">{answers.part2.topic}</p>
                                    {answers.part2.cueCard && <p className="text-slate-600 mb-3">{answers.part2.cueCard}</p>}
                                    {answers.part2.bulletPoints && (
                                        <ul className="space-y-1 mb-3">
                                            {answers.part2.bulletPoints.map((bp, idx) => (
                                                <li key={idx} className="text-slate-700 text-sm flex gap-2"><span className="text-amber-500">•</span>{typeof bp === 'string' ? bp : bp.text}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {answers.part2.followUpQuestion && (
                                        <p className="text-slate-600 italic text-sm border-t border-amber-200 pt-2 mt-2">{answers.part2.followUpQuestion}</p>
                                    )}
                                </div>
                            )}
                            {/* Part 3 */}
                            {answers?.part3 && (
                                <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                                        Part 3 — Discussion
                                    </h4>
                                    {answers.part3.topic && <p className="font-semibold text-yellow-800 mb-3">{answers.part3.topic}</p>}
                                    <ul className="space-y-2">
                                        {answers.part3.questions?.map((q, idx) => (
                                            <li key={idx} className="text-slate-700 text-sm pl-4 border-l-2 border-yellow-300 py-1">
                                                {typeof q === 'string' ? q : q.question || q.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {!answers?.part1 && !answers?.part2 && !answers?.part3 && (!answers?.recordings || answers.recordings.length === 0) && (
                                <div className="py-16 text-center">
                                    <FaExclamationTriangle className="text-amber-400 text-5xl mx-auto mb-4" />
                                    <h4 className="text-slate-700 font-bold text-lg mb-2">No Answers Found</h4>
                                    <p className="text-slate-500">This student hasn't completed the Speaking module yet.</p>
                                </div>
                            )}
                        </div>
                    ) : module?.toLowerCase() === 'writing' ? (
                        /* Writing Module - Show Task 1 and Task 2 essays with Questions */
                        <div className="space-y-8">
                            {/* Task 1 */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-md p-5 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">1</span>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Writing Task 1 - Question</h4>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Academic/GT Task 1 Prompt</span>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-100 mb-4 prose prose-slate max-w-none">
                                        <div className="font-semibold text-slate-800 mb-3 text-lg leading-relaxed">
                                            {answers?.questions?.task1?.prompt || "Standard Task 1 Prompt"}
                                        </div>
                                        <div className="text-slate-600 text-[15px] italic border-l-4 border-violet-200 pl-4 py-1">
                                            {answers?.questions?.task1?.instructions || "Summarize the information by selecting and reporting the main features..."}
                                        </div>
                                    </div>

                                    {/* Question Images */}
                                    {answers?.questions?.task1?.images?.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {answers?.questions?.task1.images.map((img, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <img
                                                        src={img.url}
                                                        alt={img.description || `Task 1 Image ${idx + 1}`}
                                                        className="w-full h-auto object-contain rounded-lg"
                                                        style={{ maxHeight: '600px' }}
                                                    />
                                                    {img.description && <p className="text-center text-xs text-slate-500 mt-2 font-medium">{img.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Student Answer */}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                                                Student's Response
                                            </h5>
                                            <span className="bg-white px-3 py-1 rounded-full border border-violet-200 text-violet-700 font-bold text-sm">
                                                {countWords(answers?.task1)} words
                                            </span>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border-2 border-slate-100 text-slate-800 whitespace-pre-wrap font-serif leading-relaxed text-[17px] min-h-[200px] shadow-inner">
                                            {answers?.task1 || <span className="text-slate-400 italic">No submission for Task 1</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Task 2 */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-md p-5 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">2</span>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Writing Task 2 - Question</h4>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Essay Writing Prompt</span>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="bg-slate-50 p-5 rounded-md border border-slate-200 mb-5">
                                        <p className="text-slate-800 font-semibold leading-relaxed">
                                            {answers?.questions?.task2?.prompt || "Standard Task 2 Prompt"}
                                        </p>
                                    </div>

                                    {/* Student Answer */}
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Response</span>
                                            <span className="text-xs font-bold text-indigo-600">{countWords(answers?.task2)} words</span>
                                        </div>
                                        <div className="bg-white p-6 rounded-md border border-slate-200 text-slate-800 whitespace-pre-wrap font-serif leading-relaxed text-[16px] min-h-[300px]">
                                            {answers?.task2 || <span className="text-slate-400 italic">No submission for Task 2</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Listening/Reading Module - Show Q&A table */
                        <div className="space-y-2">
                            {processedAnswers?.length > 0 ? processedAnswers.map((ans, i) => (
                                <div
                                    key={ans.questionNumber || i}
                                    className="p-4 rounded-md border border-slate-200 bg-white"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${ans.isCorrect ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                                            {ans.questionNumber || i + 1}
                                        </span>
                                        <p className="text-slate-700 text-sm flex-1 pt-1.5">
                                            {ans.questionText || `Question ${ans.questionNumber || i + 1}`}
                                        </p>
                                        <div className="pt-1.5 flex-shrink-0">
                                            {ans.isCorrect ? <FaCheckCircle className="text-emerald-500" /> : <FaTimes className="text-rose-500" />}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pl-11">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Student's Answer</span>
                                            <div className={`px-3 py-1.5 rounded-md font-medium text-sm border ${ans.isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                {ans.studentAnswerFull || ans.studentAnswer || <span className="italic opacity-60">(No answer)</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Correct Answer</span>
                                            <div className="px-3 py-1.5 rounded-md font-medium text-sm bg-slate-50 text-slate-700 border border-slate-200">
                                                {ans.correctAnswer || <span className="italic opacity-60">—</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center">
                                    <FaExclamationTriangle className="text-amber-400 text-4xl mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">No answers found for {module}.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 h-9 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Comprehensive Score Edit Modal
const ScoreEditModal = ({ show, onClose, student, onSave, saving, editModule, editSetNumber }) => {
    const [scores, setScores] = useState({
        listening: { band: 0, correctAnswers: 0 },
        reading: { band: 0, correctAnswers: 0 },
        writing: { task1Band: 0, task2Band: 0, overallBand: 0 },
        speaking: { band: 0 },
        adminRemarks: ""
    });

    useEffect(() => {
        if (student?.scores) {
            const sc = student.scores;
            // If editing a specific set, try to use per-set score
            const setKey = editModule && editSetNumber ? `${editModule}_${editSetNumber}` : null;
            const perSetScore = setKey ? (sc[setKey] || null) : null;

            setScores({
                listening: {
                    band: (editModule === 'listening' && perSetScore) ? (perSetScore.band || 0) : (sc.listening?.band || 0),
                    correctAnswers: (editModule === 'listening' && perSetScore) ? (perSetScore.correctAnswers || 0) : (sc.listening?.correctAnswers || 0)
                },
                reading: {
                    band: (editModule === 'reading' && perSetScore) ? (perSetScore.band || 0) : (sc.reading?.band || 0),
                    correctAnswers: (editModule === 'reading' && perSetScore) ? (perSetScore.correctAnswers || 0) : (sc.reading?.correctAnswers || 0)
                },
                writing: {
                    task1Band: (editModule === 'writing' && perSetScore) ? (perSetScore.task1Band || 0) : (sc.writing?.task1Band || 0),
                    task2Band: (editModule === 'writing' && perSetScore) ? (perSetScore.task2Band || 0) : (sc.writing?.task2Band || 0),
                    overallBand: (editModule === 'writing' && perSetScore) ? (perSetScore.overallBand || 0) : (sc.writing?.overallBand || 0)
                },
                speaking: {
                    band: sc.speaking?.band || 0
                },
                adminRemarks: student.adminRemarks || ""
            });
        }
    }, [student, editModule, editSetNumber]);

    // Calculate overall band
    const calculateOverall = () => {
        // Filter out Speaking if it's 0 or not yet provided, to calculate average of 3 modules
        const bands = [scores.listening.band, scores.reading.band, scores.writing.overallBand].filter(b => b > 0);
        if (bands.length === 0) return 0;
        const sum = bands.reduce((a, b) => a + b, 0);
        return Math.round((sum / bands.length) * 2) / 2;
    };

    const handleSave = () => {
        onSave(scores, editSetNumber || null);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md w-full max-w-3xl overflow-hidden shadow-md border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                            <FaAward className="text-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">
                                {editModule
                                    ? `Edit ${editModule.charAt(0).toUpperCase() + editModule.slice(1)}${editSetNumber ? ` — Set #${editSetNumber}` : ''}`
                                    : 'Edit All Exam Scores'
                                }
                            </h3>
                            <p className="text-slate-500 text-xs">{student?.nameEnglish} • {student?.examId}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                        <FaTimes className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {/* Overall Band Preview */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 flex items-center justify-between">
                        <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                {editModule ? `Editing ${editModule.charAt(0).toUpperCase() + editModule.slice(1)}` : 'Calculated Overall Band'}
                            </span>
                            <p className="text-slate-500 text-xs mt-0.5 font-medium">Auto-derived Score</p>
                        </div>
                        <div className="w-16 h-16 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
                            {calculateOverall() || "-"}
                        </div>
                    </div>

                    {/* Listening Section */}
                    {(!editModule || editModule === 'listening') && (
                        <div className="bg-white rounded-md p-5 border border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                                <FaHeadphones className="text-indigo-600" />
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Listening Score</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Band (0-9)</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.listening.band}
                                        onChange={(e) => setScores(prev => ({ ...prev, listening: { ...prev.listening, band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-4 rounded-md border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Correct Answers</label>
                                    <input
                                        type="number" min="0" max="40"
                                        value={scores.listening.correctAnswers}
                                        onChange={(e) => setScores(prev => ({ ...prev, listening: { ...prev.listening, correctAnswers: parseInt(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-4 rounded-md border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reading Section */}
                    {(!editModule || editModule === 'reading') && (
                        <div className="bg-white rounded-md p-5 border border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                                <FaBook className="text-emerald-600" />
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Reading Score</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Band (0-9)</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.reading.band}
                                        onChange={(e) => setScores(prev => ({ ...prev, reading: { ...prev.reading, band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-4 rounded-md border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Correct Answers</label>
                                    <input
                                        type="number" min="0" max="40"
                                        value={scores.reading.correctAnswers}
                                        onChange={(e) => setScores(prev => ({ ...prev, reading: { ...prev.reading, correctAnswers: parseInt(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-4 rounded-md border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Writing Section */}
                    {(!editModule || editModule === 'writing') && (
                        <div className="bg-white rounded-md p-5 border border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                                <FaPen className="text-indigo-600" />
                                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Writing Score</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task 1</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.task1Band}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, task1Band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task 2</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.task2Band}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, task2Band: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Overall</label>
                                    <input
                                        type="number" step="0.5" min="0" max="9"
                                        value={scores.writing.overallBand}
                                        onChange={(e) => setScores(prev => ({ ...prev, writing: { ...prev.writing, overallBand: parseFloat(e.target.value) || 0 } }))}
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 outline-none bg-slate-50 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Speaking Section - Hidden for now */}
                    {false && (!editModule || editModule === 'speaking') && (
                        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                                    <FaMicrophone />
                                </div>
                                <h4 className="font-bold text-slate-800">Speaking Score</h4>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Band Score (0-9)</label>
                                <input
                                    type="number" step="0.5" min="0" max="9"
                                    value={scores.speaking.band}
                                    onChange={(e) => setScores(prev => ({ ...prev, speaking: { ...prev.speaking, band: parseFloat(e.target.value) || 0 } }))}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-0 outline-none bg-white font-bold text-lg text-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* Admin Remarks */}
                    <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Remarks / Internal Feedback</label>
                        <textarea
                            value={scores.adminRemarks}
                            onChange={(e) => setScores(prev => ({ ...prev, adminRemarks: e.target.value }))}
                            placeholder="Type here..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-md border border-slate-200 focus:border-indigo-500 outline-none bg-white text-slate-800 resize-none text-sm"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 h-9 rounded-md border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 h-9 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                    >
                        {saving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
                        {saving ? "Saving..." : "Save Scores"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================

function StudentContent() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Modal states
    const [viewModal, setViewModal] = useState({ show: false, module: '', answers: null, loading: false });
    const [editModal, setEditModal] = useState({ show: false });

    // Fetch student data
    const fetchStudent = async () => {
        try {
            const response = await studentsAPI.getById(params.id);
            if (response.success) setStudent(response.data);
        } catch (error) {
            console.error("Failed to fetch student:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudent();
    }, [params.id]);

    // View answers handler
    const handleViewAnswers = async (module) => {
        console.log("=== View Answers Debug ===");
        console.log("Module:", module);
        console.log("Student ID:", params.id);
        console.log("Student examAnswers from state:", student?.examAnswers);

        setViewModal({ show: true, module, answers: null, loading: true });
        try {
            console.log("Calling API: getAnswerSheet for", module);
            const response = await studentsAPI.getAnswerSheet(params.id, module);
            console.log("API Response:", response);
            console.log("Answers from response:", response?.data?.answers);

            if (response.success) {
                setViewModal(prev => ({ ...prev, answers: response.data.answers, allSetsData: response.data.allSetsData || null, loading: false }));
            } else {
                console.error("API returned success: false", response);
                setViewModal(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error("Failed to fetch answers:", error);
            setViewModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Update all scores handler
    const handleSaveAllScores = async (scoresData, setNumber = null) => {
        setSaving(true);
        try {
            const payload = { ...scoresData };
            if (setNumber) payload.setNumber = setNumber;
            const response = await studentsAPI.updateAllScores(params.id, payload);
            if (response.success) {
                setStudent(response.data);
                setEditModal({ show: false });
                const label = scoresData.listening !== undefined ? 'Listening' :
                    scoresData.reading !== undefined ? 'Reading' :
                        scoresData.writing !== undefined ? 'Writing' : 'All';
                alert(`✅ ${label} score${setNumber ? ` (Set #${setNumber})` : 's'} updated successfully!`);
            }
        } catch (error) {
            alert("❌ Failed to update scores: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Publish results handler
    const handlePublishResults = async () => {
        const confirmMsg = student.resultsPublished
            ? "Are you sure you want to UNPUBLISH results? Students will no longer see their scores."
            : "Are you sure you want to PUBLISH results? Students will be able to see their final scores.";

        if (!confirm(confirmMsg)) return;

        setPublishing(true);
        try {
            const response = await studentsAPI.publishResults(params.id, !student.resultsPublished);
            if (response.success) {
                setStudent(prev => ({ ...prev, resultsPublished: response.data.resultsPublished }));
                alert(response.data.message);
            }
        } catch (error) {
            alert("❌ Failed to publish results: " + error.message);
        } finally {
            setPublishing(false);
        }
    };

    // Reset module handler
    const [resetting, setResetting] = useState(null); // which module is being reset

    const handleResetModule = async (module) => {
        const confirmMsg = `Are you sure you want to RESET the ${module.toUpperCase()} module?\n\n⚠️ This will:\n- Delete all answers for this module\n- Delete the score for this module\n- Allow the student to retake this module\n\nThis action cannot be undone!`;

        if (!confirm(confirmMsg)) return;

        setResetting(module);
        try {
            const response = await studentsAPI.resetModule(params.id, module);
            if (response.success) {
                // Refetch full student data to ensure complete state
                await fetchStudent();
                alert(`✅ ${module} module reset successfully! The student can now retake this module.`);
            }
        } catch (error) {
            alert("❌ Failed to reset module: " + error.message);
        } finally {
            setResetting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading student data...</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <FaExclamationTriangle className="text-5xl text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Student Not Found</h2>
                    <p className="text-slate-500 mb-6">The student you're looking for doesn't exist.</p>
                    <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const completedModules = student.completedModules || [];

    return (
        <div className="min-h-screen bg-slate-50 p-5 lg:p-8">
            {/* Back Button */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium mb-5 transition-colors cursor-pointer">
                <FaArrowLeft className="text-xs" /> Back to Students List
            </button>

            {/* Profile Header */}
            <div className="bg-white rounded-md border border-slate-200 p-5 lg:p-6 mb-5">
                <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center text-white text-2xl">
                        <FaUser />
                    </div>

                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">{student.nameEnglish}</h1>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-sm">
                            <span className="bg-indigo-50 px-3 py-1 rounded-md text-indigo-700 font-medium border border-indigo-100">{student.examId}</span>
                            <span className={`px-3 py-1 rounded-md font-medium border ${student.examStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {student.examStatus?.replace('-', ' ').toUpperCase() || 'ACTIVE'}
                            </span>
                            {student.resultsPublished && (
                                <span className="bg-green-50 px-3 py-1 rounded-md text-green-700 font-medium border border-green-100 flex items-center gap-1.5">
                                    <FaGlobe className="text-xs" /> Published
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800 px-6 py-4 rounded-md text-center min-w-[130px] text-white">
                        <span className="block text-[10px] uppercase font-bold tracking-widest opacity-70 mb-0.5">Overall Band</span>
                        <span className="block text-4xl font-black">{student.scores?.overall || "-"}</span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-md border border-slate-200 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <FaStar className="text-amber-400" />
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Score Management</h3>
                        <p className="text-xs text-slate-500">Edit module scores and publish results</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setEditModal({ show: true })} className="px-4 h-9 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-all flex items-center gap-1.5 cursor-pointer">
                        <FaEdit className="text-xs" /> Edit All Scores
                    </button>
                    <button onClick={handlePublishResults} disabled={publishing}
                        className={`px-4 h-9 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${student.resultsPublished ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                        {publishing ? <FaSpinner className="animate-spin text-xs" /> : student.resultsPublished ? <FaLock className="text-xs" /> : <FaUnlock className="text-xs" />}
                        {student.resultsPublished ? "Unpublish" : "Publish for Student"}
                    </button>
                </div>
            </div>

            {/* Assigned Question Sets Info */}
            {student.assignedSets && (
                <div className="bg-white rounded-md border border-slate-200 p-4 mb-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FaClipboardCheck className="text-indigo-400" /> Assigned Question Sets
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Listening', icon: FaHeadphones, color: 'text-indigo-600 bg-indigo-50', sets: student.assignedSets.listeningSetNumbers?.length ? student.assignedSets.listeningSetNumbers : (student.assignedSets.listeningSetNumber ? [student.assignedSets.listeningSetNumber] : []) },
                            { label: 'Reading', icon: FaBook, color: 'text-emerald-600 bg-emerald-50', sets: student.assignedSets.readingSetNumbers?.length ? student.assignedSets.readingSetNumbers : (student.assignedSets.readingSetNumber ? [student.assignedSets.readingSetNumber] : []) },
                            { label: 'Writing', icon: FaPen, color: 'text-violet-600 bg-violet-50', sets: student.assignedSets.writingSetNumbers?.length ? student.assignedSets.writingSetNumbers : (student.assignedSets.writingSetNumber ? [student.assignedSets.writingSetNumber] : []) },
                            { label: 'Speaking', icon: FaMicrophone, color: 'text-orange-600 bg-orange-50', sets: student.assignedSets.speakingSetNumbers?.length ? student.assignedSets.speakingSetNumbers : (student.assignedSets.speakingSetNumber ? [student.assignedSets.speakingSetNumber] : []) },
                        ].map((mod, i) => {
                            const Icon = mod.icon;
                            return (
                                <div key={i} className="border border-slate-100 rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center ${mod.color}`}>
                                            <Icon className="text-xs" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{mod.label}</span>
                                    </div>
                                    {mod.sets.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {mod.sets.map((s, j) => (
                                                <span key={j} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                                    Set #{s}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">Not assigned</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Module Score Cards - Full Set Grouped */}
            {(() => {
                const moduleConfigs = {
                    listening: { title: 'Listening', icon: FaHeadphones, color: 'blue' },
                    reading: { title: 'Reading', icon: FaBook, color: 'green' },
                    writing: { title: 'Writing', icon: FaPen, color: 'purple' },
                };
                const scoresObj = student.scores || {};
                const assignedSets = student.assignedSets || {};

                // Build Full Sets from assignedSets or fallback to legacy
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
                const extraSetsData = assignedSets.extraSets || [];

                // Helper: get per-set score for a module
                const getModuleScore = (moduleId, setNum) => {
                    const setKey = `${moduleId}_${setNum}`;
                    const perSet = scoresObj[setKey] || null;
                    if (moduleId === 'writing') {
                        const src = perSet || scoresObj.writing || {};
                        return { band: src.overallBand || 0, subInfo: `Task 1: ${src.task1Band || 0} | Task 2: ${src.task2Band || 0}` };
                    }
                    const src = perSet || scoresObj[moduleId] || {};
                    return { band: src.band || 0, subInfo: `Correct: ${src.correctAnswers || 0}/${src.totalQuestions || 40}` };
                };

                // Render a single card
                const renderCard = (moduleId, setNum, label) => {
                    const mod = moduleConfigs[moduleId];
                    if (!mod) return null;
                    const { band, subInfo } = getModuleScore(moduleId, setNum);
                    const completionKey = `${moduleId}:${setNum}`;
                    const isCompleted = completedModules.some(m =>
                        m === completionKey || m.toLowerCase() === moduleId || m.toLowerCase() === moduleId.toUpperCase()
                    );

                    return (
                        <div key={`${moduleId}-${setNum}`} className={`relative p-5 rounded-md border ${mod.color === 'blue' ? 'bg-blue-50 border-blue-100 hover:border-blue-200' :
                            mod.color === 'green' ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200' :
                                'bg-violet-50 border-violet-100 hover:border-violet-200'
                            } transition-all`}>
                            {isCompleted && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <FaCheckCircle className="text-white text-[10px]" />
                                </div>
                            )}
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${mod.color === 'blue' ? 'bg-blue-500 text-white' :
                                    mod.color === 'green' ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white'}`}>
                                    <mod.icon className="text-base" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-800 truncate">{label || mod.title}</h3>
                                    <p className="text-xs text-slate-500">{subInfo}</p>
                                </div>
                                <BandScoreCircle score={band} size="small" />
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => handleViewAnswers(moduleId)}
                                    className="flex-1 h-8 flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer">
                                    <FaEye className="text-slate-400 text-[10px]" /> View
                                </button>
                                <button onClick={() => setEditModal({ show: true, module: moduleId, setNumber: setNum })}
                                    className="flex-1 h-8 flex items-center justify-center gap-1 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-900 transition-all cursor-pointer">
                                    <FaEdit className="text-[10px]" /> Edit
                                </button>
                                {isCompleted && (
                                    <button onClick={() => handleResetModule(moduleId)}
                                        disabled={resetting === moduleId}
                                        className="h-8 px-2.5 flex items-center justify-center bg-rose-500 text-white rounded-md text-xs font-medium hover:bg-rose-600 transition-all disabled:opacity-50 cursor-pointer"
                                        title="Reset module">
                                        {resetting === moduleId ? <FaSpinner className="animate-spin text-[10px]" /> : <FaRedo className="text-[10px]" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                };

                // Calculate per-Full-Set overall band
                const calcFullSetOverall = (fs) => {
                    const l = getModuleScore('listening', fs.listeningSetNumber).band;
                    const r = getModuleScore('reading', fs.readingSetNumber).band;
                    const w = getModuleScore('writing', fs.writingSetNumber).band;
                    const bands = [l, r, w].filter(b => b > 0);
                    if (bands.length === 0) return 0;
                    const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
                    return Math.round(avg * 2) / 2;
                };

                return (
                    <div className="mb-6 space-y-6">
                        {/* Full Sets */}
                        {fullSets.map((fs, idx) => {
                            const fsOverall = calcFullSetOverall(fs);
                            return (
                                <div key={idx}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <h2 className="text-sm font-bold text-slate-700">{fs.label || `Full Set ${idx + 1}`}</h2>
                                        {fsOverall > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                                                Overall: {fsOverall}
                                            </span>
                                        )}
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {fs.listeningSetNumber && renderCard('listening', fs.listeningSetNumber, 'Listening')}
                                        {fs.readingSetNumber && renderCard('reading', fs.readingSetNumber, 'Reading')}
                                        {fs.writingSetNumber && renderCard('writing', fs.writingSetNumber, 'Writing')}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Extra Parts */}
                        {extraSetsData.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                    <h2 className="text-sm font-bold text-slate-700">Extra Exams</h2>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {extraSetsData.map((es, idx) =>
                                        renderCard(es.module, es.setNumber, `${moduleConfigs[es.module]?.title || es.module} (Extra)`)
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Student Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="bg-white rounded-md border border-slate-200 p-5">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FaUser className="text-indigo-400" /> Personal Information
                    </h2>
                    <div className="space-y-1">
                        {[
                            { label: "Email Address", value: student.email },
                            { label: "Phone Number", value: student.phone },
                            { label: "NID Number", value: student.nidNumber },
                            { label: "Payment Status", value: student.paymentStatus, badge: true, badgeColor: student.paymentStatus === 'paid' ? 'emerald' : 'amber' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-md transition-colors">
                                <span className="text-slate-500 text-sm">{item.label}</span>
                                {item.badge ? (
                                    <span className={`bg-${item.badgeColor}-50 text-${item.badgeColor}-700 px-2.5 py-0.5 rounded-md text-sm font-medium border border-${item.badgeColor}-100 capitalize`}>
                                        {item.value}
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-medium text-sm">{item.value || '-'}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Exam Metadata */}
                <div className="bg-white rounded-md border border-slate-200 p-5">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FaClipboardCheck className="text-indigo-400" /> Exam Metadata
                    </h2>
                    <div className="space-y-1">
                        {[
                            { label: "Exam Date", value: student.examDate ? new Date(student.examDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : '-' },
                            { label: "Completed At", value: student.examCompletedAt ? new Date(student.examCompletedAt).toLocaleString() : '-' },
                            { label: "Violations", value: student.totalViolations, warning: student.totalViolations > 0 },
                            { label: "Results Published", value: student.resultsPublished ? 'Yes' : 'No', badge: true, badgeColor: student.resultsPublished ? 'emerald' : 'slate' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-md transition-colors">
                                <span className="text-slate-500 text-sm">{item.label}</span>
                                {item.warning ? (
                                    <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-md text-sm font-medium border border-rose-100">
                                        {item.value}
                                    </span>
                                ) : item.badge ? (
                                    <span className={`bg-${item.badgeColor}-50 text-${item.badgeColor}-700 px-2.5 py-0.5 rounded-md text-sm font-medium border border-${item.badgeColor}-100`}>
                                        {item.value}
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-medium text-sm">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Admin Remarks */}
            {student.adminRemarks && (
                <div className="mt-5 bg-amber-50 rounded-md border border-amber-200 p-4">
                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">Admin Remarks</h3>
                    <p className="text-slate-700 text-sm">{student.adminRemarks}</p>
                </div>
            )}

            {/* Modals */}
            <ViewAnswersModal
                show={viewModal.show}
                onClose={() => setViewModal({ show: false, module: '', answers: null, loading: false })}
                module={viewModal.module}
                answers={viewModal.answers}
                loading={viewModal.loading}
                scores={student?.scores}
                allSetsData={viewModal.allSetsData || null}
            />

            <ScoreEditModal
                show={editModal.show}
                onClose={() => setEditModal({ show: false })}
                student={student}
                onSave={handleSaveAllScores}
                saving={saving}
                editModule={editModal.module || null}
                editSetNumber={editModal.setNumber || null}
            />
        </div>
    );
}

export default function StudentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-slate-400" />
            </div>
        }>
            <StudentContent />
        </Suspense>
    );
}
