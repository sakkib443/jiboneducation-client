"use client";
import React, { useState } from "react";
import { FaTrash, FaPlus, FaUpload, FaSpinner, FaTimes, FaImage, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { uploadImage } from "@/lib/api";

// ═══ Shared Styles ═══
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none";
const ta = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-y";
const sel = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white";

// ─── Tip Box ─────────────────────────────
function Tip({ children }) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
            💡 {children}
        </div>
    );
}

// ─── Step Header ────────────────────────────
function Step({ num, title }) {
    return (
        <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">{num}</span>
            <span className="text-xs font-semibold text-gray-700">{title}</span>
        </div>
    );
}

// ─── Add Button ─────────────────────────────
function AddBtn({ onClick, label }) {
    return (
        <button type="button" onClick={onClick}
            className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors cursor-pointer border border-dashed border-indigo-200">
            <FaPlus size={10} /> {label}
        </button>
    );
}

// ─── Remove Button ──────────────────────────
function RemBtn({ onClick }) {
    return (
        <button type="button" onClick={onClick}
            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1 shrink-0" title="Delete">
            <FaTrash size={11} />
        </button>
    );
}

// ═══════════════════════════════════════════════════
// 1. NOTE / FORM / SENTENCE / SUMMARY / FLOW-CHART COMPLETION
// ═══════════════════════════════════════════════════
function CompletionForm({ group, onChange, typeLabel, tipText }) {
    const questions = group.questions || [];

    const updateQ = (idx, field, value) => {
        onChange({ ...group, questions: questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) });
    };

    const addQ = () => {
        const maxQ = questions.length > 0 ? Math.max(...questions.map(q => q.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            questions: [...questions, { questionNumber: maxQ + 1, textBefore: "", textAfter: "", correctAnswer: "" }]
        });
    };

    const removeQ = (idx) => {
        const updated = questions.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(q => q.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, questions: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                {tipText}<br />
                নিচে পুরো note/form text paste করুন (ফাঁকার জায়গায় নম্বর + __________ লিখুন), তারপর Step 3 তে প্রতিটি ফাঁকার উত্তর দিন।
            </Tip>

            {/* Step 1: Heading */}
            <div>
                <Step num="1" title={`${typeLabel} এর heading (optional)`} />
                <input className={inp} value={group.mainHeading || ""} onChange={e => onChange({ ...group, mainHeading: e.target.value })}
                    placeholder={`e.g. ${typeLabel === 'Form' ? 'Enquiry Form' : 'Bankside Recruitment Agency'}`} />
            </div>

            {/* Step 2: Notes/Form passage */}
            <div>
                <Step num="2" title={`পুরো ${typeLabel} text paste করুন — ফাঁকায় নম্বর + __________ লিখুন`} />
                <Tip>
                    Format: <code className="bg-blue-100 px-1 rounded">• Name of agent: Becky 1 __________</code><br />
                    প্রতিটি ফাঁকার আগে question number লিখুন তারপর __________ (আন্ডারস্কোর)
                </Tip>
                <textarea className={ta} rows={7}
                    value={group.passage || ""}
                    onChange={e => onChange({ ...group, passage: e.target.value })}
                    placeholder={"Bankside Recruitment Agency\n• Address of agency: 497 Eastside, Docklands\n• Name of agent: Becky 1 __________\n• Best to call her in the 2 __________\n• Must have good 3 __________ skills"} />
            </div>

            {/* Step 3: Answers */}
            <div>
                <Step num="3" title="প্রতিটি ফাঁকার সঠিক উত্তর দিন" />
                <div className="space-y-2">
                    {questions.map((q, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-xs font-bold text-green-700 w-8 shrink-0">Q{q.questionNumber}</span>
                            <input className={`${inp} flex-1`} value={q.correctAnswer}
                                onChange={e => updateQ(idx, "correctAnswer", e.target.value)}
                                placeholder={`Q${q.questionNumber} এর উত্তর...`} />
                            <RemBtn onClick={() => removeQ(idx)} />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addQ} label="Answer যোগ করুন" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 2. TABLE COMPLETION
// ═══════════════════════════════════════════════════
function TableCompletionForm({ group, onChange }) {
    const questions = group.questions || [];

    const updateQ = (idx, field, value) => {
        onChange({ ...group, questions: questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) });
    };

    const addQ = () => {
        const maxQ = questions.length > 0 ? Math.max(...questions.map(q => q.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            questions: [...questions, { questionNumber: maxQ + 1, questionText: "", correctAnswer: "" }]
        });
    };

    const removeQ = (idx) => {
        const updated = questions.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(q => q.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, questions: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Table Completion — table এর ফাঁকা cell গুলো পূরণ করতে হবে।<br />
                Step 1 এ পুরো table HTML paste করুন, Step 2 তে প্রতিটি ফাঁকার context ও উত্তর দিন।
            </Tip>

            <div>
                <Step num="1" title="Table HTML paste করুন (ফাঁকায় [N] লিখুন)" />
                <Tip>Table HTML format ব্যবহার করুন। ফাঁকার জায়গায় <code className="bg-blue-100 px-1 rounded">[1]</code>, <code className="bg-blue-100 px-1 rounded">[2]</code> ইত্যাদি লিখুন।</Tip>
                <textarea className={ta} rows={6}
                    value={group.tableHtml || ""}
                    onChange={e => onChange({ ...group, tableHtml: e.target.value })}
                    placeholder={'<table>\n<tr><th>Name</th><th>Detail</th></tr>\n<tr><td>Hotel</td><td>[21]</td></tr>\n<tr><td>[22]</td><td>near the beach</td></tr>\n</table>'} />
            </div>

            <div>
                <Step num="2" title="প্রতিটি ফাঁকার context ও উত্তর দিন" />
                <div className="space-y-2">
                    {questions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-green-700 w-8 shrink-0">Q{q.questionNumber}</span>
                                <input className={`${inp} flex-1`} value={q.questionText}
                                    onChange={e => updateQ(idx, "questionText", e.target.value)}
                                    placeholder="Context hint (e.g. Hotel dining room has view of the...)" />
                                <RemBtn onClick={() => removeQ(idx)} />
                            </div>
                            <div className="flex items-center gap-2 ml-10">
                                <span className="text-[10px] text-green-600 w-12 shrink-0">Answer:</span>
                                <input className={`${inp} flex-1 bg-green-50 border-green-300 text-green-800 font-medium`} value={q.correctAnswer}
                                    onChange={e => updateQ(idx, "correctAnswer", e.target.value)}
                                    placeholder={`সঠিক উত্তর...`} />
                            </div>
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addQ} label="Question যোগ করুন" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 3. SHORT ANSWER
// ═══════════════════════════════════════════════════
function ShortAnswerForm({ group, onChange }) {
    const questions = group.questions || [];

    const updateQ = (idx, field, value) => {
        onChange({ ...group, questions: questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) });
    };

    const addQ = () => {
        const maxQ = questions.length > 0 ? Math.max(...questions.map(q => q.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            questions: [...questions, { questionNumber: maxQ + 1, questionText: "", correctAnswer: "" }]
        });
    };

    const removeQ = (idx) => {
        const updated = questions.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(q => q.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, questions: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>Short Answer — প্রশ্ন করুন, ছোট উত্তর দিন (সর্বাধিক ৩ শব্দ)</Tip>

            <div className="space-y-2">
                {questions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="w-8 h-7 text-xs font-bold text-white bg-indigo-600 rounded flex items-center justify-center shrink-0 mt-1">Q{q.questionNumber}</span>
                            <textarea className={`${ta} flex-1`} rows={2} value={q.questionText}
                                onChange={e => updateQ(idx, "questionText", e.target.value)}
                                placeholder="প্রশ্ন লিখুন... e.g. What is the main topic of the talk?" />
                            <RemBtn onClick={() => removeQ(idx)} />
                        </div>
                        <div className="flex items-center gap-2 ml-10">
                            <span className="text-[10px] font-semibold text-green-600 w-12 shrink-0">Answer:</span>
                            <input className={`${inp} flex-1 bg-green-50 border-green-200 text-green-800 font-medium`}
                                value={q.correctAnswer}
                                onChange={e => updateQ(idx, "correctAnswer", e.target.value)}
                                placeholder="সঠিক উত্তর..." />
                        </div>
                    </div>
                ))}
            </div>
            <AddBtn onClick={addQ} label="Question যোগ করুন" />
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 4. MULTIPLE CHOICE (A/B/C)
// ═══════════════════════════════════════════════════
function MCQForm({ group, onChange }) {
    const mcqs = group.mcQuestions || [];

    const updateQ = (idx, field, value) => {
        onChange({ ...group, mcQuestions: mcqs.map((q, i) => i === idx ? { ...q, [field]: value } : q) });
    };

    const updateOption = (qIdx, oIdx, text) => {
        const updated = mcqs.map((q, i) => {
            if (i !== qIdx) return q;
            return { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, text } : o) };
        });
        onChange({ ...group, mcQuestions: updated });
    };

    const addQ = () => {
        const maxQ = mcqs.length > 0 ? Math.max(...mcqs.map(q => q.questionNumber)) : group.startQuestion - 1;
        const newQ = {
            questionNumber: maxQ + 1, questionText: "", correctAnswer: "",
            options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }]
        };
        onChange({ ...group, endQuestion: maxQ + 1, mcQuestions: [...mcqs, newQ] });
    };

    const removeQ = (idx) => {
        const updated = mcqs.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(q => q.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, mcQuestions: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                MCQ তে প্রশ্ন + ৩টি option (A/B/C) দিন।<br />
                সঠিক উত্তরের <strong>letter বাটনে click করুন</strong> — সবুজ হয়ে যাবে ✓
            </Tip>

            {mcqs.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="w-8 h-7 text-xs font-bold text-white bg-indigo-600 rounded flex items-center justify-center shrink-0 mt-1">Q{q.questionNumber}</span>
                        <textarea className={`${ta} flex-1`} rows={2} value={q.questionText}
                            onChange={e => updateQ(qIdx, "questionText", e.target.value)}
                            placeholder="question text paste করুন..." />
                        <RemBtn onClick={() => removeQ(qIdx)} />
                    </div>

                    {q.correctAnswer && (
                        <div className="ml-10 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg inline-block">
                            ✓ সঠিক উত্তর: {q.correctAnswer}
                        </div>
                    )}
                    {!q.correctAnswer && (
                        <p className="ml-10 text-xs text-orange-500">👆 নিচের A/B/C বাটনে click করে সঠিক উত্তর select করুন</p>
                    )}

                    <div className="ml-10 space-y-2">
                        {(q.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${q.correctAnswer === opt.letter ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                                <button type="button"
                                    onClick={() => updateQ(qIdx, "correctAnswer", opt.letter)}
                                    className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all cursor-pointer flex-shrink-0 ${q.correctAnswer === opt.letter
                                        ? "bg-green-500 border-green-500 text-white shadow-md"
                                        : "border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 bg-white"}`}>
                                    {q.correctAnswer === opt.letter ? "✓" : opt.letter}
                                </button>
                                <input className={`${inp} flex-1`} value={opt.text}
                                    onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                    placeholder={`Option ${opt.letter} এর text...`} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <AddBtn onClick={addQ} label="MCQ Question যোগ করুন" />
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 5. MULTIPLE CHOICE MULTI (Choose TWO)
// ═══════════════════════════════════════════════════
function MCQMultiForm({ group, onChange }) {
    const options = group.options || [];
    const answers = group.correctAnswers || ["", ""];

    const updateOption = (idx, text) => {
        onChange({ ...group, options: options.map((o, i) => i === idx ? { ...o, text } : o) });
    };

    const toggleAnswer = (letter) => {
        const current = [...answers];
        const pos = current.indexOf(letter);
        if (pos >= 0) {
            current[pos] = "";
        } else {
            const emptySlot = current.indexOf("");
            if (emptySlot >= 0) current[emptySlot] = letter;
        }
        onChange({ ...group, correctAnswers: current });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Choose TWO letters — ৫টি option থেকে ২টি সঠিক উত্তর select করুন।<br />
                সবুজ বাটনে click করুন সঠিক উত্তরের জন্য।
            </Tip>

            {/* Question text */}
            <div>
                <Step num="1" title="প্রশ্ন লিখুন" />
                <textarea className={ta} rows={2} value={group.questionText || ""}
                    onChange={e => onChange({ ...group, questionText: e.target.value })}
                    placeholder="e.g. Which TWO experiences do the speakers agree have been valuable?" />
            </div>

            {/* Options */}
            <div>
                <Step num="2" title="Options দিন এবং সঠিক ২টি select করুন" />
                {answers.filter(Boolean).length > 0 && (
                    <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg inline-block mb-2">
                        ✓ সঠিক উত্তর: {answers.filter(Boolean).join(", ")}
                    </div>
                )}
                <div className="space-y-2">
                    {options.map((opt, oIdx) => {
                        const isSelected = answers.includes(opt.letter);
                        return (
                            <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isSelected ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                                <button type="button" onClick={() => toggleAnswer(opt.letter)}
                                    className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center border-2 transition-all cursor-pointer flex-shrink-0 ${isSelected
                                        ? "bg-green-500 border-green-500 text-white shadow-md"
                                        : "border-gray-300 text-gray-500 hover:border-green-400 bg-white"}`}>
                                    {isSelected ? "✓" : opt.letter}
                                </button>
                                <input className={`${inp} flex-1`} value={opt.text}
                                    onChange={e => updateOption(oIdx, e.target.value)}
                                    placeholder={`Option ${opt.letter} এর text...`} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 6. MATCHING
// ═══════════════════════════════════════════════════
function MatchingForm({ group, onChange }) {
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];

    const updateFeature = (idx, text) => {
        onChange({ ...group, featureOptions: features.map((f, i) => i === idx ? { ...f, text } : f) });
    };

    const addFeature = () => {
        const letter = String.fromCharCode(65 + features.length);
        onChange({ ...group, featureOptions: [...features, { letter, text: "" }] });
    };

    const removeFeature = (idx) => {
        onChange({ ...group, featureOptions: features.filter((_, i) => i !== idx) });
    };

    const updateItem = (idx, field, value) => {
        onChange({ ...group, matchingItems: items.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group,
            endQuestion: maxQ + 1,
            matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }]
        });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Matching — options list (A-H) তৈরি করুন, তারপর প্রতিটি প্রশ্নের জন্য সঠিক letter select করুন।
            </Tip>

            {/* Feature List */}
            <div>
                <Step num="1" title="Options list তৈরি করুন" />
                <input className={`${inp} mb-2`} value={group.featureListTitle || ""} onChange={e => onChange({ ...group, featureListTitle: e.target.value })}
                    placeholder="List title (e.g. List of People)" />
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600 w-5 shrink-0">{f.letter}</span>
                            <input className={`${inp} flex-1`} value={f.text}
                                onChange={e => updateFeature(idx, e.target.value)}
                                placeholder={`Option ${f.letter} text...`} />
                            <RemBtn onClick={() => removeFeature(idx)} />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addFeature} label="Option যোগ করুন" />
            </div>

            {/* Matching Items */}
            <div>
                <Step num="2" title="প্রশ্ন + সঠিক answer (letter) দিন" />
                <div className="space-y-2">
                    {items.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-xs font-bold text-indigo-700 w-8 shrink-0">Q{m.questionNumber}</span>
                            <input className={`${inp} flex-1`} value={m.text}
                                onChange={e => updateItem(idx, "text", e.target.value)}
                                placeholder="Statement text..." />
                            <select className={`${sel} w-16`} value={m.correctAnswer}
                                onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                <option value="">—</option>
                                {features.map(f => <option key={f.letter} value={f.letter}>{f.letter}</option>)}
                            </select>
                            <RemBtn onClick={() => removeItem(idx)} />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addItem} label="Question যোগ করুন" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 7. MAP / DIAGRAM LABELING
// ═══════════════════════════════════════════════════
function MapDiagramForm({ group, onChange, typeLabel }) {
    const [imgUploading, setImgUploading] = useState(false);
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try {
            const result = await uploadImage(file);
            if (result.success && result.data?.url) onChange({ ...group, imageUrl: result.data.url });
        } catch (err) { alert("Upload failed"); }
        finally { setImgUploading(false); }
    };

    const updateFeature = (idx, text) => {
        onChange({ ...group, featureOptions: features.map((f, i) => i === idx ? { ...f, text } : f) });
    };

    const updateItem = (idx, field, value) => {
        onChange({ ...group, matchingItems: items.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({
            ...group, endQuestion: maxQ + 1,
            matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }]
        });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                {typeLabel} — ছবিতে লেবেল দিতে হবে। ছবি upload করুন, options দিন, তারপর প্রতিটি ফাঁকার জন্য সঠিক letter select করুন।
            </Tip>

            {/* Image upload */}
            <div>
                <Step num="1" title={`${typeLabel} ছবি upload করুন`} />
                {group.imageUrl ? (
                    <div className="mt-1">
                        <img src={group.imageUrl} alt="" className="max-h-48 rounded border border-gray-200 mb-2" />
                        <div className="flex items-center gap-2">
                            <input className={`${inp} flex-1 text-xs font-mono`} value={group.imageUrl}
                                onChange={e => onChange({ ...group, imageUrl: e.target.value })} placeholder="Image URL" />
                            <button type="button" onClick={() => onChange({ ...group, imageUrl: '' })}
                                className="text-xs text-red-500 cursor-pointer flex items-center gap-1"><FaTimes size={10} /> Remove</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mt-1">
                        <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                            {imgUploading ? <FaSpinner className="animate-spin" size={10} /> : <FaUpload size={10} />}
                            {imgUploading ? 'Uploading...' : 'Upload Image'}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imgUploading} />
                        </label>
                        <input className={`${inp} flex-1 text-xs`} value={group.imageUrl || ""} onChange={e => onChange({ ...group, imageUrl: e.target.value })}
                            placeholder="or paste URL..." />
                    </div>
                )}
            </div>

            {/* Options */}
            <div>
                <Step num="2" title="Label options দিন (optional, for letter-based matching)" />
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600 w-5 shrink-0">{f.letter}</span>
                            <input className={`${inp} flex-1`} value={f.text} onChange={e => updateFeature(idx, e.target.value)}
                                placeholder={`Option ${f.letter}... (optional)`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Matching Items */}
            <div>
                <Step num="3" title="প্রশ্ন + সঠিক answer দিন" />
                <div className="space-y-2">
                    {items.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-xs font-bold text-indigo-700 w-8 shrink-0">Q{m.questionNumber}</span>
                            <input className={`${inp} flex-1`} value={m.text} onChange={e => updateItem(idx, "text", e.target.value)}
                                placeholder="Label description..." />
                            <select className={`${sel} w-16`} value={m.correctAnswer} onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                <option value="">—</option>
                                {features.map(f => <option key={f.letter} value={f.letter}>{f.letter}</option>)}
                            </select>
                            <RemBtn onClick={() => removeItem(idx)} />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addItem} label="Question যোগ করুন" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MAIN EXPORT: QuestionGroupEditor
// ═══════════════════════════════════════════════════
export function ListeningGroupEditor({ group, index, onUpdate, onRemove }) {
    const [collapsed, setCollapsed] = useState(false);

    // Count questions in group
    const getQCount = () => {
        return (group.endQuestion || group.startQuestion) - group.startQuestion + 1;
    };

    const typeLabels = {
        "note-completion": "📝 Note Completion",
        "form-completion": "📋 Form Completion",
        "sentence-completion": "✏️ Sentence Completion",
        "table-completion": "📊 Table Completion",
        "summary-completion": "📄 Summary Completion",
        "flow-chart-completion": "🔄 Flow Chart",
        "short-answer": "💬 Short Answer",
        "multiple-choice": "🔘 MCQ (A/B/C)",
        "multiple-choice-multi": "☑️ Choose TWO",
        "matching": "🔗 Matching",
        "map-labeling": "🗺️ Map Labelling",
        "diagram-labeling": "📐 Diagram Labelling",
    };

    const renderForm = () => {
        switch (group.groupType) {
            case "note-completion":
                return <CompletionForm group={group} onChange={onUpdate}
                    typeLabel="Notes" tipText="Note Completion — audio থেকে notes এর ফাঁকা জায়গা পূরণ করতে হবে।" />;
            case "form-completion":
                return <CompletionForm group={group} onChange={onUpdate}
                    typeLabel="Form" tipText="Form Completion — audio শুনে form এর ফাঁকা পূরণ করতে হবে।" />;
            case "sentence-completion":
                return <CompletionForm group={group} onChange={onUpdate}
                    typeLabel="Sentences" tipText="Sentence Completion — বাক্যের ফাঁকা পূরণ (সর্বাধিক ২ শব্দ)।" />;
            case "summary-completion":
                return <CompletionForm group={group} onChange={onUpdate}
                    typeLabel="Summary" tipText="Summary Completion — summary এর ফাঁকা পূরণ করতে হবে।" />;
            case "flow-chart-completion":
                return <CompletionForm group={group} onChange={onUpdate}
                    typeLabel="Flow Chart" tipText="Flow Chart — প্রবাহ চিত্রের ফাঁকা পূরণ করতে হবে।" />;
            case "table-completion":
                return <TableCompletionForm group={group} onChange={onUpdate} />;
            case "short-answer":
                return <ShortAnswerForm group={group} onChange={onUpdate} />;
            case "multiple-choice":
                return <MCQForm group={group} onChange={onUpdate} />;
            case "multiple-choice-multi":
                return <MCQMultiForm group={group} onChange={onUpdate} />;
            case "matching":
                return <MatchingForm group={group} onChange={onUpdate} />;
            case "map-labeling":
                return <MapDiagramForm group={group} onChange={onUpdate} typeLabel="Map/Plan Labelling" />;
            case "diagram-labeling":
                return <MapDiagramForm group={group} onChange={onUpdate} typeLabel="Diagram Labelling" />;
            default:
                return <p className="text-sm text-gray-500">Unknown type: {group.groupType}</p>;
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 cursor-pointer select-none"
                onClick={() => setCollapsed(!collapsed)}>
                <div className="flex items-center gap-3">
                    <span className="text-lg">{typeLabels[group.groupType]?.slice(0, 2) || "❓"}</span>
                    <div>
                        <span className="font-semibold text-gray-800 text-sm">{typeLabels[group.groupType]?.slice(2)?.trim() || group.groupType}</span>
                        <div className="text-[10px] text-gray-400">
                            Q{group.startQuestion}–Q{group.endQuestion} • {getQCount()} questions
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="text-gray-300 hover:text-red-500 cursor-pointer p-1"><FaTrash size={12} /></button>
                    {collapsed ? <FaChevronDown className="text-gray-400" size={12} /> : <FaChevronUp className="text-gray-400" size={12} />}
                </div>
            </div>

            {!collapsed && (
                <div className="p-4 space-y-3">
                    {/* Editable instruction */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Main Instruction</label>
                            <input className={`${inp} text-xs`} value={group.mainInstruction || ""}
                                onChange={e => onUpdate({ ...group, mainInstruction: e.target.value })}
                                placeholder="e.g. Complete the notes below." />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Sub Instruction</label>
                            <input className={`${inp} text-xs`} value={group.subInstruction || ""}
                                onChange={e => onUpdate({ ...group, subInstruction: e.target.value })}
                                placeholder="e.g. Write ONE WORD AND/OR A NUMBER..." />
                        </div>
                    </div>

                    {renderForm()}
                </div>
            )}
        </div>
    );
}
