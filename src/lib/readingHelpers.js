// ═══════════════════════════════════════════
// Reading Test Helper Functions
// ═══════════════════════════════════════════

export const QUESTION_TYPES = [
    { value: "note-completion", label: "Note/Sentence Completion", icon: "📝" },
    { value: "table-completion", label: "Table Completion", icon: "📊" },
    { value: "short-answer", label: "Short Answer Questions", icon: "✏️" },
    { value: "true-false-not-given", label: "True / False / Not Given", icon: "✅" },
    { value: "yes-no-not-given", label: "Yes / No / Not Given", icon: "🔘" },
    { value: "matching-information", label: "Matching Information", icon: "🔗" },
    { value: "matching-headings", label: "Matching Headings", icon: "📑" },
    { value: "matching-features", label: "Matching Features", icon: "👥" },
    { value: "multiple-choice-full", label: "Multiple Choice (A/B/C/D)", icon: "🔤" },
    { value: "summary-with-options", label: "Summary with Word List", icon: "📋" },
    { value: "choose-two-letters", label: "Choose Two Letters", icon: "✌️" },
    { value: "diagram-labeling", label: "Diagram / Flowchart Labeling", icon: "🗺️" },
    { value: "custom-flowchart-1", label: "Custom Flowchart (Mock 01)", icon: "🔄" },
];

// Get next available question number from existing groups
export function getNextQuestionNumber(groups) {
    let max = 0;
    for (const g of groups) {
        if (g.endQuestion > max) max = g.endQuestion;
    }
    return max + 1;
}

