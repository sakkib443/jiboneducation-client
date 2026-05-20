"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaHighlighter, FaEraser, FaStickyNote, FaTimes } from "react-icons/fa";

/**
 * TextHighlighter Component
 * Allows users to highlight text in yellow and add notes
 * Persists highlights across page navigation
 */
// Derive highlight colors - Using orange as requested
const getHighlightColors = (contrastMode) => {
    return { color: '#FF9800', hover: '#F57C00' };
};

export default function TextHighlighter({ children, passageId = "default", contrastMode = 'black-on-white' }) {
    const { color: highlightColor, hover: highlightHoverColor } = getHighlightColors(contrastMode);
    const containerRef = useRef(null);
    const [highlights, setHighlights] = useState([]);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState("");
    const [selectionOffset, setSelectionOffset] = useState(-1);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState("");

    // Click state for showing note popup / remove button
    const [hoveredHighlightId, setHoveredHighlightId] = useState(null);
    const [hoverPopupPosition, setHoverPopupPosition] = useState({ x: 0, y: 0 });
    const [hoveredHighlightData, setHoveredHighlightData] = useState(null);

    // Store highlights per passage so they persist when navigating between passages
    const highlightsPerPassage = useRef({});
    const prevPassageId = useRef(passageId);

    useEffect(() => {
        // Save current highlights for the previous passage before switching
        if (prevPassageId.current !== passageId) {
            highlightsPerPassage.current[prevPassageId.current] = highlights;
            prevPassageId.current = passageId;
        }

        // Restore saved highlights for this passage (or empty if first visit)
        const saved = highlightsPerPassage.current[passageId] || [];
        setHighlights(saved);

        // Reset toolbar state
        setShowToolbar(false);
        setShowNoteInput(false);

        // Reset popup state so it doesn't stick on page change
        setHoveredHighlightId(null);
        setHoveredHighlightData(null);
    }, [passageId]);

    // Utility: compute text content from React children (MUST match processNode's counting logic exactly)
    const getReactTextContent = useCallback((node) => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (node == null || typeof node === 'boolean') return '';
        if (React.isValidElement(node)) {
            const type = node.type;
            if (type === 'input' || type === 'textarea' || type === 'select') return '';
            return getReactTextContent(node.props.children);
        }
        if (Array.isArray(node)) return node.map(getReactTextContent).join('');
        return '';
    }, []);

    // Keep a ref to current children so handleMouseUp always has the latest
    const childrenRef = useRef(children);
    childrenRef.current = children;

    // Handle text selection
    const handleMouseUp = useCallback((e) => {
        if (e.target.closest('.highlight-toolbar') || e.target.closest('.hover-popup')) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setShowToolbar(false);
            setShowNoteInput(false);
            return;
        }

        const text = selection.toString().trim();

        if (text && text.length > 0) {
            const range = selection.getRangeAt(0);
            const clonedRange = range.cloneRange();
            const rect = clonedRange.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect && rect.width > 0 && rect.height > 0) {
                // Use viewport coords for fixed positioning (avoids overflow clipping)
                setToolbarPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8,
                });
                setSelectedText(text);

                // Calculate offset using React text content (guaranteed to match processNode)
                try {
                    // Get full text as React tree sees it
                    const reactFullText = getReactTextContent(childrenRef.current);

                    // Get approximate DOM offset as a hint for finding the right occurrence
                    const preRange = document.createRange();
                    preRange.selectNodeContents(containerRef.current);
                    preRange.setEnd(range.startContainer, range.startOffset);
                    const domOffset = preRange.toString().length;

                    // Find the occurrence of selected text in reactFullText closest to domOffset
                    let bestOffset = -1;
                    let bestDistance = Infinity;
                    let searchFrom = 0;
                    while (searchFrom < reactFullText.length) {
                        const idx = reactFullText.indexOf(text, searchFrom);
                        if (idx === -1) break;
                        const distance = Math.abs(idx - domOffset);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestOffset = idx;
                        }
                        if (idx > domOffset + 500) break; // stop searching far ahead
                        searchFrom = idx + 1;
                    }
                    setSelectionOffset(bestOffset);
                } catch {
                    setSelectionOffset(-1);
                }

                setShowToolbar(true);
            } else {
                setShowToolbar(false);
                setShowNoteInput(false);
            }
        } else {
            setShowToolbar(false);
            setShowNoteInput(false);
        }
    }, [getReactTextContent]);


    // Hide toolbar when clicking outside
    const handleMouseDown = useCallback((e) => {
        if (!e.target.closest('.highlight-toolbar') && !e.target.closest('.hover-popup')) {
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection?.toString().trim()) {
                    setShowToolbar(false);
                    setShowNoteInput(false);
                }
            }, 100);
        }
    }, []);

    // Add highlight
    const handleHighlight = useCallback((withNote = false) => {
        if (!selectedText || selectionOffset < 0) return;

        const newStart = selectionOffset;
        const newEnd = selectionOffset + selectedText.length;

        setHighlights((prev) => {
            // Remove any highlights that overlap with the new selection
            const nonOverlapping = prev.filter((h) => {
                const hStart = h.offset;
                const hEnd = h.offset + h.text.length;
                // Keep only if no overlap at all
                return hEnd <= newStart || hStart >= newEnd;
            });

            const newHighlight = {
                id: Date.now().toString(),
                text: selectedText,
                offset: selectionOffset,
                color: highlightColor,
                note: withNote ? noteText.trim() : "",
                createdAt: new Date().toISOString(),
            };

            return [...nonOverlapping, newHighlight];
        });

        setShowToolbar(false);
        setShowNoteInput(false);
        setNoteText("");
        setSelectedText("");
        setSelectionOffset(-1);
        window.getSelection()?.removeAllRanges();
    }, [selectedText, selectionOffset, noteText]);

    // Remove highlight for selected text at the specific offset
    const handleRemoveHighlight = useCallback(() => {
        if (!selectedText) return;

        // Remove the highlight that matches both text and offset
        setHighlights((prev) => prev.filter((h) => !(h.text === selectedText && h.offset === selectionOffset)));
        setShowToolbar(false);
        window.getSelection()?.removeAllRanges();
        setSelectedText("");
        setSelectionOffset(-1);
    }, [selectedText, selectionOffset]);

    // Remove highlight by ID (from hover popup)
    const handleRemoveHighlightById = useCallback((highlightId) => {
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
        setHoveredHighlightId(null);
        setHoveredHighlightData(null);
    }, []);

    // Handle note action
    const handleAddNote = useCallback(() => {
        setShowNoteInput(true);
    }, []);

    // Save note and highlight
    const handleSaveNote = useCallback(() => {
        handleHighlight(true);
    }, [handleHighlight]);

    // Apply highlights to a single text string - position-based
    // Supports highlights that span across multiple text nodes (overlap matching)
    const applyHighlightsToText = useCallback((text, textStartOffset = 0) => {
        if (!text || typeof text !== 'string' || highlights.length === 0) return null;

        const textEndOffset = textStartOffset + text.length;
        const ranges = [];

        highlights.forEach((highlight) => {
            const hlStart = highlight.offset;
            const hlEnd = highlight.offset + highlight.text.length;

            // Check if this highlight OVERLAPS with this text node (not just fully contained)
            if (hlStart < textEndOffset && hlEnd > textStartOffset) {
                const localStart = Math.max(0, hlStart - textStartOffset);
                const localEnd = Math.min(text.length, hlEnd - textStartOffset);

                if (localEnd > localStart) {
                    // Verify the overlapping portion matches
                    const portionStart = Math.max(0, textStartOffset - hlStart);
                    const expectedPortion = highlight.text.substring(portionStart, portionStart + (localEnd - localStart));
                    const actualPortion = text.substring(localStart, localEnd);

                    if (actualPortion === expectedPortion) {
                        ranges.push({
                            start: localStart,
                            end: localEnd,
                            highlight: highlight
                        });
                    }
                }
            }
        });

        if (ranges.length === 0) return null;

        // Sort ranges by start position
        ranges.sort((a, b) => a.start - b.start);

        // Merge overlapping ranges to prevent text duplication
        const mergedRanges = [];
        for (const range of ranges) {
            const last = mergedRanges[mergedRanges.length - 1];
            if (last && range.start < last.end) {
                // Overlap: extend the previous range if needed
                if (range.end > last.end) {
                    last.end = range.end;
                }
                // Keep the highlight data from whichever is newer
            } else {
                mergedRanges.push({ ...range });
            }
        }

        // Build React elements array
        const elements = [];
        let lastEnd = 0;

        mergedRanges.forEach((range, idx) => {
            // Add non-highlighted text before this range
            if (range.start > lastEnd) {
                elements.push(text.substring(lastEnd, range.start));
            }
            // Add highlighted text as a span element
            const highlightedText = text.substring(range.start, range.end);
            const hasNote = range.highlight.note && range.highlight.note.length > 0;
            elements.push(
                <span
                    key={`hl-${textStartOffset}-${idx}`}
                    data-id={range.highlight.id}
                    data-note={encodeURIComponent(range.highlight.note || '')}
                    className={`text-highlight ${hasNote ? 'has-note' : ''}`}
                    title={hasNote ? range.highlight.note : undefined}
                >
                    {highlightedText}
                </span>
            );
            lastEnd = range.end;
        });

        // Add any remaining text after the last highlight
        if (lastEnd < text.length) {
            elements.push(text.substring(lastEnd));
        }

        return elements;
    }, [highlights]);


    // Helper function to escape HTML entities
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };


    // Handle click on highlights to show note popup / remove button
    const handleHighlightClick = useCallback((e) => {
        const mark = e.target.closest('.text-highlight');
        if (mark && !showToolbar) {
            e.stopPropagation();
            const highlightId = mark.dataset.id;
            const note = decodeURIComponent(mark.dataset.note || '');
            const highlight = highlights.find(h => h.id === highlightId);

            if (highlight) {
                // If clicking the same highlight, toggle off
                if (hoveredHighlightId === highlightId) {
                    setHoveredHighlightId(null);
                    setHoveredHighlightData(null);
                    return;
                }

                const rect = mark.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect();

                if (containerRect) {
                    // Use viewport coords for fixed positioning
                    setHoverPopupPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                    });
                    setHoveredHighlightId(highlightId);
                    setHoveredHighlightData({ ...highlight, note });
                }
            }
        }
    }, [highlights, showToolbar, hoveredHighlightId]);

    // Render children with highlights applied - tracks global offset across text nodes
    const renderChildrenWithHighlights = useMemo(() => {
        if (!children || highlights.length === 0) return children;

        // Mutable offset tracker shared across all recursive calls
        const offset = { value: 0 };

        const processNode = (node, key = 0) => {
            // Handle string nodes
            if (typeof node === 'string') {
                const currentOffset = offset.value;
                offset.value += node.length;
                const processed = applyHighlightsToText(node, currentOffset);
                if (processed) {
                    return <React.Fragment key={key}>{processed}</React.Fragment>;
                }
                return node;
            }

            // Handle numbers (they render as text in DOM)
            // NOTE: booleans (true/false) do NOT render in React, so skip them!
            if (typeof node === 'number') {
                const text = String(node);
                const currentOffset = offset.value;
                offset.value += text.length;
                const processed = applyHighlightsToText(text, currentOffset);
                if (processed) {
                    return <React.Fragment key={key}>{processed}</React.Fragment>;
                }
                return node;
            }

            // Handle null/undefined/boolean - React doesn't render these
            if (node == null || typeof node === 'boolean') return null;

            // Handle React elements
            if (React.isValidElement(node)) {
                const nodeChildren = node.props.children;

                // Skip processing input/textarea/select elements (form elements)
                const nodeType = node.type;
                if (nodeType === 'input' || nodeType === 'textarea' || nodeType === 'select') {
                    return node;
                }

                // If children is a simple string, process it
                if (typeof nodeChildren === 'string') {
                    const currentOffset = offset.value;
                    offset.value += nodeChildren.length;
                    const processed = applyHighlightsToText(nodeChildren, currentOffset);
                    if (processed) {
                        return React.cloneElement(node, { key }, processed);
                    }
                    return node;
                }

                // If children is a number (renders as text in DOM)
                if (typeof nodeChildren === 'number') {
                    const text = String(nodeChildren);
                    const currentOffset = offset.value;
                    offset.value += text.length;
                    const processed = applyHighlightsToText(text, currentOffset);
                    if (processed) {
                        return React.cloneElement(node, { key }, processed);
                    }
                    return node;
                }

                // Skip booleans (React doesn't render them)
                if (typeof nodeChildren === 'boolean') {
                    return node;
                }

                // If children is array, process each child
                if (Array.isArray(nodeChildren)) {
                    const processedChildren = nodeChildren.map((child, idx) => processNode(child, idx));
                    return React.cloneElement(node, { key }, processedChildren);
                }

                // If children is a single element, process it
                if (nodeChildren) {
                    const processedChild = processNode(nodeChildren, 0);
                    return React.cloneElement(node, { key }, processedChild);
                }

                return node;
            }

            // Handle arrays
            if (Array.isArray(node)) {
                return node.map((child, idx) => processNode(child, idx));
            }

            return node;
        };

        return processNode(children);
    }, [children, highlights, applyHighlightsToText]);


    return (
        <div
            ref={containerRef}
            className="relative text-highlighter-container"
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
            onClick={handleHighlightClick}
        >
            {renderChildrenWithHighlights}

            {/* Click Popup - Sticky Note Style */}
            {hoveredHighlightId && hoveredHighlightData && !showToolbar && (
                hoveredHighlightData.note ? (
                    /* Sticky Note Popup for highlights with notes */
                    <div
                        className="hover-popup fixed z-[9999]"
                        style={{
                            left: `${hoverPopupPosition.x}px`,
                            top: `${hoverPopupPosition.y}px`,
                            transform: "translate(-50%, -100%)",
                        }}
                    >
                        <div
                            className="relative rounded shadow-lg border border-yellow-400"
                            style={{
                                backgroundColor: '#FFFACD',
                                minWidth: '160px',
                                maxWidth: '280px',
                            }}
                        >
                            {/* Top bar with red square + close button */}
                            <div className="flex items-center justify-between px-2 py-1">
                                <div className="w-4 h-4 bg-red-600 rounded-sm" />
                                <button
                                    onClick={() => {
                                        setHoveredHighlightId(null);
                                        setHoveredHighlightData(null);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-yellow-300 rounded text-xs font-bold cursor-pointer"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Note content */}
                            <div className="px-3 py-2">
                                <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {hoveredHighlightData.note}
                                </p>
                            </div>

                            {/* Delete button */}
                            <div className="px-2 pb-2 flex justify-end">
                                <button
                                    onClick={() => handleRemoveHighlightById(hoveredHighlightId)}
                                    className="px-3 py-1 bg-gray-400 hover:bg-red-500 text-white text-xs font-medium rounded cursor-pointer transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Simple popup for highlights without notes - also click based */
                    <div
                        className="hover-popup fixed z-[9999] bg-gray-800 rounded-lg shadow-xl p-1.5 border border-gray-700"
                        style={{
                            left: `${hoverPopupPosition.x}px`,
                            top: `${hoverPopupPosition.y}px`,
                            transform: "translate(-50%, -100%)",
                        }}
                    >
                        <button
                            onClick={() => handleRemoveHighlightById(hoveredHighlightId)}
                            className="flex items-center gap-1.5 px-2 py-1 text-white text-xs hover:bg-red-500 rounded transition-colors"
                            title="Remove Highlight"
                        >
                            <FaEraser size={11} />
                            <span>Remove</span>
                        </button>
                        <div
                            className="absolute w-2 h-2 bg-gray-800 border-r border-b border-gray-700 transform rotate-45"
                            style={{
                                bottom: "-5px",
                                left: "50%",
                                marginLeft: "-4px",
                            }}
                        />
                    </div>
                )
            )}

            {/* Floating Toolbar - Shows when selecting text */}
            {showToolbar && (
                <div
                    className="highlight-toolbar fixed z-[9999] flex items-center gap-1 bg-gray-800 rounded-lg shadow-xl p-1.5 border border-gray-700"
                    style={{
                        left: `${toolbarPosition.x}px`,
                        top: `${toolbarPosition.y}px`,
                        transform: "translateX(-50%)",
                    }}
                >
                    {!showNoteInput ? (
                        <>
                            <button
                                onClick={() => handleHighlight(false)}
                                className="flex items-center justify-center w-8 h-8 rounded hover:brightness-90 transition-all"
                                title="Highlight"
                                style={{ backgroundColor: highlightColor }}
                            >
                                <FaHighlighter className="text-gray-800 text-sm" />
                            </button>

                            <button
                                onClick={handleRemoveHighlight}
                                className="flex items-center justify-center w-8 h-8 rounded bg-gray-700 hover:bg-red-500 transition-colors"
                                title="Remove Highlight"
                            >
                                <FaEraser className="text-white text-sm" />
                            </button>

                            <button
                                onClick={handleAddNote}
                                className="flex items-center justify-center w-8 h-8 rounded bg-gray-700 hover:bg-blue-500 transition-colors"
                                title="Add Note"
                            >
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
                                    if (e.key === "Enter") handleSaveNote();
                                    if (e.key === "Escape") {
                                        setShowNoteInput(false);
                                        setNoteText("");
                                    }
                                }}
                            />
                            <button
                                onClick={handleSaveNote}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowNoteInput(false);
                                    setNoteText("");
                                }}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    )}

                    <div
                        className="absolute w-3 h-3 bg-gray-800 border-l border-t border-gray-700 transform rotate-45"
                        style={{
                            top: "-7px",
                            left: "50%",
                            marginLeft: "-6px",
                        }}
                    />
                </div>
            )}

            <style jsx global>{`
                .text-highlight {
                    background-color: ${highlightColor} !important;
                    color: #000000 !important;
                    padding: 2px 4px;
                    border-radius: 3px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    position: relative;
                }
                .text-highlight:hover {
                    background-color: ${highlightHoverColor} !important;
                }
                .text-highlight.has-note {
                }
                .text-highlight.has-note::before {
                    content: '📝';
                    position: absolute;
                    top: -8px;
                    left: 0;
                    font-size: 12px;
                    line-height: 1;
                    pointer-events: none;
                    user-select: none;
                }
                .text-highlighter-container {
                    user-select: text;
                    -webkit-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                }
            `}</style>
        </div>
    );
}
