"use client";

import React, { useState } from "react";
import {
    FaCog,
    FaSave,
    FaSpinner,
    FaGlobe,
    FaClock,
    FaMoneyBillWave,
    FaShieldAlt,
    FaEnvelope,
    FaCheck,
} from "react-icons/fa";

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        // General Settings
        siteName: "IELTS Online Exam System",
        siteDescription: "Professional IELTS Mock Test Platform by Jibon Education",

        // Exam Settings
        listeningDuration: 40,
        readingDuration: 60,
        writingDuration: 60,
        maxViolations: 3,
        autoTerminateOnViolation: true,

        // Payment Settings
        examFee: 5000,
        currency: "BDT",

        // Notification Settings
        sendEmailOnRegistration: true,
        sendEmailOnExamComplete: true,
        adminEmail: "admin@jiboneducation.com",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaCog className="text-gray-600" />
                        Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Configure system settings and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${saved
                        ? "bg-green-500 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700"
                        } disabled:opacity-50`}
                >
                    {saving ? (
                        <FaSpinner className="animate-spin" />
                    ) : saved ? (
                        <FaCheck />
                    ) : (
                        <FaSave />
                    )}
                    {saved ? "Saved!" : "Save Changes"}
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaGlobe className="text-cyan-600" />
                    General Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Name
                        </label>
                        <input
                            type="text"
                            name="siteName"
                            value={settings.siteName}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Description
                        </label>
                        <textarea
                            name="siteDescription"
                            value={settings.siteDescription}
                            onChange={handleChange}
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>
            </div>

            {/* Exam Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaClock className="text-cyan-600" />
                    Exam Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Listening Duration (min)
                        </label>
                        <input
                            type="number"
                            name="listeningDuration"
                            value={settings.listeningDuration}
                            onChange={handleChange}
                            min={1}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reading Duration (min)
                        </label>
                        <input
                            type="number"
                            name="readingDuration"
                            value={settings.readingDuration}
                            onChange={handleChange}
                            min={1}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Writing Duration (min)
                        </label>
                        <input
                            type="number"
                            name="writingDuration"
                            value={settings.writingDuration}
                            onChange={handleChange}
                            min={1}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaShieldAlt className="text-cyan-600" />
                    Security Settings
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Violations Before Warning
                            </label>
                            <input
                                type="number"
                                name="maxViolations"
                                value={settings.maxViolations}
                                onChange={handleChange}
                                min={1}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="autoTerminateOnViolation"
                            checked={settings.autoTerminateOnViolation}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <p className="font-medium text-gray-800">Auto-terminate on Violation</p>
                            <p className="text-sm text-gray-500">
                                Automatically terminate exam when max violations reached
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-cyan-600" />
                    Payment Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Exam Fee
                        </label>
                        <input
                            type="number"
                            name="examFee"
                            value={settings.examFee}
                            onChange={handleChange}
                            min={0}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Currency
                        </label>
                        <select
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="BDT">BDT (৳)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaEnvelope className="text-cyan-600" />
                    Notification Settings
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Email
                        </label>
                        <input
                            type="email"
                            name="adminEmail"
                            value={settings.adminEmail}
                            onChange={handleChange}
                            className="w-full md:w-1/2 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="sendEmailOnRegistration"
                            checked={settings.sendEmailOnRegistration}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <p className="font-medium text-gray-800">Email on Registration</p>
                            <p className="text-sm text-gray-500">Send email when new student is registered</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="sendEmailOnExamComplete"
                            checked={settings.sendEmailOnExamComplete}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <p className="font-medium text-gray-800">Email on Exam Complete</p>
                            <p className="text-sm text-gray-500">Send email when student completes exam</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Footer Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${saved
                        ? "bg-green-500 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700"
                        } disabled:opacity-50`}
                >
                    {saving ? <FaSpinner className="animate-spin" /> : saved ? <FaCheck /> : <FaSave />}
                    {saved ? "Settings Saved!" : "Save All Settings"}
                </button>
            </div>
        </div>
    );
}