// Create empty template for each question type
export function createGroupTemplate(type, startQ) {
    const base = { startQuestion: startQ };

    switch (type) {
        case "note-completion":
            return {
                groupType: "note-completion", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Complete the notes below.",
                subInstruction: "Choose ONE WORD ONLY from the passage for each answer.",
                mainHeading: "",
                passage: "",
                notesSections: [{
                    subHeading: "",
                    bullets: Array.from({ length: 4 }, (_, i) => ({
                        type: "question", questionNumber: startQ + i,
                        textBefore: "", textAfter: "", correctAnswer: ""
                    }))
                }]
            };

        case "table-completion":
            return {
                groupType: "table-completion", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Complete the table below.",
                subInstruction: "Choose ONE WORD ONLY from the passage for each answer.",
                tableTitle: "",
                columns: ["", "Column 1", "Column 2", "Column 3"],
                rows: [
                    {
                        label: "Row 1",
                        cells: [
                            { content: `${startQ} __________`, hasBlank: true },
                            { content: `${startQ + 1} __________`, hasBlank: true },
                            { content: "", hasBlank: false }
                        ]
                    },
                    {
                        label: "Row 2",
                        cells: [
                            { content: "", hasBlank: false },
                            { content: `${startQ + 2} __________`, hasBlank: true },
                            { content: `${startQ + 3} __________`, hasBlank: true }
                        ]
                    }
                ],
                answers: Array.from({ length: 4 }, (_, i) => ({
                    questionNumber: startQ + i, correctAnswer: ""
                }))
            };

        case "short-answer":
            return {
                groupType: "short-answer", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Answer the questions below.",
                subInstruction: "Choose ONE WORD ONLY from the passage for each answer.",
                questions: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i,
                    questionText: "",
                    correctAnswer: ""
                }))
            };

        case "true-false-not-given":
            return {
                groupType: "true-false-not-given", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Do the following statements agree with the information given in the passage?",
                subInstruction: "In boxes on your answer sheet, write",
                optionsExplanation: [
                    { option: "TRUE", explanation: "if the statement agrees with the information" },
                    { option: "FALSE", explanation: "if the statement contradicts the information" },
                    { option: "NOT GIVEN", explanation: "if there is no information on this" },
                ],
                statements: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i, text: "", correctAnswer: ""
                }))
            };

        case "yes-no-not-given":
            return {
                groupType: "yes-no-not-given", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Do the following statements agree with the claims of the writer in the passage?",
                subInstruction: "In boxes on your answer sheet, write",
                optionsExplanation: [
                    { option: "YES", explanation: "if the statement agrees with the claims of the writer" },
                    { option: "NO", explanation: "if the statement contradicts the claims of the writer" },
                    { option: "NOT GIVEN", explanation: "if it is impossible to say what the writer thinks about this" },
                ],
                statements: Array.from({ length: 4 }, (_, i) => ({
                    questionNumber: startQ + i, text: "", correctAnswer: ""
                }))
            };

        case "matching-information":
            return {
                groupType: "matching-information", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "The passage has seven paragraphs, A-G. Which section contains the following information?",
                subInstruction: "NB You may use any letter more than once.",
                paragraphOptions: ["A", "B", "C", "D", "E", "F", "G"],
                matchingItems: Array.from({ length: 4 }, (_, i) => ({
                    questionNumber: startQ + i, text: "", correctAnswer: ""
                }))
            };

        case "matching-headings":
            return {
                groupType: "matching-headings", ...base,
                endQuestion: startQ + 6,
                mainInstruction: "The Reading Passage has seven paragraphs, A-G.",
                subInstruction: "Choose the correct heading for each paragraph from the list of headings below.",
                featureListTitle: "List of Headings",
                featureOptions: Array.from({ length: 9 }, (_, i) => ({
                    letter: ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"][i],
                    text: ""
                })),
                paragraphOptions: ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"],
                matchingItems: Array.from({ length: 7 }, (_, i) => ({
                    questionNumber: startQ + i,
                    text: `Paragraph ${String.fromCharCode(65 + i)}`,
                    correctAnswer: ""
                }))
            };

        case "matching-features":
            return {
                groupType: "matching-features", ...base,
                endQuestion: startQ + 4,
                mainInstruction: "Look at the following statements and the list of people below.",
                subInstruction: "Match each statement with the correct person.",
                note: "NB You may use any letter more than once.",
                featureListTitle: "List of People",
                featureOptions: [
                    { letter: "A", text: "" },
                    { letter: "B", text: "" },
                    { letter: "C", text: "" },
                ],
                paragraphOptions: ["A", "B", "C"],
                matchingItems: Array.from({ length: 5 }, (_, i) => ({
                    questionNumber: startQ + i, text: "", correctAnswer: ""
                }))
            };

        case "multiple-choice-full":
            return {
                groupType: "multiple-choice-full", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Choose the correct letter, A, B, C or D.",
                subInstruction: "Write the correct letter in boxes on your answer sheet.",
                mcQuestions: Array.from({ length: 4 }, (_, i) => ({
                    questionNumber: startQ + i,
                    questionText: "",
                    options: [
                        { letter: "A", text: "" },
                        { letter: "B", text: "" },
                        { letter: "C", text: "" },
                        { letter: "D", text: "" },
                    ],
                    correctAnswer: ""
                }))
            };

        case "summary-with-options":
            return {
                groupType: "summary-with-options", ...base,
                endQuestion: startQ + 3,
                mainInstruction: "Complete the summary using the list of phrases/words below.",
                subInstruction: "Write the correct letter in boxes on your answer sheet.",
                mainHeading: "",
                phraseList: Array.from({ length: 7 }, (_, i) => ({
                    letter: String.fromCharCode(65 + i), text: ""
                })),
                summarySegments: [
                    { type: "text", content: "" },
                    { type: "blank", questionNumber: startQ, correctAnswer: "" },
                    { type: "text", content: "" },
                    { type: "blank", questionNumber: startQ + 1, correctAnswer: "" },
                    { type: "text", content: "" },
                    { type: "blank", questionNumber: startQ + 2, correctAnswer: "" },
                    { type: "text", content: "" },
                    { type: "blank", questionNumber: startQ + 3, correctAnswer: "" },
                    { type: "text", content: "" },
                ]
            };

        case "choose-two-letters":
            return {
                groupType: "choose-two-letters", ...base,
                endQuestion: startQ + 1,
                mainInstruction: "Choose TWO letters, A-E.",
                questionSets: [{
                    questionNumbers: [startQ, startQ + 1],
                    questionText: "",
                    options: [
                        { letter: "A", text: "" },
                        { letter: "B", text: "" },
                        { letter: "C", text: "" },
                        { letter: "D", text: "" },
                        { letter: "E", text: "" },
                    ],
                    correctAnswers: ["", ""]
                }]
            };

        case "diagram-labeling":
            return {
                groupType: "diagram-labeling", ...base,
                endQuestion: startQ,
                mainInstruction: "Questions " + startQ,
                subInstruction: "Complete the flow-chart below.",
                imageUrl: "",
                markers: [
                    { questionNumber: startQ, x: 50, y: 50, correctAnswer: "" }
                ]
            };

        default:
            return { groupType: type, ...base, endQuestion: startQ };
    }
}

