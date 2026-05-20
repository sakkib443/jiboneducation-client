"use client";

import React, { useEffect, useState, Suspense } from "react";
import {
    FaSearch,
    FaFilter,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaEye,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";
import Link from "next/link";

function ResultsContent() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await studentsAPI.getAllResults({ page, limit: 12, searchTerm });
                if (response.success && response.data) {
                    setResults(Array.isArray(response.data.results) ? response.data.results : []);
                    setTotalPages(response.data.pagination?.totalPages || 1);
                }
            } catch (error) {
                console.error("Failed to fetch results:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    return (
        <div className="min-h-screen bg-sky-50 p-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Exam Results</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and review student performance.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-blue-100 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 text-sm bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Content Table/Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-3xl text-blue-400" />
                </div>
            ) : results.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center border border-blue-100 shadow-sm">
                    <p className="text-slate-500">No results found.</p>
                </div>
            ) : (
                <div className="bg-white border border-blue-100 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Exam ID / Roll</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">L</th>
                                    <th className="px-6 py-4 text-center">R</th>
                                    <th className="px-6 py-4 text-center">W</th>
                                    <th className="px-6 py-4 text-center">S</th>
                                    <th className="px-6 py-4 text-center">Overall</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.map((result) => (
                                    <tr key={result._id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {result.nameEnglish}
                                            <div className="text-xs text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                                <FaCalendarAlt className="text-[10px]" />
                                                {result.examCompletedAt ? new Date(result.examCompletedAt).toLocaleDateString() : 'Active'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {result.rollNumber || result.examId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${result.examStatus === 'completed'
                                                ? 'bg-emerald-100/60 text-emerald-700'
                                                : 'bg-amber-100/60 text-amber-700'
                                                }`}>
                                                {result.examStatus === 'completed' ? <FaCheckCircle className="text-[10px]" /> : <FaSpinner className="text-[10px]" />}
                                                <span className="capitalize">{result.examStatus}</span>
                                            </span>
                                        </td>

                                        {['Listening', 'Reading', 'Writing', 'Speaking'].map((mod) => {
                                            const score = result.scores?.[mod.toLowerCase()]?.band ||
                                                result.scores?.[mod.toLowerCase()]?.overallBand || 0;
                                            return (
                                                <td key={mod} className="px-6 py-4 text-center font-medium bg-slate-50/30">
                                                    {score || "-"}
                                                </td>
                                            );
                                        })}

                                        <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/20">
                                            {result.scores?.overall || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/admin/students/${result._id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Simple Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm transition-colors"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="text-sm text-slate-600 px-2 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm transition-colors"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-sky-50 flex items-center justify-center">
                <FaSpinner className="animate-spin text-2xl text-blue-400" />
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
