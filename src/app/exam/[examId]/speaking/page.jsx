"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaMicrophone,
    FaClock,
    FaCheck,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaPlay,
    FaArrowRight,
    FaVideo,
    FaStop,
    FaRedo,
    FaUpload,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";
import { speakingAPI, studentsAPI, uploadAPI } from "@/lib/api";
import ExamSecurity from "@/components/ExamSecurity";

export default function SpeakingExamPage() {
    const params = useParams();
    const router = useRouter();

    // Core state
    const [timeLeft, setTimeLeft] = useState(14 * 60); // 14 minutes
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [uploadProgress, setUploadProgress] = useState("");

    // Data loading states
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [questionSet, setQuestionSet] = useState(null);
    const [session, setSession] = useState(null);

    // Question navigation
    const [allQuestions, setAllQuestions] = useState([]); // Flat list of all questions
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState({}); // { [questionIndex]: Blob }
    const [recordingTime, setRecordingTime] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");

    // Refs
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Load session and question set
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedSession = localStorage.getItem("examSession");
                if (!storedSession) {
                    setLoadError("No exam session found. Please start from the home page.");
                    setIsLoading(false);
                    return;
                }

                const parsed = JSON.parse(storedSession);
                setSession(parsed);

                // Verify from database
                try {
                    const verifyResponse = await studentsAPI.verifyExamId(parsed.examId);
                    if (verifyResponse.success && verifyResponse.data) {
                        const dbCompletedModules = verifyResponse.data.completedModules || [];
                        if (dbCompletedModules.includes("speaking")) {
                            parsed.completedModules = dbCompletedModules;
                            localStorage.setItem("examSession", JSON.stringify(parsed));
                            router.push(`/exam/${params.examId}`);
                            return;
                        }
                    }
                } catch (apiError) {
                    console.error("Failed to verify:", apiError);
                    if (parsed.completedModules?.includes("speaking")) {
                        router.push(`/exam/${params.examId}`);
                        return;
                    }
                }

                const speakingSetNumber = parsed.assignedSets?.speakingSetNumber;
                if (!speakingSetNumber) {
                    setLoadError("No speaking test assigned for this exam.");
                    setIsLoading(false);
                    return;
                }

                const response = await speakingAPI.getForExam(speakingSetNumber);

                if (response.success && response.data) {
                    setQuestionSet(response.data);
                    // Flatten all questions into a single list
                    const questions = flattenQuestions(response.data);
                    setAllQuestions(questions);
                } else {
                    setLoadError("Failed to load speaking test questions.");
                }
            } catch (err) {
                console.error("Load error:", err);
                setLoadError(err.message || "Failed to load exam data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [params.examId]);

    // Flatten the speaking test questions into a sequential list
    const flattenQuestions = (data) => {
        const questions = [];

        // Part 1 topics & questions
        const part1Topics = data?.part1?.topics || [];
        part1Topics.forEach((topic, tIdx) => {
            const topicName = topic.topic || topic.topicName || `Topic ${tIdx + 1}`;
            (topic.questions || []).forEach((q, qIdx) => {
                questions.push({
                    part: 1,
                    label: `Part 1 — ${topicName}`,
                    questionText: typeof q === 'string' ? q : q.question || q.text || String(q),
                    questionNumber: questions.length + 1,
                });
            });
        });

        // Part 2 cue card (single question)
        const part2 = data?.part2 || {};
        if (part2.topic || part2.cueCard) {
            let cueText = part2.topic || "Cue Card Topic";
            if (part2.cueCard) cueText += `\n${part2.cueCard}`;
            if (part2.bulletPoints?.length) {
                cueText += "\n\nYou should say:\n" + part2.bulletPoints.map(bp =>
                    `• ${typeof bp === 'string' ? bp : bp.text || bp}`
                ).join("\n");
            }
            if (part2.followUpQuestion) {
                cueText += `\n\n${part2.followUpQuestion}`;
            }
            questions.push({
                part: 2,
                label: "Part 2 — Cue Card / Long Turn",
                questionText: cueText,
                questionNumber: questions.length + 1,
                isCueCard: true,
                prepTime: part2.preparationTime || 60,
                speakTime: part2.speakingTime || 120,
            });
        }

        // Part 3 discussion questions
        const part3Questions = data?.part3?.questions || [];
        part3Questions.forEach((q, idx) => {
            questions.push({
                part: 3,
                label: `Part 3 — Discussion${data?.part3?.topic ? `: "${data.part3.topic}"` : ""}`,
                questionText: typeof q === 'string' ? q : q.question || q.text || String(q),
                questionNumber: questions.length + 1,
            });
        });

        return questions;
    };

    // Timer
    useEffect(() => {
        if (showInstructions || isLoading || loadError) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showInstructions, isLoading, loadError]);

    // Initialize camera/mic when instructions are dismissed
    const startCamera = useCallback(async () => {
        try {
            setCameraError("");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: true,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraReady(true);
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Camera/microphone access denied. Please allow access and try again.");
        }
    }, []);

    // Stop camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const startRecording = () => {
        if (!streamRef.current) return;

        chunksRef.current = [];

        // Find supported mime type
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];

        const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: supportedType,
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            setRecordings(prev => ({ ...prev, [currentQuestionIndex]: blob }));
            chunksRef.current = [];
        };

        mediaRecorder.start(1000); // Collect data every 1s
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setRecordingTime(0);

        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const deleteRecording = (index) => {
        setRecordings(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleStartExam = async () => {
        setShowInstructions(false);
        await startCamera();
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Stop any ongoing recording
        if (isRecording) stopRecording();

        const storedSession = localStorage.getItem("examSession");
        const sessionData = storedSession ? JSON.parse(storedSession) : null;
        const examId = sessionData?.examId;

        try {
            // Upload all recordings to Cloudinary
            const uploadedRecordings = [];
            const recordingEntries = Object.entries(recordings);

            for (let i = 0; i < recordingEntries.length; i++) {
                const [qIdx, blob] = recordingEntries[i];
                const question = allQuestions[parseInt(qIdx)];
                setUploadProgress(`Uploading recording ${i + 1}/${recordingEntries.length}...`);

                try {
                    const uploadResult = await uploadAPI.uploadSpeakingRecording(blob);
                    if (uploadResult.success) {
                        uploadedRecordings.push({
                            questionLabel: question?.label || "",
                            questionText: question?.questionText || "",
                            videoUrl: uploadResult.data.url,
                            publicId: uploadResult.data.publicId,
                            duration: uploadResult.data.duration || 0,
                        });
                    }
                } catch (uploadErr) {
                    console.error(`Failed to upload recording ${i + 1}:`, uploadErr);
                }
            }

            setUploadProgress("Saving results...");

            // Save module score with answers + recording URLs
            const response = await studentsAPI.saveModuleScore(examId, "speaking", {
                band: 0,
                answers: {
                    part1: questionSet?.part1 || null,
                    part2: questionSet?.part2 || null,
                    part3: questionSet?.part3 || null,
                    recordings: uploadedRecordings,
                },
            });

            if (response.success && sessionData) {
                sessionData.completedModules = response.data?.completedModules || [...(sessionData.completedModules || []), "speaking"];
                sessionData.scores = response.data?.scores || {
                    ...(sessionData.scores || {}),
                    speaking: { band: 0 },
                };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error("Failed to save speaking score:", error);
            if (sessionData) {
                sessionData.completedModules = [...(sessionData.completedModules || []), "speaking"];
                sessionData.scores = { ...(sessionData.scores || {}), speaking: { band: 0 } };
                localStorage.setItem("examSession", JSON.stringify(sessionData));
            }
        }

        // Clean up camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        router.push(`/exam/${params.examId}`);
    };

    // Current question data
    const currentQuestion = allQuestions[currentQuestionIndex];
    const hasRecording = recordings[currentQuestionIndex] !== undefined;
    const totalQuestions = allQuestions.length;
    const recordedCount = Object.keys(recordings).length;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-orange-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading speaking test...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <FaTimes className="text-4xl text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{loadError}</p>
                    <button
                        onClick={() => router.push(`/exam/${params.examId}`)}
                        className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                    >
                        Back to Exam
                    </button>
                </div>
            </div>
        );
    }

    // Instructions screen
    if (showInstructions) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <FaMicrophone className="text-3xl text-orange-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">IELTS Speaking Test</h1>
                        <p className="text-gray-500">Set #{questionSet?.setNumber || questionSet?.testNumber || ""} • Duration: 11–14 minutes</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                        <h2 className="font-semibold text-gray-800 mb-4">Test Structure</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Part 1 — Introduction & Interview (4–5 min)</p>
                                    <p className="text-gray-500 text-sm">General questions about familiar topics.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Part 2 — Long Turn / Cue Card (3–4 min)</p>
                                    <p className="text-gray-500 text-sm">1 minute to prepare, then speak for 1–2 minutes.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-orange-600 font-bold text-sm">3</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Part 3 — Discussion (4–5 min)</p>
                                    <p className="text-gray-500 text-sm">More abstract questions related to the Part 2 topic.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700 text-sm">
                            <strong>⚠️ Important:</strong> Your camera and microphone will be turned on when you start.
                            Each question will appear one at a time. You must record your answer for each question.
                            All recordings will be uploaded and reviewed by the examiner.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                        <p className="text-amber-700 text-sm">
                            <strong>📹 Recording Instructions:</strong> Click &quot;Start Recording&quot; to begin your answer,
                            and &quot;Stop Recording&quot; when you&apos;re done. You can re-record if needed. Navigate between
                            questions using the Next/Previous buttons.
                        </p>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleStartExam}
                            className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors cursor-pointer"
                        >
                            <FaVideo />
                            Start Speaking Test
                            <FaArrowRight className="text-sm" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isTimeWarning = timeLeft <= 120;

    return (
        <>
            <ExamSecurity examId={session?.examId} />
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 py-3 px-4 sticky top-0 z-30">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaMicrophone className="text-orange-600 text-xl" />
                            <span className="font-bold text-gray-800">Speaking Test</span>
                            <span className="text-gray-400 text-sm">Set #{questionSet?.setNumber || questionSet?.testNumber}</span>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                Q {currentQuestionIndex + 1}/{totalQuestions}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                                {recordedCount} recorded
                            </span>
                        </div>

                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${isTimeWarning ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            }`}>
                            <FaClock />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </header>

                {/* Question Progress Bar */}
                <div className="bg-white border-b border-gray-200 py-2 px-4">
                    <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
                        {allQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (isRecording) return;
                                    setCurrentQuestionIndex(idx);
                                }}
                                disabled={isRecording}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed ${idx === currentQuestionIndex
                                    ? "bg-orange-500 text-white ring-2 ring-orange-300 scale-110"
                                    : recordings[idx]
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                    }`}
                                title={`Q${idx + 1}: ${recordings[idx] ? "Recorded ✓" : "Not recorded"}`}
                            >
                                {recordings[idx] ? <FaCheck className="text-[10px]" /> : idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 py-6 px-4">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Question */}
                        <div>
                            {/* Part badge */}
                            <div className="mb-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${currentQuestion?.part === 1 ? "bg-orange-100 text-orange-700" :
                                    currentQuestion?.part === 2 ? "bg-amber-100 text-amber-700" :
                                        "bg-yellow-100 text-yellow-700"
                                    }`}>
                                    {currentQuestion?.label}
                                </span>
                            </div>

                            {/* Question Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-lg">
                                        {currentQuestionIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                            Question {currentQuestionIndex + 1} of {totalQuestions}
                                        </p>
                                        <p className="text-gray-800 text-lg font-medium leading-relaxed whitespace-pre-line">
                                            {currentQuestion?.questionText}
                                        </p>
                                    </div>
                                </div>

                                {/* Cue card timing info */}
                                {currentQuestion?.isCueCard && (
                                    <div className="mt-4 flex gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                                        <span className="flex items-center gap-1">
                                            <FaClock className="text-orange-400" />
                                            Preparation: {currentQuestion.prepTime}s
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FaMicrophone className="text-orange-400" />
                                            Speaking: {currentQuestion.speakTime}s
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Recording Status */}
                            <div className="mt-4">
                                {hasRecording && !isRecording ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <FaCheckCircle />
                                            <span className="text-sm font-medium">Answer recorded successfully</span>
                                        </div>
                                        <button
                                            onClick={() => deleteRecording(currentQuestionIndex)}
                                            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                        >
                                            <FaRedo className="text-xs" /> Re-record
                                        </button>
                                    </div>
                                ) : !isRecording ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-2 text-amber-700">
                                        <FaExclamationTriangle />
                                        <span className="text-sm">Not recorded yet. Click &quot;Start Recording&quot; to answer.</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Right: Video + Recording Controls */}
                        <div>
                            {/* Camera Feed */}
                            <div className="bg-black rounded-xl overflow-hidden relative mb-4 aspect-video">
                                {cameraError ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                                        <div>
                                            <FaExclamationTriangle className="text-4xl text-red-400 mx-auto mb-3" />
                                            <p className="text-red-300 text-sm mb-3">{cameraError}</p>
                                            <button
                                                onClick={startCamera}
                                                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                            style={{ transform: "scaleX(-1)" }}
                                        />
                                        {/* Recording indicator */}
                                        {isRecording && (
                                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                                                <div className="w-3 h-3 bg-white rounded-full" />
                                                REC {formatTime(recordingTime)}
                                            </div>
                                        )}
                                        {!cameraReady && !cameraError && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <FaSpinner className="animate-spin text-3xl text-white" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Recording Controls */}
                            <div className="flex items-center justify-center gap-4">
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        disabled={!cameraReady || isRecording}
                                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg shadow-red-200"
                                    >
                                        <FaVideo />
                                        {hasRecording ? "Re-record Answer" : "Start Recording"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 cursor-pointer transition-all animate-pulse shadow-lg"
                                    >
                                        <FaStop />
                                        Stop Recording ({formatTime(recordingTime)})
                                    </button>
                                )}
                            </div>

                            {/* Playback of recorded answer */}
                            {hasRecording && !isRecording && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-2 font-medium">Preview your recording:</p>
                                    <video
                                        src={URL.createObjectURL(recordings[currentQuestionIndex])}
                                        controls
                                        className="w-full rounded-lg border border-gray-200"
                                        style={{ maxHeight: "200px" }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Bottom Bar */}
                <div className="bg-white border-t border-gray-200 py-3 px-4 sticky bottom-0">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => {
                                if (isRecording) stopRecording();
                                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                            }}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft className="text-sm" />
                            Previous
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-gray-400">
                                {recordedCount}/{totalQuestions} questions recorded
                            </p>
                        </div>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <button
                                onClick={() => {
                                    if (isRecording) stopRecording();
                                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer"
                            >
                                Next
                                <FaChevronRight className="text-sm" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold cursor-pointer"
                            >
                                <FaCheck />
                                Submit All
                            </button>
                        )}
                    </div>
                </div>

                {/* Submit Modal */}
                {showSubmitModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Submit Speaking Test?</h3>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Questions</span>
                                    <span className="font-medium text-gray-800">{totalQuestions}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Recorded</span>
                                    <span className="font-medium text-green-600">{recordedCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Not Recorded</span>
                                    <span className={`font-medium ${totalQuestions - recordedCount > 0 ? "text-red-500" : "text-gray-400"}`}>
                                        {totalQuestions - recordedCount}
                                    </span>
                                </div>
                            </div>

                            {totalQuestions - recordedCount > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                    <p className="text-amber-700 text-sm">
                                        ⚠️ You have {totalQuestions - recordedCount} unrecorded question(s). Are you sure you want to submit?
                                    </p>
                                </div>
                            )}

                            {isSubmitting && uploadProgress && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                    <p className="text-blue-700 text-sm flex items-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        {uploadProgress}
                                    </p>
                                </div>
                            )}

                            <p className="text-gray-600 mb-6 text-sm">
                                Your recordings will be uploaded and evaluated by the examiner. This may take a moment.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-40"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FaUpload />
                                            Submit & Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
