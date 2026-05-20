"use client";
import React, { useState } from "react";
import {
    FaTrash, FaPlus, FaChevronDown, FaChevronUp, FaCode, FaEye,
    FaArrowUp, FaArrowDown, FaCopy
} from "react-icons/fa";

// ── styles
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none";
const ta = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-y font-mono";
const sel = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white";

const QUESTION_TYPES = [
    "multiple-choice", "multiple-choice-multi", "matching",
    "form-completion", "note-completion", "table-completion",
    "sentence-completion", "summary-completion", "flow-chart-completion",
    "short-answer", "map-labeling", "diagram-labeling", "plan-labeling"
];

// ═══════════════════════════════════════════════════════
// INSTRUCTION BLOCK EDITOR
// ═══════════════════════════════════════════════════════
function InstructionBlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown }) {
    const [showPreview, setShowPreview] = useState(true);
    const [showHtml, setShowHtml] = useState(false);

    return (
        <div className="border border-blue-200 rounded-xl bg-blue-50/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-blue-100/60 border-b border-blue-200">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded text-[10px] font-bold flex items-center justify-center">📌</span>
                    <span className="text-xs font-semibold text-blue-700">Instruction Block</span>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setShowPreview(!showPreview)}
                        className={`p-1.5 rounded text-xs cursor-pointer ${showPreview ? 'text-blue-600 bg-blue-200' : 'text-gray-400 hover:text-blue-500'}`}
                        title="Preview"><FaEye size={10} /></button>
                    <button type="button" onClick={() => setShowHtml(!showHtml)}
                        className={`p-1.5 rounded text-xs cursor-pointer ${showHtml ? 'text-blue-600 bg-blue-200' : 'text-gray-400 hover:text-blue-500'}`}
                        title="Edit HTML"><FaCode size={10} /></button>
                    <button type="button" onClick={onMoveUp} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Move Up"><FaArrowUp size={9} /></button>
                    <button type="button" onClick={onMoveDown} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Move Down"><FaArrowDown size={9} /></button>
                    <button type="button" onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 cursor-pointer" title="Delete"><FaTrash size={10} /></button>
                </div>
            </div>

            <div className="p-3 space-y-2">
                {/* HTML Preview */}
                {showPreview && block.content && (
                    <div className="bg-white rounded-lg border border-blue-100 p-3 text-sm"
                        dangerouslySetInnerHTML={{ __html: block.content }} />
                )}

                {/* HTML Editor */}
                {showHtml && (
                    <textarea className={ta} rows={5}
                        value={block.content || ""}
                        onChange={e => onChange({ ...block, content: e.target.value })}
                        placeholder="HTML content paste করুন... e.g. <strong>Questions 1-7</strong><br/>Complete the form below." />
                )}

                {/* Compact text input when neither preview nor HTML editor */}
                {!showPreview && !showHtml && (
                    <input className={inp} value={block.content || ""}
                        onChange={e => onChange({ ...block, content: e.target.value })}
                        placeholder="Instruction content..." />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// QUESTION BLOCK EDITOR
// ═══════════════════════════════════════════════════════
function QuestionBlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown }) {
    const [collapsed, setCollapsed] = useState(false);
    const isMultiChoice = block.questionType === "multiple-choice" || block.questionType === "multiple-choice-multi";
    const hasOptions = block.questionType === "matching" || isMultiChoice || block.questionType === "map-labeling" || block.questionType === "diagram-labeling" || block.questionType === "plan-labeling";

    const updateOption = (idx, val) => {
        const opts = [...(block.options || [])];
        opts[idx] = val;
        onChange({ ...block, options: opts });
    };

    const addOption = () => {
        onChange({ ...block, options: [...(block.options || []), ""] });
    };

    const removeOption = (idx) => {
        onChange({ ...block, options: (block.options || []).filter((_, i) => i !== idx) });
    };

    return (
        <div className="border border-green-200 rounded-xl bg-green-50/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-green-100/60 border-b border-green-200 cursor-pointer select-none"
                onClick={() => setCollapsed(!collapsed)}>
                <div className="flex items-center gap-2">
                    <span className="w-7 h-6 bg-green-600 text-white rounded text-[10px] font-bold flex items-center justify-center">
                        Q{block.questionNumber}
                    </span>
                    <span className="text-xs font-semibold text-green-700">{block.questionType || "?"}</span>
                    {block.correctAnswer && block.correctAnswer !== "TBD" && (
                        <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-medium">✓ {block.correctAnswer}</span>
                    )}
                    {block.correctAnswer === "TBD" && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">⏳ TBD</span>
                    )}
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={onMoveUp} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><FaArrowUp size={9} /></button>
                    <button type="button" onClick={onMoveDown} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><FaArrowDown size={9} /></button>
                    <button type="button" onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 cursor-pointer"><FaTrash size={10} /></button>
                    {collapsed ? <FaChevronDown className="text-gray-400" size={10} /> : <FaChevronUp className="text-gray-400" size={10} />}
                </div>
            </div>

            {!collapsed && (
                <div className="p-3 space-y-2">
                    {/* Row 1: Number + Type */}
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Q#</label>
                            <input className={inp} type="number" value={block.questionNumber || ""}
                                onChange={e => onChange({ ...block, questionNumber: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Type</label>
                            <select className={`${sel} w-full`} value={block.questionType || ""}
                                onChange={e => onChange({ ...block, questionType: e.target.value })}>
                                <option value="">-- select --</option>
                                {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Question Text */}
                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Question Text</label>
                        <input className={inp} value={block.questionText || ""}
                            onChange={e => onChange({ ...block, questionText: e.target.value })}
                            placeholder="e.g. ~Departure time: ________" />
                    </div>

                    {/* Row 3: Answer + WordLimit + Marks */}
                    <div className="grid grid-cols-[1fr_80px_80px] gap-2">
                        <div>
                            <label className="text-[10px] font-semibold text-green-600 block mb-0.5">✓ Correct Answer</label>
                            <input className={`${inp} bg-green-50 border-green-200 text-green-800 font-medium`}
                                value={block.correctAnswer || ""}
                                onChange={e => onChange({ ...block, correctAnswer: e.target.value })}
                                placeholder="সঠিক উত্তর..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Word Limit</label>
                            <input className={inp} type="number" value={block.wordLimit || ""}
                                onChange={e => onChange({ ...block, wordLimit: parseInt(e.target.value) || undefined })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Marks</label>
                            <input className={inp} type="number" value={block.marks || 1}
                                onChange={e => onChange({ ...block, marks: parseInt(e.target.value) || 1 })} />
                        </div>
                    </div>

                    {/* Options (for MCQ, matching, etc.) */}
                    {hasOptions && (
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-1">Options</label>
                            <div className="space-y-1">
                                {(block.options || []).map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-indigo-600 w-4 shrink-0">{String.fromCharCode(65 + idx)}</span>
                                        <input className={`${inp} flex-1 text-xs`} value={opt}
                                            onChange={e => updateOption(idx, e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}...`} />
                                        <button type="button" onClick={() => removeOption(idx)}
                                            className="text-gray-300 hover:text-red-500 cursor-pointer p-1"><FaTrash size={9} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addOption}
                                className="mt-1 text-[10px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                                <FaPlus size={8} /> Add Option
                            </button>
                        </div>
                    )}

                    {/* Image URL */}
                    {(block.questionType?.includes("labeling") || block.questionType?.includes("map") || block.questionType?.includes("diagram") || block.questionType?.includes("plan")) && (
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Image URL</label>
                            <input className={`${inp} text-xs font-mono`} value={block.imageUrl || ""}
                                onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                                placeholder="/images/listening/..." />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MAIN: RawBlockEditor
// ═══════════════════════════════════════════════════════
export default function RawBlockEditor({ questions, onChange }) {
    const blocks = questions || [];

    const updateBlock = (idx, updated) => {
        onChange(blocks.map((b, i) => i === idx ? updated : b));
    };

    const removeBlock = (idx) => {
        if (!confirm("এই block মুছে ফেলবেন?")) return;
        onChange(blocks.filter((_, i) => i !== idx));
    };

    const moveBlock = (idx, dir) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= blocks.length) return;
        const arr = [...blocks];
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        onChange(arr);
    };

    const addInstructionBlock = () => {
        onChange([...blocks, { blockType: "instruction", content: "" }]);
    };

    const getNextQNumber = () => {
        let max = 0;
        blocks.forEach(b => { if (b.blockType === "question" && b.questionNumber > max) max = b.questionNumber; });
        return max + 1;
    };

    const addQuestionBlock = () => {
        const num = getNextQNumber();
        onChange([...blocks, {
            blockType: "question",
            questionNumber: num,
            questionType: "note-completion",
            questionText: "",
            correctAnswer: "",
            marks: 1,
            wordLimit: 3,
        }]);
    };

    // Duplicate instruction block
    const duplicateBlock = (idx) => {
        const newBlocks = [...blocks];
        newBlocks.splice(idx + 1, 0, { ...blocks[idx] });
        onChange(newBlocks);
    };

    const questionCount = blocks.filter(b => b.blockType === "question").length;
    const instrCount = blocks.filter(b => b.blockType === "instruction").length;

    return (
        <div className="space-y-3">
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">
                    ❓ {questionCount} questions
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                    📌 {instrCount} instructions
                </span>
                <span className="text-gray-400">Total {blocks.length} blocks</span>
            </div>

            {/* Block List */}
            {blocks.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 mb-1">No blocks yet</p>
                    <p className="text-xs text-gray-400">নিচের বাটন থেকে Instruction বা Question block add করুন</p>
                </div>
            )}

            {blocks.map((block, idx) => (
                <div key={idx}>
                    {block.blockType === "instruction" ? (
                        <InstructionBlockEditor
                            block={block}
                            onChange={updated => updateBlock(idx, updated)}
                            onRemove={() => removeBlock(idx)}
                            onMoveUp={() => moveBlock(idx, -1)}
                            onMoveDown={() => moveBlock(idx, 1)}
                        />
                    ) : (
                        <QuestionBlockEditor
                            block={block}
                            onChange={updated => updateBlock(idx, updated)}
                            onRemove={() => removeBlock(idx)}
                            onMoveUp={() => moveBlock(idx, -1)}
                            onMoveDown={() => moveBlock(idx, 1)}
                        />
                    )}
                </div>
            ))}

            {/* Add Buttons */}
            <div className="flex gap-2">
                <button type="button" onClick={addInstructionBlock}
                    className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer border-2 border-dashed border-blue-200 flex items-center justify-center gap-1.5">
                    <FaPlus size={10} /> Instruction Block
                </button>
                <button type="button" onClick={addQuestionBlock}
                    className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors cursor-pointer border-2 border-dashed border-green-200 flex items-center justify-center gap-1.5">
                    <FaPlus size={10} /> Question Block
                </button>
            </div>
        </div>
    );
}
