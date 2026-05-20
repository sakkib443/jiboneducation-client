"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    FaVideo,
    FaCloudUploadAlt,
    FaServer,
    FaYoutube,
    FaSpinner,
    FaCheckCircle,
    FaArrowLeft,
    FaSave,
    FaPlay,
} from "react-icons/fa";
import { siteContentAPI } from "@/lib/api";

const SOURCE_LABELS = {
    cloudinary: { label: "Cloudinary Upload", icon: FaCloudUploadAlt, color: "blue" },
    local: { label: "Local Server Upload", icon: FaServer, color: "purple" },
    youtube: { label: "YouTube Link", icon: FaYoutube, color: "red" },
};

// Convert any YouTube URL to embed URL (https://www.youtube.com/embed/VIDEO_ID)
function toYoutubeEmbed(url) {
    if (!url) return "";
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
            return `https://www.youtube.com/embed${u.pathname}`;
        }
        if (u.hostname.includes("youtube.com")) {
            const id = u.searchParams.get("v");
            if (id) return `https://www.youtube.com/embed/${id}`;
            // /embed/X already
            if (u.pathname.startsWith("/embed/")) return url;
        }
        return url;
    } catch {
        return url;
    }
}

function VideoCard({ item, onUpdated }) {
    const [pendingSource, setPendingSource] = useState(item.videoSource || "cloudinary");
    const [youtubeUrl, setYoutubeUrl] = useState(
        item.videoSource === "youtube" ? item.videoUrl || "" : ""
    );
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);

    const SourceIcon = SOURCE_LABELS[item.videoSource]?.icon || FaVideo;
    const isLocalCurrent = item.videoSource === "local";
    const isYoutubeCurrent = item.videoSource === "youtube";
    const isCloudinaryCurrent = item.videoSource === "cloudinary";

    // Build a playable URL based on stored source
    const playableUrl = (() => {
        if (!item.videoUrl) return "";
        if (isYoutubeCurrent) return toYoutubeEmbed(item.videoUrl);
        if (isLocalCurrent && item.videoUrl.startsWith("/uploads/")) {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const origin = apiBase.replace(/\/api\/?$/, "");
            return origin + item.videoUrl;
        }
        return item.videoUrl;
    })();

    const handleSubmit = async () => {
        setMsg(null);
        setBusy(true);
        try {
            let result;
            if (pendingSource === "youtube") {
                if (!youtubeUrl.trim()) {
                    setMsg({ type: "error", text: "Please enter a YouTube URL." });
                    setBusy(false);
                    return;
                }
                result = await siteContentAPI.update(item.contentKey, {
                    videoSource: "youtube",
                    videoUrl: youtubeUrl.trim(),
                });
            } else if (pendingSource === "cloudinary") {
                if (!file) {
                    setMsg({ type: "error", text: "Please select a video file." });
                    setBusy(false);
                    return;
                }
                result = await siteContentAPI.uploadCloudinaryVideo(item.contentKey, file);
            } else if (pendingSource === "local") {
                if (!file) {
                    setMsg({ type: "error", text: "Please select a video file." });
                    setBusy(false);
                    return;
                }
                result = await siteContentAPI.uploadLocalVideo(item.contentKey, file);
            }

            if (result?.success) {
                setMsg({ type: "success", text: "Updated successfully." });
                setFile(null);
                setYoutubeUrl("");
                onUpdated?.(result.data);
            } else {
                setMsg({ type: "error", text: result?.message || "Update failed." });
            }
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Update failed." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <FaVideo className="text-cyan-600" />
                        {item.label}
                    </h3>
                    {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                    <p className="text-[11px] font-mono text-gray-400 mt-1">key: {item.contentKey}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                    item.videoSource === "youtube" ? "bg-red-50 text-red-600" :
                    item.videoSource === "cloudinary" ? "bg-blue-50 text-blue-600" :
                    item.videoSource === "local" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"
                }`}>
                    <SourceIcon className="inline mr-1" /> {item.videoSource || "none"}
                </span>
            </div>

            {/* Current preview */}
            {playableUrl && (
                <div className="mb-3 rounded-lg overflow-hidden bg-black relative" style={{ paddingBottom: "40%" }}>
                    {isYoutubeCurrent ? (
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={playableUrl}
                            title={item.label}
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    ) : (
                        <video className="absolute inset-0 w-full h-full" src={playableUrl} controls preload="metadata" />
                    )}
                </div>
            )}

            {/* Source toggle */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.entries(SOURCE_LABELS).map(([key, val]) => {
                    const Icon = val.icon;
                    const active = pendingSource === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setPendingSource(key)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-md border text-xs font-medium transition ${
                                active
                                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <Icon className={`text-lg ${active ? "" : "opacity-60"}`} />
                            {val.label}
                        </button>
                    );
                })}
            </div>

            {/* Source-specific input */}
            {pendingSource === "youtube" && (
                <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
            )}
            {(pendingSource === "cloudinary" || pendingSource === "local") && (
                <div>
                    <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                    />
                    {file && (
                        <p className="text-xs text-gray-500 mt-1">
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                    )}
                    {pendingSource === "local" && (
                        <p className="text-[11px] text-amber-600 mt-1">
                            ⚠ Local upload writes to server disk. On serverless hosts (Vercel) it will not persist.
                        </p>
                    )}
                </div>
            )}

            {/* Action */}
            <div className="flex items-center justify-between mt-4">
                {msg ? (
                    <span className={`text-xs ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {msg.type === "success" ? "✓ " : "✗ "}{msg.text}
                    </span>
                ) : <span />}
                <button
                    disabled={busy}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                >
                    {busy ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {busy ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

export default function DesignVideosPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await siteContentAPI.getByCategory("video");
                if (res.success) setItems(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleUpdated = (updated) => {
        setItems((prev) => prev.map((p) => (p.contentKey === updated.contentKey ? updated : p)));
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Link href="/dashboard/admin/design" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-600 mb-2">
                <FaArrowLeft /> Back to Design
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <FaVideo className="text-cyan-600" /> Videos
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Each video can be set from one of three sources: Cloudinary upload, local server upload, or a YouTube link.
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <FaSpinner className="animate-spin text-2xl" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
                    No video entries found. Run <code className="bg-gray-100 px-1.5 py-0.5 rounded">seedSiteContent.ts</code> to create defaults.
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((it) => (
                        <VideoCard key={it.contentKey} item={it} onUpdated={handleUpdated} />
                    ))}
                </div>
            )}
        </div>
    );
}
