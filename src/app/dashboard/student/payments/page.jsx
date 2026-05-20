"use client";

import React, { useState, useEffect } from "react";
import {
    FaCreditCard,
    FaCheckCircle,
    FaClock,
    FaExclamationCircle,
    FaReceipt,
    FaCalendarAlt,
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

export default function StudentPayments() {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await studentsAPI.getMyProfile();
                if (response.success) {
                    setStudentData(response.data);
                }
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const { paymentStatus, examId, paymentAmount, paymentDate } = studentData || {};

    const isPaid = paymentStatus === "paid";

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">Payments</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your exam payment</p>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white border border-gray-200 rounded-md p-6 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${isPaid ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                            }`}>
                            {isPaid ? <FaCheckCircle size={20} /> : <FaClock size={20} />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Payment Status</p>
                            <p className={`font-semibold ${isPaid ? "text-green-600" : "text-amber-600"}`}>
                                {isPaid ? "Paid" : "Pending"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="text-xl font-bold text-gray-800">৳{paymentAmount || "5,000"}</p>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border border-gray-200 rounded-md p-5">
                <h3 className="font-medium text-gray-800 mb-4">Payment Details</h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <FaReceipt size={12} /> Exam ID
                        </span>
                        <span className="text-gray-800 font-medium text-sm">{examId}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <FaCreditCard size={12} /> Payment Method
                        </span>
                        <span className="text-gray-800 font-medium text-sm">Bank Transfer / bKash</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <FaCalendarAlt size={12} /> Payment Date
                        </span>
                        <span className="text-gray-800 font-medium text-sm">
                            {paymentDate ? new Date(paymentDate).toLocaleDateString() : "Not paid yet"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Instructions */}
            {!isPaid && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-5">
                    <div className="flex items-start gap-3">
                        <FaExclamationCircle className="text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-800 mb-2">Payment Required</h4>
                            <p className="text-amber-700 text-sm mb-3">
                                Please complete your payment to access the exam modules.
                            </p>
                            <div className="bg-white rounded-md p-3 border border-amber-200">
                                <p className="text-sm text-gray-700 mb-1"><strong>bKash:</strong> 01XXXXXXXXX</p>
                                <p className="text-sm text-gray-700"><strong>Reference:</strong> {examId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPaid && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
                    <FaCheckCircle className="text-green-600" />
                    <p className="text-green-700 text-sm">
                        Payment completed. You have full access to all exam modules.
                    </p>
                </div>
            )}
        </div>
    );
}
