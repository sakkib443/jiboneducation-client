"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaHeadphones, FaBook, FaPen, FaLayerGroup } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";

export default function NotFound() {
    const quickLinks = [
        { name: "Full Exam", href: "/", icon: <FaLayerGroup />, color: "from-[#41bfb8] to-[#2d9a94]" },
        { name: "Listening", href: "/", icon: <FaHeadphones />, color: "from-purple-500 to-purple-600" },
        { name: "Reading", href: "/", icon: <FaBook />, color: "from-blue-500 to-blue-600" },
        { name: "Writing", href: "/", icon: <FaPen />, color: "from-emerald-500 to-emerald-600" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#41bfb8]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#f79952]/20 rounded-full blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-[150px] md:text-[200px] font-bold leading-none">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#41bfb8] to-[#4dd4cd]">4</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f79952] to-[#ffb380]">0</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#41bfb8] to-[#4dd4cd]">4</span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                        The page you're looking for doesn't exist. Let's get you back to your IELTS practice!
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center mb-12"
                >
                    <Link href="/">
                        <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#41bfb8] to-[#2d9a94] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-[#41bfb8]/25 transition-all cursor-pointer">
                            <FaHome />
                            Back to Home
                        </button>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <p className="text-slate-500 text-sm mb-4">Quick links:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quickLinks.map((link, index) => (
                            <Link key={index} href={link.href}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                                >
                                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform`}>
                                        {link.icon}
                                    </div>
                                    <p className="text-white/80 text-sm font-medium">{link.name}</p>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 pt-8 border-t border-white/10"
                >
                    <p className="text-slate-500 text-sm">
                        © 2026 Jibon Education
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
