"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FaArrowLeft,
    FaUserGraduate,
    FaSpinner,
    FaCheck,
    FaCopy,
    FaEnvelope,
    FaPhone,
    FaIdCard,
    FaCalendar,
    FaMoneyBillWave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaTimes,
    FaExclamationTriangle,
    FaPlus,
    FaTrash,
    FaVideo,
    FaClock,
    FaLink,
} from "react-icons/fa";
import { studentsAPI, listeningAPI, readingAPI, writingAPI, speakingAPI } from "@/lib/api";

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => { onClose(); }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === "error" ? "bg-red-500" : type === "success" ? "bg-green-500" : "bg-yellow-500";
    const Icon = type === "error" ? FaTimes : type === "success" ? FaCheck : FaExclamationTriangle;

    return (
        <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-md animate-slide-in`}>
            <div className="flex-shrink-0 mt-0.5"><Icon className="text-lg" /></div>
            <div className="flex-1"><p className="font-medium">{message}</p></div>
            <button onClick={onClose} className="flex-shrink-0 hover:bg-white/20 p-1 rounded cursor-pointer"><FaTimes /></button>
        </div>
    );
};

// Field Error Display
const FieldError = ({ error }) => {
    if (!error) return null;
    return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <FaExclamationTriangle className="text-[10px]" />
            {error}
        </p>
    );
};

// Parse error from API response
const parseApiError = (error) => {
    if (Array.isArray(error)) {
        const fieldErrors = {};
        let generalMessage = "";
        error.forEach((err) => {
            let fieldName = err.field?.split(".")?.pop() || err.path?.[err.path.length - 1] || "general";
            const message = err.message || "Invalid value";
            if (fieldName === "general" || fieldName === "body" || !fieldName) {
                generalMessage += message + " ";
            } else {
                fieldErrors[fieldName] = message;
            }
        });
        return { fieldErrors, generalMessage: generalMessage.trim() || "Please fix the highlighted errors" };
    }
    if (typeof error === "string") return { fieldErrors: {}, generalMessage: error };
    if (error?.errors && Array.isArray(error.errors)) return parseApiError(error.errors);
    if (error?.message) return { fieldErrors: {}, generalMessage: error.message };
    return { fieldErrors: {}, generalMessage: "An unexpected error occurred" };
};

// ═══════════════════════════════════════════
// Multi-Set Selector Component
// ═══════════════════════════════════════════
function MultiSetSelector({ label, icon, sets, selectedSets, onChange, color = "purple" }) {
    const colorMap = {
        purple: 'text-purple-500 bg-purple-50 border-purple-200',
        blue: 'text-blue-500 bg-blue-50 border-blue-200',
        green: 'text-green-500 bg-green-50 border-green-200',
        orange: 'text-orange-500 bg-orange-50 border-orange-200',
    };
    const c = colorMap[color] || colorMap.purple;

    const addSet = () => {
        // Find first unselected set
        const available = sets.filter(s => !selectedSets.includes(s.testNumber));
        if (available.length > 0) {
            onChange([...selectedSets, available[0].testNumber]);
        }
    };

    const removeSet = (idx) => {
        onChange(selectedSets.filter((_, i) => i !== idx));
    };

    const updateSet = (idx, value) => {
        const updated = [...selectedSets];
        updated[idx] = Number(value);
        onChange(updated);
    };

    return (
        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {icon} {label}
                <span className="text-xs text-gray-400 font-normal ml-1">(optional - multiple sets allowed)</span>
            </label>

            {selectedSets.length === 0 ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 italic">No sets assigned</span>
                    <button
                        type="button"
                        onClick={addSet}
                        disabled={sets.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaPlus className="text-[9px]" /> Add Set
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {selectedSets.map((setNum, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${c}`}>
                                {idx + 1}
                            </span>
                            <select
                                value={setNum}
                                onChange={(e) => updateSet(idx, e.target.value)}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">Select a set...</option>
                                {sets.map((set) => (
                                    <option
                                        key={set._id}
                                        value={set.testNumber}
                                        disabled={selectedSets.includes(set.testNumber) && set.testNumber !== setNum}
                                    >
                                        Test #{set.testNumber} - {set.title}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeSet(idx)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                                <FaTrash className="text-xs" />
                            </button>
                        </div>
                    ))}
                    {selectedSets.length < sets.length && (
                        <button
                            type="button"
                            onClick={addSet}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 cursor-pointer border border-dashed border-cyan-200"
                        >
                            <FaPlus className="text-[9px]" /> Add Another Set
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export default function CreateStudentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [toast, setToast] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [copiedField, setCopiedField] = useState(null);

    // Question set options
    const [listeningSets, setListeningSets] = useState([]);
    const [readingSets, setReadingSets] = useState([]);
    const [writingSets, setWritingSets] = useState([]);
    const [speakingSets, setSpeakingSets] = useState([]);

    // Form data - now with arrays for multi-set
    const [formData, setFormData] = useState({
        testType: "academic",
        nameEnglish: "",
        nameBengali: "",
        email: "",
        phone: "",
        nidNumber: "",
        examDate: "",
        paymentStatus: "paid",
        paymentAmount: 5000,
        paymentMethod: "cash",
        paymentReference: "",
        speakingExamDate: "",
        speakingExamTime: "",
        speakingMeetingLink: "",
    });

    // Full Sets state (each full set = L+R+W)
    const [fullSets, setFullSets] = useState([{ listeningSetNumber: '', readingSetNumber: '', writingSetNumber: '' }]);
    // Extra individual parts
    const [extraSets, setExtraSets] = useState([]);

    useEffect(() => {
        fetchQuestionSets();
    }, []);

    const fetchQuestionSets = async () => {
        try {
            const [listeningRes, readingRes, writingRes, speakingRes] = await Promise.all([
                listeningAPI.getSummary().catch(() => ({ data: [] })),
                readingAPI.getSummary().catch(() => ({ data: [] })),
                writingAPI.getSummary().catch(() => ({ data: [] })),
                speakingAPI.getSummary().catch(() => ({ data: [] })),
            ]);
            setListeningSets(listeningRes.data || []);
            setReadingSets(readingRes.data || []);
            setWritingSets(writingRes.data || []);
            setSpeakingSets(speakingRes.data || []);
        } catch (error) {
            console.error("Failed to fetch question sets:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.nameEnglish.trim()) errors.nameEnglish = "Full name is required";
        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }
        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!/^01[3-9]\d{8}$/.test(formData.phone)) {
            errors.phone = "Please enter a valid 11-digit BD phone number";
        }
        if (formData.nidNumber && !/^\d{10}$|^\d{17}$/.test(formData.nidNumber)) {
            errors.nidNumber = "NID must be 10 or 17 digits only";
        }
        if (!formData.examDate) errors.examDate = "Exam date is required";
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setToast({ message: "Please fix the highlighted errors", type: "error" });
            return;
        }

        setLoading(true);

        try {
            const studentData = {
                ...formData,
                examDate: new Date(formData.examDate).toISOString(),
                // Speaking exam schedule
                speakingExamDate: formData.speakingExamDate
                    ? new Date(formData.speakingExamDate).toISOString()
                    : undefined,
                speakingExamTime: formData.speakingExamTime || undefined,
                speakingMeetingLink: formData.speakingMeetingLink || undefined,
                // Send Full Sets
                fullSets: fullSets
                    .filter(fs => fs.listeningSetNumber || fs.readingSetNumber || fs.writingSetNumber)
                    .map((fs, idx) => ({
                        label: `Full Set ${idx + 1}`,
                        listeningSetNumber: fs.listeningSetNumber ? Number(fs.listeningSetNumber) : undefined,
                        readingSetNumber: fs.readingSetNumber ? Number(fs.readingSetNumber) : undefined,
                        writingSetNumber: fs.writingSetNumber ? Number(fs.writingSetNumber) : undefined,
                    })),
                extraSets: extraSets
                    .filter(es => es.module && es.setNumber)
                    .map(es => ({ module: es.module, setNumber: Number(es.setNumber) })),
                // Legacy compatibility: first full set values
                listeningSetNumber: fullSets[0]?.listeningSetNumber ? Number(fullSets[0].listeningSetNumber) : undefined,
                readingSetNumber: fullSets[0]?.readingSetNumber ? Number(fullSets[0].readingSetNumber) : undefined,
                writingSetNumber: fullSets[0]?.writingSetNumber ? Number(fullSets[0].writingSetNumber) : undefined,
            };

            // Remove empty fields
            Object.keys(studentData).forEach(key => {
                if (studentData[key] === "" || studentData[key] === undefined) {
                    delete studentData[key];
                }
            });

            const response = await studentsAPI.create(studentData);

            if (response.success && response.data) {
                setToast({ message: "Student registered successfully!", type: "success" });
                setTimeout(() => { router.push("/dashboard/admin/students"); }, 2000);
            }
        } catch (err) {
            let errorData = err.message || "Failed to register student";
            try {
                if (typeof errorData === "string" && errorData.startsWith("[")) {
                    errorData = JSON.parse(errorData);
                }
            } catch (e) { }

            const { fieldErrors: parsedFieldErrors, generalMessage } = parseApiError(errorData);
            if (Object.keys(parsedFieldErrors).length > 0) setFieldErrors(parsedFieldErrors);
            setToast({ message: generalMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getInputClass = (fieldName) => {
        const baseClass = "w-full border rounded-lg px-4 py-2.5 focus:outline-none transition-colors";
        if (fieldErrors[fieldName]) return `${baseClass} border-red-400 bg-red-50 focus:border-red-500`;
        return `${baseClass} border-gray-200 focus:border-cyan-500`;
    };

    // Success Screen
    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheck className="text-green-600 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Registered Successfully!</h2>
                    <p className="text-gray-500 mb-6">
                        Share the following credentials with the student for exam access.
                    </p>

                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border border-cyan-200 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Login Credentials</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Exam ID", value: success.credentials.examId, field: "examId", mono: true },
                                { label: "Email (Username)", value: success.credentials.email, field: "email" },
                                { label: "Password", value: success.credentials.password, field: "password", mono: true },
                            ].map(({ label, value, field, mono }) => (
                                <div key={field} className="flex items-center justify-between bg-white rounded-lg p-3 border border-cyan-100">
                                    <div className="text-left">
                                        <p className="text-xs text-gray-500">{label}</p>
                                        <p className={`font-medium ${mono ? 'font-mono' : ''} ${field === 'examId' ? 'text-cyan-600 text-lg font-bold' : 'text-gray-800'}`}>{value}</p>
                                    </div>
                                    <button onClick={() => copyToClipboard(value, field)} className="p-2 hover:bg-cyan-50 rounded-lg text-gray-400 hover:text-cyan-600 cursor-pointer">
                                        {copiedField === field ? <FaCheck className="text-green-500" /> : <FaCopy />}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">* Password is automatically generated from phone number</p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setSuccess(null);
                                setFormData({
                                    nameEnglish: "", nameBengali: "", email: "", phone: "", nidNumber: "",
                                    examDate: "", paymentStatus: "paid", paymentAmount: 5000, paymentMethod: "cash", paymentReference: "",
                                });
                                setListeningSelectedSets([]);
                                setReadingSelectedSets([]);
                                setWritingSelectedSets([]);
                                setSpeakingSelectedSets([]);
                            }}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >Register Another</button>
                        <Link href="/dashboard/admin/students" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700">
                            View All Students
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
            `}</style>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Register New Student</h1>
                    <p className="text-gray-500">Create a new student account with exam ID</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUserGraduate className="text-cyan-600" /> Personal Information
                    </h3>

                    <div className="mb-5 bg-cyan-50 border border-cyan-100 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Test Type *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="testType" value="academic" checked={formData.testType === "academic"} onChange={handleInputChange} className="w-4 h-4 text-cyan-600 focus:ring-cyan-500" />
                                <span className="text-sm font-medium text-gray-800">Academic</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="testType" value="general-training" checked={formData.testType === "general-training"} onChange={handleInputChange} className="w-4 h-4 text-cyan-600 focus:ring-cyan-500" />
                                <span className="text-sm font-medium text-gray-800">General Training (GT)</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (English) *</label>
                            <input type="text" name="nameEnglish" value={formData.nameEnglish} onChange={handleInputChange}
                                className={getInputClass("nameEnglish")} placeholder="e.g., Mohammad Rahman" />
                            <FieldError error={fieldErrors.nameEnglish} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Bengali)</label>
                            <input type="text" name="nameBengali" value={formData.nameBengali} onChange={handleInputChange}
                                className={getInputClass("nameBengali")} placeholder="e.g., মোহাম্মদ রহমান" />
                            <FieldError error={fieldErrors.nameBengali} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaEnvelope className="inline mr-1 text-gray-400" /> Email Address *
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                                className={getInputClass("email")} placeholder="student@email.com" />
                            <FieldError error={fieldErrors.email} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="inline mr-1 text-gray-400" /> Phone Number *
                            </label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                className={getInputClass("phone")} placeholder="01712345678" />
                            <FieldError error={fieldErrors.phone} />
                            <p className="text-xs text-gray-500 mt-1">This will be used as the student's password</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaIdCard className="inline mr-1 text-gray-400" /> NID / Voter ID Number (Optional)
                            </label>
                            <input type="text" name="nidNumber" value={formData.nidNumber} onChange={handleInputChange}
                                className={getInputClass("nidNumber")} placeholder="10 or 17 number (optional)" />
                            <FieldError error={fieldErrors.nidNumber} />
                        </div>
                    </div>
                </div>

                {/* Exam Date */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaCalendar className="text-cyan-600" /> Exam Schedule
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
                        <input type="date" name="examDate" value={formData.examDate} onChange={handleInputChange}
                            min={new Date().toISOString().split("T")[0]} className={getInputClass("examDate")} />
                        <FieldError error={fieldErrors.examDate} />
                    </div>
                </div>

                {/* Speaking Exam Schedule */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <FaVideo className="text-purple-500" /> Speaking Exam Schedule
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Optional — শুধু Speaking Exam থাকলে পূরণ করুন</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaCalendar className="inline mr-1 text-gray-400" /> Speaking Exam Date
                            </label>
                            <input
                                type="date"
                                name="speakingExamDate"
                                value={formData.speakingExamDate}
                                onChange={handleInputChange}
                                className={getInputClass("speakingExamDate")}
                            />
                            <FieldError error={fieldErrors.speakingExamDate} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaClock className="inline mr-1 text-gray-400" /> Speaking Exam Time
                            </label>
                            <input
                                type="time"
                                name="speakingExamTime"
                                value={formData.speakingExamTime}
                                onChange={handleInputChange}
                                className={getInputClass("speakingExamTime")}
                            />
                            <FieldError error={fieldErrors.speakingExamTime} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaLink className="inline mr-1 text-gray-400" /> Meeting Link (Zoom / Meet)
                            </label>
                            <input
                                type="url"
                                name="speakingMeetingLink"
                                value={formData.speakingMeetingLink}
                                onChange={handleInputChange}
                                className={getInputClass("speakingMeetingLink")}
                                placeholder="https://zoom.us/j/..."
                            />
                            <FieldError error={fieldErrors.speakingMeetingLink} />
                        </div>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaMoneyBillWave className="text-cyan-600" /> Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
                            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className={getInputClass("paymentStatus")}>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (BDT) *</label>
                            <input type="number" name="paymentAmount" value={formData.paymentAmount} onChange={handleInputChange}
                                min={0} className={getInputClass("paymentAmount")} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={getInputClass("paymentMethod")}>
                                <option value="cash">Cash</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference / TrxID</label>
                            <input type="text" name="paymentReference" value={formData.paymentReference} onChange={handleInputChange}
                                className={getInputClass("paymentReference")} placeholder="Transaction ID or reference" />
                        </div>
                    </div>
                </div>

                {/* ═══ Full Set Assignment UI ═══ */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-1">Assign Exam Sets</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        Full Set = Listening + Reading + Writing একসাথে। একাধিক Full Set add করতে পারবেন।
                    </p>

                    {/* Full Sets */}
                    <div className="space-y-4 mb-6">
                        {fullSets.map((fs, idx) => (
                            <div key={idx} className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-indigo-700">Full Set {idx + 1}</h4>
                                    {fullSets.length > 1 && (
                                        <button type="button" onClick={() => setFullSets(fullSets.filter((_, i) => i !== idx))}
                                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer">
                                            <FaTrash className="text-xs" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">🎧 Listening</label>
                                        <select
                                            value={fs.listeningSetNumber}
                                            onChange={(e) => {
                                                const updated = [...fullSets];
                                                updated[idx] = { ...updated[idx], listeningSetNumber: e.target.value };
                                                setFullSets(updated);
                                            }}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select...</option>
                                            {listeningSets.filter(s => !s.testType || s.testType === formData.testType).map(s => (
                                                <option key={s._id} value={s.testNumber}>#{s.testNumber} - {s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">📖 Reading</label>
                                        <select
                                            value={fs.readingSetNumber}
                                            onChange={(e) => {
                                                const updated = [...fullSets];
                                                updated[idx] = { ...updated[idx], readingSetNumber: e.target.value };
                                                setFullSets(updated);
                                            }}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select...</option>
                                            {readingSets.filter(s => !s.testType || s.testType === formData.testType).map(s => (
                                                <option key={s._id} value={s.testNumber}>#{s.testNumber} - {s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">✍️ Writing</label>
                                        <select
                                            value={fs.writingSetNumber}
                                            onChange={(e) => {
                                                const updated = [...fullSets];
                                                updated[idx] = { ...updated[idx], writingSetNumber: e.target.value };
                                                setFullSets(updated);
                                            }}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select...</option>
                                            {writingSets.filter(s => !s.testType || s.testType === formData.testType).map(s => (
                                                <option key={s._id} value={s.testNumber}>#{s.testNumber} - {s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => setFullSets([...fullSets, { listeningSetNumber: '', readingSetNumber: '', writingSetNumber: '' }])}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-indigo-600 bg-indigo-50 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                        >
                            <FaPlus className="text-xs" /> Add Full Set
                        </button>
                    </div>

                    {/* Extra Individual Parts */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Extra Individual Parts <span className="font-normal text-gray-400">(optional)</span></h4>
                        {extraSets.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {extraSets.map((es, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <select
                                            value={es.module}
                                            onChange={(e) => {
                                                const updated = [...extraSets];
                                                updated[idx] = { ...updated[idx], module: e.target.value, setNumber: '' };
                                                setExtraSets(updated);
                                            }}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Module...</option>
                                            <option value="listening">🎧 Listening</option>
                                            <option value="reading">📖 Reading</option>
                                            <option value="writing">✍️ Writing</option>
                                        </select>
                                        <select
                                            value={es.setNumber}
                                            onChange={(e) => {
                                                const updated = [...extraSets];
                                                updated[idx] = { ...updated[idx], setNumber: e.target.value };
                                                setExtraSets(updated);
                                            }}
                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select set...</option>
                                            {(es.module === 'listening' ? listeningSets : es.module === 'reading' ? readingSets : es.module === 'writing' ? writingSets : speakingSets).filter(s => !s.testType || s.testType === formData.testType).map(s => (
                                                <option key={s._id} value={s.testNumber}>#{s.testNumber} - {s.title}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => setExtraSets(extraSets.filter((_, i) => i !== idx))}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setExtraSets([...extraSets, { module: '', setNumber: '' }])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                            <FaPlus className="text-[9px]" /> Add Extra Part
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/admin/students" className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        {loading && <FaSpinner className="animate-spin" />}
                        Register Student
                    </button>
                </div>
            </form>
        </div>
    );
}
