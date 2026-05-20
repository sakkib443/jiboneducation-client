import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// API Base URL
const API_BASE = "http://localhost:5000/api";

// Helper to get auth token
const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async Thunks
export const fetchExams = createAsyncThunk(
    "exam/fetchExams",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/exams`, {
                headers: { ...getAuthHeader() },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch exams");
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchExamById = createAsyncThunk(
    "exam/fetchExamById",
    async (examId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/exams/${examId}`, {
                headers: { ...getAuthHeader() },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch exam");
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const startExam = createAsyncThunk(
    "exam/startExam",
    async (examId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/exams/${examId}/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to start exam");
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const submitSection = createAsyncThunk(
    "exam/submitSection",
    async ({ examId, section, answers }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/exams/${examId}/sections/${section}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit section");
            return { section, ...data.data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const submitExam = createAsyncThunk(
    "exam/submitExam",
    async ({ examId, answers }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/exams/${examId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeader() },
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit exam");
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const uploadSpeakingAudio = createAsyncThunk(
    "exam/uploadSpeakingAudio",
    async ({ examId, questionId, audioBlob }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "speaking.webm");
            formData.append("questionId", questionId);

            const res = await fetch(`${API_BASE}/exams/${examId}/speaking/upload`, {
                method: "POST",
                headers: { ...getAuthHeader() },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to upload audio");
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Initial State
const initialState = {
    // Exam List
    exams: [],
    isLoadingExams: false,

    // Current Exam Session
    currentExam: null,
    currentSection: null, // 'listening', 'reading', 'writing', 'speaking'
    currentQuestionIndex: 0,

    // Timer
    timeRemaining: 0, // in seconds
    timerRunning: false,

    // Answers
    answers: {
        listening: {},
        reading: {},
        writing: {},
        speaking: {},
    },

    // Flags
    flaggedQuestions: [],

    // Status
    examStatus: "idle", // 'idle', 'in-progress', 'paused', 'submitted'
    isSubmitting: false,
    error: null,

    // Results
    result: null,
};

// Slice
const examSlice = createSlice({
    name: "exam",
    initialState,
    reducers: {
        // Section Navigation
        setCurrentSection: (state, action) => {
            state.currentSection = action.payload;
            state.currentQuestionIndex = 0;
        },

        // Question Navigation
        setCurrentQuestion: (state, action) => {
            state.currentQuestionIndex = action.payload;
        },

        nextQuestion: (state) => {
            state.currentQuestionIndex += 1;
        },

        prevQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
            }
        },

        // Answer Management
        setAnswer: (state, action) => {
            const { section, questionId, answer } = action.payload;
            if (!state.answers[section]) {
                state.answers[section] = {};
            }
            state.answers[section][questionId] = answer;
        },

        // Flag Management
        toggleFlag: (state, action) => {
            const questionId = action.payload;
            const index = state.flaggedQuestions.indexOf(questionId);
            if (index === -1) {
                state.flaggedQuestions.push(questionId);
            } else {
                state.flaggedQuestions.splice(index, 1);
            }
        },

        // Timer
        setTimeRemaining: (state, action) => {
            state.timeRemaining = action.payload;
        },

        decrementTimer: (state) => {
            if (state.timeRemaining > 0) {
                state.timeRemaining -= 1;
            }
        },

        startTimer: (state) => {
            state.timerRunning = true;
        },

        pauseTimer: (state) => {
            state.timerRunning = false;
        },


        // Exam Status
        setExamStatus: (state, action) => {
            state.examStatus = action.payload;
        },

        // Reset Exam
        resetExam: (state) => {
            state.currentExam = null;
            state.currentSection = null;
            state.currentQuestionIndex = 0;
            state.timeRemaining = 0;
            state.timerRunning = false;
            state.answers = {
                listening: {},
                reading: {},
                writing: {},
                speaking: {},
            };
            state.flaggedQuestions = [];
            state.examStatus = "idle";
            state.result = null;
        },

        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Exams
        builder.addCase(fetchExams.pending, (state) => {
            state.isLoadingExams = true;
        });
        builder.addCase(fetchExams.fulfilled, (state, action) => {
            state.isLoadingExams = false;
            state.exams = action.payload;
        });
        builder.addCase(fetchExams.rejected, (state, action) => {
            state.isLoadingExams = false;
            state.error = action.payload;
        });

        // Fetch Exam by ID
        builder.addCase(fetchExamById.fulfilled, (state, action) => {
            state.currentExam = action.payload;
        });

        // Start Exam
        builder.addCase(startExam.fulfilled, (state, action) => {
            state.currentExam = action.payload.exam;
            state.timeRemaining = action.payload.timeLimit * 60; // Convert to seconds
            state.currentSection = "listening";
            state.examStatus = "in-progress";
            state.timerRunning = true;
        });

        // Submit Section
        builder.addCase(submitSection.fulfilled, (state, action) => {
            const { section } = action.payload;
            // Move to next section
            const sections = ["listening", "reading", "writing", "speaking"];
            const currentIndex = sections.indexOf(section);
            if (currentIndex < sections.length - 1) {
                state.currentSection = sections[currentIndex + 1];
                state.currentQuestionIndex = 0;
            }
        });

        // Submit Exam
        builder.addCase(submitExam.pending, (state) => {
            state.isSubmitting = true;
        });
        builder.addCase(submitExam.fulfilled, (state, action) => {
            state.isSubmitting = false;
            state.examStatus = "submitted";
            state.timerRunning = false;
            state.result = action.payload;
        });
        builder.addCase(submitExam.rejected, (state, action) => {
            state.isSubmitting = false;
            state.error = action.payload;
        });

        // Upload Speaking Audio
        builder.addCase(uploadSpeakingAudio.fulfilled, (state, action) => {
            // Mark speaking answer as uploaded
            const { questionId } = action.payload;
            state.answers.speaking[questionId] = { uploaded: true, ...action.payload };
        });
    },
});

export const {
    setCurrentSection,
    setCurrentQuestion,
    nextQuestion,
    prevQuestion,
    setAnswer,
    toggleFlag,
    setTimeRemaining,
    decrementTimer,
    startTimer,
    pauseTimer,
    setExamStatus,
    resetExam,
    clearError,
} = examSlice.actions;

export default examSlice.reducer;
