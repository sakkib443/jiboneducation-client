"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaArrowLeft, FaSpinner, FaSave, FaBook, FaTimes, FaCheck,
    FaCode, FaCopy, FaEye, FaEyeSlash
} from "react-icons/fa";
import { readingAPI } from "@/lib/api";
import SectionEditor from "@/components/reading/SectionEditor";
import LivePreview from "@/components/reading/LivePreview";
import { generateQuestionsFromGroups } from "@/lib/readingHelpers";

// ═══════════════════════════════════════════
// EMPTY SECTION TEMPLATE
// ═══════════════════════════════════════════
function emptySection(num) {
    return {
        sectionNumber: num,
        title: "",
        passage: "",
        passageSource: "",
        paragraphs: [],
        instructions: "",
        imageUrl: "",
        questions: [],
        questionGroups: [],
    };
}

// ═══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════
export default function CreateReadingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeSection, setActiveSection] = useState(0);
    const [showPreview, setShowPreview] = useState(true);
    const [editTestNumber, setEditTestNumber] = useState(null);
    const [splitPercent, setSplitPercent] = useState(50);
    const isDragging = useRef(false);
    const containerRef = useRef(null);

    // Drag handlers for resizable split
    const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setSplitPercent(Math.min(80, Math.max(20, pct)));
        };
        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        title: "", description: "", testType: "academic",
        source: "", difficulty: "medium", duration: 60,
    });

    // Sections state — 3 sections for IELTS Reading
    const [sections, setSections] = useState([
        emptySection(1), emptySection(2), emptySection(3),
    ]);

    // JSON modal
    const [showJson, setShowJson] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [copied, setCopied] = useState(false);

    // Summary panel
    const [showSummary, setShowSummary] = useState(false);

    // ═══ Fetch data for edit mode ═══
    useEffect(() => {
        if (!editId) return;
        const fetchData = async () => {
            setFetchLoading(true);
            try {
                const response = await readingAPI.getById(editId, true);
                if (response.success && response.data) {
                    const data = response.data;
                    setIsEditMode(true);
                    setEditTestNumber(data.testNumber || null);
                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        testType: data.testType || "academic",
                        source: data.source || "",
                        difficulty: data.difficulty || "medium",
                        duration: data.duration || 60,
                    });
                    if (data.sections && data.sections.length > 0) {
                        setSections(data.sections.map((s, i) => ({
                            sectionNumber: s.sectionNumber || i + 1,
                            title: s.title || "",
                            passage: s.passage || "",
                            passageSource: s.passageSource || "",
                            paragraphs: s.paragraphs || [],
                            instructions: s.instructions || "",
                            imageUrl: s.imageUrl || "",
                            questions: s.questions || [],
                            questionGroups: s.questionGroups || [],
                        })));
                    }
                }
            } catch (err) {
                setError("Failed to fetch reading test data");
                console.error(err);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchData();
    }, [editId]);

    // ═══ Update section ═══
    const updateSection = (idx, updated) => {
        setSections(prev => prev.map((s, i) => i === idx ? updated : s));
    };

    // ═══ JSON Export ═══
    const handleJsonExport = () => {
        const fullData = { ...formData, sections };
        setJsonText(JSON.stringify(fullData, null, 2));
        setShowJson(true);
        setJsonError("");
    };

    // ═══ JSON Import ═══
    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (parsed.title !== undefined) setFormData(prev => ({ ...prev, title: parsed.title }));
            if (parsed.description !== undefined) setFormData(prev => ({ ...prev, description: parsed.description }));
            if (parsed.testType) setFormData(prev => ({ ...prev, testType: parsed.testType }));
            if (parsed.source !== undefined) setFormData(prev => ({ ...prev, source: parsed.source }));
            if (parsed.difficulty) setFormData(prev => ({ ...prev, difficulty: parsed.difficulty }));
            if (parsed.duration) setFormData(prev => ({ ...prev, duration: parsed.duration }));
            if (parsed.sections && Array.isArray(parsed.sections)) {
                setSections(parsed.sections.map((s, i) => ({
                    sectionNumber: s.sectionNumber || i + 1,
                    title: s.title || "", passage: s.passage || "",
                    passageSource: s.passageSource || "", paragraphs: s.paragraphs || [],
                    instructions: s.instructions || "", imageUrl: s.imageUrl || "",
                    questions: s.questions || [], questionGroups: s.questionGroups || [],
                })));
            }
            setShowJson(false);
            setJsonError("");
            setSuccess("JSON imported successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setJsonError(err.message);
        }
    };

    // ═══ Copy JSON ═══
    const handleCopyJson = () => {
        navigator.clipboard.writeText(jsonText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ═══ Submit ═══
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError("Title is required");
            return;
        }
        for (let i = 0; i < sections.length; i++) {
            if (!sections[i].title.trim()) {
                setError(`Section ${i + 1} title is required`);
                return;
            }
            if (!sections[i].passage.trim()) {
                setError(`Section ${i + 1} passage is required`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            // Auto-generate questions from questionGroups
            const processedSections = sections.map(s => {
                const autoQuestions = generateQuestionsFromGroups(s.questionGroups || []);
                // Merge: use auto-generated if no manual questions, otherwise keep manual
                const questions = autoQuestions.length > 0 ? autoQuestions : s.questions;
                return { ...s, questions };
            });

            const payload = {
                ...formData,
                sections: processedSections.filter(s => s.title.trim() || s.passage.trim()),
            };

            let response;
            if (isEditMode && editId) {
                response = await readingAPI.update(editId, payload);
            } else {
                response = await readingAPI.create(payload);
            }

            if (response.success) {
                setSuccess(isEditMode ? "Reading test updated!" : "Reading test created!");
                setTimeout(() => { router.push("/dashboard/admin/reading"); }, 1500);
            } else {
                setError(response.message || "Failed to save");
            }
        } catch (err) {
            setError(err.message || "Failed to save reading test");
        } finally {
            setLoading(false);
        }
    };

    // ═══ Count totals ═══
    const totalQuestions = sections.reduce((sum, s) => {
        const fromGroups = (s.questionGroups || []).reduce((gs, g) => gs + (g.endQuestion - g.startQuestion + 1), 0);
        return sum + (fromGroups || s.questions.length);
    }, 0);

    const sectionQuestionCounts = sections.map(s => {
        return (s.questionGroups || []).reduce((gs, g) => gs + (g.endQuestion - g.startQuestion + 1), 0) || s.questions.length;
    });

    // ═══ Loading state ═══
    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-blue-500" />
            </div>
        );
    }

    return (
        <div className={`pb-10 mx-auto ${showPreview ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/admin/reading" className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaBook className="text-blue-600" />
                            {isEditMode ? "Edit Reading Test" : "Create Reading Test"}
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {totalQuestions} questions across {sections.length} sections
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowPreview(!showPreview)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${showPreview ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}>
                        {showPreview ? <FaEyeSlash /> : <FaEye />} Preview
                    </button>
                    <button type="button" onClick={() => setShowSummary(!showSummary)}
                        className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer">
                        {showSummary ? <FaEyeSlash /> : <FaEye />} Summary
                    </button>
                    <button type="button" onClick={handleJsonExport}
                        className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer">
                        <FaCode /> JSON
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={loading}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors">
                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {isEditMode ? "Update" : "Save"} Test
                    </button>
                </div>
            </div>

            {/* ═══ Messages ═══ */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError("")} className="cursor-pointer"><FaTimes /></button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <FaCheck /> <span className="text-sm">{success}</span>
                </div>
            )}

            {/* ═══ JSON Modal ═══ */}
            {showJson && (
                <div className="border border-blue-200 rounded-xl bg-blue-50 p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-700">📋 Full Test JSON (Advanced)</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={handleCopyJson} className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                            </button>
                            <button type="button" onClick={() => setShowJson(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes /></button>
                        </div>
                    </div>
                    <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:border-blue-500 resize-y" />
                    {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
                    <button type="button" onClick={handleJsonImport}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-700">
                        Import JSON
                    </button>
                </div>
            )}

            {/* ═══ Summary Panel ═══ */}
            {showSummary && (
                <div className="border border-green-200 rounded-xl bg-green-50 p-4 mb-6">
                    <h3 className="text-sm font-bold text-green-800 mb-3">📊 Test Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {sections.map((s, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                                <div className="text-xs font-bold text-gray-700 mb-2">Section {idx + 1}</div>
                                <div className="text-xs text-gray-600 mb-1">{s.title || "(no title)"}</div>
                                <div className="text-xs text-gray-500">{sectionQuestionCounts[idx]} questions</div>
                                <div className="mt-2 space-y-1">
                                    {(s.questionGroups || []).map((g, gIdx) => (
                                        <div key={gIdx} className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <span className="font-semibold">Q{g.startQuestion}-{g.endQuestion}:</span>
                                            <span>{g.groupType}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 text-xs text-green-700 font-medium">
                        Total: {totalQuestions} questions • Duration: {formData.duration} min • {formData.difficulty}
                    </div>
                </div>
            )}

            {/* ═══ Basic Info ═══ */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">📋 Test Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
                        <input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            placeholder="e.g. Reading Test 04" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                        <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                            placeholder="Optional description..." />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Test Type</label>
                        <select value={formData.testType} onChange={e => setFormData(prev => ({ ...prev, testType: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="academic">Academic</option>
                            <option value="general-training">General Training</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Difficulty</label>
                        <select value={formData.difficulty} onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Duration (min)</label>
                        <input type="number" value={formData.duration} onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Source</label>
                        <input value={formData.source} onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="e.g. Cambridge IELTS 17" />
                    </div>
                </div>
            </div>

            {/* ═══ Two-Column Layout: Editor + Preview (Resizable) ═══ */}
            <div className="flex" ref={containerRef} style={{ gap: 0 }}>
                {/* LEFT — Editor */}
                <div style={{ width: showPreview ? `${splitPercent}%` : '100%', minWidth: 0, paddingRight: showPreview ? '10px' : 0, transition: isDragging.current ? 'none' : 'width 0.15s ease' }}>
                    {/* Section Tabs */}
                    <div className="flex gap-1 mb-4">
                        {sections.map((s, idx) => (
                            <button key={idx} type="button" onClick={() => setActiveSection(idx)}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeSection === idx
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    }`}>
                                <div>Section {idx + 1}</div>
                                <div className={`text-[10px] mt-0.5 ${activeSection === idx ? "text-blue-200" : "text-gray-400"}`}>
                                    {s.title ? (s.title.length > 25 ? s.title.slice(0, 25) + "..." : s.title) : "(empty)"}
                                    {" • "}{sectionQuestionCounts[idx]}Q
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Active Section Editor */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <SectionEditor
                            section={sections[activeSection]}
                            sectionIndex={activeSection}
                            onChange={updated => updateSection(activeSection, updated)}
                        />
                    </div>

                    {/* Bottom Save Button */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                            💡 Tips: Question numbers auto-increment. Answers will be auto-saved within each question group.
                        </div>
                        <button type="button" onClick={handleSubmit} disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors shadow-md">
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {isEditMode ? "Update" : "Save"} Reading Test
                        </button>
                    </div>
                </div>

                {/* DRAGGABLE DIVIDER */}
                {showPreview && (
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            width: '6px', cursor: 'col-resize', flexShrink: 0,
                            background: 'linear-gradient(to bottom, transparent, #d1d5db 20%, #d1d5db 80%, transparent)',
                            borderRadius: '3px', position: 'relative', zIndex: 10,
                        }}
                        title="টেনে resize করুন"
                    >
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '14px', height: '36px', borderRadius: '7px',
                            background: '#e5e7eb', border: '1px solid #d1d5db',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                        }}>
                            <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#9ca3af' }} />
                            <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#9ca3af' }} />
                            <div style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#9ca3af' }} />
                        </div>
                    </div>
                )}

                {/* RIGHT — Preview */}
                {showPreview && (
                    <div style={{ width: `${100 - splitPercent}%`, minWidth: 0, paddingLeft: '10px', transition: isDragging.current ? 'none' : 'width 0.15s ease' }} className="sticky top-4 self-start">
                        {isEditMode && editTestNumber ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                                        🎯 Live Exam Preview
                                    </span>
                                    <a href={`/exam/admin-preview/reading?adminPreview=${editTestNumber}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                                        Open in New Tab ↗
                                    </a>
                                </div>
                                <iframe
                                    src={`/exam/admin-preview/reading?adminPreview=${editTestNumber}`}
                                    className="w-full border-0"
                                    style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}
                                    title="Exam Preview"
                                />
                            </div>
                        ) : (
                            <LivePreview sections={sections} title={formData.title} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
