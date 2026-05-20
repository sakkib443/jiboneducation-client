// ═══════════════════════════════════════════
// Listening Test Helper Functions
// ═══════════════════════════════════════════

export const LISTENING_QUESTION_TYPES = [
    { value: "note-completion", label: "Note Completion", icon: "📝" },
    { value: "form-completion", label: "Form Completion", icon: "📋" },
    { value: "sentence-completion", label: "Sentence Completion", icon: "✏️" },
    { value: "table-completion", label: "Table Completion", icon: "📊" },
    { value: "summary-completion", label: "Summary Completion", icon: "📄" },
    { value: "flow-chart-completion", label: "Flow Chart Completion", icon: "🔄" },
    { value: "short-answer", label: "Short Answer", icon: "💬" },
    { value: "multiple-choice", label: "MCQ (A/B/C)", icon: "🔘" },
    { value: "multiple-choice-multi", label: "Choose TWO/THREE", icon: "☑️" },
    { value: "matching", label: "Matching", icon: "🔗" },
    { value: "map-labeling", label: "Map/Plan Labelling", icon: "🗺️" },
    { value: "diagram-labeling", label: "Diagram Labelling", icon: "📐" },
];

// Get next available question number
export function getNextListeningQNumber(groups) {
    let max = 0;
    for (const g of groups) {
        if (g.endQuestion > max) max = g.endQuestion;
    }
    return max + 1;
}

// ═══════════════════════════════════════════
// Create empty template for each question type
// ═══════════════════════════════════════════
export function createListeningGroupTemplate(type, startQ) {
    const base = { startQuestion: startQ };

    switch (type) {
        case "note-completion":
            return {
                groupType: "note-completion", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Complete the notes below.",
                subInstruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
                mainHeading: "",
                passage: "",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    textBefore: "", textAfter: "",
                    correctAnswer: ""
                }))
            };

        case "form-completion":
            return {
                groupType: "form-completion", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Complete the form below.",
                subInstruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
                mainHeading: "",
                passage: "",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    textBefore: "", textAfter: "",
                    correctAnswer: ""
                }))
            };

        case "sentence-completion":
            return {
                groupType: "sentence-completion", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Complete the sentences below.",
                subInstruction: "Write NO MORE THAN TWO WORDS for each answer.",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    textBefore: "", textAfter: "",
                    correctAnswer: ""
                }))
            };

        case "table-completion":
            return {
                groupType: "table-completion", ...base,
                endQuestion: startQ + 5,
                mainInstruction: "Complete the table below.",
                subInstruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
                tableHtml: "",
                questions: Array.from({ length: 6 }, (_, i) => ({
                    questionNumber: startQ + i,
                    questionText: "",
                    correctAnswer: ""
                }))
            };

        case "summary-completion":
            return {
                groupType: "summary-completion", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Complete the summary below.",
                subInstruction: "Write ONE WORD ONLY for each answer.",
                passage: "",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    textBefore: "", textAfter: "",
                    correctAnswer: ""
                }))
            };

        case "flow-chart-completion":
            return {
                groupType: "flow-chart-completion", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Complete the flow-chart below.",
                subInstruction: "Write ONE WORD ONLY for each answer.",
                passage: "",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    textBefore: "", textAfter: "",
                    correctAnswer: ""
                }))
            };

        case "short-answer":
            return {
                groupType: "short-answer", ...base,
                endQuestion: startQ + 2,
                mainInstruction: "Answer the questions below.",
                subInstruction: "Write NO MORE THAN THREE WORDS for each answer.",
                questions: Array.from({ length: 3 }, (_, i) => ({
                    questionNumber: startQ + i,
                    questionText: "",
                    correctAnswer: ""
                }))
            };

        case "multiple-choice":
            return {
                groupType: "multiple-choice", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Choose the correct letter, A, B or C.",
                subInstruction: "",
                mcQuestions: Array.from({ length: 4 }, (_, i) => ({
                    questionNumber: startQ + i,
                    questionText: "",
                    options: [
                        { letter: "A", text: "" },
                        { letter: "B", text: "" },
                        { letter: "C", text: "" },
                    ],
                    correctAnswer: ""
                }))
            };

        case "multiple-choice-multi":
            return {
                groupType: "multiple-choice-multi", ...base,
                endQuestion: startQ + 1,
                mainInstruction: "Choose TWO letters, A–E.",
                subInstruction: "",
                questionText: "",
                options: [
                    { letter: "A", text: "" },
                    { letter: "B", text: "" },
                    { letter: "C", text: "" },
                    { letter: "D", text: "" },
                    { letter: "E", text: "" },
                ],
                correctAnswers: ["", ""]
            };

        case "matching":
            return {
                groupType: "matching", ...base,
                endQuestion: startQ + 5,
                mainInstruction: "Choose the correct letter, A–H.",
                subInstruction: "",
                featureListTitle: "List",
                featureOptions: [
                    { letter: "A", text: "" },
                    { letter: "B", text: "" },
                    { letter: "C", text: "" },
                    { letter: "D", text: "" },
                    { letter: "E", text: "" },
                    { letter: "F", text: "" },
                    { letter: "G", text: "" },
                    { letter: "H", text: "" },
                ],
                matchingItems: Array.from({ length: 6 }, (_, i) => ({
                    questionNumber: startQ + i,
                    text: "",
                    correctAnswer: ""
                }))
            };

        case "map-labeling":
        case "diagram-labeling":
            return {
                groupType: type, ...base,
                endQuestion: startQ + 4,
                mainInstruction: type === "map-labeling"
                    ? "Label the map/plan below."
                    : "Label the diagram below.",
                subInstruction: "Choose the correct letter, A–H.",
                imageUrl: "",
                featureOptions: [
                    { letter: "A", text: "" },
                    { letter: "B", text: "" },
                    { letter: "C", text: "" },
                    { letter: "D", text: "" },
                    { letter: "E", text: "" },
                ],
                matchingItems: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    text: "",
                    correctAnswer: ""
                }))
            };

        default:
            return { groupType: type, ...base, endQuestion: startQ };
    }
}