// ═══════════════════════════════════════════
// Auto-generate questions[] from questionGroups[]
// ═══════════════════════════════════════════
export function generateQuestionsFromGroups(groups) {
    const questions = [];

    for (const group of groups) {
        switch (group.groupType) {
            case "note-completion": {
                if (group.notesSections) {
                    for (const sec of group.notesSections) {
                        for (const b of (sec.bullets || [])) {
                            if (b.type === "question") {
                                questions.push({
                                    questionNumber: b.questionNumber,
                                    questionType: "note-completion",
                                    questionText: `${b.textBefore} __________ ${b.textAfter}`.trim(),
                                    correctAnswer: b.correctAnswer,
                                    acceptableAnswers: [b.correctAnswer],
                                    marks: 1, wordLimit: 1
                                });
                            }
                        }
                    }
                }
                break;
            }
            case "table-completion": {
                for (const ans of (group.answers || [])) {
                    questions.push({
                        questionNumber: ans.questionNumber,
                        questionType: "table-completion",
                        questionText: `Table blank Q${ans.questionNumber}`,
                        correctAnswer: ans.correctAnswer,
                        acceptableAnswers: [ans.correctAnswer],
                        marks: 1, wordLimit: 2
                    });
                }
                break;
            }
            case "short-answer": {
                for (const q of (group.questions || [])) {
                    questions.push({
                        questionNumber: q.questionNumber,
                        questionType: "short-answer",
                        questionText: q.questionText,
                        correctAnswer: q.correctAnswer,
                        acceptableAnswers: [q.correctAnswer],
                        marks: 1, wordLimit: 3
                    });
                }
                break;
            }
            case "true-false-not-given": {
                for (const s of (group.statements || [])) {
                    questions.push({
                        questionNumber: s.questionNumber,
                        questionType: "true-false-not-given",
                        questionText: s.text,
                        options: ["TRUE", "FALSE", "NOT GIVEN"],
                        correctAnswer: s.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "yes-no-not-given": {
                for (const s of (group.statements || [])) {
                    questions.push({
                        questionNumber: s.questionNumber,
                        questionType: "yes-no-not-given",
                        questionText: s.text,
                        options: ["YES", "NO", "NOT GIVEN"],
                        correctAnswer: s.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "matching-information": {
                for (const item of (group.matchingItems || [])) {
                    questions.push({
                        questionNumber: item.questionNumber,
                        questionType: "matching-information",
                        questionText: item.text,
                        options: group.paragraphOptions || [],
                        correctAnswer: item.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "matching-headings": {
                for (const item of (group.matchingItems || [])) {
                    questions.push({
                        questionNumber: item.questionNumber,
                        questionType: "matching-headings",
                        questionText: item.text,
                        options: group.paragraphOptions || [],
                        correctAnswer: item.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "matching-features": {
                for (const item of (group.matchingItems || [])) {
                    questions.push({
                        questionNumber: item.questionNumber,
                        questionType: "matching-features",
                        questionText: item.text,
                        options: (group.featureOptions || []).map(f => f.letter),
                        correctAnswer: item.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "multiple-choice-full": {
                for (const mcq of (group.mcQuestions || [])) {
                    questions.push({
                        questionNumber: mcq.questionNumber,
                        questionType: "multiple-choice-full",
                        questionText: mcq.questionText,
                        correctAnswer: mcq.correctAnswer, marks: 1
                    });
                }
                break;
            }
            case "summary-with-options": {
                for (const seg of (group.summarySegments || [])) {
                    if (seg.type === "blank") {
                        questions.push({
                            questionNumber: seg.questionNumber,
                            questionType: "summary-with-options",
                            questionText: `Summary blank Q${seg.questionNumber}`,
                            correctAnswer: seg.correctAnswer, marks: 1
                        });
                    }
                }
                break;
            }
            case "choose-two-letters": {
                for (const set of (group.questionSets || [])) {
                    for (const num of (set.questionNumbers || [])) {
                        questions.push({
                            questionNumber: num,
                            questionType: group.groupType,
                            questionText: set.questionText,
                            options: set.options ? set.options.map(o => o.text) : [],
                            correctAnswer: Array.isArray(set.correctAnswers) ? set.correctAnswers.join(",") : set.correctAnswers,
                            questionGroup: String(group._id || "")
                        });
                    }
                }
                break;
            }

            case "diagram-labeling": {
                for (const m of (group.markers || [])) {
                    questions.push({
                        questionNumber: m.questionNumber,
                        questionType: group.groupType,
                        questionText: `Marker at [${m.x}%, ${m.y}%]`,
                        correctAnswer: m.correctAnswer,
                        questionGroup: String(group._id || "")
                    });
                }
                break;
            }
        }
    }
    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
}

// Renumber all questions in groups sequentially
export function renumberGroups(groups) {
    let qNum = groups.length > 0 ? groups[0].startQuestion : 1;
    return groups.map(g => {
        const updated = { ...g, startQuestion: qNum };
        switch (g.groupType) {
            case "note-completion": {
                const ns = (g.notesSections || []).map(sec => ({
                    ...sec,
                    bullets: (sec.bullets || []).map(b => {
                        if (b.type === "question") {
                            const item = { ...b, questionNumber: qNum };
                            qNum++;
                            return item;
                        }
                        return b;
                    })
                }));
                updated.notesSections = ns;
                updated.endQuestion = qNum - 1;
                break;
            }
            case "table-completion": {
                updated.answers = (g.answers || []).map(a => {
                    const item = { ...a, questionNumber: qNum };
                    qNum++;
                    return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "short-answer": {
                updated.questions = (g.questions || []).map(q => {
                    const item = { ...q, questionNumber: qNum };
                    qNum++;
                    return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "true-false-not-given":
            case "yes-no-not-given": {
                updated.statements = (g.statements || []).map(s => {
                    const item = { ...s, questionNumber: qNum };
                    qNum++;
                    return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "matching-information":
            case "matching-headings":
            case "matching-features": {
                updated.matchingItems = (g.matchingItems || []).map(m => {
                    const item = { ...m, questionNumber: qNum };
                    qNum++;
                    return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "multiple-choice-full": {
                updated.mcQuestions = (g.mcQuestions || []).map(q => {
                    const item = { ...q, questionNumber: qNum };
                    qNum++;
                    return item;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "summary-with-options": {
                updated.summarySegments = (g.summarySegments || []).map(s => {
                    if (s.type === "blank") {
                        const item = { ...s, questionNumber: qNum };
                        qNum++;
                        return item;
                    }
                    return s;
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "choose-two-letters": {
                updated.questionSets = (g.questionSets || []).map(set => {
                    const nums = set.questionNumbers.map(() => { const n = qNum; qNum++; return n; });
                    return { ...set, questionNumbers: nums };
                });
                updated.endQuestion = qNum - 1;
                break;
            }
            case "diagram-labeling":
                return {
                    groupType,
                    startQuestion,
                    endQuestion: startQuestion,
                    mainInstruction: "Questions " + startQuestion,
                    subInstruction: "Complete the flow-chart below.",
                    imageUrl: "",
                    markers: [
                        { questionNumber: startQuestion, x: 50, y: 50, correctAnswer: "" }
                    ]
                };

            default:
                updated.endQuestion = qNum - 1;
        }
        return updated;
    });
}
