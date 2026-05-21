"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaPlay,
    FaInfoCircle,
    FaCheckCircle,
    FaShieldAlt,
    FaExclamationTriangle,
    FaKeyboard,
    FaHeadphones,
    FaBook,
    FaPen,
    FaClock,
    FaLaptop,
    FaWifi,
    FaTimes,
    FaExclamationCircle,
    FaArrowRight,
    FaVideo
} from "react-icons/fa";
import { LuGraduationCap, LuShieldCheck } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi";
import { studentsAPI } from "@/lib/api";
import Logo from "@/components/Logo";
import { useSiteContent, getVideoSrc, isYouTube, renderBoldMarkers } from "@/hooks/useSiteContent";

// Toast Popup Component
const ToastPopup = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 6000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        error: <FaExclamationCircle className="text-xl" />,
        warning: <FaExclamationTriangle className="text-xl" />,
        success: <FaCheckCircle className="text-xl" />,
    };

    const colors = {
        error: "bg-red-500",
        warning: "bg-amber-500",
        success: "bg-green-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
            <div className={`${colors[type]} text-white rounded-2xl shadow-2xl overflow-hidden`}>
                <div className="px-5 py-4 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        {icons[type]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg mb-0.5">
                            {type === "error" ? "Oops!" : type === "warning" ? "Warning" : "Success"}
                        </p>
                        <p className="text-white/90 text-sm leading-relaxed">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>
                {/* Progress bar */}
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="h-1 bg-white/30"
                />
            </div>
        </motion.div>
    );
};

