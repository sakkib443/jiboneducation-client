"use client";

import React, { useState, useEffect } from "react";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaCheckCircle,
    FaArrowRight,
    FaClock,
    FaInfoCircle,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { studentsAPI } from "@/lib/api";

export default function StudentExams() {
    const router = useRouter();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await studentsAPI.getMyProfile();
                if (response.success) {
                    setStudentData(response.data);
                } else {
                    setError("Failed to fetch exam data");
                }
            } catch (err) {
                console.error("Exam list error:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500 text-sm">Loading modules...</p>
            </div>
        );
    }

    const { examId, completedModules = [], paymentStatus, examDate, assignedSets = {} } = studentData;

    const moduleConfig = {
        listening: { title: "Listening", icon: FaHeadphones, description: "Test your ability to understand spoken English.", duration: "30-40 min", questions: 40 },
        reading: { title: "Reading", icon: FaBook, description: "Assess your reading comprehension skills.", duration: "60 min", questions: 40 },
        writing: { title: "Writing", icon: FaPen, description: "Evaluate your English writing proficiency.", duration: "60 min", questions: 2 },
    };

    // Build Full Sets from assignedSets.fullSets or fallback to legacy single set
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

    // Count total modules
    const totalModules = fullSets.length * 3 + extraSets.length;

    // Check completion for a specific module:setNumber combo
    const isModuleCompleted = (moduleId, setNumber) => {
        return completedModules.includes(`${moduleId}:${setNumber}`) ||
            completedModules.includes(moduleId) ||
            completedModules.includes(moduleId.toUpperCase()) ||
            completedModules.some(m => m.startsWith(`${moduleId}:`) && !setNumber);
    };

    // Check if today is exam day
    const isExamDay = () => {
        if (!examDate) return false;
        const today = new Date();
        const exam = new Date(examDate);
        return (
            today.getFullYear() === exam.getFullYear() &&
            today.getMonth() === exam.getMonth() &&
            today.getDate() === exam.getDate()
        );
    };

    const formatExamDate = (date) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const canStartExam = paymentStatus === "paid" && isExamDay();

    const handleStartModule = (moduleId, setNumber) => {
        if (!isExamDay()) {
            alert(`Your exam is scheduled for ${formatExamDate(examDate)}. Please come back on that day.`);
            return;
        }
        localStorage.setItem(
            "examSession",
            JSON.stringify({
                examId: studentData.examId,
                sessionId: studentData.examId,
                studentName: studentData.nameEnglish,
                name: studentData.nameEnglish,
                email: studentData.email,
                currentSetNumber: setNumber || undefined,
            })
        );
        router.push(`/exam/${examId}/${moduleId}${setNumber ? `?set=${setNumber}` : ''}`);
    };

    // Render a single exam card
    const renderExamCard = (moduleId, setNumber, label) => {
        const config = moduleConfig[moduleId];
        if (!config) return null;
        const completed = isModuleCompleted(moduleId, setNumber);
        const Icon = config.icon;

        return (
            <div
                key={`${moduleId}-${setNumber}`}
                className={`bg-white border rounded-md p-5 flex flex-col ${completed ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${completed ? "bg-green-100 text-green-600" : "bg-cyan-100 text-cyan-600"}`}>
                        <Icon size={16} />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800">{label || config.title}</h3>
                        {completed && (
                            <span className="text-[10px] text-green-600 font-medium uppercase">Completed</span>
                        )}
                    </div>
                </div>

                <p className="text-gray-500 text-sm mb-4 flex-1">{config.description}</p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5"><FaClock size={10} /> Duration</span>
                        <span className="text-gray-700 font-medium">{config.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5"><FaInfoCircle size={10} /> Questions</span>
                        <span className="text-gray-700 font-medium">{config.questions}</span>
                    </div>
                </div>

                {completed ? (
                    <div className="bg-green-100 text-green-700 py-2.5 rounded-md text-center text-sm font-medium flex items-center justify-center gap-2">
                        <FaCheckCircle size={12} /> Done
                    </div>
                ) : (
                    <button
                        onClick={() => handleStartModule(moduleId, setNumber)}
                        disabled={!canStartExam}
                        className={`py-2.5 rounded-md text-center text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${canStartExam
                            ? "bg-cyan-600 text-white hover:bg-cyan-700"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Start <FaArrowRight size={10} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Exam Modules</h1>
                    <p className="text-gray-500 text-sm mt-1">Complete all modules to finish your assessment</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-md px-4 py-2.5 flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Progress</p>
                        <p className="text-sm font-semibold text-cyan-600">{completedModules.length}/{totalModules}</p>
                    </div>
                    <div className="w-9 h-9 bg-cyan-100 rounded-md flex items-center justify-center">
                        <FaCheckCircle className="text-cyan-600" size={14} />
                    </div>
                </div>
            </div>

            {/* Payment/Date Warning */}
            {paymentStatus !== "paid" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-center gap-3">
                    <FaInfoCircle className="text-amber-600" />
                    <p className="text-amber-800 text-sm">
                        Your payment is pending. Please complete payment to start the exam.
                    </p>
                </div>
            ) : !isExamDay() ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-center gap-3">
                    <FaInfoCircle className="text-blue-600" />
                    <p className="text-blue-800 text-sm">
                        Your exam is scheduled for <strong>{formatExamDate(examDate)}</strong>. Please come back on that day.
                    </p>
                </div>
            ) : null}

            {/* Full Sets */}
            {fullSets.map((fs, idx) => (
                <div key={idx} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <h2 className="text-base font-semibold text-gray-800">{fs.label || `Full Set ${idx + 1}`}</h2>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {fs.listeningSetNumber && renderExamCard("listening", fs.listeningSetNumber, "Listening")}
                        {fs.readingSetNumber && renderExamCard("reading", fs.readingSetNumber, "Reading")}
                        {fs.writingSetNumber && renderExamCard("writing", fs.writingSetNumber, "Writing")}
                    </div>
                </div>
            ))}

            {/* Extra Individual Parts */}
            {extraSets.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <h2 className="text-base font-semibold text-gray-800">Extra Exams</h2>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {extraSets.map((es, idx) => (
                            renderExamCard(es.module, es.setNumber, `${moduleConfig[es.module]?.title || es.module} (Extra)`)
                        ))}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-gray-100 border border-gray-200 rounded-md p-5">
                <h4 className="font-medium text-gray-800 mb-2">Important Guidelines</h4>
                <ul className="text-gray-600 text-sm space-y-1.5">
                    <li>• Do not refresh the page or exit the browser during the exam.</li>
                    <li>• Ensure a stable internet connection before starting.</li>
                    <li>• Each module must be completed in one session.</li>
                </ul>
            </div>
        </div>
    );
}
