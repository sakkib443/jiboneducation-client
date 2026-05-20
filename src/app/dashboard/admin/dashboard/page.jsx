"use client";

import React, { useEffect, useState } from "react";
import {
    FaUsers,
    FaCheckCircle,
    FaClock,
    FaGraduationCap,
    FaArrowRight,
    FaChartLine
} from "react-icons/fa";
import { statsAPI } from "@/lib/api";
import Link from "next/link";

const DashboardCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white`}>
                {icon}
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
        </div>
    </div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        examStatus: { completed: 0, inProgress: 0, notStarted: 0, terminated: 0 },
        averageScores: { avgOverall: 0, avgListening: 0, avgReading: 0, avgWriting: 0 },
        todayExams: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await statsAPI.getOverview();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: "Total Students", value: stats.totalStudents || 0, icon: <FaUsers className="text-xl" />, color: "bg-blue-600" },
        { title: "Exams Completed", value: stats.examStatus?.completed || 0, icon: <FaCheckCircle className="text-xl" />, color: "bg-green-600" },
        { title: "In Progress", value: stats.examStatus?.inProgress || 0, icon: <FaClock className="text-xl" />, color: "bg-orange-500" },
        { title: "Avg Band Score", value: Number(stats?.averageScores?.avgOverall || 0).toFixed(1), icon: <FaGraduationCap className="text-xl" />, color: "bg-purple-600" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of system performance.</p>
                </div>
                <Link
                    href="/dashboard/admin/results"
                    className="bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                    View All Results <FaArrowRight />
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <DashboardCard key={index} {...card} />
                ))}
            </div>

            {/* Detailed Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Summary */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Performance Summary</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalStudents}</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase">Total Students</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.examStatus?.completed}</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase">Completed Exams</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.examStatus?.notStarted}</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase">Pending Start</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Exam Completion Status</h3>
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100">
                            <div
                                className="bg-green-500 h-full"
                                style={{ width: `${(stats.examStatus?.completed / stats.totalStudents * 100) || 0}%` }}
                                title="Completed"
                            ></div>
                            <div
                                className="bg-orange-500 h-full"
                                style={{ width: `${(stats.examStatus?.inProgress / stats.totalStudents * 100) || 0}%` }}
                                title="In Progress"
                            ></div>
                            <div
                                className="bg-gray-300 h-full"
                                style={{ width: `${(stats.examStatus?.notStarted / stats.totalStudents * 100) || 0}%` }}
                                title="Not Started"
                            ></div>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span> Completed
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-500"></span> In Progress
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span> Not Started
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown (Replaces Gauge) */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Average Scores</h2>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600">Overall Band</span>
                                <span className="text-sm font-bold text-gray-800">{Number(stats?.averageScores?.avgOverall || 0).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.averageScores?.avgOverall / 9) * 100}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600">Listening</span>
                                <span className="text-sm font-bold text-gray-800">{Number(stats?.averageScores?.avgListening || 0).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${(stats.averageScores?.avgListening / 9) * 100}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600">Reading</span>
                                <span className="text-sm font-bold text-gray-800">{Number(stats?.averageScores?.avgReading || 0).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(stats.averageScores?.avgReading / 9) * 100}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600">Writing</span>
                                <span className="text-sm font-bold text-gray-800">{Number(stats?.averageScores?.avgWriting || 0).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(stats.averageScores?.avgWriting / 9) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
