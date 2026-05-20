"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUpload, FaCheck, FaExclamationTriangle, FaSpinner, FaCode, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { listeningAPI } from "@/lib/api";
import Link from "next/link";

export default function ListeningUploadPage() {
    const router = useRouter();
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [parsed, setParsed] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleParse = () => {
        setError("");
        setSuccess("");
        setParsed(null);
        try {
            const data = JSON.parse(jsonText.trim());
            // Support both single object and array
            const tests = Array.isArray(data) ? data : [data];
            setParsed(tests);
            setShowPreview(true);
        } catch (e) {
            setError("❌ Invalid JSON: " + e.message);
        }
    };

    const handleUpload = async () => {
        if (!parsed) return;
        setLoading(true);
        setError("");
        setSuccess("");
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const test of parsed) {
            try {
                const response = await listeningAPI.create(test);
                if (response.success) {
                    successCount++;
                } else {
                    failCount++;
                    errors.push(`Test "${test.title || test.testId}": ${response.message}`);
                }
            } catch (err) {
                failCount++;
                errors.push(`Test "${test.title || test.testId}": ${err.message}`);
            }
        }

        setLoading(false);
        if (successCount > 0) {
            setSuccess(`✅ Successfully uploaded ${successCount} test${successCount > 1 ? "s" : ""}!${failCount > 0 ? ` (${failCount} failed)` : ""}`);
            if (failCount === 0) {
                setTimeout(() => router.push("/dashboard/admin/listening"), 1500);
            }
        }
        if (errors.length > 0) {
            setError("Errors:\n" + errors.join("\n"));
        }
    };

    const loadExample = () => {
        const example = {
            testId: "LISTENING_001",
            testNumber: 1,
            title: "Listening Test 01",
            description: "IELTS Academic Listening Test",
            source: "Cambridge IELTS 15 Test 1",
            mainAudioUrl: "",
            audioDuration: 1800,
            difficulty: "medium",
            totalQuestions: 40,
            totalMarks: 40,
            duration: 40,
            sections: [
                {
                    sectionNumber: 1,
                    title: "Part 1",
                    context: "A conversation between two people about booking a hotel room.",
                    instructions: "Questions 1-10",
                    questions: [
                        {
                            blockType: "instruction",
                            content: "Questions 1-5<br/>Complete the form below.<br/>Write ONE WORD AND/OR A NUMBER for each answer."
                        },
                        {
                            blockType: "question",
                            questionNumber: 1,
                            questionType: "form-completion",
                            questionText: "Name: ________",
                            correctAnswer: "Johnson",
                            marks: 1, wordLimit: 1
                        },
                        {
                            blockType: "question",
                            questionNumber: 2,
                            questionType: "form-completion",
                            questionText: "Room type: ________",
                            correctAnswer: "double",
                            marks: 1, wordLimit: 1
                        }
                    ]
                }
            ]
        };
        setJsonText(JSON.stringify(example, null, 2));
        setParsed(null);
        setShowPreview(false);
    };

    const getSectionSummary = (test) => {
        const totalQ = test.sections?.reduce((sum, s) =>
            sum + (s.questions?.filter(q => q.blockType !== "instruction").length || 0), 0) || 0;
        return {
            parts: test.sections?.length || 0,
            questions: totalQ,
        };
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/listening" className="p-2 text-gray-400 hover:text-gray-700 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                    <FaArrowLeft size={14} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUpload className="text-indigo-600" size={20} />
                        Upload Listening Test (JSON)
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">JSON paste করুন, validate করুন, তারপর upload করুন</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* JSON Editor */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <FaCode className="text-gray-500" size={13} />
                            <span className="text-sm font-semibold text-gray-700">JSON Data</span>
                            {parsed && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    ✓ Valid — {parsed.length} test{parsed.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={loadExample}
                            className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                            Load Example
                        </button>
                    </div>
                    <textarea
                        className="w-full p-4 font-mono text-sm text-gray-800 bg-gray-900 text-green-400 focus:outline-none resize-none"
                        rows={22}
                        value={jsonText}
                        onChange={e => { setJsonText(e.target.value); setParsed(null); setShowPreview(false); }}
                        placeholder='Paste your JSON here...&#10;&#10;Single test: { "testId": "LISTENING_001", ... }&#10;Multiple tests: [ { ... }, { ... } ]'
                        spellCheck={false}
                    />
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <span className="text-xs text-gray-400">{jsonText.length} characters</span>
                        <button
                            type="button"
                            onClick={handleParse}
                            disabled={!jsonText.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Validate JSON
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <FaExclamationTriangle className="text-red-500 mt-0.5 shrink-0" />
                            <pre className="text-red-700 text-sm whitespace-pre-wrap font-mono">{error}</pre>
                        </div>
                    </div>
                )}

                {/* Success Display */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                            <FaCheck className="text-green-500" />
                            <span className="text-green-700 text-sm font-medium">{success}</span>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {parsed && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <FaCheck className="text-green-600" size={12} />
                                <span className="text-sm font-semibold text-green-800">
                                    ✓ JSON Valid — {parsed.length} test{parsed.length > 1 ? "s" : ""} ready to upload
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-green-700 text-xs">
                                {showPreview ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
                                {showPreview ? "Hide" : "Show"} Preview
                            </div>
                        </button>

                        {showPreview && (
                            <div className="p-4 space-y-3">
                                {parsed.map((test, idx) => {
                                    const { parts, questions } = getSectionSummary(test);
                                    return (
                                        <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{test.testId}</span>
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Test #{test.testNumber}</span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-800 mt-1">{test.title}</h3>
                                                    {test.source && <p className="text-xs text-gray-500 mt-0.5">📚 {test.source}</p>}
                                                </div>
                                                <div className="text-right text-xs text-gray-500 space-y-1">
                                                    <div>{parts} parts</div>
                                                    <div>{questions} questions</div>
                                                    <div className={`font-medium ${test.difficulty === "easy" ? "text-green-600" : test.difficulty === "hard" ? "text-red-600" : "text-amber-600"}`}>
                                                        {test.difficulty || "medium"}
                                                    </div>
                                                </div>
                                            </div>
                                            {test.sections && (
                                                <div className="flex gap-2 mt-3 flex-wrap">
                                                    {test.sections.map((sec, sIdx) => {
                                                        const qCount = sec.questions?.filter(q => q.blockType !== "instruction").length || 0;
                                                        return (
                                                            <span key={sIdx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                                                Part {sec.sectionNumber}: {qCount}Q
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Ready to save {parsed.length} test{parsed.length > 1 ? "s" : ""} to the database
                            </span>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 cursor-pointer"
                            >
                                {loading ? <FaSpinner className="animate-spin" size={13} /> : <FaUpload size={13} />}
                                {loading ? "Uploading..." : `Upload ${parsed.length > 1 ? `${parsed.length} Tests` : "Test"}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Guide */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-amber-800 mb-3">📋 JSON Structure Guide</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs text-amber-700">
                        <div>
                            <p className="font-semibold mb-1">Required fields:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                                <li><code>testId</code> — unique ID (e.g., "LISTENING_001")</li>
                                <li><code>testNumber</code> — number (e.g., 1)</li>
                                <li><code>title</code> — test title</li>
                                <li><code>sections</code> — array of 4 parts</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Question blockTypes:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                                <li><code>"instruction"</code> — heading/instruction block</li>
                                <li><code>"question"</code> — actual question</li>
                            </ul>
                            <p className="font-semibold mt-2 mb-1">Question types:</p>
                            <p className="text-amber-600">form-completion, note-completion, table-completion, multiple-choice, matching, short-answer...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
