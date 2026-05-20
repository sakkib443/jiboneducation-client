"use client";
import React, { useState } from "react";
import { FaTrash, FaPlus, FaCloudUploadAlt } from "react-icons/fa";
import { uploadAPI } from "@/lib/api";

// ═══ Shared Styles ═══
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none";
const ta = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-y";
const sel = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white";

// ─── Tip Box ─────────────────────────────────
function Tip({ children }) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-blue-700 leading-relaxed">💡 {children}</p>
        </div>
    );
}

// ─── Step Header ────────────────────────────
function Step({ num, title }) {
    return (
        <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
            <span className="text-xs font-semibold text-gray-700">{title}</span>
        </div>
    );
}

// ─── Add Button ─────────────────────────────
function AddBtn({ onClick, label }) {
    return (
        <button type="button" onClick={onClick}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 px-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer mt-2">
            <FaPlus size={9} /> {label}
        </button>
    );
}

// ─── Remove Button ──────────────────────────
function RemBtn({ onClick }) {
    return (
        <button type="button" onClick={onClick}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 cursor-pointer">
            <FaTrash size={11} />
        </button>
    );
}


// ═══════════════════════════════════════════════════
// 1. NOTE COMPLETION — ফাঁকা জায়গা পূরণ করো
// ═══════════════════════════════════════════════════
export function NoteCompletionForm({ group, onChange }) {
    const bullets = group.notesSections?.[0]?.bullets || [];
    const qBullets = bullets.filter(b => b.type === "question");

    const updateBullet = (qIdx, field, value) => {
        const allB = [...bullets];
        let count = 0;
        for (let i = 0; i < allB.length; i++) {
            if (allB[i].type === "question") {
                if (count === qIdx) { allB[i] = { ...allB[i], [field]: value }; break; }
                count++;
            }
        }
        onChange({ ...group, notesSections: [{ ...group.notesSections?.[0], bullets: allB }] });
    };

    const addQ = () => {
        const maxQ = qBullets.length > 0 ? Math.max(...qBullets.map(b => b.questionNumber)) : group.startQuestion - 1;
        const newB = { type: "question", questionNumber: maxQ + 1, textBefore: "", textAfter: "", correctAnswer: "" };
        onChange({ ...group, endQuestion: maxQ + 1, notesSections: [{ ...group.notesSections?.[0], bullets: [...bullets, newB] }] });
    };

    const removeQ = (qIdx) => {
        let count = 0;
        const updated = bullets.filter(b => {
            if (b.type === "question") { const keep = count !== qIdx; count++; return keep; }
            return true;
        });
        const remaining = updated.filter(b => b.type === "question");
        const maxQ = remaining.length > 0 ? Math.max(...remaining.map(b => b.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, notesSections: [{ ...group.notesSections?.[0], bullets: updated }] });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Note Completion মানে — passage থেকে notes এ ফাঁকা জায়গা পূরণ করতে হবে।<br />
                নিচে প্রতিটি ফাঁকার জন্য: আগের text → সঠিক উত্তর → পরের text দিন।
            </Tip>

            {/* Step 1: Heading */}
            <div>
                <Step num="1" title="Notes এর heading লিখুন (optional)" />
                <input className={inp} value={group.mainHeading || ""} onChange={e => onChange({ ...group, mainHeading: e.target.value })}
                    placeholder="e.g. The nutmeg tree and fruit" />
            </div>

            {/* Step 2: Passage with blanks */}
            <div>
                <Step num="2" title="পুরো note text paste করুন — ফাঁকার জায়গায় সংখ্যা + __________ লিখুন" />
                <Tip>
                    Format: <code className="bg-blue-100 px-1 rounded">• the leaves are 1 __________ in shape</code><br />
                    প্রতিটি ফাঁকার আগে তার question number লিখুন তারপর __________ (দশটি আন্ডারস্কোর)
                </Tip>
                <textarea className={ta} rows={7}
                    value={group.passage || ""}
                    onChange={e => onChange({ ...group, passage: e.target.value })}
                    placeholder={"ORIGIN\n• the leaves of the tree are 1 __________ in shape\n• a 2 __________ surrounds the fruit\n\nHARVEST\n• collected when the fruit 3 __________\n• seeds dried for 4 __________ weeks"} />
            </div>

            {/* Step 3: Answers */}
            <div>
                <Step num="3" title="প্রতিটি ফাঁকার সঠিক উত্তর দিন" />
                <div className="space-y-2">
                    {qBullets.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-xs font-bold text-green-700 w-8 shrink-0">Q{b.questionNumber}</span>
                            <input className={`${inp} flex-1`} value={b.correctAnswer}
                                onChange={e => updateBullet(idx, "correctAnswer", e.target.value)}
                                placeholder={`Question ${b.questionNumber} এর উত্তর...`} />
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
// 2. TRUE/FALSE/NOT GIVEN & YES/NO/NOT GIVEN
// ═══════════════════════════════════════════════════
export function TFNGForm({ group, onChange }) {
    const isYN = group.groupType === "yes-no-not-given";
    const options = isYN ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];
    const stmts = group.statements || [];

    const update = (idx, field, value) => {
        onChange({ ...group, statements: stmts.map((s, i) => i === idx ? { ...s, [field]: value } : s) });
    };

    const addStmt = () => {
        const maxQ = stmts.length > 0 ? Math.max(...stmts.map(s => s.questionNumber)) : group.startQuestion - 1;
        onChange({ ...group, endQuestion: maxQ + 1, statements: [...stmts, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }] });
    };

    const removeStmt = (idx) => {
        const updated = stmts.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(s => s.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, statements: updated });
    };

    return (
        <div className="space-y-3">
            <Tip>
                {isYN
                    ? "লেখকের মতামতের সাথে মিলিয়ে YES / NO / NOT GIVEN সিলেক্ট করুন।"
                    : "Passage এর তথ্যের সাথে মিলিয়ে TRUE / FALSE / NOT GIVEN সিলেক্ট করুন।"
                }<br />
                প্রতিটি statement paste করুন → ডানদিকে correct answer সিলেক্ট করুন।
            </Tip>

            <Step num="1" title="প্রতিটি statement paste করুন এবং সঠিক উত্তর সিলেক্ট করুন" />

            {stmts.map((s, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-6 text-xs font-bold text-white bg-gray-600 rounded flex items-center justify-center shrink-0">Q{s.questionNumber}</span>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${s.correctAnswer === "TRUE" || s.correctAnswer === "YES" ? "bg-green-100 text-green-700" : s.correctAnswer === "FALSE" || s.correctAnswer === "NO" ? "bg-red-100 text-red-700" : s.correctAnswer === "NOT GIVEN" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                            {s.correctAnswer || "উত্তর নির্বাচন করুন"}
                        </div>
                        <div className="flex-1" />
                        <RemBtn onClick={() => removeStmt(idx)} />
                    </div>
                    <textarea className={ta} rows={2} value={s.text}
                        onChange={e => update(idx, "text", e.target.value)}
                        placeholder="Statement paste করুন... e.g. In the Middle Ages, most Europeans knew where nutmeg was grown." />
                    <div className="flex gap-2 flex-wrap">
                        {options.map(opt => (
                            <button key={opt} type="button"
                                onClick={() => update(idx, "correctAnswer", opt)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${s.correctAnswer === opt
                                    ? opt === "TRUE" || opt === "YES" ? "bg-green-500 border-green-500 text-white"
                                        : opt === "FALSE" || opt === "NO" ? "bg-red-500 border-red-500 text-white"
                                            : "bg-yellow-500 border-yellow-500 text-white"
                                    : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <AddBtn onClick={addStmt} label="Statement যোগ করুন" />
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 3. MATCHING INFORMATION
// ═══════════════════════════════════════════════════
export function MatchingInfoForm({ group, onChange }) {
    const items = group.matchingItems || [];
    const paraOpts = group.paragraphOptions || ["A", "B", "C", "D", "E", "F", "G"];

    const updateItem = (idx, field, value) => {
        onChange({ ...group, matchingItems: items.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({ ...group, endQuestion: maxQ + 1, matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }] });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Matching Information মানে — statement টি passage এর কোন paragraph (A, B, C...) এ আছে সেটা বের করতে হবে।<br />
                প্রতিটি statement paste করুন → সঠিক paragraph letter সিলেক্ট করুন।
            </Tip>

            <div>
                <Step num="1" title="Paragraph labels সেট করুন (passage এ কোন কোন label আছে?)" />
                <input className={inp} value={paraOpts.join(", ")}
                    onChange={e => onChange({ ...group, paragraphOptions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="A, B, C, D, E, F, G" />
            </div>

            <div>
                <Step num="2" title="প্রতিটি statement paste করুন → সঠিক paragraph select করুন" />
                <div className="space-y-2">
                    {items.map((m, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-6 text-xs font-bold text-white bg-gray-600 rounded flex items-center justify-center shrink-0">Q{m.questionNumber}</span>
                                <div className="flex-1" />
                                <span className="text-xs text-gray-500">Paragraph:</span>
                                <select className={`${sel} w-20`} value={m.correctAnswer}
                                    onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                    <option value="">—</option>
                                    {paraOpts.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <RemBtn onClick={() => removeItem(idx)} />
                            </div>
                            <textarea className={ta} rows={2} value={m.text}
                                onChange={e => updateItem(idx, "text", e.target.value)}
                                placeholder="Statement paste করুন... e.g. a description of attempts to limit nutmeg production" />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addItem} label="Statement যোগ করুন" />
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 4. MATCHING HEADINGS
// ═══════════════════════════════════════════════════
export function MatchingHeadingsForm({ group, onChange }) {
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];
    const romanNums = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

    const updateFeature = (idx, text) => {
        onChange({ ...group, featureOptions: features.map((f, i) => i === idx ? { ...f, text } : f) });
    };

    const addFeature = () => {
        const next = romanNums[features.length] || `${features.length + 1}`;
        onChange({ ...group, featureOptions: [...features, { letter: next, text: "" }] });
    };

    const removeFeature = (idx) => {
        onChange({ ...group, featureOptions: features.filter((_, i) => i !== idx) });
    };

    const updateItem = (idx, field, value) => {
        onChange({ ...group, matchingItems: items.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({ ...group, endQuestion: maxQ + 1, matchingItems: [...items, { questionNumber: maxQ + 1, text: `Paragraph ${items.length + 1}`, correctAnswer: "" }] });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Matching Headings মানে — প্রতিটি paragraph এর জন্য সঠিক heading (i, ii, iii...) বেছে নিতে হবে।<br />
                <strong>Step 1:</strong> সব heading গুলো লিখুন। <strong>Step 2:</strong> কোন paragraph এর heading কোনটা সেটা match করুন।
            </Tip>

            {/* Headings list */}
            <div>
                <Step num="1" title="সব heading গুলো লিখুন (question paper থেকে)" />
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <span className="text-xs font-bold text-blue-700 w-6 shrink-0">{f.letter}</span>
                            <input className={`${inp} flex-1`} value={f.text}
                                onChange={e => updateFeature(idx, e.target.value)}
                                placeholder={`Heading ${f.letter}... e.g. The history of nutmeg trade`} />
                            <RemBtn onClick={() => removeFeature(idx)} />
                        </div>
                    ))}
                    <AddBtn onClick={addFeature} label="Heading যোগ করুন" />
                </div>
            </div>

            {/* Paragraph → heading match */}
            <div>
                <Step num="2" title="কোন paragraph এর heading কোনটা? সিলেক্ট করুন" />
                <div className="space-y-1.5">
                    {items.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 w-8 shrink-0">Q{m.questionNumber}</span>
                            <span className="text-sm text-gray-700 flex-1 font-medium">{m.text || `Paragraph ${idx + 1}`}</span>
                            <span className="text-xs text-gray-500">Heading:</span>
                            <select className={`${sel} w-24`} value={m.correctAnswer}
                                onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                <option value="">— বেছে নিন</option>
                                {features.map(f => <option key={f.letter} value={f.letter}>{f.letter} – {f.text.substring(0, 25)}{f.text.length > 25 ? "..." : ""}</option>)}
                            </select>
                        </div>
                    ))}
                    <AddBtn onClick={addItem} label="Paragraph যোগ করুন" />
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 5. MATCHING FEATURES
// ═══════════════════════════════════════════════════
export function MatchingFeaturesForm({ group, onChange }) {
    const features = group.featureOptions || [];
    const items = group.matchingItems || [];

    const updateFeature = (idx, text) => {
        const updated = features.map((f, i) => i === idx ? { ...f, text } : f);
        onChange({ ...group, featureOptions: updated, paragraphOptions: updated.map(f => f.letter) });
    };

    const addFeature = () => {
        const next = String.fromCharCode(65 + features.length);
        const updated = [...features, { letter: next, text: "" }];
        onChange({ ...group, featureOptions: updated, paragraphOptions: updated.map(f => f.letter) });
    };

    const removeFeature = (idx) => {
        const updated = features.filter((_, i) => i !== idx);
        onChange({ ...group, featureOptions: updated, paragraphOptions: updated.map(f => f.letter) });
    };

    const updateItem = (idx, field, value) => {
        onChange({ ...group, matchingItems: items.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
    };

    const addItem = () => {
        const maxQ = items.length > 0 ? Math.max(...items.map(m => m.questionNumber)) : group.startQuestion - 1;
        onChange({ ...group, endQuestion: maxQ + 1, matchingItems: [...items, { questionNumber: maxQ + 1, text: "", correctAnswer: "" }] });
    };

    const removeItem = (idx) => {
        const updated = items.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, matchingItems: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Matching Features মানে — statement টি কোন ব্যক্তি / দেশ / সময়কাল (A, B, C...) এর সাথে মিলে?<br />
                <strong>Step 1:</strong> ব্যক্তি/বৈশিষ্ট্যের তালিকা লিখুন। <strong>Step 2:</strong> প্রতিটি statement এর সঠিক match দিন।
            </Tip>

            {/* Features list */}
            <div>
                <Step num="1" title={`"${group.featureListTitle || 'List of'}" — ব্যক্তি / দেশ / বিষয়গুলো লিখুন`} />
                <div className="mb-2">
                    <input className={inp} value={group.featureListTitle || ""}
                        onChange={e => onChange({ ...group, featureListTitle: e.target.value })}
                        placeholder="List এর title... e.g. List of Explorers" />
                </div>
                <div className="space-y-1.5">
                    {features.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-100 rounded-lg">
                            <span className="text-xs font-bold text-purple-700 w-6 shrink-0">{f.letter}</span>
                            <input className={`${inp} flex-1`} value={f.text}
                                onChange={e => updateFeature(idx, e.target.value)}
                                placeholder={`e.g. Peter Fleming`} />
                            <RemBtn onClick={() => removeFeature(idx)} />
                        </div>
                    ))}
                    <AddBtn onClick={addFeature} label="ব্যক্তি/বৈশিষ্ট্য যোগ করুন" />
                </div>
            </div>

            {/* Statements */}
            <div>
                <Step num="2" title="প্রতিটি statement paste করুন → সঠিক ব্যক্তি/বৈশিষ্ট্য select করুন" />
                <div className="space-y-2">
                    {items.map((m, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-6 text-xs font-bold text-white bg-gray-600 rounded flex items-center justify-center shrink-0">Q{m.questionNumber}</span>
                                <div className="flex-1" />
                                <span className="text-xs text-gray-500">Match:</span>
                                <select className={`${sel} w-24`} value={m.correctAnswer}
                                    onChange={e => updateItem(idx, "correctAnswer", e.target.value)}>
                                    <option value="">— বেছে নিন</option>
                                    {features.map(f => <option key={f.letter} value={f.letter}>{f.letter} – {f.text}</option>)}
                                </select>
                                <RemBtn onClick={() => removeItem(idx)} />
                            </div>
                            <textarea className={ta} rows={2} value={m.text}
                                onChange={e => updateItem(idx, "text", e.target.value)}
                                placeholder="Statement paste করুন..." />
                        </div>
                    ))}
                    <AddBtn onClick={addItem} label="Statement যোগ করুন" />
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 6. MULTIPLE CHOICE (A/B/C/D)
// ═══════════════════════════════════════════════════
export function MCQFullForm({ group, onChange }) {
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
            options: [{ letter: "A", text: "" }, { letter: "B", text: "" }, { letter: "C", text: "" }, { letter: "D", text: "" }]
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
                MCQ তে প্রশ্ন + ৪টি option (A/B/C/D) দিন।<br />
                সঠিক উত্তরের <strong>letter বাটনে click করুন</strong> — সবুজ হয়ে যাবে ✓
            </Tip>

            {mcqs.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    {/* Question */}
                    <div className="flex items-start gap-2">
                        <span className="w-8 h-7 text-xs font-bold text-white bg-blue-600 rounded flex items-center justify-center shrink-0 mt-1">Q{q.questionNumber}</span>
                        <textarea className={`${ta} flex-1`} rows={2} value={q.questionText}
                            onChange={e => updateQ(qIdx, "questionText", e.target.value)}
                            placeholder="question text paste করুন... e.g. What is the writer's main argument?" />
                        <RemBtn onClick={() => removeQ(qIdx)} />
                    </div>

                    {/* Correct answer indicator */}
                    {q.correctAnswer && (
                        <div className="ml-10 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg inline-block">
                            ✓ সঠিক উত্তর: {q.correctAnswer}
                        </div>
                    )}
                    {!q.correctAnswer && (
                        <p className="ml-10 text-xs text-orange-500">👆 নিচের A/B/C/D বাটনে click করে সঠিক উত্তর select করুন</p>
                    )}

                    {/* Options */}
                    <div className="ml-10 space-y-2">
                        {(q.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${q.correctAnswer === opt.letter ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                                <button type="button"
                                    onClick={() => updateQ(qIdx, "correctAnswer", opt.letter)}
                                    title="Click করুন সঠিক উত্তর হলে"
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
            <AddBtn onClick={addQ} label="নতুন MCQ যোগ করুন" />
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 7. SUMMARY WITH OPTIONS (Phrase List)
// ═══════════════════════════════════════════════════
export function SummaryOptionsForm({ group, onChange }) {
    const phrases = group.phraseList || [];
    const segments = group.summarySegments || [];
    const blankSegments = segments.filter(s => s.type === "blank");

    const updatePhrase = (idx, text) => {
        onChange({ ...group, phraseList: phrases.map((p, i) => i === idx ? { ...p, text } : p) });
    };

    const addPhrase = () => {
        const next = String.fromCharCode(65 + phrases.length);
        onChange({ ...group, phraseList: [...phrases, { letter: next, text: "" }] });
    };

    const removePhrase = (idx) => {
        onChange({ ...group, phraseList: phrases.filter((_, i) => i !== idx) });
    };

    const updateSeg = (idx, field, value) => {
        onChange({ ...group, summarySegments: segments.map((s, i) => i === idx ? { ...s, [field]: value } : s) });
    };

    const removeSeg = (idx) => {
        const updated = segments.filter((_, i) => i !== idx);
        const blanks = updated.filter(s => s.type === "blank");
        const maxQ = blanks.length > 0 ? Math.max(...blanks.map(s => s.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, summarySegments: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Summary with Options মানে — summary text এ ফাঁকা জায়গাগুলো একটি word list থেকে পূরণ করতে হবে।<br />
                <strong>Step 1:</strong> Word list দিন (A, B, C...)। <strong>Step 2:</strong> Summary কে text + blank অংশে ভাগ করুন।
            </Tip>

            {/* Heading */}
            <div>
                <Step num="1" title="Summary heading লিখুন (optional)" />
                <input className={inp} value={group.mainHeading || ""}
                    onChange={e => onChange({ ...group, mainHeading: e.target.value })}
                    placeholder="e.g. The uses of nutmeg" />
            </div>

            {/* Phrase list */}
            <div>
                <Step num="2" title="Word/Phrase list দিন (question paper এর box থেকে)" />
                <div className="grid grid-cols-2 gap-1.5">
                    {phrases.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 p-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                            <span className="text-xs font-bold text-orange-700 w-5 shrink-0">{p.letter}</span>
                            <input className={`${inp} flex-1 py-1`} value={p.text}
                                onChange={e => updatePhrase(idx, e.target.value)}
                                placeholder="word / phrase..." />
                            <RemBtn onClick={() => removePhrase(idx)} />
                        </div>
                    ))}
                </div>
                <AddBtn onClick={addPhrase} label="Word যোগ করুন" />
            </div>

            {/* Summary segments */}
            <div>
                <Step num="3" title="Summary text সাজান — Text অংশ এবং Blank (প্রশ্ন) অংশ আলাদা করুন" />
                <Tip>
                    Summary টি text + blank এ ভাগ করুন।<br />
                    <strong>+ Text:</strong> সাধারণ text অংশ | <strong>+ Blank:</strong> ফাঁকা (question) অংশ, তারপর সঠিক উত্তর select করুন
                </Tip>
                <div className="space-y-1.5">
                    {segments.map((seg, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${seg.type === "text" ? "bg-gray-50 border-gray-200" : "bg-orange-50 border-orange-200"}`}>
                            {seg.type === "text" ? (
                                <>
                                    <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded font-bold shrink-0">Text</span>
                                    <input className={`${inp} flex-1`} value={seg.content || ""}
                                        onChange={e => updateSeg(idx, "content", e.target.value)}
                                        placeholder="Summary এর text অংশ..." />
                                </>
                            ) : (
                                <>
                                    <span className="text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded font-bold shrink-0">Q{seg.questionNumber}</span>
                                    <select className={`${sel} flex-1`} value={seg.correctAnswer || ""}
                                        onChange={e => updateSeg(idx, "correctAnswer", e.target.value)}>
                                        <option value="">সঠিক উত্তর select করুন...</option>
                                        {phrases.map(p => <option key={p.letter} value={p.letter}>{p.letter} – {p.text}</option>)}
                                    </select>
                                </>
                            )}
                            <RemBtn onClick={() => removeSeg(idx)} />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => onChange({ ...group, summarySegments: [...segments, { type: "text", content: "" }] })}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 py-1.5 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <FaPlus size={9} /> + Text
                    </button>
                    <button type="button" onClick={() => {
                        const maxQ = blankSegments.length > 0 ? Math.max(...blankSegments.map(s => s.questionNumber)) : group.startQuestion - 1;
                        onChange({ ...group, endQuestion: maxQ + 1, summarySegments: [...segments, { type: "blank", questionNumber: maxQ + 1, correctAnswer: "" }] });
                    }} className="flex items-center gap-1 text-xs font-medium text-orange-600 py-1.5 px-3 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
                        <FaPlus size={9} /> + Blank (ফাঁকা)
                    </button>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 8. TABLE COMPLETION
// ═══════════════════════════════════════════════════
export function TableCompletionForm({ group, onChange }) {
    const columns = group.columns || ["", "Column 1", "Column 2"];
    const rows = group.rows || [];
    const answers = group.answers || [];

    // Helper: count blanks in all cells → sync answers array
    const syncAnswers = (newRows, existingAnswers, startQ) => {
        const blanks = [];
        newRows.forEach(row => {
            (row.cells || []).forEach(cell => {
                // Find "N __________" pattern
                const matches = (cell.content || "").match(/(\d+)\s*_{5,}/g) || [];
                matches.forEach(m => {
                    const num = parseInt(m.match(/(\d+)/)?.[1]);
                    if (!isNaN(num)) blanks.push(num);
                });
            });
        });
        blanks.sort((a, b) => a - b);
        const newAnswers = blanks.map(n => ({
            questionNumber: n,
            correctAnswer: existingAnswers.find(a => a.questionNumber === n)?.correctAnswer || ""
        }));
        const maxQ = blanks.length > 0 ? Math.max(...blanks) : startQ;
        return { newAnswers, maxQ };
    };

    const updateColumn = (idx, value) => {
        const updated = columns.map((c, i) => i === idx ? value : c);
        onChange({ ...group, columns: updated });
    };

    const addColumn = () => {
        const newCols = [...columns, `Column ${columns.length}`];
        const newRows = rows.map(r => ({
            ...r, cells: [...(r.cells || []), { content: "", hasBlank: false }]
        }));
        onChange({ ...group, columns: newCols, rows: newRows });
    };

    const removeColumn = (cIdx) => {
        if (columns.length <= 2) return;
        const newCols = columns.filter((_, i) => i !== cIdx);
        const newRows = rows.map(r => ({
            ...r, cells: (r.cells || []).filter((_, i) => i !== cIdx)
        }));
        const { newAnswers, maxQ } = syncAnswers(newRows, answers, group.startQuestion);
        onChange({ ...group, columns: newCols, rows: newRows, answers: newAnswers, endQuestion: maxQ });
    };

    const updateRow = (rIdx, field, value) => {
        const newRows = rows.map((r, i) => i === rIdx ? { ...r, [field]: value } : r);
        onChange({ ...group, rows: newRows });
    };

    const updateCell = (rIdx, cIdx, value) => {
        const newRows = rows.map((r, i) => {
            if (i !== rIdx) return r;
            const cells = (r.cells || []).map((c, j) => j === cIdx ? { ...c, content: value } : c);
            return { ...r, cells };
        });
        const { newAnswers, maxQ } = syncAnswers(newRows, answers, group.startQuestion);
        onChange({ ...group, rows: newRows, answers: newAnswers, endQuestion: maxQ });
    };

    const addRow = () => {
        const numCells = columns.length - 1; // first column is row label
        const newRow = { label: `Row ${rows.length + 1}`, cells: Array.from({ length: numCells }, () => ({ content: "", hasBlank: false })) };
        onChange({ ...group, rows: [...rows, newRow] });
    };

    const removeRow = (rIdx) => {
        const newRows = rows.filter((_, i) => i !== rIdx);
        const { newAnswers, maxQ } = syncAnswers(newRows, answers, group.startQuestion);
        onChange({ ...group, rows: newRows, answers: newAnswers, endQuestion: maxQ });
    };

    const updateAnswer = (qNum, value) => {
        const newAnswers = answers.map(a => a.questionNumber === qNum ? { ...a, correctAnswer: value } : a);
        onChange({ ...group, answers: newAnswers });
    };

    const dataCols = columns.slice(1); // all except first (row label)

    return (
        <div className="space-y-4">
            <Tip>
                Table Completion — table এর ফাঁকা জায়গা passage থেকে পূরণ করতে হবে।<br />
                <strong>Step 1:</strong> Table title + column headers দিন।
                <strong> Step 2:</strong> প্রতিটি row এর cell এ content লিখুন।<br />
                ফাঁকার জায়গায় লিখুন: <code className="bg-blue-100 px-1 rounded">4 __________</code> (question number + ১০টি underscore)<br />
                <strong>Step 3:</strong> নিচে answers দিন।
            </Tip>

            {/* Table Title */}
            <div>
                <Step num="1" title="Table title লিখুন" />
                <input className={inp} value={group.tableTitle || ""}
                    onChange={e => onChange({ ...group, tableTitle: e.target.value })}
                    placeholder="e.g. Intensive farming versus aeroponic urban farming" />
            </div>

            {/* Column Headers */}
            <div>
                <Step num="2" title="Column headers দিন (প্রথমটি row label এর জন্য — খালি রাখুন)" />
                <div className="flex gap-2 flex-wrap items-center">
                    {columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1">
                            <input
                                className={`${inp} w-32 py-1`}
                                value={col}
                                onChange={e => updateColumn(cIdx, e.target.value)}
                                placeholder={cIdx === 0 ? "(row label col)" : `Header ${cIdx}`}
                            />
                            {cIdx > 1 && (
                                <button type="button" onClick={() => removeColumn(cIdx)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                    <FaTrash size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addColumn}
                        className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer">
                        + Column
                    </button>
                </div>
            </div>

            {/* Table Rows */}
            <div>
                <Step num="3" title="Table এর rows fill করুন — ফাঁকার জায়গায় 4 __________ format ব্যবহার করুন" />
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-600 w-28">
                                    {columns[0] || ""}
                                </th>
                                {dataCols.map((col, i) => (
                                    <th key={i} className="border border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-600">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-gray-50">
                                    {/* Row label */}
                                    <td className="border border-gray-200 px-2 py-1 bg-gray-50">
                                        <div className="flex items-center gap-1">
                                            <input className="w-full text-xs font-semibold text-gray-700 bg-transparent border-none outline-none"
                                                value={row.label} onChange={e => updateRow(rIdx, "label", e.target.value)}
                                                placeholder="Row label..." />
                                            <button type="button" onClick={() => removeRow(rIdx)} className="text-red-300 hover:text-red-500 cursor-pointer flex-shrink-0">
                                                <FaTrash size={9} />
                                            </button>
                                        </div>
                                    </td>
                                    {/* Data cells */}
                                    {dataCols.map((_, cIdx) => {
                                        const cell = (row.cells || [])[cIdx] || { content: "" };
                                        const hasBlank = /\d+\s*_{5,}/.test(cell.content || "");
                                        return (
                                            <td key={cIdx} className={`border border-gray-200 px-2 py-1 ${hasBlank ? "bg-amber-50" : ""}`}>
                                                <textarea
                                                    className="w-full text-xs bg-transparent border-none outline-none resize-none"
                                                    rows={2}
                                                    value={cell.content || ""}
                                                    onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                                                    placeholder={`text... or "4 __________"`}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <AddBtn onClick={addRow} label="Row যোগ করুন" />
            </div>

            {/* Answers */}
            {answers.length > 0 && (
                <div>
                    <Step num="4" title="সঠিক উত্তর দিন" />
                    <div className="space-y-2">
                        {answers.map((a, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-xs font-bold text-green-700 w-8 shrink-0">Q{a.questionNumber}</span>
                                <input className={`${inp} flex-1`} value={a.correctAnswer}
                                    onChange={e => updateAnswer(a.questionNumber, e.target.value)}
                                    placeholder={`Question ${a.questionNumber} এর উত্তর...`} />
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">⚠️ Cell এ নতুন ফাঁকা যোগ করলে এখানে automatically list আপডেট হবে</p>
                </div>
            )}
            {answers.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">⚠️ এখনো কোনো blank নেই। Cell এ <code className="bg-amber-100 px-1 rounded">4 __________</code> format এ লিখলে answer field এখানে দেখাবে।</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 9. SHORT ANSWER QUESTIONS
// ═══════════════════════════════════════════════════
export function ShortAnswerForm({ group, onChange }) {
    const questions = group.questions || [];

    const updateQ = (idx, field, value) => {
        const updated = questions.map((q, i) => i === idx ? { ...q, [field]: value } : q);
        onChange({ ...group, questions: updated });
    };

    const addQ = () => {
        const lastQ = questions.length > 0 ? questions[questions.length - 1].questionNumber : group.startQuestion - 1;
        const newQ = { questionNumber: lastQ + 1, questionText: "", correctAnswer: "" };
        const updated = [...questions, newQ];
        onChange({ ...group, questions: updated, endQuestion: lastQ + 1 });
    };

    const removeQ = (idx) => {
        const updated = questions.filter((_, i) => i !== idx);
        onChange({ ...group, questions: updated, endQuestion: updated.length > 0 ? updated[updated.length - 1].questionNumber : group.startQuestion });
    };

    const isTFNG = false;
    const answerType = (group.subInstruction || "").toLowerCase().includes("number") ? "number" : "word";

    return (
        <div className="space-y-4">
            <Tip>
                Short Answer Questions — student passage পড়ে সরাসরি উত্তর লিখবে।<br />
                <strong>Step 1:</strong> Question এর ধরন বেছে নিন (instruction এ)।<br />
                <strong>Step 2:</strong> প্রতিটি question এর text + সঠিক উত্তর দিন।
            </Tip>

            {/* Instructions */}
            <Step num="1" title="Instructions দিন" />
            <div className="grid grid-cols-1 gap-2">
                <input className={inp} value={group.mainInstruction || ""}
                    onChange={e => onChange({ ...group, mainInstruction: e.target.value })}
                    placeholder="e.g. Answer the questions below." />
                <input className={inp} value={group.subInstruction || ""}
                    onChange={e => onChange({ ...group, subInstruction: e.target.value })}
                    placeholder="e.g. Choose ONE NUMBER ONLY / ONE WORD ONLY from the text for each answer." />
            </div>

            {/* Questions */}
            <Step num="2" title="Questions + সঠিক উত্তর দিন" />
            <div className="space-y-3">
                {questions.map((q, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Q{q.questionNumber}</span>
                            <RemBtn onClick={() => removeQ(idx)} />
                        </div>
                        <textarea className={inp} rows={2}
                            value={q.questionText}
                            onChange={e => updateQ(idx, "questionText", e.target.value)}
                            placeholder={`When did Viking warriors raid an abbey on the coast of England?`} />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 shrink-0">✅ Answer:</span>
                            <input className={`${inp} flex-1 bg-green-50 border-green-200`}
                                value={q.correctAnswer}
                                onChange={e => updateQ(idx, "correctAnswer", e.target.value)}
                                placeholder={`e.g. 793 / oval / transported...`} />
                        </div>
                    </div>
                ))}
            </div>
            <AddBtn onClick={addQ} label="Question যোগ করুন" />
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 10. CHOOSE TWO LETTERS
// ═══════════════════════════════════════════════════
export function ChooseTwoForm({ group, onChange }) {
    const sets = group.questionSets || [];

    const updateSet = (sIdx, field, value) => {
        onChange({ ...group, questionSets: sets.map((s, i) => i === sIdx ? { ...s, [field]: value } : s) });
    };

    const updateOption = (sIdx, oIdx, text) => {
        const updated = sets.map((s, i) => {
            if (i !== sIdx) return s;
            return { ...s, options: s.options.map((o, j) => j === oIdx ? { ...o, text } : o) };
        });
        onChange({ ...group, questionSets: updated });
    };

    const toggleCorrect = (sIdx, letter) => {
        const set = sets[sIdx];
        const current = set.correctAnswers || [];
        const maxLen = (set.questionNumbers || []).length;
        const updated = current.includes(letter) ? current.filter(l => l !== letter)
            : current.length < maxLen ? [...current, letter] : [...current.slice(1), letter];
        updateSet(sIdx, "correctAnswers", updated);
    };

    const addSet = () => {
        const maxQ = sets.length > 0 ? Math.max(...sets.flatMap(s => s.questionNumbers)) : group.startQuestion - 1;
        const newSet = {
            questionNumbers: [maxQ + 1, maxQ + 2], questionText: "",
            options: ["A", "B", "C", "D", "E"].map(l => ({ letter: l, text: "" })),
            correctAnswers: []
        };
        onChange({ ...group, endQuestion: maxQ + 2, questionSets: [...sets, newSet] });
    };

    const changeNumQuestions = (sIdx, delta) => {
        const set = sets[sIdx];
        let nums = [...(set.questionNumbers || [])];
        if (delta > 0) {
            const maxQ = Math.max(...sets.flatMap(s => s.questionNumbers || []), group.startQuestion - 1);
            nums.push(maxQ + 1);
            onChange({ ...group, endQuestion: maxQ + 1, questionSets: sets.map((s, i) => i === sIdx ? { ...s, questionNumbers: nums } : s) });
        } else if (nums.length > 1) {
            nums.pop();
            const maxQ = Math.max(...sets.flatMap((s, i) => i === sIdx ? nums : s.questionNumbers || []), group.startQuestion - 1);
            onChange({ ...group, endQuestion: maxQ, questionSets: sets.map((s, i) => i === sIdx ? { ...s, questionNumbers: nums } : s) });
        }
    };

    const changeNumOptions = (sIdx, delta) => {
        const set = sets[sIdx];
        let opts = [...(set.options || [])];
        if (delta > 0) {
            const nextLetter = String.fromCharCode(65 + opts.length);
            opts.push({ letter: nextLetter, text: "" });
        } else if (opts.length > 2) {
            opts.pop();
        }
        updateSet(sIdx, "options", opts);
    };

    const removeSet = (idx) => {
        const updated = sets.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.flatMap(s => s.questionNumbers)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, questionSets: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Choose Multiple Letters — সঠিক অপশনগুলো বেছে নিন।<br />
                <strong>সঠিক অপশনের লেটার বাটনে ক্লিক করুন</strong> — সবুজ হলে সিলেক্টেড।
            </Tip>

            {sets.map((set, sIdx) => {
                const numQs = (set.questionNumbers || []).length;
                return (
                <div key={sIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded shrink-0">Q{set.questionNumbers?.join(" & ")}</span>
                        <textarea className={`${ta} flex-1`} rows={2} value={set.questionText}
                            onChange={e => updateSet(sIdx, "questionText", e.target.value)}
                            placeholder="Question text paste করুন... e.g. Which THREE of the following are mentioned?" />
                        <RemBtn onClick={() => removeSet(sIdx)} />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">Number of Selections:</span>
                        <button type="button" onClick={() => changeNumQuestions(sIdx, -1)} className="px-2 py-0.5 bg-gray-200 rounded text-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{numQs}</span>
                        <button type="button" onClick={() => changeNumQuestions(sIdx, 1)} className="px-2 py-0.5 bg-gray-200 rounded text-xs">+</button>
                    </div>

                    {/* Correct answers indicator */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">সঠিক {numQs}টি:</span>
                        {(set.correctAnswers || []).length === 0
                            ? <span className="text-xs text-orange-500">নিচের option বাটনে click করুন</span>
                            : (set.correctAnswers || []).map(l => (
                                <span key={l} className="text-xs font-bold text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded-full">✓ {l}</span>
                            ))
                        }
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                        {(set.options || []).map((opt, oIdx) => {
                            const isCorrect = (set.correctAnswers || []).includes(opt.letter);
                            return (
                                <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCorrect ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                                    <button type="button"
                                        onClick={() => toggleCorrect(sIdx, opt.letter)}
                                        title="Click করুন সঠিক উত্তর হলে"
                                        className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center border-2 transition-all cursor-pointer flex-shrink-0 ${isCorrect
                                            ? "bg-green-500 border-green-500 text-white shadow-md"
                                            : "border-gray-300 text-gray-500 hover:border-green-400 bg-white"}`}>
                                        {isCorrect ? "✓" : opt.letter}
                                    </button>
                                    <input className={`${inp} flex-1`} value={opt.text}
                                        onChange={e => updateOption(sIdx, oIdx, e.target.value)}
                                        placeholder={`Option ${opt.letter}...`} />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-1">
                        <button type="button" onClick={() => changeNumOptions(sIdx, -1)} className="text-xs text-red-500 underline hover:text-red-700">Remove Option</button>
                        <button type="button" onClick={() => changeNumOptions(sIdx, 1)} className="text-xs text-blue-500 underline hover:text-blue-700">Add Option</button>
                    </div>
                </div>
            )})}
            <AddBtn onClick={addSet} label="Question Set যোগ করুন" />
        </div>
    );
}


// ═══════════════════════════════════════════════════
// 11. DIAGRAM / FLOWCHART LABELING
// ═══════════════════════════════════════════════════
export function DiagramLabelingForm({ group, onChange }) {
    const [isUploading, setIsUploading] = useState(false);
    const markers = group.markers || [];

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await uploadAPI.uploadImage(file);
            onChange({ ...group, imageUrl: res.url || res.data?.url || "" });
        } catch (err) {
            alert("Upload failed: " + err.message);
        }
        setIsUploading(false);
    };

    const addMarkerClick = (e) => {
        if (!group.imageUrl) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const maxQ = markers.length > 0 ? Math.max(...markers.map(m => m.questionNumber)) : group.startQuestion - 1;
        
        onChange({ 
            ...group, 
            endQuestion: maxQ + 1,
            markers: [...markers, { questionNumber: maxQ + 1, x, y, correctAnswer: "" }] 
        });
    };

    const updateMarker = (idx, field, val) => {
        onChange({
            ...group,
            markers: markers.map((m, i) => i === idx ? { ...m, [field]: val } : m)
        });
    };

    const removeMarker = (idx) => {
        const updated = markers.filter((_, i) => i !== idx);
        const maxQ = updated.length > 0 ? Math.max(...updated.map(m => m.questionNumber)) : group.startQuestion;
        onChange({ ...group, endQuestion: maxQ, markers: updated });
    };

    return (
        <div className="space-y-4">
            <Tip>
                Diagram বা Flowchart এর ছবি আপলোড করুন। তারপর ছবির যে যে জায়গায় প্রশ্ন আছে সেখানে ক্লিক করে Question Marker বসান।
            </Tip>
            
            <Step num="1" title="ছবি আপলোড করুন (Upload Image)" />
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2 text-center">
                {!group.imageUrl ? (
                    <label className="cursor-pointer inline-flex flex-col items-center">
                        <FaCloudUploadAlt size={32} className="text-gray-400 mb-2" />
                        <span className="text-sm text-blue-600 font-bold underline mb-1">{isUploading ? "Uploading..." : "Click to select image"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
                    </label>
                ) : (
                    <div className="space-y-3">
                        <div className="text-xs text-green-600 font-bold mb-2">✅ Image Uploaded</div>
                        <label className="text-xs text-blue-600 cursor-pointer underline">
                             [Change Image]
                             <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
                        </label>
                    </div>
                )}
                {/* Fallback to allow URL paste directly if upload fails */}
                <div className="mt-4 text-left">
                    <span className="text-xs text-gray-500 mb-1 block">Or paste image URL directly:</span>
                    <input className={inp} value={group.imageUrl || ""} onChange={e => onChange({ ...group, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
            </div>

            {group.imageUrl && (
                <>
                    <Step num="2" title="ছবির ওপর ক্লিক করে Marker (Question Box) তৈরি করুন" />
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white max-w-2xl mx-auto cursor-crosshair group select-none"
                        onClick={addMarkerClick}>
                        <img src={group.imageUrl} alt="Diagram" className="w-full h-auto pointer-events-none" />
                        
                        {/* Render temporary hover hint overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-blur-sm pointer-events-none">Click to add marker</span>
                        </div>

                        {markers.map((m, idx) => (
                            <div key={idx} 
                                onClick={e => e.stopPropagation()} 
                                className="absolute -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md shadow-lg border-2 border-blue-500 rounded p-1 flex flex-col items-center z-10 hover:z-20 transition-transform"
                                style={{ top: `${m.y}%`, left: `${m.x}%` }}>
                                <div className="text-[10px] font-bold bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-3 absolute top-0 shadow-sm border border-white">
                                    {m.questionNumber}
                                </div>
                                <input 
                                    className="w-20 text-xs px-1 py-0.5 border border-gray-300 rounded mt-2 outline-none text-center focus:border-blue-500 font-medium"
                                    value={m.correctAnswer}
                                    placeholder="Answer"
                                    onChange={e => updateMarker(idx, "correctAnswer", e.target.value)}
                                />
                                <button type="button" onClick={() => removeMarker(idx)} className="text-[10px] text-red-500 hover:text-red-700 mt-1 uppercase font-bold tracking-wider">Remove</button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// 12. CUSTOM FLOWCHART (MOCK 01)
// ═══════════════════════════════════════════════════
export function CustomFlowchartForm({ group, onChange }) {
    const handleAnswerChange = (qNum, val) => {
        const idx = group.questions?.findIndex(q => q.questionNumber === qNum);
        if (idx >= 0) {
            const updated = [...group.questions];
            updated[idx] = { ...updated[idx], correctAnswer: val };
            onChange({ ...group, questions: updated });
        } else {
            const updated = [...(group.questions || []), { questionNumber: qNum, correctAnswer: val }];
            onChange({ ...group, questions: updated });
        }
    };

    return (
        <div className="space-y-4 bg-gray-50 p-4 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-gray-800 text-sm mb-2">Custom CSS Flowchart (Mock 01)</h4>
            <div className="text-xs text-gray-600 mb-4 bg-white p-3 rounded border border-gray-200">
                <p>This is a custom hard-coded flowchart layout. The design is fixed via CSS in the frontend.</p>
                <p>You do not need to upload any image. Just enter the correct answers below.</p>
            </div>
            
            <div className="space-y-3">
                {[27, 28, 29, 30, 31, 32].map(qNum => {
                    const qObj = (group.questions || []).find(q => q.questionNumber === qNum) || {};
                    return (
                        <div key={qNum} className="flex items-center gap-2 max-w-sm">
                            <span className="font-bold text-sm min-w-[30px]">Q{qNum}:</span>
                            <input 
                                className={inp} 
                                value={qObj.correctAnswer || ""} 
                                onChange={e => handleAnswerChange(qNum, e.target.value)} 
                                placeholder="Correct answer"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MAIN WRAPPER — QuestionGroupEditor
// ═══════════════════════════════════════════════════
export function QuestionGroupEditor({ group, index, onUpdate, onRemove }) {
    const [collapsed, setCollapsed] = React.useState(false);

    const typeInfo = [
        { value: "note-completion", label: "Note/Sentence Completion", icon: "📝", color: "blue" },
        { value: "table-completion", label: "Table Completion", icon: "📊", color: "cyan" },
        { value: "short-answer", label: "Short Answer Questions", icon: "✏️", color: "purple" },
        { value: "true-false-not-given", label: "True / False / Not Given", icon: "✅", color: "green" },
        { value: "yes-no-not-given", label: "Yes / No / Not Given", icon: "🔘", color: "teal" },
        { value: "matching-information", label: "Matching Information", icon: "🔗", color: "indigo" },
        { value: "matching-headings", label: "Matching Headings", icon: "📑", color: "purple" },
        { value: "matching-features", icon: "👥", color: "violet" },
        { value: "multiple-choice-full", label: "Multiple Choice (A/B/C/D)", icon: "🔤", color: "orange" },
        { value: "summary-with-options", label: "Summary + Options", icon: "📋", color: "amber" },
        { value: "choose-two-letters", label: "Choose Two Letters", icon: "✌️", color: "rose" },
    ].find(t => t.value === group.groupType) || { label: group.groupType, icon: "❓", color: "gray" };

    const renderForm = () => {
        switch (group.groupType) {
            case "note-completion": return <NoteCompletionForm group={group} onChange={onUpdate} />;
            case "table-completion": return <TableCompletionForm group={group} onChange={onUpdate} />;
            case "short-answer": return <ShortAnswerForm group={group} onChange={onUpdate} />;
            case "true-false-not-given":
            case "yes-no-not-given": return <TFNGForm group={group} onChange={onUpdate} />;
            case "matching-information": return <MatchingInfoForm group={group} onChange={onUpdate} />;
            case "matching-headings": return <MatchingHeadingsForm group={group} onChange={onUpdate} />;
            case "matching-features": return <MatchingFeaturesForm group={group} onChange={onUpdate} />;
            case "multiple-choice-full": return <MCQFullForm group={group} onChange={onUpdate} />;
            case "summary-with-options": return <SummaryOptionsForm group={group} onChange={onUpdate} />;
            case "choose-two-letters": return <ChooseTwoForm group={group} onChange={onUpdate} />;
            case "diagram-labeling": 
            case "custom-flowchart-1": return <CustomFlowchartForm group={group} onChange={onUpdate} />;
            default: return <p className="text-sm text-gray-500">Unknown question type</p>;
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setCollapsed(!collapsed)}>
                <div className="flex items-center gap-2">
                    <span className="text-xl">{typeInfo.icon}</span>
                    <div>
                        <span className="font-semibold text-sm text-gray-800">{typeInfo.label}</span>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Q{group.startQuestion}–Q{group.endQuestion}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors cursor-pointer">
                        <FaTrash size={12} />
                    </button>
                    <span className="text-gray-400 text-sm">{collapsed ? "▼" : "▲"}</span>
                </div>
            </div>

            {/* Body */}
            {!collapsed && (
                <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                    {/* Instruction field */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">
                            📌 Main Instruction (e.g. Do the following statements agree...)
                        </label>
                        <input className={inp} value={group.mainInstruction || ""}
                            onChange={e => onUpdate({ ...group, mainInstruction: e.target.value })}
                            placeholder="e.g. Do the following statements agree with the information in the Reading Passage?" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">
                            📌 Sub Instruction (e.g. In spaces 1-5 below, write...)
                        </label>
                        <input className={inp} value={group.subInstruction || ""}
                            onChange={e => onUpdate({ ...group, subInstruction: e.target.value })}
                            placeholder="e.g. In spaces 23-26 below, write YES, NO or NOT GIVEN" />
                    </div>

                    {/* Type-specific form */}
                    <div className="border-t border-dashed border-gray-200 pt-3">
                        {renderForm()}
                    </div>
                </div>
            )}
        </div>
    );
}
