// API Service for IELTS Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get auth token from localStorage
const getAuthToken = () => {
    if (typeof window === "undefined") return null;

    // First check for standard token (used by all users)
    const token = localStorage.getItem("token");
    if (token) return token;

    // Fallback to adminAuth for backward compatibility
    const auth = localStorage.getItem("adminAuth");
    if (auth) {
        try {
            const parsed = JSON.parse(auth);
            return parsed.token;
        } catch (e) {
            return null;
        }
    }
    return null;
};
// Check if JWT token is expired
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() is in milliseconds
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true; // If can't decode, treat as expired
    }
};

// Clear auth data and redirect to login
const handleUnauthorized = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminAuth');
    window.location.href = '/login';
};


const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();

    // 🔒 Check token expiry BEFORE making request
    if (token && isTokenExpired(token)) {
        handleUnauthorized();
        throw new Error('Session expired. Please login again.');
    }

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // 🔒 Handle 401 Unauthorized — token expired on server side
            if (response.status === 401) {
                handleUnauthorized();
                throw new Error('Session expired. Please login again.');
            }
            // Check if it's a validation error with array of errors
            if (data.errors && Array.isArray(data.errors)) {
                const error = new Error(JSON.stringify(data.errors));
                error.validationErrors = data.errors;
                throw error;
            }
            // Check if message is an array (Zod validation format)
            if (Array.isArray(data.message)) {
                const error = new Error(JSON.stringify(data.message));
                error.validationErrors = data.message;
                throw error;
            }
            throw new Error(data.message || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

// Upload image to Cloudinary via backend
export const uploadImage = async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
    }
    return data;
};

