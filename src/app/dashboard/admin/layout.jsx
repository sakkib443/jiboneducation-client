"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    FaHome,
    FaUsers,
    FaChartBar,
    FaCog,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaUserGraduate,
    FaHeadphones,
    FaBook,
    FaPen,
    FaSearch,
    FaBell,
    FaGlobe,
    FaChevronDown,
    FaMicrophone,
    FaPalette,
    FaVideo,
    FaFont,
} from "react-icons/fa";
import Logo from "@/components/Logo";

const menuItems = [
    {
        title: "Dashboard",
        icon: FaHome,
        href: "/dashboard/admin/dashboard",
    },
    {
        title: "Students",
        icon: FaUserGraduate,
        href: "/dashboard/admin/students",
        badge: "New",
    },
    {
        title: "Listening",
        icon: FaHeadphones,
        href: "/dashboard/admin/listening",
    },
    {
        title: "Reading",
        icon: FaBook,
        href: "/dashboard/admin/reading",
    },
    {
        title: "Writing",
        icon: FaPen,
        href: "/dashboard/admin/writing",
    },
    // {
    //     title: "Speaking",
    //     icon: FaMicrophone,
    //     href: "/dashboard/admin/speaking",
    // },
    {
        title: "Exam Results",
        icon: FaChartBar,
        href: "/dashboard/admin/results",
    },
    {
        title: "Design",
        icon: FaPalette,
        href: "/dashboard/admin/design",
        submenu: [
            {
                title: "Videos",
                icon: FaVideo,
                href: "/dashboard/admin/design/videos",
            },
            {
                title: "Homepage Texts",
                icon: FaFont,
                href: "/dashboard/admin/design/homepage",
            },
        ],
    },
];

const secondaryItems = [
    {
        title: "Users",
        icon: FaUsers,
        href: "/dashboard/admin/users",
    },
    {
        title: "Settings",
        icon: FaCog,
        href: "/dashboard/admin/settings",
    },
];

function AdminLayoutContent({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [adminInfo, setAdminInfo] = useState(null);
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentType = searchParams?.get("type") || null;
    const isLoginPage = pathname === "/dashboard/admin";

    // Auto-expand sidebar groups when on a child route
    useEffect(() => {
        const matched = menuItems.find(
            (it) => it.submenu && pathname?.startsWith(it.href + "/")
        );
        if (matched && expandedMenu !== matched.title) {
            setExpandedMenu(matched.title);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    useEffect(() => {
        if (isLoginPage) {
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");

            if (!token || !userStr) {
                router.replace("/login");
                return;
            }

            // 🔒 Check if token is expired
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 < Date.now()) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    localStorage.removeItem("adminAuth");
                    router.replace("/login");
                    return;
                }
            } catch (e) {
                router.replace("/login");
                return;
            }

            const user = JSON.parse(userStr);
            if (user.role !== "admin" && user.role !== "mentor") {
                router.replace("/dashboard/student");
                return;
            }

            setAdminInfo(user);
            setIsLoading(false);
        } catch (e) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("adminAuth");
            router.replace("/login");
        }
    }, [isLoginPage]);

    const handleLogout = () => {
        localStorage.removeItem("adminAuth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const isActive = (href) => {
        if (href.includes("?")) {
            return pathname === href.split("?")[0];
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    if (isLoginPage) return <>{children}</>;

    if (isLoading || !adminInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const NavItem = ({ item, isSub = false }) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        if (item.submenu) {
            const isExpanded = expandedMenu === item.title;
            return (
                <div className="mb-1">
                    <button
                        onClick={() => setExpandedMenu(isExpanded ? null : item.title)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        <Icon className={`text-lg ${!sidebarOpen && "mx-auto"}`} />
                        {sidebarOpen && (
                            <>
                                <span className="text-sm flex-1 text-left">{item.title}</span>
                                <FaChevronDown className={`text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </>
                        )}
                    </button>
                    {sidebarOpen && isExpanded && (
                        <div className="mt-1 ml-4 space-y-1 pl-2 border-l border-gray-200">
                            {item.submenu.map((sub) => {
                                const subActive = sub.type !== undefined
                                    ? (pathname === "/dashboard/admin/question-sets" &&
                                        ((sub.type === null && !currentType) || (sub.type === currentType)))
                                    : (pathname === sub.href || pathname?.startsWith(sub.href + "/"));
                                return (
                                    <Link
                                        key={sub.href + (sub.type || 'all')}
                                        href={sub.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm ${subActive
                                            ? "bg-gray-100 text-gray-900 font-medium"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <sub.icon className="text-sm" />
                                        <span>{sub.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-all duration-200 group ${active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
            >
                <Icon className={`text-lg ${!sidebarOpen && "mx-auto"}`} />
                {sidebarOpen && (
                    <>
                        <span className="text-sm flex-1">{item.title}</span>
                        {item.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-600"}`}>
                                {item.badge}
                            </span>
                        )}
                    </>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Toggle Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-20"
                    } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b border-gray-200">
                    {sidebarOpen ? (
                        <Logo size="large" className="w-44" />
                    ) : (
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            JE
                        </div>
                    )}
                </div>

                {/* Navigation Scrollable */}
                <div className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
                    <p className={`px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-300 ${!sidebarOpen && 'opacity-0'}`}>Menu</p>
                    <nav>
                        {menuItems.map((item) => <NavItem key={item.href} item={item} />)}
                    </nav>

                    <div className="my-6 h-px bg-gray-100 mx-2" />

                    <p className={`px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-300 ${!sidebarOpen && 'opacity-0'}`}>System</p>
                    <nav>
                        {secondaryItems
                            .filter((item) => {
                                // Mentors should not see Users (user management is admin-only)
                                if (item.href === "/dashboard/admin/users" && adminInfo?.role === "mentor") return false;
                                return true;
                            })
                            .map((item) => <NavItem key={item.href} item={item} />)}
                    </nav>
                </div>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ${!sidebarOpen && 'justify-center'}`}
                    >
                        <FaSignOutAlt className="text-lg" />
                        {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
                {/* Top Navbar */}
                <header className="h-16 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <FaBars />
                        </button>

                        {/* Desktop Sidebar Toggle */}
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <FaBars />
                        </button>
                    </div>

                    {/* Right Side Icons & Profile */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                target="_blank"
                                title="View Website"
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                            >
                                <FaGlobe />
                                <span className="hidden sm:inline">View Site</span>
                            </Link>
                            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                                <FaBell />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-gray-200"></div>

                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-700 leading-none mb-1">{adminInfo?.name || "Admin"}</p>
                                <p className="text-xs text-gray-500">{adminInfo?.role || "System Admin"}</p>
                            </div>
                            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                                {adminInfo?.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Padding */}
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full"></div>
            </div>
        }>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}