// ═══════════════════════════════════════════
// Generate flat questions[] from questionGroups[]
// ═══════════════════════════════════════════
export function generateListeningQuestions(groups) {
    const questions = [];

    for (const group of groups) {
        // Build instruction HTML
        let instrContent = '';
        const sQ = group.startQuestion;
        const eQ = group.endQuestion;

        if (group.mainInstruction) {
            instrContent = `<strong>Questions ${sQ}–${eQ}</strong><br/>${group.mainInstruction}`;
            if (group.subInstruction) {
                instrContent += `<br/>Write <strong>${group.subInstruction}</strong>`;
            }
        }

        switch (group.groupType) {
            case "note-completion":
            case "form-completion":
            case "sentence-completion":
            case "summary-completion":
            case "flow-chart-completion": {
                // Add instruction
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });

                // If there's a main heading above the blanks
                if (group.mainHeading) {
                    questions.push({ blockType: "instruction", content: `<strong>${group.mainHeading}</strong>` });
                }

                // If there's formatted passage (with embedded [N] blanks)
                if (group.passage?.trim()) {
                    questions.push({ blockType: "instruction", content: group.passage });
                }

                // Add questions
                for (const q of (group.questions || [])) {
                    const text = q.textBefore || q.questionText || '';
                    const after = q.textAfter || '';
                    const fullText = after ? `${text} ________ ${after}` : (text.includes('________') ? text : `${text} ________`);
                    questions.push({
                        blockType: "question",
                        questionNumber: q.questionNumber,
                        questionType: group.groupType,
                        questionText: fullText,
                        correctAnswer: q.correctAnswer,
                        acceptableAnswers: [q.correctAnswer].filter(Boolean),
                        marks: 1,
                        wordLimit: group.groupType === 'sentence-completion' ? 2 : 1,
                    });
                }
                break;
            }

            case "table-completion": {
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });
                if (group.tableHtml?.trim()) {
                    questions.push({ blockType: "instruction", content: group.tableHtml });
                }
                for (const q of (group.questions || [])) {
                    questions.push({
                        blockType: "question",
                        questionNumber: q.questionNumber,
                        questionType: "table-completion",
                        questionText: q.questionText || `Table Q${q.questionNumber} ________`,
                        correctAnswer: q.correctAnswer,
                        acceptableAnswers: [q.correctAnswer].filter(Boolean),
                        marks: 1, wordLimit: 1,
                    });
                }
                break;
            }

            case "short-answer": {
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });
                for (const q of (group.questions || [])) {
                    questions.push({
                        blockType: "question",
                        questionNumber: q.questionNumber,
                        questionType: "short-answer",
                        questionText: q.questionText,
                        correctAnswer: q.correctAnswer,
                        acceptableAnswers: [q.correctAnswer].filter(Boolean),
                        marks: 1, wordLimit: 3,
                    });
                }
                break;
            }

            case "multiple-choice": {
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });
                for (const mcq of (group.mcQuestions || [])) {
                    questions.push({
                        blockType: "question",
                        questionNumber: mcq.questionNumber,
                        questionType: "multiple-choice",
                        questionText: mcq.questionText,
                        options: (mcq.options || []).map(o => `${o.letter}. ${o.text}`),
                        correctAnswer: mcq.correctAnswer,
                        marks: 1,
                    });
                }
                break;
            }

            case "multiple-choice-multi": {
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });
                const answers = group.correctAnswers || [];
                for (let i = 0; i < answers.length; i++) {
                    questions.push({
                        blockType: "question",
                        questionNumber: group.startQuestion + i,
                        questionType: "multiple-choice-multi",
                        questionText: group.questionText || '',
                        options: (group.options || []).map(o => `${o.letter}. ${o.text}`),
                        correctAnswer: answers[i],
                        marks: 1,
                    });
                }
                break;
            }

            case "matching": {
                if (instrContent) {
                    let full = instrContent;
                    // Add feature list to instruction
                    if (group.featureListTitle) full += `<br/><br/><strong>${group.featureListTitle}</strong>`;
                    if (group.featureOptions?.length) {
                        full += '<br/>' + group.featureOptions
                            .filter(f => f.text?.trim())
                            .map(f => `${f.letter} &nbsp; ${f.text}`).join('<br/>');
                    }
                    questions.push({ blockType: "instruction", content: full });
                }
                for (const item of (group.matchingItems || [])) {
                    questions.push({
                        blockType: "question",
                        questionNumber: item.questionNumber,
                        questionType: "matching",
                        questionText: item.text,
                        options: (group.featureOptions || []).map(f => f.letter),
                        correctAnswer: item.correctAnswer,
                        marks: 1,
                    });
                }
                break;
            }

            case "map-labeling":
            case "diagram-labeling": {
                if (instrContent) questions.push({ blockType: "instruction", content: instrContent });
                if (group.imageUrl) {
                    questions.push({ blockType: "instruction", content: `<img src="${group.imageUrl}" alt="Map/Diagram" style="max-width:100%;max-height:400px" />`, imageUrl: group.imageUrl });
                }
                for (const item of (group.matchingItems || [])) {
                    questions.push({
                        blockType: "question",
                        questionNumber: item.questionNumber,
                        questionType: group.groupType,
                        questionText: item.text,
                        options: (group.featureOptions || []).map(f => f.letter),
                        correctAnswer: item.correctAnswer,
                        marks: 1,
                    });
                }
                break;
            }
        }
    }
    // Return in build order — DO NOT sort! Sorting breaks the interleaved
    // instruction↔question pattern that mirrors the actual test paper layout.
    return questions;
}

