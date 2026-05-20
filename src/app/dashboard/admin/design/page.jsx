"use client";

import React from "react";
import Link from "next/link";
import { FaVideo, FaFont, FaPalette, FaArrowRight } from "react-icons/fa";

export default function DesignOverviewPage() {
    const cards = [
        {
            title: "Videos",
            description: "Manage exam guideline & module instruction videos. Upload to Cloudinary, server, or use a YouTube link.",
            icon: FaVideo,
            href: "/dashboard/admin/design/videos",
            color: "from-cyan-500 to-blue-600",
        },
        {
            title: "Homepage Texts",
            description: "Edit hero section texts shown on the landing page (badge, title lines, subtitle).",
            icon: FaFont,
            href: "/dashboard/admin/design/homepage",
            color: "from-pink-500 to-rose-600",
        },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow">
                    <FaPalette />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Design</h1>
            </div>
            <p className="text-gray-500 mb-8 text-sm">
                Control dynamic content shown to students — videos and homepage texts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link
                            key={c.href}
                            href={c.href}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-cyan-300 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xl mb-3 shadow`}>
                                <Icon />
                            </div>
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-800">{c.title}</h3>
                                <FaArrowRight className="text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="text-sm text-gray-500">{c.description}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
