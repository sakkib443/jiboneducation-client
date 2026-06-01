"use client";

import React, { useState, useEffect } from "react";
import {
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaLock,
    FaClock,
    FaDownload,
    FaCheckCircle,
    FaClipboardList,
    FaArrowRight,
    FaSpinner,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { studentsAPI } from "@/lib/api";

export default function StudentResults() {
    const router = useRouter();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const response = await studentsAPI.getMyProfile();
                if (response.success) {
                    setStudentData(response.data);
                } else {
                    setError("Failed to fetch results");
                }
            } catch (err) {
                console.error("Results error:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, []);

    // ==================== PDF DOWNLOAD ====================
    const handleDownloadPDF = async () => {
        if (!studentData || !studentData.scores) return;

        setDownloading(true);

        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 20;
            const contentWidth = pageWidth - margin * 2;

            const {
                nameEnglish = "N/A",
                examId = "N/A",
                examDate,
                scores,
                adminRemarks,
            } = studentData;

            // ====== COLORS ======
            const primary = [0, 131, 143];      // Teal
            const primaryLight = [0, 188, 212];  // Cyan
            const dark = [30, 41, 59];           // Slate-800
            const gray = [100, 116, 139];        // Slate-500
            const lightGray = [241, 245, 249];   // Slate-100
            const white = [255, 255, 255];
            const green = [16, 185, 129];        // Emerald
            const gold = [234, 179, 8];          // Yellow-500

            // ====== HEADER BAND ======
            doc.setFillColor(...primary);
            doc.rect(0, 0, pageWidth, 52, "F");

            // Subtle gradient overlay
            doc.setFillColor(...primaryLight);
            doc.setGState(new doc.GState({ opacity: 0.15 }));
            doc.circle(pageWidth - 20, -10, 50, "F");
            doc.circle(30, 60, 30, "F");
            doc.setGState(new doc.GState({ opacity: 1 }));

            // Header Text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(...white);
            doc.text("IELTS EXAM RESULT", margin, 22);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(200, 230, 235);
            doc.text("Jibon Education — Official Score Report", margin, 32);

            // Exam ID badge (right side)
            const badgeText = `Exam ID: ${examId}`;
            const badgeWidth = doc.getTextWidth(badgeText) + 12;
            doc.setFillColor(255, 255, 255);
            doc.setGState(new doc.GState({ opacity: 0.2 }));
            doc.roundedRect(pageWidth - margin - badgeWidth, 14, badgeWidth, 10, 2, 2, "F");
            doc.setGState(new doc.GState({ opacity: 1 }));
            doc.setFontSize(9);
            doc.setTextColor(...white);
            doc.text(badgeText, pageWidth - margin - badgeWidth + 6, 20.5);

            // Date
            const dateStr = examDate
                ? new Date(examDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })
                : "N/A";
            doc.setFontSize(8);
            doc.setTextColor(200, 230, 235);
            doc.text(`Date: ${dateStr}`, pageWidth - margin - badgeWidth + 6, 28);

            let y = 64;

            // ====== CANDIDATE INFO ======
            doc.setFillColor(...lightGray);
            doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...gray);
            doc.text("CANDIDATE NAME", margin + 8, y + 6);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...dark);
            doc.text(nameEnglish, margin + 8, y + 14);

            // Verified badge
            doc.setFillColor(...green);
            doc.circle(pageWidth - margin - 12, y + 9, 4, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(...white);
            doc.text("✓", pageWidth - margin - 13.5, y + 11);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...green);
            doc.text("Verified", pageWidth - margin - 6, y + 10.5);

            y += 28;

            // ====== OVERALL BAND SCORE ======
            const overallBand = scores?.overall || 0;

            // Overall score box
            doc.setFillColor(...primary);
            doc.roundedRect(margin, y, contentWidth, 38, 4, 4, "F");

            // Decorative circles
            doc.setFillColor(...primaryLight);
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.circle(margin + 20, y + 40, 25, "F");
            doc.circle(pageWidth - margin - 15, y - 5, 20, "F");
            doc.setGState(new doc.GState({ opacity: 1 }));

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(200, 230, 235);
            doc.text("OVERALL BAND SCORE", margin + 12, y + 12);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(32);
            doc.setTextColor(...white);
            doc.text(overallBand.toFixed(1), margin + 12, y + 32);

            // Right side label
            const getBandLabel = (band) => {
                if (band >= 8.5) return "Expert User";
                if (band >= 7.5) return "Very Good User";
                if (band >= 6.5) return "Competent User";
                if (band >= 5.5) return "Modest User";
                if (band >= 4.5) return "Limited User";
                return "Basic User";
            };

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...white);
            const bandLabel = getBandLabel(overallBand);
            doc.text(bandLabel, pageWidth - margin - doc.getTextWidth(bandLabel) - 12, y + 22);

            // Gold star icon area
            doc.setFillColor(...gold);
            doc.setGState(new doc.GState({ opacity: 0.3 }));
            doc.circle(pageWidth - margin - 12, y + 10, 5, "F");
            doc.setGState(new doc.GState({ opacity: 1 }));
            doc.setFontSize(9);
            doc.setTextColor(...gold);
            doc.text("★", pageWidth - margin - 14, y + 12);

            y += 48;

            // ====== MODULE SCORES ======
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...dark);
            doc.text("MODULE SCORES", margin, y);
            y += 3;

            // Divider line
            doc.setDrawColor(220, 220, 230);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            const modules = [
                {
                    name: "Listening",
                    band: scores?.listening?.band || 0,
                    raw: scores?.listening?.raw,
                    total: scores?.listening?.totalQuestions || 40,
                    icon: "🎧",
                    color: [59, 130, 246], // Blue
                },
                {
                    name: "Reading",
                    band: scores?.reading?.band || 0,
                    raw: scores?.reading?.raw,
                    total: scores?.reading?.totalQuestions || 40,
                    icon: "📖",
                    color: [139, 92, 246], // Purple
                },
                {
                    name: "Writing",
                    band: scores?.writing?.overallBand || 0,
                    task1: scores?.writing?.task1Band,
                    task2: scores?.writing?.task2Band,
                    icon: "✍️",
                    color: [236, 72, 153], // Pink
                },
                ...(scores?.speaking?.band > 0
                    ? [{
                        name: "Speaking",
                        band: scores.speaking.band,
                        manual: true,
                        icon: "🎤",
                        color: [249, 115, 22], // Orange
                    }]
                    : []),
            ];

            const cardWidth = (contentWidth - 5 * (modules.length - 1)) / modules.length;

            modules.forEach((mod, index) => {
                const x = margin + index * (cardWidth + 5);

                // Card background
                doc.setFillColor(...white);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(x, y, cardWidth, 52, 3, 3, "FD");

                // Color accent line at top
                doc.setFillColor(...mod.color);
                doc.roundedRect(x, y, cardWidth, 3, 3, 3, "F");
                doc.setFillColor(...white);
                doc.rect(x, y + 1.5, cardWidth, 1.5, "F");

                // Icon
                doc.setFontSize(14);
                doc.text(mod.icon, x + 5, y + 13);

                // Module name
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(...dark);
                doc.text(mod.name, x + 14, y + 12);

                // Band score (large)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.setTextColor(...mod.color);
                const bandText = mod.band.toFixed(1);
                doc.text(bandText, x + cardWidth / 2 - doc.getTextWidth(bandText) / 2, y + 32);

                // Label
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(...gray);
                const label = "BAND SCORE";
                doc.text(label, x + cardWidth / 2 - doc.getTextWidth(label) / 2, y + 37);

                // Details
                if (mod.raw !== undefined) {
                    doc.setFontSize(7);
                    doc.setTextColor(...gray);
                    const detail = `${mod.raw}/${mod.total} correct`;
                    doc.text(detail, x + cardWidth / 2 - doc.getTextWidth(detail) / 2, y + 46);
                } else if (mod.task1 !== undefined) {
                    doc.setFontSize(7);
                    doc.setTextColor(...gray);
                    const detail = `T1: ${mod.task1 || "—"} | T2: ${mod.task2 || "—"}`;
                    doc.text(detail, x + cardWidth / 2 - doc.getTextWidth(detail) / 2, y + 46);
                } else if (mod.manual) {
                    doc.setFontSize(7);
                    doc.setTextColor(...gray);
                    const detail = "Examiner assessed";
                    doc.text(detail, x + cardWidth / 2 - doc.getTextWidth(detail) / 2, y + 46);
                }
            });

            y += 62;

            // ====== SCORE BREAKDOWN TABLE ======
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...dark);
            doc.text("DETAILED BREAKDOWN", margin, y);
            y += 3;

            doc.setDrawColor(220, 220, 230);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;

            // Table header
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...gray);
            doc.text("MODULE", margin + 6, y + 7);
            doc.text("BAND SCORE", margin + 70, y + 7);
            doc.text("RAW SCORE", margin + 110, y + 7);
            doc.text("PERCENTAGE", margin + 145, y + 7);
            y += 14;

            // Table rows
            const rows = [
                {
                    name: "Listening",
                    band: scores?.listening?.band || 0,
                    raw: scores?.listening?.raw,
                    total: scores?.listening?.totalQuestions || 40,
                },
                {
                    name: "Reading",
                    band: scores?.reading?.band || 0,
                    raw: scores?.reading?.raw,
                    total: scores?.reading?.totalQuestions || 40,
                },
                {
                    name: "Writing",
                    band: scores?.writing?.overallBand || 0,
                    raw: null,
                    total: null,
                    extra: `Task 1: ${scores?.writing?.task1Band || "—"} / Task 2: ${scores?.writing?.task2Band || "—"}`,
                },
                ...(scores?.speaking?.band > 0
                    ? [{
                        name: "Speaking",
                        band: scores.speaking.band,
                        raw: null,
                        total: null,
                        extra: "Examiner assessed (live test)",
                    }]
                    : []),
            ];

            rows.forEach((row, i) => {
                if (i % 2 === 0) {
                    doc.setFillColor(252, 252, 254);
                    doc.rect(margin, y - 4, contentWidth, 12, "F");
                }

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(...dark);
                doc.text(row.name, margin + 6, y + 3);

                doc.setFont("helvetica", "bold");
                doc.setTextColor(...primary);
                doc.text(row.band.toFixed(1), margin + 76, y + 3);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(...dark);
                if (row.raw !== null) {
                    doc.text(`${row.raw}/${row.total}`, margin + 115, y + 3);
                    const pct = ((row.raw / row.total) * 100).toFixed(0) + "%";
                    doc.text(pct, margin + 152, y + 3);
                } else {
                    doc.setFontSize(7.5);
                    doc.setTextColor(...gray);
                    doc.text(row.extra, margin + 110, y + 3);
                }

                y += 12;
            });

            // Overall row
            doc.setFillColor(...primary);
            doc.roundedRect(margin, y - 3, contentWidth, 12, 2, 2, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...white);
            doc.text("OVERALL", margin + 6, y + 4);
            doc.setFontSize(12);
            doc.text(overallBand.toFixed(1), margin + 74, y + 4.5);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(getBandLabel(overallBand), margin + 110, y + 4);

            y += 18;

            // ====== EXAMINER REMARKS ======
            if (adminRemarks) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.setTextColor(...dark);
                doc.text("EXAMINER'S REMARKS", margin, y);
                y += 3;

                doc.setDrawColor(220, 220, 230);
                doc.setLineWidth(0.3);
                doc.line(margin, y, pageWidth - margin, y);
                y += 6;

                doc.setFillColor(250, 251, 252);
                doc.setDrawColor(226, 232, 240);

                const splitRemarks = doc.splitTextToSize(adminRemarks, contentWidth - 16);
                const remarksHeight = splitRemarks.length * 5 + 8;

                doc.roundedRect(margin, y, contentWidth, remarksHeight, 3, 3, "FD");

                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(...gray);
                doc.text(splitRemarks, margin + 8, y + 7);

                y += remarksHeight + 8;
            }

            // ====== FOOTER ======
            const footerY = pageHeight - 20;

            doc.setDrawColor(220, 220, 230);
            doc.setLineWidth(0.3);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...gray);
            doc.text("This is a computer-generated report from Jibon Education IELTS Exam Portal.", margin, footerY);
            doc.text(
                `Generated on: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
                margin,
                footerY + 4
            );

            // Right side
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(...primary);
            const footerRight = "www.jiboneducation.com";
            doc.text(footerRight, pageWidth - margin - doc.getTextWidth(footerRight), footerY);

            // Official stamp area
            doc.setFillColor(...primary);
            doc.setGState(new doc.GState({ opacity: 0.08 }));
            doc.circle(pageWidth - margin - 20, footerY - 15, 12, "F");
            doc.setGState(new doc.GState({ opacity: 1 }));
            doc.setFontSize(6);
            doc.setTextColor(...primary);
            doc.text("OFFICIAL", pageWidth - margin - 26, footerY - 16);
            doc.text(" REPORT", pageWidth - margin - 26, footerY - 13);

            // ====== SAVE ======
            doc.save(`IELTS_Result_${examId}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500 text-sm">Loading results...</p>
            </div>
        );
    }

    const {
        scores,
        resultsPublished,
        adminRemarks,
        nameEnglish,
        examId,
        examDate,
        completedModules = [],
        assignedSets = {}
    } = studentData || {};

    const totalExpectedModules = 3; // base module count
    const isAllCompleted = completedModules.length >= totalExpectedModules;
    const hasStartedExam = completedModules.length > 0;

    // Build Full Sets from assignedSets
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
    const extraSetsResult = assignedSets.extraSets || [];

    // Get score for a module+set combo
    const getScore = (moduleId, setNum) => {
        if (setNum) {
            const setKey = `${moduleId}_${setNum}`;
            const perSet = scores?.[setKey] || null;
            // If per-set score exists, use it; otherwise check if this is the only/first set
            if (perSet) return perSet;
            // Only fallback to base score if this setNum matches the first/legacy set number
            const legacySetNum = assignedSets?.[`${moduleId}SetNumber`];
            if (legacySetNum === setNum || (!legacySetNum && fullSets.length <= 1)) {
                return scores?.[moduleId] || {};
            }
            // This set hasn't been taken yet - return empty
            return {};
        }
        return scores?.[moduleId] || {};
    };

    // Calculate per-Full-Set overall
    const calcFullSetOverall = (fs) => {
        const lScore = getScore('listening', fs.listeningSetNumber);
        const rScore = getScore('reading', fs.readingSetNumber);
        const wScore = getScore('writing', fs.writingSetNumber);
        const bands = [lScore?.band || 0, rScore?.band || 0, wScore?.overallBand || 0].filter(b => b > 0);
        if (bands.length === 0) return 0;
        const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
        return Math.round(avg * 2) / 2;
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

    const handleStartExam = () => {
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
            })
        );
        router.push(`/exam/${examId}`);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">Exam Results</h1>
                <p className="text-gray-500 text-sm mt-1">Your IELTS assessment scores</p>
            </div>

            {/* Case 1: Results Published - Show Scores */}
            {resultsPublished ? (
                <div className="space-y-4">
                    {/* Overall Band Card */}
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Candidate: {nameEnglish}</p>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Congratulations on completing your exam!
                                </h2>
                            </div>
                            <div className="bg-cyan-600 text-white px-6 py-4 rounded-md text-center min-w-[100px]">
                                <p className="text-[10px] uppercase tracking-wide opacity-80">Overall</p>
                                <p className="text-3xl font-bold">{scores?.overall || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Module Scores - Full Set Grouped */}
                    {fullSets.map((fs, idx) => {
                        const fsOverall = calcFullSetOverall(fs);
                        const lScore = getScore('listening', fs.listeningSetNumber);
                        const rScore = getScore('reading', fs.readingSetNumber);
                        const wScore = getScore('writing', fs.writingSetNumber);
                        return (
                            <div key={idx}>
                                {fullSets.length > 1 && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <h3 className="text-sm font-bold text-gray-700">{fs.label || `Full Set ${idx + 1}`}</h3>
                                        {fsOverall > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                                                Overall: {fsOverall}
                                            </span>
                                        )}
                                        <div className="h-px flex-1 bg-gray-200"></div>
                                    </div>
                                )}
                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    {fs.listeningSetNumber && (
                                        <ScoreCard title="Listening" icon={FaHeadphones} band={lScore?.band} raw={lScore?.raw || lScore?.correctAnswers} total={40} />
                                    )}
                                    {fs.readingSetNumber && (
                                        <ScoreCard title="Reading" icon={FaBook} band={rScore?.band} raw={rScore?.raw || rScore?.correctAnswers} total={40} />
                                    )}
                                    {fs.writingSetNumber && (
                                        <ScoreCard title="Writing" icon={FaPen} band={wScore?.overallBand} task1={wScore?.task1Band} task2={wScore?.task2Band} />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Speaking — examiner-graded (manual, not part of the online sets) */}
                    {scores?.speaking?.band > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <h3 className="text-sm font-bold text-gray-700">Speaking</h3>
                                <div className="h-px flex-1 bg-gray-200"></div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <ScoreCard title="Speaking" icon={FaMicrophone} band={scores.speaking.band} manual />
                            </div>
                        </div>
                    )}

                    {/* Extra Parts Results */}
                    {extraSetsResult.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                <h3 className="text-sm font-bold text-gray-700">Extra Exams</h3>
                                <div className="h-px flex-1 bg-gray-200"></div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                {extraSetsResult.map((es, idx) => {
                                    const eScore = getScore(es.module, es.setNumber);
                                    const modTitle = es.module === 'listening' ? 'Listening' : es.module === 'reading' ? 'Reading' : 'Writing';
                                    const ModIcon = es.module === 'listening' ? FaHeadphones : es.module === 'reading' ? FaBook : FaPen;
                                    return es.module === 'writing'
                                        ? <ScoreCard key={idx} title={`${modTitle} (Extra)`} icon={ModIcon} band={eScore?.overallBand} task1={eScore?.task1Band} task2={eScore?.task2Band} />
                                        : <ScoreCard key={idx} title={`${modTitle} (Extra)`} icon={ModIcon} band={eScore?.band} raw={eScore?.raw || eScore?.correctAnswers} total={40} />;
                                })}
                            </div>
                        </div>
                    )}

                    {/* Examiner Remarks */}
                    {adminRemarks && (
                        <div className="bg-white border border-gray-200 rounded-md p-5">
                            <h4 className="font-medium text-gray-800 mb-3">Examiner's Remarks</h4>
                            <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
                                <p className="text-gray-600 text-sm italic">"{adminRemarks}"</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaCheckCircle className="text-green-500" size={12} />
                            <span>Results verified and published</span>
                        </div>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {downloading ? (
                                <>
                                    <FaSpinner className="animate-spin" size={12} /> Generating...
                                </>
                            ) : (
                                <>
                                    <FaDownload size={12} /> Download Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : isAllCompleted ? (
                /* Case 2: Exam Completed but Results Not Published */
                <div className="bg-white border border-gray-200 rounded-md p-8">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-amber-100 rounded-md flex items-center justify-center mx-auto mb-4">
                            <FaClock className="text-amber-600 text-2xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Results Under Review</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Your exam has been submitted and is being evaluated. Results are typically published within 24-48 hours.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-xs font-medium">
                                    Pending
                                </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Exam ID</p>
                                <p className="text-sm font-medium text-gray-700">{examId}</p>
                            </div>
                        </div>

                        <div className="bg-cyan-50 border border-cyan-100 rounded-md p-4">
                            <p className="text-cyan-700 text-sm">
                                <strong>Tip:</strong> Check back later or contact admin for updates.
                            </p>
                        </div>
                    </div>
                </div>
            ) : hasStartedExam ? (
                /* Case 3: Exam In Progress */
                <div className="bg-white border border-gray-200 rounded-md p-8">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-4">
                            <FaClipboardList className="text-blue-600 text-2xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Exam In Progress</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            You need to complete all 3 modules (Listening, Reading, Writing) to get your results.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-gray-700 font-medium">{completedModules.length}/{totalExpectedModules} completed</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all"
                                    style={{ width: `${(completedModules.length / totalExpectedModules) * 100}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleStartExam}
                            className="bg-cyan-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                            Continue Exam <FaArrowRight size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Case 4: Exam Not Started */
                <div className="bg-white border border-gray-200 rounded-md p-8">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mx-auto mb-4">
                            <FaClipboardList className="text-gray-500 text-2xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results Yet</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Your exam is scheduled for {formatExamDate(examDate)}.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Exam ID</p>
                            <p className="text-sm font-medium text-gray-700">{examId}</p>
                        </div>

                        <button
                            onClick={handleStartExam}
                            className="bg-cyan-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                            Start Exam <FaArrowRight size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const ScoreCard = ({ title, icon: Icon, band, raw, total, task1, task2, manual, examinerGraded }) => (
    <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-600">
                    <Icon size={14} />
                </div>
                <span className="font-medium text-gray-800">{title}</span>
            </div>
        </div>

        <div className="text-center py-3 bg-gray-50 rounded-md border border-gray-100 mb-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Band Score</p>
            <p className="text-2xl font-bold text-gray-800">
                {band !== undefined ? band.toFixed(1) : "—"}
            </p>
        </div>

        {raw !== undefined ? (
            <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Correct Answers</span>
                    <span className="font-medium">{raw}/{total}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-600 rounded-full"
                        style={{ width: `${(raw / total) * 100}%` }}
                    />
                </div>
            </div>
        ) : manual ? (
            <div className="text-center py-1.5">
                <p className="text-xs text-gray-400">Examiner assessed — live speaking test</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-md p-2.5 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase">Task 1</p>
                    <p className="font-semibold text-gray-800">{task1 || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-2.5 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase">Task 2</p>
                    <p className="font-semibold text-gray-800">{task2 || "—"}</p>
                </div>
            </div>
        )}
        {examinerGraded && (
            <div className="text-center">
                <p className="text-xs text-gray-400">Examiner Graded</p>
            </div>
        )}
    </div>
);
