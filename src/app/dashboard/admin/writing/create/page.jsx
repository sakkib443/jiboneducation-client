"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaPlus,
    FaTrash,
    FaPen,
    FaImage,
    FaTimes,
    FaClock,
    FaCloudUploadAlt,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaChevronLeft,
    FaChevronRight,
    FaBars,
    FaEllipsisV,
    FaSearchPlus,
    FaSearchMinus,
} from "react-icons/fa";
import { writingAPI, uploadAPI } from "@/lib/api";

// ========== LIVE PREVIEW — matches actual exam page design ==========
function LivePreview({ formData, tasks }) {
    const [activeTask, setActiveTask] = useState(0);
    const [demoText, setDemoText] = useState({});
    const wordCount = (demoText[activeTask] || "").trim().split(/\s+/).filter(Boolean).length;
    const currentTask = tasks[activeTask];
    if (!currentTask) return null;

    const minWords = currentTask.minWords || (currentTask.taskNumber === 1 ? 150 : 250);
    const meetsMin = wordCount >= minWords;
    const timeMinutes = currentTask.recommendedTime || (currentTask.taskNumber === 1 ? 20 : 40);

    return (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col" style={{ minHeight: "650px" }}>
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 flex items-center justify-between px-3 py-1.5 flex-shrink-0">
                <span className="text-gray-700 font-bold text-xs">IELTS Writing</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                    <FaClock className="text-[8px]" />
                    <span>{timeMinutes}:00</span>
                </div>
                <button className="bg-gray-800 text-white px-3 py-1 rounded-md text-[10px] font-medium flex items-center gap-1">
                    Submit Part {currentTask.taskNumber} <FaCheck className="text-[8px]" />
                </button>
            </div>

            {/* Main Split Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left - Instructions */}
                <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-3 bg-white" style={{ maxHeight: "520px" }}>
                    <div className="border border-gray-200 rounded-md p-3 mb-3">
                        <h2 className="font-bold text-gray-800 text-sm mb-2">Part {currentTask.taskNumber}</h2>
                        {currentTask.instructions && (
                            <p className="text-[12px] leading-relaxed whitespace-pre-line text-gray-600">
                                {currentTask.instructions}
                            </p>
                        )}
                    </div>

                    {currentTask.prompt && (
                        <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-gray-800 mb-3">
                            {currentTask.prompt}
                        </div>
                    )}

                    {currentTask.imageUrl && (
                        <div className="border border-gray-300 overflow-hidden">
                            <img src={currentTask.imageUrl} alt="Task visual" className="w-full object-contain" />
                        </div>
                    )}

                    {!currentTask.prompt && !currentTask.instructions && !currentTask.imageUrl && (
                        <div className="text-gray-400 text-xs italic text-center py-12">
                            Add instructions and prompt to see preview
                        </div>
                    )}
                </div>

                {/* Right - Writing Area */}
                <div className="w-1/2 flex flex-col" style={{ maxHeight: "520px" }}>
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-gray-500 text-[10px] font-medium">Part {currentTask.taskNumber} Answer</span>
                        <span className={`text-[10px] ${meetsMin ? "text-green-600 font-medium" : "text-gray-400"}`}>
                            Word Count: {wordCount}
                        </span>
                    </div>

                    <textarea
                        value={demoText[activeTask] || ""}
                        onChange={(e) => setDemoText(prev => ({ ...prev, [activeTask]: e.target.value }))}
                        placeholder={`Enter your part ${currentTask.taskNumber} answer...`}
                        className="flex-1 w-full p-3 resize-none outline-none text-gray-800 text-xs leading-relaxed bg-white"
                        style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                    />

                    <div className="h-1 bg-gray-100 flex-shrink-0">
                        <div
                            className={`h-full transition-all duration-300 ${meetsMin ? "bg-green-500" : wordCount > 0 ? "bg-gray-400" : "bg-gray-200"}`}
                            style={{ width: `${Math.min((wordCount / minWords) * 100, 100)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 py-1 bg-gray-50 flex-shrink-0">
                        <span className="text-[9px] text-gray-400">{timeMinutes}:00 remaining</span>
                        <span className="text-[9px] text-gray-400">
                            {meetsMin ? "✓ Min. reached" : `${minWords - wordCount} more words needed`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1">
                    {tasks.map((t, idx) => {
                        const tw = (demoText[idx] || "").trim().split(/\s+/).filter(Boolean).length;
                        const isActive = activeTask === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveTask(idx)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-all ${isActive
                                    ? "bg-gray-800 text-white"
                                    : tw > 0
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                {tw > 0 && !isActive ? "✓ " : ""}Part {t.taskNumber}
                            </button>
                        );
                    })}
                </div>
                <button className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-medium flex items-center gap-1">
                    Submit Part {currentTask.taskNumber} <FaCheck className="text-[8px]" />
                </button>
            </div>
        </div>
    );
}


// ========== MAIN PAGE ==========
export default function CreateWritingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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
        title: "",
        description: "",
        testType: "academic",
        duration: 60,
        source: "",
    });

    // Tasks state — always 2 tasks for IELTS Writing
    const [tasks, setTasks] = useState([
        {
            taskNumber: 1,
            taskType: "task1-academic",
            subType: "",
            prompt: "",
            instructions: "You should spend about 20 minutes on this task. Write at least 150 words.",
            minWords: 150,
            recommendedTime: 20,
            imageUrl: "",
            sampleAnswer: "",
            keyPoints: [],
        },
        {
            taskNumber: 2,
            taskType: "task2",
            subType: "",
            prompt: "",
            instructions: "You should spend about 40 minutes on this task. Write at least 250 words.",
            minWords: 250,
            recommendedTime: 40,
            imageUrl: "",
            sampleAnswer: "",
            keyPoints: [],
        },
    ]);

    const [imageUploading, setImageUploading] = useState({});

    // Fetch data for edit mode
    useEffect(() => {
        if (!editId) return;

        const fetchData = async () => {
            try {
                const response = await writingAPI.getById(editId, true);
                if (response.success && response.data) {
                    const data = response.data;
                    setIsEditMode(true);
                    setEditTestNumber(data.testNumber || null);

                    setFormData({
                        title: data.title || "",
                        description: data.description || "",
                        testType: data.testType || "academic",
                        duration: data.duration || 60,
                        difficulty: data.difficulty || "medium",
                        source: data.source || "",
                    });

                    if (data.tasks && data.tasks.length > 0) {
                        setTasks(data.tasks.map(t => ({
                            taskNumber: t.taskNumber,
                            taskType: t.taskType || "",
                            subType: t.subType || "",
                            prompt: t.prompt || "",
                            instructions: t.instructions || "",
                            minWords: t.minWords || (t.taskNumber === 1 ? 150 : 250),
                            recommendedTime: t.recommendedTime || (t.taskNumber === 1 ? 20 : 40),
                            imageUrl: t.images?.[0]?.url || "",
                            sampleAnswer: t.sampleAnswer || "",
                            keyPoints: t.keyPoints || [],
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch:", err);
                setError("Failed to load writing test data.");
            }
        };

        fetchData();
    }, [editId]);

    // Update a specific task field
    const updateTask = (index, field, value) => {
        setTasks(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Image upload handler
    const handleImageUpload = async (taskIndex, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(prev => ({ ...prev, [taskIndex]: true }));
        try {
            const response = await uploadAPI.uploadImage(file);
            if (response.success && response.data?.url) {
                updateTask(taskIndex, "imageUrl", response.data.url);
            }
        } catch (err) {
            setError("Image upload failed: " + err.message);
        } finally {
            setImageUploading(prev => ({ ...prev, [taskIndex]: false }));
        }
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const dataToSend = {
                ...formData,
                tasks: tasks.map(t => ({
                    taskNumber: t.taskNumber,
                    taskType: t.taskType,
                    subType: t.subType || undefined,
                    prompt: t.prompt,
                    instructions: t.instructions,
                    minWords: t.minWords,
                    recommendedTime: t.recommendedTime,
                    images: t.imageUrl ? [{ url: t.imageUrl, description: "", caption: "" }] : [],
                    sampleAnswer: t.sampleAnswer || undefined,
                    keyPoints: t.keyPoints?.length ? t.keyPoints : undefined,
                })),
            };

            const response = isEditMode
                ? await writingAPI.update(editId, dataToSend)
                : await writingAPI.create(dataToSend);

            if (response.success) {
                router.push("/dashboard/admin/writing");
            }
        } catch (err) {
            setError(err.message || `Failed to ${isEditMode ? "update" : "create"} writing test`);
        } finally {
            setLoading(false);
        }
    };

    // Task 1 sub-type options


    return (
        <div className={`${showPreview ? "max-w-[1600px]" : "max-w-4xl"} mx-auto transition-all duration-500`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/writing" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaPen className="text-orange-500" />
                        {isEditMode ? "Edit" : "Create"} Writing Test
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEditMode ? "Modify existing writing test" : "Create a new IELTS Writing test with Task 1 & Task 2"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${showPreview
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    {showPreview ? <><FaEyeSlash /> Hide Preview</> : <><FaEye /> Show Preview</>}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="cursor-pointer"><FaTimes /></button>
                </div>
            )}

            <div className="flex" ref={containerRef} style={{ gap: 0 }}>
                {/* LEFT: FORM */}
                <div style={{ width: showPreview ? `${splitPercent}%` : '100%', minWidth: 0, paddingRight: showPreview ? '10px' : 0, transition: isDragging.current ? 'none' : 'width 0.15s ease' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaPen className="text-orange-500" /> Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g., Academic Writing Test 1"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description..."
                                        rows={2}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                                        <select
                                            value={formData.testType}
                                            onChange={(e) => setFormData(p => ({ ...p, testType: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400"
                                        >
                                            <option value="academic">Academic</option>
                                            <option value="general-training">General Training</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData(p => ({ ...p, duration: Number(e.target.value) }))}
                                            min={10}
                                            max={120}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                        <input
                                            type="text"
                                            value={formData.source}
                                            onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                                            placeholder="e.g., Cambridge IELTS 18"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Tasks */}
                        {tasks.map((task, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Task Header */}
                                <div className={`p-4 border-b ${index === 0 ? "bg-orange-50 border-orange-100" : "bg-blue-50 border-blue-100"}`}>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? "bg-orange-500" : "bg-blue-500"}`}>
                                            {task.taskNumber}
                                        </span>
                                        Task {task.taskNumber}
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            ({task.taskNumber === 1 ? "150+ words • 20 min" : "250+ words • 40 min"})
                                        </span>
                                    </h3>
                                </div>

                                <div className="p-6 space-y-5">


                                    {/* Instructions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                        <textarea
                                            value={task.instructions}
                                            onChange={(e) => updateTask(index, "instructions", e.target.value)}
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 resize-none text-sm"
                                        />
                                    </div>

                                    {/* Prompt */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt / Question *</label>
                                        <textarea
                                            value={task.prompt}
                                            onChange={(e) => updateTask(index, "prompt", e.target.value)}
                                            placeholder={task.taskNumber === 1
                                                ? "Describe the graph/chart/process..."
                                                : "Some people believe that... To what extent do you agree or disagree?"
                                            }
                                            rows={5}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 resize-none text-sm"
                                        />
                                    </div>

                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <FaImage className="inline mr-1 text-orange-500" />
                                            Reference Image {task.taskNumber === 1 && "(Graph/Chart/Diagram)"}
                                        </label>
                                        {!task.imageUrl ? (
                                            <label className={`relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer ${imageUploading[index] ? "bg-orange-50 border-orange-300" : "bg-gray-50 border-gray-300 hover:border-orange-400"}`}>
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e)} disabled={imageUploading[index]} className="hidden" />
                                                {imageUploading[index]
                                                    ? <FaSpinner className="animate-spin text-orange-600 text-xl" />
                                                    : <div className="text-center">
                                                        <FaCloudUploadAlt className="text-2xl mx-auto mb-1 text-gray-400" />
                                                        <span className="text-xs text-gray-500">Click to upload image</span>
                                                    </div>
                                                }
                                            </label>
                                        ) : (
                                            <div className="relative">
                                                <img src={task.imageUrl} alt="Uploaded" className="w-full max-h-48 object-contain rounded-lg border" />
                                                <button
                                                    type="button"
                                                    onClick={() => updateTask(index, "imageUrl", "")}
                                                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                                                >
                                                    <FaTimes className="text-xs" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Min Words & Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Words</label>
                                            <input
                                                type="number"
                                                value={task.minWords}
                                                onChange={(e) => updateTask(index, "minWords", Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-orange-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time (min)</label>
                                            <input
                                                type="number"
                                                value={task.recommendedTime}
                                                onChange={(e) => updateTask(index, "recommendedTime", Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-orange-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Sample Answer */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sample Answer (optional)</label>
                                        <textarea
                                            value={task.sampleAnswer}
                                            onChange={(e) => updateTask(index, "sampleAnswer", e.target.value)}
                                            placeholder="Model answer for reference..."
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 resize-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Submit */}
                        <div className="flex justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-xl border shadow-lg">
                            <Link href="/dashboard/admin/writing" className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-orange-600 hover:to-amber-600 cursor-pointer disabled:opacity-60"
                            >
                                {loading && <FaSpinner className="animate-spin" />}
                                {isEditMode ? "Update Test" : "Create Test"}
                            </button>
                        </div>
                    </form>
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

                {/* RIGHT: PREVIEW */}
                {showPreview && (
                    <div style={{ width: `${100 - splitPercent}%`, minWidth: 0, paddingLeft: '10px', transition: isDragging.current ? 'none' : 'width 0.15s ease' }} className="sticky top-4 self-start">
                        {isEditMode && editTestNumber ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                                    <span className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                                        🎯 Live Exam Preview
                                    </span>
                                    <a href={`/exam/admin-preview/writing?adminPreview=${editTestNumber}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                                        Open in New Tab ↗
                                    </a>
                                </div>
                                <iframe
                                    src={`/exam/admin-preview/writing?adminPreview=${editTestNumber}`}
                                    className="w-full border-0"
                                    style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}
                                    title="Exam Preview"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Live Preview</h3>
                                    <span className="text-xs text-gray-400 ml-auto">How students will see this</span>
                                </div>
                                <LivePreview formData={formData} tasks={tasks} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