export default function HomePage() {
    const router = useRouter();
    const [examId, setExamId] = useState("");
    const [toast, setToast] = useState(null);

    // Dynamic site content (managed from Admin > Design)
    const SC_KEYS = [
        "video.home_welcome",
        "text.hero_badge",
        "text.hero_title_line1",
        "text.hero_title_line2",
        "text.hero_title_line3",
        "text.hero_subtitle",
    ];
    const SC_DEFAULTS = {
        "video.home_welcome": { videoSource: "local", videoUrl: "/video/IELTS on computer - Quick Guide.mp4" },
        "text.hero_badge": { textValue: "100% AUTHENTIC EXAM EXPERIENCE" },
        "text.hero_title_line1": { textValue: "Jibon Education" },
        "text.hero_title_line2": { textValue: "Online IELTS Mock Tests" },
        "text.hero_title_line3": { textValue: "Examination System" },
        "text.hero_subtitle": {
            textValue:
                "Prepare for your IELTS exam with our **Official-Style Computer-Based Mock Tests** — real exam format, instant results, anytime, anywhere!",
        },
    };
    const { data: siteContent } = useSiteContent(SC_KEYS, SC_DEFAULTS);

    const heroBadge = siteContent["text.hero_badge"]?.textValue || SC_DEFAULTS["text.hero_badge"].textValue;
    const heroLine1 = siteContent["text.hero_title_line1"]?.textValue || SC_DEFAULTS["text.hero_title_line1"].textValue;
    const heroLine2 = siteContent["text.hero_title_line2"]?.textValue || SC_DEFAULTS["text.hero_title_line2"].textValue;
    const heroLine3 = siteContent["text.hero_title_line3"]?.textValue || SC_DEFAULTS["text.hero_title_line3"].textValue;
    const heroSubtitleRaw = siteContent["text.hero_subtitle"]?.textValue || SC_DEFAULTS["text.hero_subtitle"].textValue;

    const homeVideoEntry = siteContent["video.home_welcome"];
    const homeVideoSrc = getVideoSrc(homeVideoEntry, "/video/IELTS on computer - Quick Guide.mp4");
    const homeVideoIsYT = isYouTube(homeVideoEntry);
    const [isLoading, setIsLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [showDemoVideo, setShowDemoVideo] = useState(false);

    // Parse error message to user-friendly format
    const parseErrorMessage = (error) => {
        // If it's a string that looks like JSON array
        if (typeof error === "string") {
            // Try to parse JSON
            if (error.startsWith("[") || error.startsWith("{")) {
                try {
                    const parsed = JSON.parse(error);
                    if (Array.isArray(parsed)) {
                        // Get the first error message
                        const firstError = parsed[0];
                        if (firstError?.message) {
                            return cleanErrorMessage(firstError.message);
                        }
                    }
                    if (parsed.message) {
                        return cleanErrorMessage(parsed.message);
                    }
                } catch (e) {
                    // Not valid JSON, use as-is
                }
            }
            return cleanErrorMessage(error);
        }

        // If it's an array
        if (Array.isArray(error)) {
            const firstError = error[0];
            if (firstError?.message) {
                return cleanErrorMessage(firstError.message);
            }
        }

        // If it's an object with message
        if (error?.message) {
            return cleanErrorMessage(error.message);
        }

        return "Something went wrong. Please try again.";
    };

    // Clean up error message for better readability
    const cleanErrorMessage = (msg) => {
        // Map of technical messages to user-friendly messages
        const messageMap = {
            "Invalid Exam ID format": "Invalid Exam ID format. Example: JEIELTS260001",
            "Invalid Exam ID": "This Exam ID does not exist. Please check and try again.",
            "Payment not confirmed": "Your payment is not confirmed yet. Please contact admin.",
            "This account has been deactivated": "Your account has been deactivated. Please contact admin.",
            "You have already completed this exam": "You have already completed this exam.",
            "Your exam was terminated": "Your exam was terminated due to violations. Please contact admin.",
            "You have an exam in progress": "You already have an exam in progress. Please contact admin.",
        };

        // Check if message matches any known pattern
        for (const [pattern, friendly] of Object.entries(messageMap)) {
            if (msg.toLowerCase().includes(pattern.toLowerCase())) {
                return friendly;
            }
        }

        // Remove technical prefixes like "body.examId: "
        let cleaned = msg.replace(/^body\.\w+:\s*/i, "");
        cleaned = cleaned.replace(/\(e\.g\.,?\s*[A-Z0-9]+\)/i, "");

        return cleaned.trim() || "Something went wrong. Please try again.";
    };

    const showToast = (message, type = "error") => {
        const friendlyMessage = parseErrorMessage(message);
        setToast({ message: friendlyMessage, type });
    };

    const handleStartExam = async (e) => {
        e.preventDefault();

        if (!examId.trim()) {
            showToast("Please enter your Exam ID to continue", "warning");
            return;
        }

        if (examId.trim().length < 4) {
            showToast("The Exam ID format is invalid. Please check and try again.", "error");
            return;
        }

        if (!agreed) {
            showToast("Please accept the terms and conditions before starting", "warning");
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Verify the exam ID exists and is valid
            const verifyResponse = await studentsAPI.verifyExamId(examId.trim());

            if (!verifyResponse.success || !verifyResponse.data?.valid) {
                const errorMessage = verifyResponse.data?.message || "Invalid Exam ID. Please check and try again.";
                showToast(errorMessage, "error");
                setIsLoading(false);
                return;
            }

            // Step 2: Start the exam session
            const startResponse = await studentsAPI.startExam(
                examId.trim(),
                "", // IP address
                "" // Browser fingerprint
            );

            if (startResponse.success && startResponse.data) {
                // Clear any old session first
                localStorage.removeItem("examSession");

                // Store session info in localStorage
                localStorage.setItem("examSession", JSON.stringify({
                    sessionId: startResponse.data.sessionId,
                    examId: startResponse.data.examId,
                    studentName: startResponse.data.studentName,
                    assignedSets: startResponse.data.assignedSets,
                    startedAt: startResponse.data.startedAt,
                    completedModules: startResponse.data.completedModules || [],
                    scores: startResponse.data.scores || null
                }));

                // Navigate to exam page
                router.push(`/exam/${startResponse.data.sessionId}`);
            } else {
                showToast("Failed to start exam. Please try again.", "error");
            }
        } catch (err) {
            showToast(err.message || "An error occurred. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const examSections = [
        { name: "Listening", icon: <FaHeadphones />, duration: "30 min", questions: 40, iconClass: "bg-purple-50 text-purple-500" },
        { name: "Reading", icon: <FaBook />, duration: "60 min", questions: 40, iconClass: "bg-blue-50 text-blue-500" },
        { name: "Writing", icon: <FaPen />, duration: "60 min", questions: 2, iconClass: "bg-emerald-50 text-emerald-500" },
    ];

    const requirements = [
        { icon: <FaLaptop />, text: "Desktop or laptop computer" },
        { icon: <FaHeadphones />, text: "Headphones for listening" },
        { icon: <FaWifi />, text: "Stable internet connection" },
        { icon: <FaClock />, text: "2.5 hours of uninterrupted time" },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
            {/* Toast Popup */}
            <AnimatePresence>
                {toast && (
                    <ToastPopup
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Demo Video Modal */}
            <AnimatePresence>
                {showDemoVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDemoVideo(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <FaVideo className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-sm">Exam Instruction</h3>
                                        <p className="text-gray-400 text-[11px]">Learn how the exam works</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDemoVideo(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                                {homeVideoIsYT ? (
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={homeVideoSrc}
                                        title="Exam Instruction"
                                        frameBorder="0"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        className="absolute inset-0 w-full h-full"
                                        src={homeVideoSrc}
                                        controls
                                        autoPlay
                                        playsInline
                                    />
                                )}
                            </div>
                            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                                <p className="text-gray-500 text-xs">Watch this video before starting your exam</p>
                                <button
                                    onClick={() => setShowDemoVideo(false)}
                                    className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Static Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FF6904]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF6904]/5 rounded-full blur-[150px]"></div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="py-6 px-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between max-w-7xl mx-auto"
                    >
                        <Logo size="default" />
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowDemoVideo(true)}
                                className="relative px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/40 transition-all cursor-pointer transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                {/* Pulsing glow ring */}
                                <span className="absolute -inset-1 rounded-2xl bg-red-400 opacity-0 animate-pulse" style={{ animationDuration: '2s' }}></span>
                                {/* Pulsing dot */}
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400 border border-white"></span>
                                </span>
                                <FaVideo className="relative z-10 text-xs" />
                                <span className="relative z-10">Exam Instruction</span>
                            </button>
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <LuShieldCheck className="text-emerald-500" />
                                <span className="hidden sm:inline">Secure Platform</span>
                            </div>
                            <button
                                onClick={() => router.push("/login")}
                                className="px-5 py-2.5 bg-[#FF6904] text-white rounded-xl font-semibold text-sm hover:bg-[#e85d00] hover:shadow-lg hover:shadow-[#FF6904]/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
                            >
                                Login
                            </button>
                        </div>
                    </motion.div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Info Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="hidden lg:block"
                        >
                            {/* Badge (dynamic) */}
                            <div className="inline-flex items-center gap-2 bg-[#FF6904]/10 border border-[#FF6904]/20 rounded-full px-4 py-1.5 mb-5">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="text-[#FF6904] text-xs font-bold tracking-wider uppercase">{heroBadge}</span>
                            </div>

                            {/* Title 3 lines (dynamic) */}
                            <h2 className="text-4xl font-extrabold text-slate-900 mb-2 outfit leading-tight">
                                <span className="text-[#FF6904]">{heroLine1}</span>
                                <br />
                                {heroLine2}
                                <br />
                                <span className="text-[#dc2626]">
                                    {heroLine3}
                                </span>
                            </h2>

                            {/* Subtitle with **bold** marker support (dynamic) */}
                            <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
                                {renderBoldMarkers(heroSubtitleRaw, "span", "text-[#FF6904] font-bold")}
                            </p>

                            {/* Exam Sections Preview */}
                            <div className="space-y-4 mb-8">
                                {examSections.map((section, index) => (
                                    <motion.div
                                        key={section.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${section.iconClass} flex items-center justify-center text-xl`}>
                                            {section.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-slate-900 font-semibold">{section.name}</h3>
                                            <p className="text-slate-500 text-sm font-medium">{section.duration} • {section.questions} {section.questions === 2 ? 'tasks' : 'questions'}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Requirements */}
                            <div className="grid grid-cols-2 gap-3">
                                {requirements.map((req, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 + index * 0.05 }}
                                        className="flex items-center gap-2 text-slate-600 text-sm font-medium"
                                    >
                                        <span className="text-[#FF6904]">{req.icon}</span>
                                        {req.text}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right - Login Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
                        >
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
                                {/* Card Header */}
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-[#FF6904]/10 border border-[#FF6904]/20 rounded-2xl flex items-center justify-center shadow-sm">
                                        <HiOutlineDocumentText className="text-[#FF6904] text-3xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 outfit">Start Your Exam</h3>
                                    <p className="text-slate-500 text-sm mt-2 font-medium">Enter your unique Exam ID to begin</p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleStartExam} className="space-y-6">
                                    <div>
                                        <label className="block text-slate-700 text-sm mb-2 font-semibold">Exam ID</label>
                                        <div className="relative">
                                            <FaKeyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={examId}
                                                onChange={(e) => {
                                                    setExamId(e.target.value.toUpperCase());
                                                }}
                                                placeholder="e.g., JEIELTS240001"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 focus:border-[#FF6904] focus:bg-white focus:ring-4 focus:ring-[#FF6904]/10 outline-none transition-all text-lg font-mono tracking-widest"
                                                autoComplete="off"
                                                spellCheck="false"
                                            />
                                        </div>
                                    </div>

                                    {/* Agreement */}
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={agreed}
                                                onChange={(e) => {
                                                    setAgreed(e.target.checked);
                                                }}
                                                className="w-5 h-5 rounded border-2 border-slate-300 bg-white checked:bg-[#FF6904] checked:border-[#FF6904] appearance-none cursor-pointer transition-all"
                                            />
                                            {agreed && (
                                                <FaCheckCircle className="absolute inset-0 text-white w-5 h-5 pointer-events-none" />
                                            )}
                                        </div>
                                        <span className="text-slate-600 text-sm font-medium group-hover:text-slate-800 transition-colors leading-relaxed">
                                            I agree to the exam rules and understand that my activity will be monitored during the test.
                                        </span>
                                    </label>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-3 bg-[#FF6904] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#e85d00] hover:shadow-lg hover:shadow-[#FF6904]/30 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Verifying Exam ID...
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <FaPlay className="text-sm" />
                                                <span>Start Examination</span>
                                                <FaArrowRight className="text-sm" />
                                            </div>
                                        )}
                                    </button>
                                </form>

                                {/* Security Note */}
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-start gap-3 text-slate-500 text-xs leading-relaxed">
                                        <FaShieldAlt className="text-[#FF6904] mt-0.5 flex-shrink-0" />
                                        <p>
                                            This exam is conducted in a secure environment. Tab switching, screen recording, and copy-paste are monitored.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 px-8 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-sm font-medium">
                        <p>© 2026 Jibon Education. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <span className="hover:text-[#FF6904] cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-[#FF6904] cursor-pointer transition-colors">Terms of Service</span>
                            <span className="hover:text-[#FF6904] cursor-pointer transition-colors">Support</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
