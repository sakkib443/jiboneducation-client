"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { FaHighlighter, FaEraser, FaStickyNote, FaTimes } from "react-icons/fa";

/**
 * DomHighlighter
 * ----------------------------------------------------------------------------
 * Highlight + notes that work on the *rendered DOM* (including content rendered
 * via dangerouslySetInnerHTML, e.g. the Listening instruction/notes blocks).
 *
 * It paints highlights using the CSS Custom Highlight API (CSS.highlights), so
 * it NEVER mutates the DOM. That means it cannot conflict with React, portals,
 * or the embedded answer inputs — nothing else can break. Highlights are stored
 * as character offsets within the container's selectable text and re-resolved
 * to Ranges after every render / DOM change, so they survive re-renders.
 *
 * If the browser lacks the Custom Highlight API the component simply renders its
 * children with no highlighting (graceful, non-breaking degradation).
 */
const HL_NAME = "jibon-hl";
const NOTE_NAME = "jibon-hl-note";
const HL_COLOR = "#FF9800";
const NOTE_COLOR = "#FFD54F";

const supportsHighlightAPI = () =>
    typeof window !== "undefined" &&
    typeof window.Highlight === "function" &&
    typeof CSS !== "undefined" &&
    !!CSS.highlights;

const SKIP_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON", "SCRIPT", "STYLE"]);

