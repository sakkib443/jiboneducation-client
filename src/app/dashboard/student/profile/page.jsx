"use client";

import React, { useState, useEffect } from "react";
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaIdCard,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaGraduationCap,
    FaEdit,
} from "react-icons/fa";
import { studentsAPI } from "@/lib/api";

export default function StudentProfile() {
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

    const {
        nameEnglish,
        nameBangla,
        email,
        phone,
        examId,
        nidNumber,
        fatherName,
        motherName,
        address,
        examDate,
        photo,
    } = studentData || {};

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">My Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Your account information</p>
            </div>

            {/* Profile Header */}
            <div className="bg-white border border-gray-200 rounded-md p-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-700 text-2xl font-bold overflow-hidden">
                        {photo ? (
                            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            nameEnglish?.charAt(0).toUpperCase() || "S"
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-800">{nameEnglish}</h2>
                        {nameBangla && <p className="text-gray-500 text-sm">{nameBangla}</p>}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-xs font-medium">
                                {examId}
                            </span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                IELTS Candidate
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white border border-gray-200 rounded-md p-5 mb-4">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FaUser size={12} className="text-gray-400" />
                    Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <InfoField icon={FaEnvelope} label="Email" value={email} />
                    <InfoField icon={FaPhone} label="Phone" value={phone} />
                    <InfoField icon={FaIdCard} label="NID Number" value={nidNumber} />
                    <InfoField icon={FaCalendarAlt} label="Exam Date" value={examDate ? new Date(examDate).toLocaleDateString() : "Not set"} />
                </div>
            </div>

            {/* Family Information */}
            <div className="bg-white border border-gray-200 rounded-md p-5 mb-4">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FaGraduationCap size={12} className="text-gray-400" />
                    Family Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <InfoField label="Father's Name" value={fatherName} />
                    <InfoField label="Mother's Name" value={motherName} />
                </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-gray-200 rounded-md p-5">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt size={12} className="text-gray-400" />
                    Address
                </h3>
                <p className="text-gray-700 text-sm">{address || "Not provided"}</p>
            </div>

            {/* Note */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-gray-500 text-xs text-center">
                    To update your profile information, please contact the admin.
                </p>
            </div>
        </div>
    );
}

const InfoField = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        {Icon && (
            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                <Icon size={12} />
            </div>
        )}
        <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 truncate">{value || "N/A"}</p>
        </div>
    </div>
);
