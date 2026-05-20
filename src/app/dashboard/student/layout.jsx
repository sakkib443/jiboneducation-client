"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    FaHome,
    FaClipboardList,
    FaChartBar,
    FaSignOutAlt,
    FaBars,
    FaTimes,
} from "react-icons/fa";
import Logo from "@/components/Logo";
import { FaCreditCard, FaUserCircle, FaCog } from "react-icons/fa";

const menuItems = [
    {
        title: "Dashboard",
        icon: FaHome,
        href: "/dashboard/student",
    },
    {
        title: "Results",
        icon: FaChartBar,
        href: "/dashboard/student/results",
    },
    {
        title: "Payments",
        icon: FaCreditCard,
        href: "/dashboard/student/payments",
    },
    {
        title: "Profile",
        icon: FaUserCircle,
        href: "/dashboard/student/profile",
    },
    {
        title: "Settings",
        icon: FaCog,
        href: "/dashboard/student/settings",
    },
];

function StudentLayoutContent({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            router.push("/login");
            return;
        }

        // 🔒 Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("adminAuth");
                router.push("/login");
                return;
            }
        } catch (e) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(user);
            // Admin and mentor should go to admin dashboard
            if (parsedUser.role === "admin" || parsedUser.role === "mentor") {
                router.push("/dashboard/admin/dashboard");
                return;
            }
            // Accept 'user' and 'student' roles for student dashboard
            setStudentInfo(parsedUser);
        } catch (error) {
            console.error("Failed to parse user session", error);
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("examSession");
        router.push("/login");
    };

    const isActive = (href) => pathname === href;

    if (isLoading || !studentInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-200 ${sidebarOpen ? "w-56" : "w-16"
                    } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    {sidebarOpen ? (
                        <Logo className="w-28" />
                    ) : (
                        <div className="w-8 h-8 bg-cyan-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                            B
                        </div>
                    )}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1">
                    {menuItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active
                                    ? "bg-cyan-50 text-cyan-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className={`text-base ${active ? "text-cyan-600" : "text-gray-400"}`} />
                                {sidebarOpen && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ${!sidebarOpen && "justify-center"
                            }`}
                    >
                        <FaSignOutAlt className="text-base" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-200 ${sidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}>
                {/* Header */}
                <header className="h-16 px-4 lg:px-6 flex items-center justify-between bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                        >
                            <FaBars size={16} />
                        </button>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:flex p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                        >
                            <FaBars size={16} />
                        </button>
                        <h1 className="text-gray-800 font-semibold text-sm hidden sm:block">
                            Student Portal
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-800">{studentInfo?.name || "Student"}</p>
                            <p className="text-xs text-gray-500">{studentInfo?.email}</p>
                        </div>
                        <div className="w-9 h-9 bg-cyan-100 rounded-md flex items-center justify-center text-cyan-700 font-semibold text-sm">
                            {studentInfo?.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function StudentLayout({ children }) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <StudentLayoutContent>{children}</StudentLayoutContent>
        </Suspense>
    );
}
