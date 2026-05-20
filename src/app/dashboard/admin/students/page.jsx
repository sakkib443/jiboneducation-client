"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    FaPlus,
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaRedo,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaDownload,
    FaCopy,
    FaCheck,
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

export default function StudentsListPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        examStatus: "",
        paymentStatus: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, student: null });
    const [resetModal, setResetModal] = useState({ show: false, student: null });
    const [copiedId, setCopiedId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkModal, setBulkModal] = useState({ show: false, action: null });

    // Bulk selection helpers
    const isAllSelected = students.length > 0 && selectedIds.length === students.length;
    const isSomeSelected = selectedIds.length > 0;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s._id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkReset = async () => {
        try {
            setActionLoading(true);
            const selected = students.filter(s => selectedIds.includes(s._id));
            for (const student of selected) {
                if (student.examId) {
                    await studentsAPI.resetExam(student.examId);
                }
            }
            setBulkModal({ show: false, action: null });
            setSelectedIds([]);
            fetchStudents();
        } catch (error) {
            alert("Failed to reset some exams: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        try {
            setActionLoading(true);
            for (const id of selectedIds) {
                await studentsAPI.delete(id);
            }
            setBulkModal({ show: false, action: null });
            setSelectedIds([]);
            fetchStudents();
        } catch (error) {
            alert("Failed to delete some students: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [pagination.page, filters]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(searchTerm && { searchTerm }),
                ...(filters.examStatus && { examStatus: filters.examStatus }),
                ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
            };

            const response = await studentsAPI.getAll(params);

            if (response.success && response.data) {
                setStudents(response.data.students);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStudents();
    };

    const handleDelete = async () => {
        if (!deleteModal.student) return;

        try {
            setActionLoading(true);
            await studentsAPI.delete(deleteModal.student._id);
            setDeleteModal({ show: false, student: null });
            fetchStudents();
        } catch (error) {
            alert("Failed to delete student: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetExam = async () => {
        if (!resetModal.student) return;

        try {
            setActionLoading(true);
            await studentsAPI.resetExam(resetModal.student.examId);
            setResetModal({ show: false, student: null });
            fetchStudents();
        } catch (error) {
            alert("Failed to reset exam: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const copyExamId = (examId) => {
        navigator.clipboard.writeText(examId);
        setCopiedId(examId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const statusColors = {
        "not-started": "bg-gray-100 text-gray-600",
        "in-progress": "bg-yellow-100 text-yellow-700",
        "completed": "bg-green-100 text-green-700",
        "terminated": "bg-red-100 text-red-700",
        "expired": "bg-purple-100 text-purple-700",
    };

    const paymentColors = {
        pending: "bg-orange-100 text-orange-700",
        paid: "bg-green-100 text-green-700",
        refunded: "bg-gray-100 text-gray-600",
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                    <p className="text-gray-500 mt-1">Manage registered students and exam IDs</p>
                </div>
                <Link
                    href="/dashboard/admin/students/create"
                    className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-cyan-600 hover:to-teal-700 transition-all flex items-center gap-2 w-fit"
                >
                    <FaPlus />
                    Register New Student
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or exam ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </form>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${showFilters ? "bg-cyan-50 border-cyan-500 text-cyan-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <FaFilter />
                        Filters
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Status</label>
                            <select
                                value={filters.examStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, examStatus: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Status</option>
                                <option value="not-started">Not Started</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select
                                value={filters.paymentStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ examStatus: "", paymentStatus: "" });
                                    setSearchTerm("");
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <FaSpinner className="animate-spin text-3xl text-cyan-500 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading students...</p>
                                    </td>
                                </tr>
                            ) : students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(student._id) ? 'bg-cyan-50' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input type="checkbox" checked={selectedIds.includes(student._id)} onChange={() => toggleSelect(student._id)} className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-semibold text-sm">
                                                        {student.nameEnglish?.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{student.nameEnglish}</p>
                                                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-cyan-600">
                                                    {student.examId}
                                                </code>
                                                <button
                                                    onClick={() => copyExamId(student.examId)}
                                                    className="text-gray-400 hover:text-cyan-600 p-1"
                                                    title="Copy Exam ID"
                                                >
                                                    {copiedId === student.examId ? (
                                                        <FaCheck className="text-green-500" />
                                                    ) : (
                                                        <FaCopy />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {student.phone}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColors[student.paymentStatus]}`}>
                                                {student.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[student.examStatus]}`}>
                                                {student.examStatus?.replace("-", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {student.examStatus === "completed" && student.scores?.overall ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                        {student.scores.overall.toFixed(1)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {new Date(student.examDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/dashboard/admin/students/${student._id}`}
                                                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/admin/students/${student._id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                {(student.examStatus === "completed" || student.examStatus === "terminated" || student.examStatus === "in-progress") && (
                                                    <button
                                                        onClick={() => setResetModal({ show: true, student })}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Reset Exam"
                                                    >
                                                        <FaRedo />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, student })}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 text-5xl mb-4">👥</div>
                                        <p className="text-gray-500">No students found</p>
                                        <Link
                                            href="/dashboard/admin/students/create"
                                            className="text-cyan-600 hover:underline mt-2 inline-block"
                                        >
                                            Register your first student
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                            {pagination.total} students
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <FaChevronLeft className="text-sm" />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <FaChevronRight className="text-sm" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {isSomeSelected && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-slide-up">
                    <span className="text-sm font-medium">{selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected</span>
                    <div className="w-px h-6 bg-gray-600"></div>
                    <button onClick={() => setBulkModal({ show: true, action: 'reset' })} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
                        <FaRedo className="text-xs" /> Reset Exam
                    </button>
                    <button onClick={() => setBulkModal({ show: true, action: 'delete' })} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                        <FaTrash className="text-xs" /> Delete
                    </button>
                    <button onClick={() => setSelectedIds([])} className="ml-2 text-gray-400 hover:text-white text-sm">✕</button>
                    <style>{`@keyframes slide-up { from { transform: translateX(-50%) translateY(100px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } } .animate-slide-up { animation: slide-up 0.3s ease-out; }`}</style>
                </div>
            )}

            {/* Bulk Action Modal */}
            {bulkModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {bulkModal.action === 'delete' ? 'Delete Students' : 'Reset Exams'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {bulkModal.action === 'delete'
                                ? `Are you sure you want to delete ${selectedIds.length} student(s)? This cannot be undone.`
                                : `Are you sure you want to reset exams for ${selectedIds.length} student(s)? They will be able to take exams again.`
                            }
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setBulkModal({ show: false, action: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button
                                onClick={bulkModal.action === 'delete' ? handleBulkDelete : handleBulkReset}
                                disabled={actionLoading}
                                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${bulkModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {actionLoading && <FaSpinner className="animate-spin" />}
                                {bulkModal.action === 'delete' ? `Delete ${selectedIds.length}` : `Reset ${selectedIds.length}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Student</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{deleteModal.student?.nameEnglish}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, student: null })}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading && <FaSpinner className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Exam Modal */}
            {resetModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Exam</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to reset the exam for <strong>{resetModal.student?.nameEnglish}</strong>?
                            This will allow them to take the exam again.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setResetModal({ show: false, student: null })}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetExam}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading && <FaSpinner className="animate-spin" />}
                                Reset Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
