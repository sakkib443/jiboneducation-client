"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaPlay,
    FaInfoCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaKeyboard,
    FaUser,
    FaPhone,
    FaIdCard,
    FaSpinner
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";
import Logo from "@/components/Logo";

function ExamEntryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1); // 1: Enter Exam ID, 2: Enter User Info
    const [examId, setExamId] = useState("");
    const [examDetails, setExamDetails] = useState(null);
    const [userInfo, setUserInfo] = useState({
        name: "",
        phone: "",
        nid: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if code is passed in URL
        const code = searchParams.get("code");
        if (code) {
            setExamId(code.toUpperCase());
        }
    }, [searchParams]);

    const handleVerifyExam = async (e) => {
        e.preventDefault();

        if (!examId.trim()) {
            setError("Please enter your Exam ID");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const response = await studentsAPI.verifyExamId(examId.trim());
            if (response.success && response.data) {
                if (response.data.valid) {
                    setExamDetails(response.data.student);
                    setStep(2);
                } else if (response.data.completedModules && response.data.completedModules.length >= 3) {
                    // If exam is completed, redirect to the exam page which shows the success screen
                    // We need to set a temporary session for the page to work
                    localStorage.setItem("examSession", JSON.stringify({
                        examId: examId.trim().toUpperCase(),
                        studentName: response.data.name || "Student",
                        completedModules: response.data.completedModules,
                        scores: response.data.scores
                    }));
                    router.push(`/exam/${examId.trim().toUpperCase()}`);
                } else {
                    setError(response.data?.message || "Invalid Exam ID. Please check and try again.");
                }
            } else {
                setError(response.data?.message || "Invalid Exam ID. Please check and try again.");
            }
        } catch (err) {
            setError(err.message || "Invalid Exam ID");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartExam = async (e) => {
        e.preventDefault();

        if (!userInfo.name.trim() || !userInfo.phone.trim() || !userInfo.nid.trim()) {
            setError("Please fill in all fields");
            return;
        }

        if (userInfo.phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }

        if (userInfo.nid.length < 10) {
            setError("Please enter a valid NID number");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const response = await studentsAPI.startExam(
                examId.trim(),
                "", // IP address - will be detected by backend
                "" // Browser fingerprint
            );

            if (response.success && response.data) {
                // Clear any old session first
                localStorage.removeItem("examSession");

                // Store session info with assigned question sets
                localStorage.setItem("examSession", JSON.stringify({
                    sessionId: response.data.sessionId,
                    examId: response.data.examId,
                    studentName: response.data.studentName,
                    assignedSets: response.data.assignedSets,
                    completedModules: response.data.completedModules || [],
                    scores: response.data.scores || null,
                    user: userInfo
                }));

                // Navigate to exam page with session ID
                router.push(`/exam/${response.data.sessionId}`);
            }
        } catch (err) {
            setError(err.message || "Failed to start exam");
        } finally {
            setIsLoading(false);
        }
    };

    const instructions = [
        "Ensure you have a stable internet connection throughout the test",
        "Use a desktop or laptop computer for best experience",
        "Keep your browser in fullscreen mode during the exam",
        "Do not switch tabs or minimize the window",
        "Each section has a specific time limit",
        "Answers are auto-saved every 30 seconds",
        "You cannot go back once a section is submitted",
        "Results will be displayed immediately after completion"
    ];

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-2">
                        <Logo className="w-40" />
                    </div>
                    <p className="text-gray-500">Online Examination System</p>
                </div>

                {/* Main Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-cyan-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                                1
                            </div>
                            <span className="text-sm font-medium hidden sm:block">Exam ID</span>
                        </div>
                        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-cyan-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium hidden sm:block">Your Info</span>
                        </div>
                    </div>

                    {/* Step 1: Enter Exam ID */}
                    {step === 1 && (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to IELTS Exam</h2>
                                <p className="text-gray-500">
                                    Enter your Exam ID to start your test session
                                </p>
                            </div>

                            <form onSubmit={handleVerifyExam} className="mb-6">
                                <div className="relative mb-4">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <FaKeyboard />
                                    </div>
                                    <input
                                        type="text"
                                        value={examId}
                                        onChange={(e) => {
                                            setExamId(e.target.value.toUpperCase());
                                            setError("");
                                        }}
                                        placeholder="Enter Exam ID (e.g., JEIELTS2500001)"
                                        className="w-full border-2 border-gray-300 rounded-lg pl-12 pr-4 py-4 text-gray-800 placeholder-gray-400 focus:border-cyan-600 focus:outline-none text-lg tracking-wider"
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm mb-4 flex items-center gap-2">
                                        <FaExclamationTriangle />
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 bg-cyan-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-cyan-700 transition-colors cursor-pointer disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay />
                                            Continue
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: Enter User Info */}
                    {step === 2 && (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Your Details</h2>
                                <p className="text-gray-500">
                                    Exam: <span className="font-mono text-cyan-600">{examId}</span>
                                </p>
                            </div>

                            <form onSubmit={handleStartExam} className="mb-6 space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <FaUser />
                                    </div>
                                    <input
                                        type="text"
                                        value={userInfo.name}
                                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full border-2 border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:border-cyan-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <FaPhone />
                                    </div>
                                    <input
                                        type="tel"
                                        value={userInfo.phone}
                                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                                        placeholder="Phone Number (e.g., 01712345678)"
                                        className="w-full border-2 border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:border-cyan-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <FaIdCard />
                                    </div>
                                    <input
                                        type="text"
                                        value={userInfo.nid}
                                        onChange={(e) => setUserInfo({ ...userInfo, nid: e.target.value })}
                                        placeholder="NID Number"
                                        className="w-full border-2 border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:border-cyan-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm flex items-center gap-2">
                                        <FaExclamationTriangle />
                                        {error}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setError("");
                                        }}
                                        className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors cursor-pointer disabled:opacity-70"
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <FaPlay />
                                                Start Exam
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Instructions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                            <FaInfoCircle className="text-cyan-600" />
                            Important Instructions
                        </h3>

                        <ul className="space-y-2">
                            {instructions.map((instruction, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-gray-600 text-sm"
                                >
                                    <FaCheckCircle className="text-cyan-600 mt-0.5 flex-shrink-0 text-xs" />
                                    {instruction}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FaExclamationTriangle className="text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-amber-700 font-medium text-sm">Anti-Cheat System Active</p>
                                <p className="text-amber-600 text-xs mt-1">
                                    Tab switching and window minimizing are monitored. Multiple violations may result in automatic submission.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    © 2024 IELTS Exam. Jibon Education.
                </p>
            </div>
        </div>
    );
}

export default function ExamEntryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-3xl text-cyan-600" />
            </div>
        }>
            <ExamEntryContent />
        </Suspense>
    );
}
