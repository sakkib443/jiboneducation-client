"use client";

import React, { useState, useEffect } from "react";
import {
    FaLock,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
    FaExclamationCircle,
    FaCog,
    FaShieldAlt,
} from "react-icons/fa";

export default function StudentSettings() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!currentPassword) {
            newErrors.currentPassword = "Current password is required";
        }
        if (!newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/change-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Password changed successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.message || "Failed to change password" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Something went wrong. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setter, field) => (e) => {
        setter(e.target.value);
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
        setMessage({ type: "", text: "" });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
            </div>

            {/* Change Password Section */}
            <div className="bg-white border border-gray-200 rounded-md p-5">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-600">
                        <FaShieldAlt size={16} />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-800">Change Password</h3>
                        <p className="text-gray-500 text-xs">Update your account password</p>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${message.type === "success"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}>
                        {message.type === "success" ? (
                            <FaCheckCircle className="text-green-600" size={14} />
                        ) : (
                            <FaExclamationCircle className="text-red-600" size={14} />
                        )}
                        <p className={`text-sm ${message.type === "success" ? "text-green-700" : "text-red-700"
                            }`}>
                            {message.text}
                        </p>
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Current Password
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={handleInputChange(setCurrentPassword, "currentPassword")}
                                placeholder="Enter current password"
                                className={`w-full pl-10 pr-10 py-2.5 border rounded-md text-sm bg-gray-50 focus:bg-white outline-none transition-colors ${errors.currentPassword
                                        ? "border-red-300 focus:border-red-400"
                                        : "border-gray-200 focus:border-cyan-500"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <p className="mt-1 text-red-500 text-xs">{errors.currentPassword}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={handleInputChange(setNewPassword, "newPassword")}
                                placeholder="Enter new password"
                                className={`w-full pl-10 pr-10 py-2.5 border rounded-md text-sm bg-gray-50 focus:bg-white outline-none transition-colors ${errors.newPassword
                                        ? "border-red-300 focus:border-red-400"
                                        : "border-gray-200 focus:border-cyan-500"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <p className="mt-1 text-red-500 text-xs">{errors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={handleInputChange(setConfirmPassword, "confirmPassword")}
                                placeholder="Confirm new password"
                                className={`w-full pl-10 pr-10 py-2.5 border rounded-md text-sm bg-gray-50 focus:bg-white outline-none transition-colors ${errors.confirmPassword
                                        ? "border-red-300 focus:border-red-400"
                                        : "border-gray-200 focus:border-cyan-500"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-red-500 text-xs">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-md bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Updating..." : "Change Password"}
                    </button>
                </form>
            </div>

            {/* Security Tips */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Security Tips</h4>
                <ul className="text-gray-500 text-xs space-y-1">
                    <li>• Use a strong password with at least 8 characters</li>
                    <li>• Include uppercase, lowercase, numbers, and symbols</li>
                    <li>• Never share your password with anyone</li>
                    <li>• Change your password regularly</li>
                </ul>
            </div>
        </div>
    );
}
