"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    FaArrowLeft,
    FaSpinner,
    FaSave,
    FaUserGraduate,
    FaEnvelope,
    FaPhone,
    FaCalendar,
    FaMoneyBillWave,
    FaHeadphones,
    FaBook,
    FaPen,
    FaMicrophone,
    FaPlus,
    FaTrash,
} from "react-icons/fa";
import { studentsAPI, listeningAPI, readingAPI, writingAPI, speakingAPI } from "@/lib/api";

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
        const available = sets.filter(s => !selectedSets.includes(s.testNumber));
        if (available.length > 0) onChange([...selectedSets, available[0].testNumber]);
    };

    const removeSet = (idx) => onChange(selectedSets.filter((_, i) => i !== idx));

    const updateSet = (idx, value) => {
        const updated = [...selectedSets];
        updated[idx] = Number(value);
        onChange(updated);
    };

    return (
        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {icon} {label}
                <span className="text-xs text-gray-400 font-normal ml-1">(optional - multiple sets)</span>
            </label>
            {selectedSets.length === 0 ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 italic">No sets assigned</span>
                    <button type="button" onClick={addSet} disabled={sets.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaPlus className="text-[9px]" /> Add Set
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {selectedSets.map((setNum, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${c}`}>{idx + 1}</span>
                            <select value={setNum} onChange={(e) => updateSet(idx, e.target.value)}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
                                <option value="">Select a set...</option>
                                {sets.map(set => (
                                    <option key={set._id} value={set.testNumber} disabled={selectedSets.includes(set.testNumber) && set.testNumber !== setNum}>
                                        Test #{set.testNumber} - {set.title}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={() => removeSet(idx)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                                <FaTrash className="text-xs" />
                            </button>
                        </div>
                    ))}
                    {selectedSets.length < sets.length && (
                        <button type="button" onClick={addSet}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 cursor-pointer border border-dashed border-cyan-200">
                            <FaPlus className="text-[9px]" /> Add Another Set
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Question set options
    const [listeningSets, setListeningSets] = useState([]);
    const [readingSets, setReadingSets] = useState([]);
    const [writingSets, setWritingSets] = useState([]);
    const [speakingSets, setSpeakingSets] = useState([]);

    // Form data (basic fields)
    const [formData, setFormData] = useState({
        nameEnglish: "", nameBengali: "", phone: "", nidNumber: "",
        examDate: "", paymentStatus: "pending", paymentAmount: 0,
        paymentMethod: "cash", paymentReference: "",
        isActive: true, canRetake: false,
    });

    // Multi-set selections
    const [listeningSelectedSets, setListeningSelectedSets] = useState([]);
    const [readingSelectedSets, setReadingSelectedSets] = useState([]);
    const [writingSelectedSets, setWritingSelectedSets] = useState([]);
    const [speakingSelectedSets, setSpeakingSelectedSets] = useState([]);

    useEffect(() => {
        if (params.id) { fetchStudent(); fetchQuestionSets(); }
    }, [params.id]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const response = await studentsAPI.getById(params.id);
            if (response.success && response.data) {
                const student = response.data;
                setFormData({
                    nameEnglish: student.nameEnglish || "",
                    nameBengali: student.nameBengali || "",
                    phone: student.phone || "",
                    nidNumber: student.nidNumber || "",
                    examDate: student.examDate ? new Date(student.examDate).toISOString().split("T")[0] : "",
                    paymentStatus: student.paymentStatus || "pending",
                    paymentAmount: student.paymentAmount || 0,
                    paymentMethod: student.paymentMethod || "cash",
                    paymentReference: student.paymentReference || "",
                    isActive: student.isActive !== false,
                    canRetake: student.canRetake || false,
                });

                // Load multi-set arrays (fall back to single set)
                const sets = student.assignedSets || {};
                setListeningSelectedSets(sets.listeningSetNumbers?.length ? sets.listeningSetNumbers : (sets.listeningSetNumber ? [sets.listeningSetNumber] : []));
                setReadingSelectedSets(sets.readingSetNumbers?.length ? sets.readingSetNumbers : (sets.readingSetNumber ? [sets.readingSetNumber] : []));
                setWritingSelectedSets(sets.writingSetNumbers?.length ? sets.writingSetNumbers : (sets.writingSetNumber ? [sets.writingSetNumber] : []));
                setSpeakingSelectedSets(sets.speakingSetNumbers?.length ? sets.speakingSetNumbers : (sets.speakingSetNumber ? [sets.speakingSetNumber] : []));
            }
        } catch (error) {
            console.error("Failed to fetch student:", error);
            setError("Failed to load student data");
        } finally { setLoading(false); }
    };

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
        } catch (error) { console.error("Failed to fetch question sets:", error); }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            // Build fullSets from the multi-set selections
            // We group L+R+W into one full set (matching the first of each)
            const maxLen = Math.max(
                listeningSelectedSets.length,
                readingSelectedSets.length,
                writingSelectedSets.length
            );
            const fullSets = [];
            for (let i = 0; i < maxLen; i++) {
                const fs = { label: `Full Set ${i + 1}` };
                if (listeningSelectedSets[i]) fs.listeningSetNumber = listeningSelectedSets[i];
                if (readingSelectedSets[i]) fs.readingSetNumber = readingSelectedSets[i];
                if (writingSelectedSets[i]) fs.writingSetNumber = writingSelectedSets[i];
                fullSets.push(fs);
            }

            const updateData = {
                nameEnglish: formData.nameEnglish,
                nameBengali: formData.nameBengali || undefined,
                phone: formData.phone,
                nidNumber: formData.nidNumber || undefined,
                examDate: new Date(formData.examDate).toISOString(),
                paymentStatus: formData.paymentStatus,
                paymentAmount: formData.paymentAmount,
                paymentMethod: formData.paymentMethod,
                paymentReference: formData.paymentReference || undefined,
                // Send fullSets so server updates assignedSets.fullSets + legacy fields
                fullSets: fullSets.length > 0 ? fullSets : [],
                extraSets: [],
                // Also send legacy fields as fallback
                listeningSetNumber: listeningSelectedSets[0] || undefined,
                readingSetNumber: readingSelectedSets[0] || undefined,
                writingSetNumber: writingSelectedSets[0] || undefined,
                speakingSetNumber: speakingSelectedSets[0] || undefined,
                listeningSetNumbers: listeningSelectedSets.length > 0 ? listeningSelectedSets : undefined,
                readingSetNumbers: readingSelectedSets.length > 0 ? readingSelectedSets : undefined,
                writingSetNumbers: writingSelectedSets.length > 0 ? writingSelectedSets : undefined,
                speakingSetNumbers: speakingSelectedSets.length > 0 ? speakingSelectedSets : undefined,
                isActive: formData.isActive,
                canRetake: formData.canRetake,
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) delete updateData[key];
            });

            const response = await studentsAPI.update(params.id, updateData);
            if (response.success) router.push("/dashboard/admin/students");
        } catch (err) {
            setError(err.message || "Failed to update student");
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FaSpinner className="animate-spin text-4xl text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/dashboard/admin/students/${params.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
                    <p className="text-gray-500">Update student information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUserGraduate className="text-cyan-600" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (English) *</label>
                            <input type="text" name="nameEnglish" value={formData.nameEnglish} onChange={handleInputChange} required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Bengali)</label>
                            <input type="text" name="nameBengali" value={formData.nameBengali} onChange={handleInputChange}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="inline mr-1 text-gray-400" /> Phone Number *
                            </label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NID / Voter ID Number (Optional)</label>
                            <input type="text" name="nidNumber" value={formData.nidNumber} onChange={handleInputChange}
                                placeholder="10 or 17 number (optional)"
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaCalendar className="inline mr-1 text-gray-400" /> Exam Date *
                            </label>
                            <input type="date" name="examDate" value={formData.examDate} onChange={handleInputChange} required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
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
                            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500">
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (BDT) *</label>
                            <input type="number" name="paymentAmount" value={formData.paymentAmount} onChange={handleInputChange} required min={0}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} required
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500">
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
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
                        </div>
                    </div>
                </div>

                {/* ═══ Question Sets — Multi-Set ═══ */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-1">Assigned Question Sets</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        একাধিক set assign করতে পারবেন — student প্রতিটি set আলাদাভাবে attempt করতে পারবে।
                    </p>
                    <div className="grid grid-cols-1 gap-5">
                        <MultiSetSelector label="Listening Sets" icon={<FaHeadphones className="inline mr-1 text-purple-500" />}
                            sets={listeningSets} selectedSets={listeningSelectedSets} onChange={setListeningSelectedSets} color="purple" />
                        <MultiSetSelector label="Reading Sets" icon={<FaBook className="inline mr-1 text-blue-500" />}
                            sets={readingSets} selectedSets={readingSelectedSets} onChange={setReadingSelectedSets} color="blue" />
                        <MultiSetSelector label="Writing Sets" icon={<FaPen className="inline mr-1 text-green-500" />}
                            sets={writingSets} selectedSets={writingSelectedSets} onChange={setWritingSelectedSets} color="green" />
                        <MultiSetSelector label="Speaking Sets" icon={<FaMicrophone className="inline mr-1 text-orange-500" />}
                            sets={speakingSets} selectedSets={speakingSelectedSets} onChange={setSpeakingSelectedSets} color="orange" />
                    </div>
                </div>

                {/* Status Options */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Status Options</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                            <div>
                                <p className="font-medium text-gray-800">Account Active</p>
                                <p className="text-sm text-gray-500">Allow student to access exam</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="canRetake" checked={formData.canRetake} onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                            <div>
                                <p className="font-medium text-gray-800">Allow Retake</p>
                                <p className="text-sm text-gray-500">Allow student to retake the exam</p>
                            </div>
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">{error}</div>
                )}

                <div className="flex justify-end gap-4">
                    <Link href={`/dashboard/admin/students/${params.id}`}
                        className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</Link>
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
