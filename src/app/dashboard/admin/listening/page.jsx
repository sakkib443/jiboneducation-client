"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaHeadphones,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaToggleOn,
    FaToggleOff,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaExclamationTriangle,
    FaVolumeUp,
    FaUpload,
    FaEye,
} from "react-icons/fa";
import { listeningAPI } from "@/lib/api";

export default function ListeningListPage() {
    const router = useRouter();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("");
    const [testTypeFilter, setTestTypeFilter] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState("");

    const fetchTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            };
            if (searchTerm) params.searchTerm = searchTerm;
            if (difficultyFilter) params.difficulty = difficultyFilter;
            if (testTypeFilter) params.testType = testTypeFilter;
            if (sortBy) params.sort = sortBy;

            const response = await listeningAPI.getAll(params);
            if (response.success && response.data) {
                setTests(response.data.tests || response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination?.total || response.data.tests?.length || 0,
                    totalPages: response.data.pagination?.totalPages || 0,
                }));
            }
        } catch (err) {
            setError("Failed to fetch listening tests");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchTerm, difficultyFilter, testTypeFilter, sortBy]);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    const handleDelete = async (id) => {
        try {
            const response = await listeningAPI.delete(id);
            if (response.success) {
                setTests(prev => prev.filter(t => t._id !== id));
                setDeleteConfirm(null);
            }
        } catch (err) {
            setError("Failed to delete test");
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const response = await listeningAPI.toggleActive(id);
            if (response.success) {
                setTests(prev => prev.map(t =>
                    t._id === id ? { ...t, isActive: response.data?.isActive ?? !t.isActive } : t
                ));
            }
        } catch (err) {
            setError("Failed to toggle active status");
        }
    };

    const getDifficultyBadge = (difficulty) => {
        const colors = {
            easy: "bg-green-100 text-green-700",
            medium: "bg-amber-100 text-amber-700",
            hard: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[difficulty] || "bg-gray-100 text-gray-700"}`}>
                {difficulty || "—"}
            </span>
        );
    };

    const formatDuration = (seconds) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s > 0 ? `${s}s` : ""}`;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaHeadphones className="text-indigo-600" />
                        Listening Tests
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {pagination.total} test{pagination.total !== 1 ? "s" : ""} total
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/admin/listening/upload"
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <FaUpload size={12} /> Upload JSON
                    </Link>
                    <Link
                        href="/dashboard/admin/listening/create"
                        className="px-4 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-900 transition-colors"
                    >
                        <FaPlus size={12} /> Create Test
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-md border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}
                        placeholder="Search by title, ID, source..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md outline-none focus:border-indigo-500 text-sm"
                    />
                </div>
                <select
                    value={difficultyFilter}
                    onChange={(e) => {
                        setDifficultyFilter(e.target.value);
                        setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="px-3 py-2.5 border border-gray-200 rounded-md outline-none focus:border-indigo-500 text-sm"
                >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <select
                    value={testTypeFilter}
                    onChange={(e) => {
                        setTestTypeFilter(e.target.value);
                        setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="px-3 py-2.5 border border-gray-200 rounded-md outline-none focus:border-indigo-500 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="academic">Academic</option>
                    <option value="general-training">General Training</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => {
                        setSortBy(e.target.value);
                        setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="px-3 py-2.5 border border-gray-200 rounded-md outline-none focus:border-indigo-500 text-sm"
                >
                    <option value="">Sort By...</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError("")}><FaTimes /></button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                    </div>
                ) : tests.length === 0 ? (
                    <div className="text-center py-16">
                        <FaHeadphones className="text-5xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No Listening Tests Found</p>
                        <p className="text-gray-400 text-sm mb-6">Upload or create your first listening test to get started</p>
                        <div className="flex items-center justify-center gap-3">
                            <Link
                                href="/dashboard/admin/listening/upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                            >
                                <FaUpload size={12} /> Upload JSON
                            </Link>
                            <Link
                                href="/dashboard/admin/listening/create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md text-sm"
                            >
                                <FaPlus size={12} /> Create Test
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parts</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Questions</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Audio</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Difficulty</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tests.map((test) => (
                                        <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm text-gray-600">#{test.testNumber}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800 text-sm">{test.title}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{test.testId}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                                                {test.source || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${test.testType === "general-training" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                    {test.testType === "general-training" ? "GT" : "Academic"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {test.sections?.length || 4} parts
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <span className="font-medium">{test.totalQuestions || 40}</span> Qs
                                            </td>
                                            <td className="px-4 py-3">
                                                {test.mainAudioUrl ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                                        <FaVolumeUp size={9} />
                                                        {formatDuration(test.audioDuration)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">No audio</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getDifficultyBadge(test.difficulty)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(test._id)}
                                                    className={`text-xl transition-colors cursor-pointer ${test.isActive ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-gray-400"}`}
                                                    title={test.isActive ? "Active — Click to deactivate" : "Inactive — Click to activate"}
                                                >
                                                    {test.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <a
                                                        href={`/exam/admin-preview/listening?adminPreview=${test.testNumber}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-green-600 rounded-md transition-colors"
                                                        title="Preview Exam"
                                                    >
                                                        <FaEye size={13} />
                                                    </a>
                                                    <Link
                                                        href={`/dashboard/admin/listening/create?edit=${test._id}`}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit size={13} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteConfirm(test._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                                <span className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                        className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-6 w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <FaExclamationTriangle className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Delete Listening Test?</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 border rounded-md text-sm cursor-pointer hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded-md text-sm cursor-pointer hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
