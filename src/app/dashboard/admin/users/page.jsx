"use client";

import React, { useState, useEffect } from "react";
import {
    FaUsers,
    FaSearch,
    FaSpinner,
    FaUserShield,
    FaUser,
    FaChalkboardTeacher,
    FaPlus,
    FaTrashAlt,
    FaTimes,
    FaCheckCircle,
    FaExclamationTriangle,
    FaEnvelope,
    FaPhone,
    FaLock,
    FaUserCog,
} from "react-icons/fa";
import { usersAPI } from "@/lib/api";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
    });

    const isAdmin = currentUserRole === "admin";

    useEffect(() => {
        // Get current user info
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserRole(user.role || "admin");
                setCurrentUserId(user._id || "");
            }
        } catch (e) { }

        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getAll();
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (err) {
            setError("You don't have permission to manage users. Only Admins can access this feature.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError("");

        try {
            const response = await usersAPI.create(formData);
            if (response.success) {
                const roleLabel = formData.role === "admin" ? "Admin" : formData.role === "mentor" ? "Mentor" : "User";
                setSuccess(`${roleLabel} "${formData.name}" created successfully!`);
                setShowCreateModal(false);
                setFormData({ name: "", email: "", phone: "", password: "", role: "admin" });
                fetchUsers();
                setTimeout(() => setSuccess(""), 4000);
            } else {
                setError(response.message || "Failed to create user");
            }
        } catch (err) {
            setError(err.message || "Failed to create user");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        setDeleting(userId);
        setError("");

        try {
            const response = await usersAPI.delete(userId);
            if (response.success) {
                setSuccess("User deleted successfully!");
                setDeleteConfirm(null);
                setUsers(prev => prev.filter(u => u._id !== userId));
                setTimeout(() => setSuccess(""), 4000);
            } else {
                setError(response.message || "Failed to delete user");
            }
        } catch (err) {
            setError(err.message || "Failed to delete user");
        } finally {
            setDeleting(null);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await usersAPI.updateRole(userId, newRole);
            if (response.success) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
                setSuccess(`Role updated to ${newRole}`);
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err) {
            setError(err.message || "Failed to update role");
        }
    };

    const roleConfig = {
        admin: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: FaUserShield, label: "Admin" },
        mentor: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: FaChalkboardTeacher, label: "Mentor" },
        user: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FaUser, label: "User" },
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage admin accounts</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <FaPlus className="text-xs" /> Create User
                    </button>
                )}
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-700 text-sm">
                    <FaCheckCircle /> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                    <FaExclamationTriangle /> {error}
                    <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"><FaTimes /></button>
                </div>
            )}

            {/* Info Banner */}
            {!isAdmin && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <FaLock className="text-amber-500 text-xl mt-0.5" />
                    <div>
                        <p className="text-amber-800 font-medium">View Only Access</p>
                        <p className="text-amber-600 text-sm">
                            Only Admins can create, edit, or delete users.
                        </p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative max-w-md">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                {isAdmin && (
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center">
                                        <FaSpinner className="animate-spin text-3xl text-cyan-500 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => {
                                    const rc = roleConfig[user.role] || roleConfig.user;
                                    const RoleIcon = rc.icon;
                                    const isCurrentUser = user._id === currentUserId;

                                    return (
                                        <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? "bg-blue-50/30" : ""}`}>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === "admin"
                                                        ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                                                        : user.role === "mentor"
                                                            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                                            : "bg-gradient-to-br from-blue-400 to-cyan-500"
                                                        }`}>
                                                        <span className="text-white font-semibold">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {user.name}
                                                            {isCurrentUser && (
                                                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">You</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 text-sm">{user.email}</td>
                                            <td className="px-4 py-4 text-gray-600 text-sm">{user.phone || "-"}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${rc.bg} ${rc.text} ${rc.border}`}>
                                                    <RoleIcon className="text-[10px]" />
                                                    {rc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-4 py-4 text-center">
                                                    {!isCurrentUser ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Role Toggle */}
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="mentor">Mentor</option>
                                                                <option value="user">User</option>
                                                            </select>
                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => setDeleteConfirm(user)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                                                title="Delete user"
                                                            >
                                                                <FaTrashAlt className="text-sm" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center">
                                        <FaUsers className="text-gray-300 text-5xl mx-auto mb-4" />
                                        <p className="text-gray-500">No users found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Stats Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>Total: {users.length} users</span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><FaUserShield className="text-purple-500" /> {users.filter(u => u.role === "admin").length} Admin</span>
                        <span className="flex items-center gap-1"><FaChalkboardTeacher className="text-emerald-500" /> {users.filter(u => u.role === "mentor").length} Mentor</span>
                        <span className="flex items-center gap-1"><FaUser className="text-blue-400" /> {users.filter(u => u.role === "user").length} User</span>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                                        <FaUserCog className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Create New User</h2>
                                        <p className="text-xs text-gray-500">Add an admin account</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                                        placeholder="01712345678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: "admin", label: "Admin", icon: FaUserShield, desc: "Full system access", color: "purple" },
                                        { value: "mentor", label: "Mentor", icon: FaChalkboardTeacher, desc: "All access except user mgmt", color: "emerald" },
                                        { value: "user", label: "User", icon: FaUser, desc: "Standard account", color: "blue" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: opt.value })}
                                            className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${formData.role === opt.value
                                                ? `border-${opt.color}-400 bg-${opt.color}-50`
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <opt.icon className={`text-sm ${formData.role === opt.value ? `text-${opt.color}-600` : "text-gray-400"}`} />
                                                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {creating ? <FaSpinner className="animate-spin" /> : <FaPlus className="text-xs" />}
                                    {creating ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaTrashAlt className="text-red-500 text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Delete User?</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm._id)}
                                disabled={deleting === deleteConfirm._id}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {deleting === deleteConfirm._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt className="text-xs" />}
                                {deleting === deleteConfirm._id ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