// ═══════════════════════════════════════════
// Renumber questions sequentially
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// Convert flat questions[] → questionGroups[]
// (for backward compatibility when editing existing tests)
// ═══════════════════════════════════════════
export function convertFlatQuestionsToGroups(flatQuestions) {
    if (!flatQuestions || flatQuestions.length === 0) return [];

    const groups = [];

    // Walk through blocks IN ORDER to preserve instruction-question associations
    let i = 0;
    let pendingInstructions = []; // accumulate instruction blocks before questions

    while (i < flatQuestions.length) {
        const block = flatQuestions[i];

        // Collect instruction blocks
        if (block.blockType === "instruction") {
            pendingInstructions.push(block);
            i++;
            continue;
        }

        // If it's not a question block, skip
        if (block.blockType !== "question" && block.questionNumber === undefined) {
            i++;
            continue;
        }

        // It's a question block — collect consecutive same-type questions
        const qType = block.questionType || "note-completion";
        const sameTypeQs = [block];
        let j = i + 1;

        // For completion types, also collect interleaved instruction blocks
        const isCompletionType = [
            "note-completion", "form-completion", "sentence-completion",
            "summary-completion", "flow-chart-completion"
        ].includes(qType);

        const interleavedInstructions = [];

        while (j < flatQuestions.length) {
            const next = flatQuestions[j];
            if (next.blockType === "question" && (next.questionType || "note-completion") === qType) {
                sameTypeQs.push(next);
                j++;
            } else if (next.blockType === "instruction" && isCompletionType) {
                // Check if next question after this instruction is same type
                let k = j + 1;
                while (k < flatQuestions.length && flatQuestions[k].blockType === "instruction") k++;
                if (k < flatQuestions.length && flatQuestions[k].blockType === "question"
                    && (flatQuestions[k].questionType || "note-completion") === qType) {
                    // This instruction is between same-type questions, collect it
                    interleavedInstructions.push(next);
                    j++;
                } else {
                    break; // instruction belongs to next group
                }
            } else {
                break;
            }
        }

        const startQ = sameTypeQs[0].questionNumber;
        const endQ = sameTypeQs[sameTypeQs.length - 1].questionNumber;

        // Extract mainHeading and passage from pending + interleaved instructions
        let mainHeading = "";
        let passageHtml = "";

        // Separate header instruction (Questions N-M) from context instructions
        const contextInstructions = [];
        for (const ib of [...pendingInstructions, ...interleavedInstructions]) {
            const content = ib.content || '';
            const isHeader = /^<strong>Questions?\s*\d+/i.test(content);
            if (isHeader) {
                // Skip the "Questions 1-10... Complete the notes..." header
                continue;
            }
            // Check if it's a title/heading (short, wrapped in <strong>)
            if (!mainHeading && /^<strong>[^<]+<\/strong>$/.test(content.trim()) && content.length < 200) {
                mainHeading = content.replace(/<\/?strong>/g, '').trim();
            } else {
                contextInstructions.push(content);
            }
        }

        if (contextInstructions.length > 0) {
            passageHtml = contextInstructions.join('<br/>');
        }

        // Clear pending instructions (consumed)
        pendingInstructions = [];

        // Build group based on type
        switch (qType) {
            case "multiple-choice": {
                const mcQuestions = sameTypeQs.map(sq => ({
                    questionNumber: sq.questionNumber,
                    questionText: sq.questionText || '',
                    options: (sq.options || []).map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                        return { letter, text };
                    }),
                    correctAnswer: sq.correctAnswer || '',
                }));
                groups.push({
                    groupType: "multiple-choice",
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: "Choose the correct letter, A, B or C.",
                    subInstruction: "",
                    mcQuestions,
                });
                break;
            }

            case "multiple-choice-multi": {
                const firstQ = sameTypeQs[0];
                groups.push({
                    groupType: "multiple-choice-multi",
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: "Choose TWO letters, A–E.",
                    subInstruction: "",
                    questionText: firstQ.questionText || '',
                    options: (firstQ.options || []).map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const text = (opt || '').replace(/^[A-Z]\.\s*/, '');
                        return { letter, text };
                    }),
                    correctAnswers: sameTypeQs.map(sq => sq.correctAnswer || ''),
                });
                break;
            }

            case "matching":
            case "matching-features":
            case "matching-headings":
            case "map-labeling":
            case "diagram-labeling": {
                const opts = (sameTypeQs[0].options || []).map((opt, oIdx) => {
                    if (typeof opt === 'string') {
                        const letter = opt.match(/^([A-Z])/)?.[1] || String.fromCharCode(65 + oIdx);
                        const text = opt.replace(/^[A-Z]\.\s*/, '');
                        return { letter, text: text === letter ? '' : text };
                    }
                    return { letter: String.fromCharCode(65 + oIdx), text: '' };
                });

                const matchingItems = sameTypeQs.map(sq => ({
                    questionNumber: sq.questionNumber,
                    text: sq.questionText || '',
                    correctAnswer: sq.correctAnswer || '',
                }));

                const isMap = qType === 'map-labeling' || qType === 'diagram-labeling';
                groups.push({
                    groupType: qType,
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: isMap
                        ? (qType === 'map-labeling' ? "Label the map/plan below." : "Label the diagram below.")
                        : "Choose the correct letter.",
                    subInstruction: "",
                    featureListTitle: "List",
                    featureOptions: opts,
                    matchingItems,
                    ...(isMap && sameTypeQs[0].imageUrl ? { imageUrl: sameTypeQs[0].imageUrl } : {}),
                });
                break;
            }

            case "table-completion": {
                // Try to find table HTML in context instructions
                let tableHtml = "";
                for (const ctx of contextInstructions) {
                    if (ctx.includes('<table')) {
                        tableHtml = ctx;
                        break;
                    }
                }
                groups.push({
                    groupType: "table-completion",
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: "Complete the table below.",
                    subInstruction: "Write ONE WORD AND/OR A NUMBER for each answer.",
                    tableHtml,
                    questions: sameTypeQs.map(sq => ({
                        questionNumber: sq.questionNumber,
                        questionText: sq.questionText || '',
                        correctAnswer: sq.correctAnswer || '',
                    })),
                });
                break;
            }

            case "short-answer": {
                groups.push({
                    groupType: "short-answer",
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: "Answer the questions below.",
                    subInstruction: "Write NO MORE THAN THREE WORDS for each answer.",
                    questions: sameTypeQs.map(sq => ({
                        questionNumber: sq.questionNumber,
                        questionText: sq.questionText || '',
                        correctAnswer: sq.correctAnswer || '',
                    })),
                });
                break;
            }

            default: {
                // note-completion, form-completion, sentence-completion, summary-completion, flow-chart-completion
                const completionType = qType || "note-completion";
                const instrMap = {
                    "note-completion": { main: "Complete the notes below.", sub: "Write ONE WORD AND/OR A NUMBER for each answer." },
                    "form-completion": { main: "Complete the form below.", sub: "Write ONE WORD AND/OR A NUMBER for each answer." },
                    "sentence-completion": { main: "Complete the sentences below.", sub: "Write NO MORE THAN TWO WORDS for each answer." },
                    "summary-completion": { main: "Complete the summary below.", sub: "Write ONE WORD ONLY for each answer." },
                    "flow-chart-completion": { main: "Complete the flow-chart below.", sub: "Write ONE WORD ONLY for each answer." },
                };
                const defaultInstr = instrMap[completionType] || instrMap["note-completion"];

                groups.push({
                    groupType: completionType,
                    startQuestion: startQ,
                    endQuestion: endQ,
                    mainInstruction: defaultInstr.main,
                    subInstruction: defaultInstr.sub,
                    mainHeading: mainHeading,
                    passage: passageHtml,
                    questions: sameTypeQs.map(sq => ({
                        questionNumber: sq.questionNumber,
                        textBefore: sq.questionText || '',
                        textAfter: '',
                        correctAnswer: sq.correctAnswer || '',
                    })),
                });
                break;
            }
        }

        i = j;
    }

    return groups;
}

export function renumberListeningGroups(groups) {
    let qNum = groups.length > 0 ? groups[0].startQuestion : 1;

    return groups.map(g => {
        const updated = { ...g, startQuestion: qNum };

        switch (g.groupType) {
            case "note-completion":
            case "form-completion":
            case "sentence-completion":
            case "summary-completion":
            case "flow-chart-completion":
            case "table-completion":
            case "short-answer": {
                updated.questions = (g.questions || []).map(q => {
                    const item = { ...q, questionNumber: qNum }; qNum++; return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "multiple-choice": {
                updated.mcQuestions = (g.mcQuestions || []).map(q => {
                    const item = { ...q, questionNumber: qNum }; qNum++; return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "multiple-choice-multi": {
                const count = (g.correctAnswers || []).length || 2;
                updated.endQuestion = qNum + count - 1;
                qNum += count;
                break;
            }
            case "matching":
            case "map-labeling":
            case "diagram-labeling": {
                updated.matchingItems = (g.matchingItems || []).map(m => {
                    const item = { ...m, questionNumber: qNum }; qNum++; return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            default:
                updated.endQuestion = qNum - 1;
        }
        return updated;
    });
}