export default function DomHighlighter({ children, passageId = "default", contrastMode = "black-on-white" }) {
    const containerRef = useRef(null);
    const [highlights, setHighlights] = useState([]);
    const highlightsRef = useRef([]);
    highlightsRef.current = highlights;

    const perPassage = useRef({});
    const prevPassageId = useRef(passageId);

    const [toolbar, setToolbar] = useState(null); // { x, y, start, end, text }
    const [noteMode, setNoteMode] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [popup, setPopup] = useState(null); // { x, y, id, note }

    const enabled = supportsHighlightAPI();

    // Persist highlights per passage so they survive navigation between parts
    useEffect(() => {
        if (prevPassageId.current !== passageId) {
            perPassage.current[prevPassageId.current] = highlightsRef.current;
            prevPassageId.current = passageId;
            setHighlights(perPassage.current[passageId] || []);
            setToolbar(null);
            setNoteMode(false);
            setPopup(null);
        }
    }, [passageId]);

    // Collect selectable text nodes in order (skipping form controls / our UI)
    const collectTextNodes = useCallback(() => {
        const root = containerRef.current;
        if (!root || typeof document === "undefined") return [];
        const nodes = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
                let p = n.parentElement;
                while (p && p !== root) {
                    if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
                    if (p.classList && (p.classList.contains("hl-toolbar") || p.classList.contains("hl-popup"))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    p = p.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        let cur;
        while ((cur = walker.nextNode())) nodes.push(cur);
        return nodes;
    }, []);

    // Map a text-node + local offset to a global character offset
    const pointToOffset = useCallback((node, localOffset) => {
        if (!node || node.nodeType !== Node.TEXT_NODE) return -1;
        const nodes = collectTextNodes();
        let acc = 0;
        for (const tn of nodes) {
            if (tn === node) return acc + localOffset;
            acc += tn.nodeValue.length;
        }
        return -1;
    }, [collectTextNodes]);

    // Build a Range from global start/end offsets
    const offsetsToRange = useCallback((start, end) => {
        if (typeof document === "undefined") return null;
        const nodes = collectTextNodes();
        const range = document.createRange();
        let acc = 0, setS = false, setE = false;
        for (const tn of nodes) {
            const len = tn.nodeValue.length;
            if (!setS && start <= acc + len) {
                range.setStart(tn, Math.max(0, Math.min(len, start - acc)));
                setS = true;
            }
            if (setS && !setE && end <= acc + len) {
                range.setEnd(tn, Math.max(0, Math.min(len, end - acc)));
                setE = true;
                break;
            }
            acc += len;
        }
        return setS && setE ? range : null;
    }, [collectTextNodes]);

    // Paint highlights via the Custom Highlight API (no DOM mutation)
    const applyHighlights = useCallback(() => {
        if (!enabled || !containerRef.current) return;
        const plain = new window.Highlight();
        const noted = new window.Highlight();
        let hasPlain = false, hasNoted = false;
        for (const h of highlightsRef.current) {
            const r = offsetsToRange(h.start, h.end);
            if (!r) continue;
            if (h.note) { noted.add(r); hasNoted = true; }
            else { plain.add(r); hasPlain = true; }
        }
        if (hasPlain) CSS.highlights.set(HL_NAME, plain); else CSS.highlights.delete(HL_NAME);
        if (hasNoted) CSS.highlights.set(NOTE_NAME, noted); else CSS.highlights.delete(NOTE_NAME);
    }, [enabled, offsetsToRange]);

    // Re-apply on highlight change and whenever the DOM content changes (re-renders)
    useEffect(() => {
        if (!enabled) return;
        applyHighlights();
        const root = containerRef.current;
        if (!root) return;
        const obs = new MutationObserver(() => applyHighlights());
        obs.observe(root, { childList: true, subtree: true, characterData: true });
        return () => obs.disconnect();
    }, [enabled, highlights, applyHighlights]);

    // Clear our highlight registries when unmounting
    useEffect(() => {
        return () => {
            if (supportsHighlightAPI()) {
                CSS.highlights.delete(HL_NAME);
                CSS.highlights.delete(NOTE_NAME);
            }
        };
    }, []);

    // Selection -> toolbar
    const handleMouseUp = useCallback((e) => {
        if (!enabled) return;
        if (e.target.closest(".hl-toolbar") || e.target.closest(".hl-popup")) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) { setToolbar(null); setNoteMode(false); return; }
        const text = sel.toString();
        if (!text || !text.trim()) { setToolbar(null); setNoteMode(false); return; }
        const range = sel.getRangeAt(0);
        if (!containerRef.current || !containerRef.current.contains(range.commonAncestorContainer)) {
            setToolbar(null);
            return;
        }
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) { setToolbar(null); return; }
        const start = pointToOffset(range.startContainer, range.startOffset);
        const end = pointToOffset(range.endContainer, range.endOffset);
        if (start < 0 || end < 0 || end <= start) { setToolbar(null); return; }
        setToolbar({ x: rect.left + rect.width / 2, y: rect.bottom + 8, start, end, text });
        setNoteMode(false);
        setPopup(null);
    }, [enabled, pointToOffset]);

    const addHighlight = useCallback((withNote) => {
        if (!toolbar) return;
        const { start, end, text } = toolbar;
        setHighlights((prev) => {
            const keep = prev.filter((h) => h.end <= start || h.start >= end); // drop overlaps
            return [...keep, {
                id: `${Date.now()}-${Math.round(start)}`,
                start, end, text,
                note: withNote ? noteText.trim() : "",
            }];
        });
        setToolbar(null);
        setNoteMode(false);
        setNoteText("");
        window.getSelection()?.removeAllRanges();
    }, [toolbar, noteText]);

    const eraseSelection = useCallback(() => {
        if (!toolbar) return;
        const { start, end } = toolbar;
        setHighlights((prev) => prev.filter((h) => h.end <= start || h.start >= end));
        setToolbar(null);
        window.getSelection()?.removeAllRanges();
    }, [toolbar]);

    const removeById = useCallback((id) => {
        setHighlights((prev) => prev.filter((h) => h.id !== id));
        setPopup(null);
    }, []);

    // Click on a highlighted span -> show note / delete popup
    const handleClick = useCallback((e) => {
        if (!enabled) return;
        if (toolbar || e.target.closest(".hl-toolbar") || e.target.closest(".hl-popup")) return;
        let node = null, offset = 0;
        if (document.caretPositionFromPoint) {
            const cp = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (cp) { node = cp.offsetNode; offset = cp.offset; }
        } else if (document.caretRangeFromPoint) {
            const cr = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (cr) { node = cr.startContainer; offset = cr.startOffset; }
        }
        const clickOffset = pointToOffset(node, offset);
        if (clickOffset < 0) return;
        const hit = highlightsRef.current.find((h) => clickOffset >= h.start && clickOffset < h.end);
        if (hit) {
            e.stopPropagation();
            setPopup({ x: e.clientX, y: e.clientY - 8, id: hit.id, note: hit.note });
        }
    }, [enabled, toolbar, pointToOffset]);

    return (
        <div
            ref={containerRef}
            className="relative dom-highlighter-container"
            onMouseUp={handleMouseUp}
            onClick={handleClick}
        >
            {children}

            {/* Note / delete popup */}
            {popup && (
                <div
                    className="hl-popup fixed z-[9999]"
                    style={{ left: `${popup.x}px`, top: `${popup.y}px`, transform: "translate(-50%, -100%)" }}
                >
                    {popup.note ? (
                        <div className="rounded shadow-lg border border-yellow-400" style={{ backgroundColor: "#FFFACD", minWidth: "160px", maxWidth: "280px" }}>
                            <div className="flex items-center justify-between px-2 py-1">
                                <div className="w-4 h-4 bg-red-600 rounded-sm" />
                                <button onClick={() => setPopup(null)} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-yellow-300 rounded text-xs font-bold cursor-pointer" title="Close">✕</button>
                            </div>
                            <div className="px-3 py-2">
                                <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-wrap">{popup.note}</p>
                            </div>
                            <div className="px-2 pb-2 flex justify-end">
                                <button onClick={() => removeById(popup.id)} className="px-3 py-1 bg-gray-400 hover:bg-red-500 text-white text-xs font-medium rounded cursor-pointer transition-colors">Delete</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-lg shadow-xl p-1.5 border border-gray-700">
                            <button onClick={() => removeById(popup.id)} className="flex items-center gap-1.5 px-2 py-1 text-white text-xs hover:bg-red-500 rounded transition-colors" title="Remove Highlight">
                                <FaEraser size={11} /><span>Remove</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Selection toolbar */}
            {toolbar && (
                <div
                    className="hl-toolbar fixed z-[9999] flex items-center gap-1 bg-gray-800 rounded-lg shadow-xl p-1.5 border border-gray-700"
                    style={{ left: `${toolbar.x}px`, top: `${toolbar.y}px`, transform: "translateX(-50%)" }}
                >
                    {!noteMode ? (
                        <>
                            <button onClick={() => addHighlight(false)} className="flex items-center justify-center w-8 h-8 rounded hover:brightness-90 transition-all" title="Highlight" style={{ backgroundColor: HL_COLOR }}>
                                <FaHighlighter className="text-gray-800 text-sm" />
                            </button>
                            <button onClick={eraseSelection} className="flex items-center justify-center w-8 h-8 rounded bg-gray-700 hover:bg-red-500 transition-colors" title="Remove Highlight">
                                <FaEraser className="text-white text-sm" />
                            </button>
                            <button onClick={() => setNoteMode(true)} className="flex items-center justify-center w-8 h-8 rounded bg-gray-700 hover:bg-blue-500 transition-colors" title="Add Note">
                                <FaStickyNote className="text-white text-sm" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 p-1">
                            <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a note..."
                                className="px-2 py-1 text-sm rounded border-none outline-none bg-gray-700 text-white placeholder-gray-400 w-40"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addHighlight(true);
                                    if (e.key === "Escape") { setNoteMode(false); setNoteText(""); }
                                }}
                            />
                            <button onClick={() => addHighlight(true)} className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Save</button>
                            <button onClick={() => { setNoteMode(false); setNoteText(""); }} className="p-1 text-gray-400 hover:text-white"><FaTimes size={12} /></button>
                        </div>
                    )}
                </div>
            )}

            <style jsx global>{`
                .dom-highlighter-container {
                    user-select: text;
                    -webkit-user-select: text;
                }
                ::highlight(${HL_NAME}) {
                    background-color: ${HL_COLOR};
                    color: #000000;
                }
                ::highlight(${NOTE_NAME}) {
                    background-color: ${NOTE_COLOR};
                    color: #000000;
                    text-decoration: underline dotted #b8860b;
                }
            `}</style>
        </div>
    );
}
