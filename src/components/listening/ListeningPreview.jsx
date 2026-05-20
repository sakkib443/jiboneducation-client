"use client";
import React, { useState } from "react";
import { FaHeadphones, FaVolumeUp, FaCheck } from "react-icons/fa";

// ══════════════════════════════════════════════════════════
//  buildRenderGroups — SAME as exam page
//  Groups consecutive same-type questions together
// ══════════════════════════════════════════════════════════
function buildRenderGroups(blocks) {
    const groups = [];
    let i = 0;
    while (i < blocks.length) {
        const b = blocks[i];
        if (b.blockType === 'instruction') {
            groups.push({ type: 'instruction', block: b });
            i++; continue;
        }
        const qType = b.questionType || 'fill-in-blank';
        const group = [b];
        let j = i + 1;
        if (['matching', 'multiple-choice-multi', 'matching-features', 'matching-headings', 'map-labeling', 'diagram-labeling'].includes(qType)) {
            while (j < blocks.length && blocks[j].blockType !== 'instruction' && blocks[j].questionType === qType) {
                group.push(blocks[j]); j++;
            }
        }
        groups.push({ type: qType, blocks: group });
        i = j;
    }
    return groups;
}

// ══════════════════════════════════════════════════════════
//  NoteCompletionRow — SAME style as exam page
//  but shows correct answer in green instead of input
// ══════════════════════════════════════════════════════════
function NoteCompletionRow({ q }) {
    const raw = q.questionText || '';
    const noBullet = raw.startsWith('~');
    const displayText = noBullet ? raw.slice(1).trimStart() : raw;
    const hasBlank = /_{2,}|\{blank\}|\[\d+\]/.test(displayText);

    if (hasBlank) {
        const parts = displayText.split(/_{2,}|\{blank\}|\[\d+\]/);
        const segments = [];
        parts.forEach((part, pIdx) => {
            if (part.trim()) segments.push(<span key={`t-${pIdx}`}>{part}</span>);
            if (pIdx < parts.length - 1) {
                segments.push(
                    <span key={`b-${pIdx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle', margin: '0 3px' }}>
                        <span style={{
                            border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                            padding: '0 6px', color: '#111827', background: 'white',
                            lineHeight: '1.8', borderRadius: '2px'
                        }}>{q.questionNumber}</span>
                        <span style={{
                            display: 'inline-block', border: '1px solid #d1d5db', width: '140px',
                            padding: '2px 8px', background: q.correctAnswer ? '#ecfdf5' : '#f9fafb',
                            color: q.correctAnswer ? '#059669' : '#9ca3af',
                            fontWeight: 'bold', fontSize: '13px', borderRadius: '2px', minHeight: '26px',
                            lineHeight: '22px'
                        }}>
                            {q.correctAnswer || ''}
                        </span>
                    </span>
                );
            }
        });
        return (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '15px', color: '#1f2937', lineHeight: '2' }}>
                {!noBullet && <span style={{ marginTop: '4px', flexShrink: 0 }}>•</span>}
                <span style={{ flex: 1 }}>{segments}</span>
            </li>
        );
    }

    // No inline blank — show [N] + text + answer box
    const cleanText = displayText.replace(/_{1,}/g, '').replace(/\{blank\}/g, '').replace(/\[\d+\]/g, '').trim();
    return (
        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '15px', color: '#1f2937', lineHeight: '2' }}>
            {!noBullet && <span style={{ marginTop: '4px', flexShrink: 0 }}>•</span>}
            <span style={{ flex: 1 }}>
                {cleanText}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle', marginLeft: '6px' }}>
                    <span style={{
                        border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                        padding: '0 6px', color: '#111827', background: 'white',
                        lineHeight: '1.8', borderRadius: '2px'
                    }}>{q.questionNumber}</span>
                    <span style={{
                        display: 'inline-block', border: '1px solid #d1d5db', width: '140px',
                        padding: '2px 8px', background: q.correctAnswer ? '#ecfdf5' : '#f9fafb',
                        color: q.correctAnswer ? '#059669' : '#9ca3af',
                        fontWeight: 'bold', fontSize: '13px', borderRadius: '2px', minHeight: '26px',
                        lineHeight: '22px'
                    }}>
                        {q.correctAnswer || ''}
                    </span>
                </span>
            </span>
        </li>
    );
}

// ══════════════════════════════════════════════════════════
//  Main Preview Component
// ══════════════════════════════════════════════════════════
export default function ListeningPreview({ sections, title, mainAudioUrl }) {
    const [activePart, setActivePart] = useState(0);
    const currentSection = sections[activePart] || {};
    const blocks = currentSection.questions || [];
    const questionBlocks = blocks.filter(b => b.blockType === "question");

    const renderGroups = buildRenderGroups(blocks);

    return (
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', fontFamily: "'Arial', sans-serif", fontSize: '14px' }}>

            {/* ══ Header ══ */}
            <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #ccc', height: '44px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontWeight: 'bold', color: '#d40000', fontSize: '20px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>IELTS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }}>
                            <FaVolumeUp size={11} />
                            <span>Admin Preview</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '3px', fontWeight: 'bold' }}>
                            ✓ Correct answers shown
                        </span>
                    </div>
                </div>
            </header>

            {/* Part Banner — gray bar (same as exam) */}
            <div style={{ backgroundColor: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '5px 16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {sections.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePart(idx)}
                            style={{
                                padding: '4px 14px', fontSize: '13px', fontWeight: activePart === idx ? 'bold' : 'normal',
                                background: activePart === idx ? '#fff' : 'transparent',
                                color: activePart === idx ? '#1f2937' : '#4b5563',
                                border: activePart === idx ? '1px solid #d1d5db' : '1px solid transparent',
                                borderBottom: activePart === idx ? '1px solid #fff' : 'none',
                                borderRadius: '3px 3px 0 0', cursor: 'pointer', marginBottom: '-6px'
                            }}
                        >
                            Part {idx + 1}
                        </button>
                    ))}
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '6px' }}>
                    {currentSection.instructions || `Part ${activePart + 1}`}
                </div>
            </div>

            {/* ══ Scrollable Content ══ */}
            <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingBottom: '56px' }}>
                <div style={{ maxWidth: '1000px', padding: '30px 60px' }}>

                    {/* Section image if any */}
                    {currentSection.imageUrl && (
                        <div style={{ marginBottom: '16px' }}>
                            <img src={currentSection.imageUrl} alt="Section diagram" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                        </div>
                    )}

                    {blocks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                            <FaHeadphones size={40} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                            <p style={{ fontStyle: 'italic', fontSize: '14px' }}>No questions in Part {activePart + 1}</p>
                        </div>
                    )}

                    {/* ══ Render Groups — same as exam page ══ */}
                    {(() => {
                        // Detect embedded question numbers from instruction blocks
                        const embeddedQNums = new Set();
                        renderGroups.forEach(grp => {
                            if (grp.type === 'instruction' && grp.block.content) {
                                const matches = grp.block.content.match(/\[(\d+)\]/g);
                                if (matches) {
                                    matches.forEach(m => {
                                        const num = parseInt(m.replace(/[\[\]]/g, ''));
                                        if (num >= 1 && num <= 40) embeddedQNums.add(num);
                                    });
                                }
                            }
                        });

                        // Build a map of qNum -> correctAnswer for embedded questions
                        const answerMap = {};
                        blocks.forEach(b => {
                            if (b.blockType === 'question' && b.questionNumber) {
                                answerMap[b.questionNumber] = b.correctAnswer || '';
                            }
                        });

                        return renderGroups.map((grp, gIdx) => {

                            // ── Instruction block ──
                            if (grp.type === 'instruction') {
                                // Process instruction HTML: replace [N] with correct answer display
                                let html = grp.block.content || '';
                                const hasEmbedded = /\[\d+\]/.test(html);
                                if (hasEmbedded) {
                                    html = html.replace(
                                        /(?:<strong>\s*)?\[(\d+)\](?:\s*<\/strong>)?/g,
                                        (match, qNum) => {
                                            const answer = answerMap[parseInt(qNum)] || '';
                                            return `<span style="display: inline-flex; align-items: center; gap: 4px; margin: 0 4px; vertical-align: middle;">` +
                                                `<span style="border: 1px solid #374151; font-weight: bold; font-size: 11px; min-width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; color: #111827; background: #f3f4f6; line-height: 1; border-radius: 2px; flex-shrink: 0;">${qNum}</span>` +
                                                `<span style="display: inline-block; border: 1px solid ${answer ? '#059669' : '#d1d5db'}; min-width: 100px; padding: 2px 8px; background: ${answer ? '#ecfdf5' : '#f9fafb'}; color: ${answer ? '#059669' : '#9ca3af'}; font-weight: bold; font-size: 13px; border-radius: 2px; min-height: 24px; line-height: 20px;">${answer || '—'}</span>` +
                                                `</span>`;
                                        }
                                    );
                                }

                                return (
                                    <div key={gIdx} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#1f2937' }}>
                                        <div
                                            className="preview-instruction-html"
                                            dangerouslySetInnerHTML={{ __html: html }}
                                        />
                                        {grp.block.imageUrl && (
                                            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                                                <img src={grp.block.imageUrl} alt="Map/Diagram" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                                            </div>
                                        )}
                                        <style jsx global>{`
                                        .preview-instruction-html table {
                                            border-collapse: collapse;
                                            width: 100%;
                                            margin: 12px 0;
                                            border: 1px solid #d1d5db;
                                        }
                                        .preview-instruction-html th,
                                        .preview-instruction-html td {
                                            border: 1px solid #d1d5db;
                                            padding: 10px 12px;
                                            text-align: left;
                                            vertical-align: middle;
                                            font-size: 13px;
                                        }
                                        .preview-instruction-html th {
                                            background-color: #f9fafb;
                                            font-weight: bold;
                                        }
                                    `}</style>
                                    </div>
                                );
                            }

                            const grpBlocks = grp.blocks;
                            const firstB = grpBlocks[0];

                            // ── Skip questions already embedded in instruction blocks ──
                            if (grp.type !== 'instruction') {
                                const allEmbedded = grpBlocks.every(b => embeddedQNums.has(b.questionNumber));
                                if (allEmbedded) return null;
                            }

                            // ── Fill-in-blank / Note-completion / Sentence-completion ──
                            if (['fill-in-blank', 'note-completion', 'sentence-completion', 'form-completion', 'table-completion', 'summary-completion', 'short-answer', 'flow-chart-completion'].includes(grp.type)) {
                                return (
                                    <div key={gIdx} style={{ marginBottom: '20px' }}>
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {grpBlocks.map(q => (
                                                <NoteCompletionRow key={q.questionNumber} q={q} />
                                            ))}
                                        </ul>
                                    </div>
                                );
                            }

                            // ── Multiple Choice ──
                            if (grp.type === 'multiple-choice' || grp.type === 'multiple-choice-multi') {
                                const isMultiSelect = grp.type === 'multiple-choice-multi';
                                const qNumbers = grpBlocks.map(b => b.questionNumber);

                                // ── Multi-Select: ONE block with [21][22] ──
                                if (isMultiSelect) {
                                    return (
                                        <div key={gIdx} style={{ marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                {qNumbers.map(n => (
                                                    <span key={n} style={{
                                                        border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: '#111827', background: 'white',
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px', marginTop: '2px'
                                                    }}>{n}</span>
                                                ))}
                                                <span style={{ color: '#1f2937', fontSize: '15px', lineHeight: '1.5' }}>{firstB.questionText}</span>
                                            </div>
                                            <div style={{ marginLeft: '34px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {(firstB.options || []).map((opt, oIdx) => {
                                                    const letter = String.fromCharCode(65 + oIdx);
                                                    const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                    const isCorrect = grpBlocks.some(q => q.correctAnswer && (q.correctAnswer === letter || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(letter))));
                                                    return (
                                                        <div key={oIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                            <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0, fontSize: '14px' }}>{letter}</span>
                                                            <div style={{
                                                                width: '18px', height: '18px', border: `1px solid ${isCorrect ? '#059669' : '#d1d5db'}`,
                                                                background: isCorrect ? '#059669' : 'white', flexShrink: 0, marginTop: '1px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px'
                                                            }}>
                                                                {isCorrect && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" fill="none" /></svg>}
                                                            </div>
                                                            <span style={{ color: isCorrect ? '#059669' : '#374151', fontWeight: isCorrect ? '600' : '400', fontSize: '14px' }}>{text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                // ── Single-Select MCQ: each question separately ──
                                return (
                                    <div key={gIdx} style={{ marginBottom: '24px' }}>
                                        {grpBlocks.map((q) => {
                                            return (
                                                <div key={q.questionNumber} style={{ marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                                                        <span style={{
                                                            border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                                                            padding: '0 6px', color: '#111827', background: 'white',
                                                            lineHeight: '1.8', flexShrink: 0, borderRadius: '2px', marginTop: '2px'
                                                        }}>{q.questionNumber}</span>
                                                        <span style={{ color: '#1f2937', fontSize: '15px', lineHeight: '1.5' }}>{q.questionText}</span>
                                                    </div>
                                                    <div style={{ marginLeft: '34px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(q.options || []).map((opt, oIdx) => {
                                                            const letter = String.fromCharCode(65 + oIdx);
                                                            const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                            const isCorrect = q.correctAnswer === letter;
                                                            return (
                                                                <div key={oIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                                    <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0, fontSize: '14px' }}>{letter}</span>
                                                                    <div style={{
                                                                        width: '18px', height: '18px', border: `1px solid ${isCorrect ? '#059669' : '#d1d5db'}`,
                                                                        background: isCorrect ? '#059669' : 'white', flexShrink: 0, marginTop: '1px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                                                    }}>
                                                                        {isCorrect && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
                                                                    </div>
                                                                    <span style={{ color: isCorrect ? '#059669' : '#374151', fontWeight: isCorrect ? '600' : '400', fontSize: '14px' }}>{text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            // ── Matching / Matching Features ──
                            if (grp.type === 'matching' || grp.type === 'matching-features' || grp.type === 'matching-headings') {
                                const hasLongOpts = (firstB.options || []).some(o => (o || '').length > 4);
                                return (
                                    <div key={gIdx} style={{ marginBottom: '20px' }}>
                                        {/* Options list box for long options */}
                                        {hasLongOpts && (
                                            <div style={{ border: '1px solid #d1d5db', marginBottom: '12px', maxWidth: '480px' }}>
                                                {(firstB.options || []).map((opt, oIdx) => {
                                                    const letter = (opt || '').match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + oIdx);
                                                    const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                                                    return (
                                                        <div key={oIdx} style={{ display: 'flex', gap: '12px', padding: '5px 10px', borderBottom: oIdx < (firstB.options.length - 1) ? '1px solid #e5e7eb' : 'none', fontSize: '13px' }}>
                                                            <span style={{ fontWeight: 'bold', width: '16px', flexShrink: 0 }}>{letter}</span>
                                                            <span style={{ color: '#374151' }}>{text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
                                            {grpBlocks.map(q => (
                                                <div key={q.questionNumber} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: '#111827', background: 'white',
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px'
                                                    }}>{q.questionNumber}</span>
                                                    <span style={{ flex: 1, color: '#1f2937', fontSize: '15px' }}>{q.questionText}</span>
                                                    {/* Show answer instead of dropdown */}
                                                    <div style={{
                                                        border: '1px solid #d1d5db', padding: '4px 8px', fontSize: '14px',
                                                        background: q.correctAnswer ? '#ecfdf5' : 'white',
                                                        color: q.correctAnswer ? '#059669' : '#9ca3af',
                                                        fontWeight: 'bold', width: '70px', textAlign: 'center', borderRadius: '2px'
                                                    }}>
                                                        {q.correctAnswer || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // ── Map / Diagram Labeling ──
                            if (grp.type === 'map-labeling' || grp.type === 'diagram-labeling') {
                                return (
                                    <div key={gIdx} style={{ marginBottom: '20px' }}>
                                        {firstB.imageUrl && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <img src={firstB.imageUrl} alt="Map/Diagram" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #d1d5db' }} />
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
                                            {grpBlocks.map(q => (
                                                <div key={q.questionNumber} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        border: '1px solid #374151', fontWeight: 'bold', fontSize: '12px',
                                                        padding: '0 6px', color: '#111827', background: 'white',
                                                        lineHeight: '1.8', flexShrink: 0, borderRadius: '2px'
                                                    }}>{q.questionNumber}</span>
                                                    <span style={{ flex: 1, color: '#1f2937', fontSize: '15px' }}>{q.questionText}</span>
                                                    <div style={{
                                                        border: '1px solid #d1d5db', padding: '4px 8px', fontSize: '14px',
                                                        background: q.correctAnswer ? '#ecfdf5' : 'white',
                                                        color: q.correctAnswer ? '#059669' : '#9ca3af',
                                                        fontWeight: 'bold', width: '70px', textAlign: 'center', borderRadius: '2px'
                                                    }}>
                                                        {q.correctAnswer || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // ── Fallback ──
                            return (
                                <div key={gIdx} style={{ marginBottom: '10px', color: '#6b7280', fontSize: '12px' }}>
                                    {grpBlocks.map(q => (
                                        <div key={q.questionNumber} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{
                                                border: '1px solid #374151', fontWeight: 'bold', fontSize: '11px',
                                                padding: '0 5px', borderRadius: '2px'
                                            }}>{q.questionNumber}</span>
                                            <span>{q.questionText} (Unsupported type)</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* ══ Bottom Navigator — same as exam page ══ */}
            <div style={{
                borderTop: '1px solid #d1d5db', backgroundColor: '#f9fafb',
                padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Showing correct answers in GREEN</span>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                    {questionBlocks.map(b => (
                        <div key={b.questionNumber} style={{
                            width: '22px', height: '22px', fontSize: '10px', fontWeight: 'bold',
                            border: '1px solid #d1d5db', background: b.correctAnswer ? '#059669' : '#fff',
                            color: b.correctAnswer ? '#fff' : '#9ca3af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px'
                        }}>
                            {b.questionNumber}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
