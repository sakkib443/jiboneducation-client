"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
    FaCheckCircle,
    FaHome,
    FaCheck,
    FaRegCalendarCheck,
    FaSpinner
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

function ResultContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const module = searchParams.get("module") || "listening";
    const [saveStatus, setSaveStatus] = useState("saving");
    const savedRef = useRef(false);

    // Save scores to backend - but we won't show them to the student here
    useEffect(() => {
        const saveExamResults = async () => {
            // If it's the final module (writing usually ends the full exam session)
            // or if it's a individual module, we save it.
            if (savedRef.current) return;

            try {
                setSaveStatus("saving");

                // Get results from localStorage
                const listeningData = localStorage.getItem(`exam_${params.examId}_listening`);
                const readingData = localStorage.getItem(`exam_${params.examId}_reading`);
                const writingData = localStorage.getItem(`exam_${params.examId}_writing`);

                // Parse
                const listening = listeningData ? JSON.parse(listeningData) : null;
                const reading = readingData ? JSON.parse(readingData) : null;
                const writing = writingData ? JSON.parse(writingData) : null;

                // Build scores object for complete registration in backend
                const scores = {};
                if (listening) {
                    scores.listening = {
                        score: listening.score || 0,
                        total: listening.total || 40,
                        band: listening.bandScore || 0
                    };
                }
                if (reading) {
                    scores.reading = {
                        score: reading.score || 0,
                        total: reading.total || 40,
                        band: reading.bandScore || 0
                    };
                }
                if (writing) {
                    scores.writing = {
                        task1Words: writing.task1Words || 0,
                        task2Words: writing.task2Words || 0,
                        band: writing.bandScore || 0
                    };
                }

                // Call backend
                savedRef.current = true;
                const response = await studentsAPI.completeExam(params.examId, scores);

                if (response.success) {
                    setSaveStatus("saved");
                    // Important: Don't clear EVERYTHING if they carry over, 
                    // but for complete exam result page, we clear session.
                    localStorage.removeItem("examSession");
                }
            } catch (error) {
                console.error("Failed to save exam results:", error);
                setSaveStatus("error");
            }
        };

        saveExamResults();
    }, [params.examId]);

    const moduleNames = {
        listening: "Listening",
        reading: "Reading",
        writing: "Writing",
        full: "Full IELTS Exam"
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200 py-6 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-xs">IE</span>
                        </div>
                        <span className="text-slate-900 font-black tracking-tight text-xl uppercase">IELTS Dashboard</span>
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Ref ID: {params.examId}
                    </div>
                </div>
            </header>

            {/* Content Container */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50/50">
                        <FaCheck className="text-3xl" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                        {moduleNames[module] || "Exam"} Submitted
                    </h1>

                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                        Your responses have been successfully recorded and sent to our examiners.
                        The official results will be processed after a through review.
                        You will be notified once your band scores are released.
                    </p>

                    {/* Status Box */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between mb-10">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Status</p>
                            <div className="flex items-center gap-2">
                                {saveStatus === "saving" ? (
                                    <>
                                        <FaSpinner className="animate-spin text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">Encrypting & Saving...</span>
                                    </>
                                ) : saveStatus === "error" ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <span className="text-sm font-bold text-rose-600">Save Failed (Syncing later)</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span className="text-sm font-bold text-slate-800">Verified & Secured</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Exam Part</p>
                            <p className="text-sm font-black text-slate-800 uppercase">{module}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                        >
                            <FaHome /> Back to Home
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                        >
                            <FaRegCalendarCheck /> Print Proof
                        </button>
                    </div>

                    <p className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        © 2024 Jibon Education · IELTS Department
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <FaSpinner className="animate-spin text-slate-400 text-3xl" />
            </div>
        }>
            <ResultContent />
        </Suspense>
    );
}