// Upload audio to Cloudinary via backend
export const uploadAudio = async (file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("audio", file);

    const response = await fetch(`${API_BASE_URL}/upload/audio`, {
        method: "POST",
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to upload audio");
    }
    return data;
};

// ================== AUTH API ==================
export const authAPI = {
    login: async (email, password) => {
        const response = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        return response;
    },

    register: async (userData) => {
        const response = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
        return response;
    },
};

// ================== STUDENTS API ==================
export const studentsAPI = {
    // Create new student
    create: async (studentData) => {
        const response = await apiRequest("/students", {
            method: "POST",
            body: JSON.stringify(studentData),
        });
        return response;
    },

    // Get all students with filters
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/students?${queryString}`);
        return response;
    },

    // Get student by ID
    getById: async (id) => {
        const response = await apiRequest(`/students/${id}`);
        return response;
    },

    // Get student by exam ID
    getByExamId: async (examId) => {
        const response = await apiRequest(`/students/exam/${examId}`);
        return response;
    },

    // Get current student profile
    getMyProfile: async () => {
        const response = await apiRequest("/students/my-profile");
        return response;
    },

    // Update student
    update: async (id, updateData) => {
        const response = await apiRequest(`/students/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
        });
        return response;
    },

    // Delete student
    delete: async (id) => {
        const response = await apiRequest(`/students/${id}`, {
            method: "DELETE",
        });
        return response;
    },

    // Verify exam ID (public)
    verifyExamId: async (examId) => {
        const response = await apiRequest("/students/verify", {
            method: "POST",
            body: JSON.stringify({ examId }),
        });
        return response;
    },

    // Start exam session
    startExam: async (examId, ipAddress, browserFingerprint) => {
        const response = await apiRequest("/students/start-exam", {
            method: "POST",
            body: JSON.stringify({ examId, ipAddress, browserFingerprint }),
        });
        return response;
    },

    // Report violation
    reportViolation: async (examId, type) => {
        const response = await apiRequest("/students/violation", {
            method: "POST",
            body: JSON.stringify({ examId, type }),
        });
        return response;
    },

    // Get exam results
    getResults: async (examId) => {
        const response = await apiRequest(`/students/results/${examId}`);
        return response;
    },

    // Reset exam (admin)
    resetExam: async (examId) => {
        const response = await apiRequest(`/students/reset/${examId}`, {
            method: "POST",
        });
        return response;
    },

    // Get all results (admin)
    getAllResults: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/students/all-results?${queryString}`);
        return response;
    },

    // Complete exam and save scores
    completeExam: async (examId, scores) => {
        const response = await apiRequest("/students/complete-exam", {
            method: "POST",
            body: JSON.stringify({ examId, scores }),
        });
        return response;
    },

    // Save individual module score
    saveModuleScore: async (examId, module, scoreData) => {
        const response = await apiRequest("/students/save-module-score", {
            method: "POST",
            body: JSON.stringify({ examId, module, scoreData }),
        });
        return response;
    },

    // Get statistics (admin)
    getStatistics: async () => {
        const response = await apiRequest("/students/statistics");
        return response;
    },

    // Update score (admin)
    updateScore: async (studentId, module, score) => {
        const response = await apiRequest(`/students/${studentId}/update-score`, {
            method: "PATCH",
            body: JSON.stringify({ module, score }),
        });
        return response;
    },

    // Get answer sheet (admin)
    getAnswerSheet: async (studentId, module) => {
        const response = await apiRequest(`/students/${studentId}/answer-sheet/${module}`);
        return response;
    },

    // Update all scores at once (admin)
    updateAllScores: async (studentId, scoresData) => {
        const response = await apiRequest(`/students/${studentId}/update-all-scores`, {
            method: "PATCH",
            body: JSON.stringify(scoresData),
        });
        return response;
    },

    // Publish results for student (admin)
    publishResults: async (studentId, publish = true) => {
        const response = await apiRequest(`/students/${studentId}/publish-results`, {
            method: "POST",
            body: JSON.stringify({ publish }),
        });
        return response;
    },

    // Reset individual module (admin)
    resetModule: async (studentId, module) => {
        const response = await apiRequest(`/students/${studentId}/reset-module`, {
            method: "POST",
            body: JSON.stringify({ module }),
        });
        return response;
    },
};

// ================== HELPER: Create module-specific API ==================
const createModuleAPI = (basePath) => ({
    create: async (data) => {
        return await apiRequest(`/${basePath}`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/${basePath}?${queryString}`);
    },
    getById: async (id, includeAnswers = false) => {
        return await apiRequest(`/${basePath}/${id}?includeAnswers=${includeAnswers}`);
    },
    getForExam: async (testNumber) => {
        return await apiRequest(`/${basePath}/exam/${testNumber}`);
    },
    update: async (id, updateData) => {
        return await apiRequest(`/${basePath}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
        });
    },
    delete: async (id) => {
        return await apiRequest(`/${basePath}/${id}`, {
            method: "DELETE",
        });
    },
    toggleActive: async (id) => {
        return await apiRequest(`/${basePath}/${id}/toggle-active`, {
            method: "PATCH",
        });
    },
    getSummary: async () => {
        return await apiRequest(`/${basePath}/summary`);
    },
    getStatistics: async () => {
        return await apiRequest(`/${basePath}/statistics`);
    },
});

// ================== LISTENING API ==================
export const listeningAPI = {
    ...createModuleAPI("listening"),
    grade: async (testNumber, answers) => {
        return await apiRequest("/listening/grade", {
            method: "POST",
            body: JSON.stringify({ testNumber, answers }),
        });
    },
};

// ================== READING API ==================
export const readingAPI = {
    ...createModuleAPI("reading"),
    grade: async (testNumber, answers) => {
        return await apiRequest("/reading/grade", {
            method: "POST",
            body: JSON.stringify({ testNumber, answers }),
        });
    },
};

// ================== WRITING API ==================
export const writingAPI = {
    ...createModuleAPI("writing"),
    submitResponse: async (studentId, testNumber, taskNumber, response) => {
        return await apiRequest("/writing/submit", {
            method: "POST",
            body: JSON.stringify({ studentId, testNumber, taskNumber, response }),
        });
    },
    markSubmission: async (submissionId, examinerId, scores, feedback) => {
        return await apiRequest(`/writing/submissions/${submissionId}/mark`, {
            method: "PATCH",
            body: JSON.stringify({ examinerId, scores, feedback }),
        });
    },
    getPendingSubmissions: async (page = 1, limit = 10) => {
        return await apiRequest(`/writing/submissions/pending?page=${page}&limit=${limit}`);
    },
};

// ================== SPEAKING API ==================
export const speakingAPI = {
    ...createModuleAPI("speaking"),
};


// ================== EXAMS API ==================
export const examsAPI = {
    getAll: async () => {
        const response = await apiRequest("/exams");
        return response;
    },

    getById: async (examId) => {
        const response = await apiRequest(`/exams/${examId}`);
        return response;
    },

    create: async (examData) => {
        const response = await apiRequest("/exams", {
            method: "POST",
            body: JSON.stringify(examData),
        });
        return response;
    },

    update: async (examId, examData) => {
        const response = await apiRequest(`/exams/${examId}`, {
            method: "PUT",
            body: JSON.stringify(examData),
        });
        return response;
    },

    delete: async (examId) => {
        const response = await apiRequest(`/exams/${examId}`, {
            method: "DELETE",
        });
        return response;
    },
};

// ================== EXAM SESSIONS API ==================
export const examSessionsAPI = {
    start: async (data) => {
        const response = await apiRequest("/exam-sessions/start", {
            method: "POST",
            body: JSON.stringify(data),
        });
        return response;
    },

    getSession: async (sessionId) => {
        const response = await apiRequest(`/exam-sessions/${sessionId}`);
        return response;
    },

    submitAnswers: async (sessionId, section, answers) => {
        const response = await apiRequest(`/exam-sessions/${sessionId}/submit`, {
            method: "POST",
            body: JSON.stringify({ section, answers }),
        });
        return response;
    },

    getResult: async (sessionId) => {
        const response = await apiRequest(`/exam-sessions/${sessionId}/result`);
        return response;
    },

    // Admin endpoints
    getAllSessions: async (query = {}) => {
        const params = new URLSearchParams(query).toString();
        const response = await apiRequest(`/exam-sessions?${params}`);
        return response;
    },

    updateWritingScores: async (sessionId, task1Band, task2Band) => {
        const response = await apiRequest(`/exam-sessions/${sessionId}/writing-scores`, {
            method: "PATCH",
            body: JSON.stringify({ task1Band, task2Band }),
        });
        return response;
    },
};

// ================== UPLOAD API ==================
export const uploadAPI = {
    // Upload audio file
    uploadAudio: async (file) => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append("audio", file);

        try {
            const response = await fetch(`${API_BASE_URL}/upload/audio`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload audio");
            }

            return data;
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    },

    // Upload image file
    uploadImage: async (file) => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`${API_BASE_URL}/upload/image`, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload image");
            }

            return data;
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    },

    // Delete file
    deleteFile: async (publicId, type = "video") => {
        const response = await apiRequest(`/upload/${encodeURIComponent(publicId)}?type=${type}`, {
            method: "DELETE",
        });
        return response;
    },

    // Upload speaking recording (public — no auth needed)
    uploadSpeakingRecording: async (blob) => {
        const formData = new FormData();
        formData.append("video", blob, `speaking-${Date.now()}.webm`);

        try {
            const response = await fetch(`${API_BASE_URL}/upload/speaking-recording`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload recording");
            }

            return data;
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    },
};

// ================== STATS API ==================
export const statsAPI = {
    getOverview: async () => {
        return await studentsAPI.getStatistics();
    },
};

// ================== SITE CONTENT API (Design — Videos & Texts) ==================
export const siteContentAPI = {
    // Public — no auth
    getByKey: async (key) => apiRequest(`/site-content/key/${encodeURIComponent(key)}`),
    getBulk: async (keys) =>
        apiRequest(`/site-content/bulk?keys=${encodeURIComponent((keys || []).join(","))}`),
    getByCategory: async (category) =>
        apiRequest(`/site-content/category/${encodeURIComponent(category)}`),

    // Admin
    getAll: async () => apiRequest("/site-content"),
    update: async (key, payload) =>
        apiRequest(`/site-content/key/${encodeURIComponent(key)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),
    uploadCloudinaryVideo: async (key, file) => {
        const formData = new FormData();
        formData.append("video", file);
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(
            `${API_BASE_URL}/site-content/upload-cloudinary/${encodeURIComponent(key)}`,
            { method: "POST", body: formData, headers }
        );
        return response.json();
    },
    uploadLocalVideo: async (key, file) => {
        const formData = new FormData();
        formData.append("video", file);
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(
            `${API_BASE_URL}/site-content/upload-local/${encodeURIComponent(key)}`,
            { method: "POST", body: formData, headers }
        );
        return response.json();
    },
};

// ================== USERS API (Admin only) ==================
export const usersAPI = {
    getAll: async () => {
        return await apiRequest("/users");
    },
    create: async (userData) => {
        return await apiRequest("/users", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    },
    delete: async (id) => {
        return await apiRequest(`/users/${id}`, {
            method: "DELETE",
        });
    },
    updateRole: async (id, role) => {
        return await apiRequest(`/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
        });
    },
};

export default {
    auth: authAPI,
    students: studentsAPI,
    listening: listeningAPI,
    reading: readingAPI,
    writing: writingAPI,
    speaking: speakingAPI,
    exams: examsAPI,
    examSessions: examSessionsAPI,
    upload: uploadAPI,
    stats: statsAPI,
    users: usersAPI,
    siteContent: siteContentAPI,
};
