"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaArrowRight,
    FaCheck,
    FaClock
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

export default function FullExamPage() {
    const params = useParams();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentModule, setCurrentModule] = useState(0);
    const [moduleResults, setModuleResults] = useState({});
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const modules = [
        { id: "listening", name: "Listening", icon: <FaHeadphones />, duration: 40, questions: 40 },
        { id: "reading", name: "Reading", icon: <FaBook />, duration: 60, questions: 40 },
        { id: "writing", name: "Writing", icon: <FaPen />, duration: 60, questions: 2 }
    ];

    useEffect(() => {
        if (!isClient) return;

        const loadAndCheck = async () => {
            try {
                // Load session to check completion
                const storedSession = localStorage.getItem("examSession");
                if (storedSession) {
                    const parsed = JSON.parse(storedSession);

                    // Check localStorage first
                    if (parsed && parsed.completedModules && Array.isArray(parsed.completedModules) && parsed.completedModules.length >= 3) {
                        router.push(`/exam/${params.examId}`);
                        return;
                    }

                    // Also verify with DATABASE
                    try {
                        const response = await studentsAPI.verifyExamId(parsed.examId);
                        if (response.success && response.data) {
                            const dbCompletedModules = response.data.completedModules || [];
                            if (dbCompletedModules.length >= 3) {
                                parsed.completedModules = dbCompletedModules;
                                localStorage.setItem("examSession", JSON.stringify(parsed));
                                router.push(`/exam/${params.examId}`);
                                return;
                            }
                        }
                    } catch (err) {
                        console.error("Completion verify error:", err);
                    }
                }

                // Check local results for each module
                const checkResults = () => {
                    const results = {};
                    try {
                        const listening = localStorage.getItem(`exam_${params.examId}_listening`);
                        if (listening) results.listening = JSON.parse(listening);

                        const reading = localStorage.getItem(`exam_${params.examId}_reading`);
                        if (reading) results.reading = JSON.parse(reading);

                        const writing = localStorage.getItem(`exam_${params.examId}_writing`);
                        if (writing) results.writing = JSON.parse(writing);

                        const speaking = localStorage.getItem(`exam_${params.examId}_speaking`);
                        if (speaking) results.speaking = JSON.parse(speaking);

                        setModuleResults(results);

                        if (!results.listening) {
                            setCurrentModule(0);
                        } else if (!results.reading) {
                            setCurrentModule(1);
                        } else if (!results.writing) {
                            setCurrentModule(2);
                        } else {
                            router.push(`/exam/${params.examId}/result?module=full`);
                        }
                    } catch (e) {
                        console.error("Error parsing module results:", e);
                    }
                };

                checkResults();
                setIsLoading(false);

                const interval = setInterval(checkResults, 2000);
                return () => clearInterval(interval);
            } catch (error) {
                console.error("Initialization error:", error);
                setIsLoading(false);
            }
        };

        loadAndCheck();
    }, [isClient, params.examId, router]);

    useEffect(() => {
        if (isLoading || !isClient) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            startCurrentModule();
        }
    }, [countdown, isLoading, isClient]);

    const startCurrentModule = () => {
        const module = modules[currentModule];
        if (module && params.examId) {
            router.push(`/exam/${params.examId}/${module.id}`);
        }
    };

    const currentMod = modules[currentModule] || modules[0];

    if (!isClient || isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <FaClock className="animate-spin text-4xl text-cyan-600 mx-auto mb-4" />
                    <p className="text-gray-600">Preparing exam session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-3 px-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-cyan-600 font-bold text-xl">IELTS</span>
                        <span className="text-gray-600">| Full Exam</span>
                    </div>
                    <span className="text-gray-400 text-sm">Exam ID: {params.examId}</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            {modules.map((mod, idx) => {
                                const isComplete = moduleResults[mod.id];
                                const isCurrent = idx === currentModule;

                                return (
                                    <div key={mod.id} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isComplete
                                            ? "bg-green-500 text-white"
                                            : isCurrent
                                                ? "bg-cyan-100 border-2 border-cyan-600 text-cyan-600"
                                                : "bg-gray-100 text-gray-400"
                                            }`}>
                                            {isComplete ? <FaCheck /> : mod.icon}
                                        </div>
                                        {idx < modules.length - 1 && (
                                            <div className={`w-16 md:w-24 h-1 mx-2 rounded ${isComplete ? "bg-green-500" : "bg-gray-200"
                                                }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            {modules.map(mod => (
                                <span key={mod.id}>{mod.name}</span>
                            ))}
                        </div>
                    </div>

                    {/* Transition Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                        <div className="w-20 h-20 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl text-cyan-600">{currentMod.icon}</span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-1">
                            {currentModule === 0 ? 'Starting' : 'Next Section'}
                        </h1>
                        <h2 className="text-xl font-bold text-cyan-600 mb-4">
                            {currentMod.name} Test
                        </h2>

                        <div className="flex items-center justify-center gap-6 mb-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{currentMod.duration}</p>
                                <p className="text-gray-500 text-sm">minutes</p>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{currentMod.questions}</p>
                                <p className="text-gray-500 text-sm">questions</p>
                            </div>
                        </div>

                        {/* Countdown */}
                        <div className="mb-6">
                            <p className="text-gray-500 mb-2">Starting in</p>
                            <div className="w-16 h-16 bg-cyan-50 border-2 border-cyan-600 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl font-bold text-cyan-600">{countdown}</span>
                            </div>
                        </div>

                        <button
                            onClick={startCurrentModule}
                            className="inline-flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded font-semibold hover:bg-cyan-700 transition-colors cursor-pointer"
                        >
                            Start Now
                            <FaArrowRight />
                        </button>

                        {/* Previous Results - Show completion only, no scores */}
                        {Object.keys(moduleResults).length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-gray-500 text-sm mb-3">Completed Sections</p>
                                <div className="flex justify-center gap-4">
                                    {modules.map(mod => {
                                        const result = moduleResults[mod.id];
                                        if (!result) return null;
                                        return (
                                            <div key={mod.id} className="bg-green-50 border border-green-200 rounded px-4 py-2">
                                                <p className="text-xs text-gray-500">{mod.name}</p>
                                                <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                                                    <FaCheck className="text-xs" /> Submitted
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-3 px-4">
                <div className="max-w-4xl mx-auto text-center text-gray-400 text-sm">
                    IELTS Full Exam Mode • Jibon Education
                </div>
            </footer>
        </div>
    );
}
