"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaFont, FaSpinner, FaArrowLeft, FaSave } from "react-icons/fa";
import { siteContentAPI } from "@/lib/api";

// Render **bold** preview (matches the way page.jsx will render it)
function PreviewText({ text }) {
    const parts = (text || "").split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((p, i) => {
                if (p.startsWith("**") && p.endsWith("**")) {
                    return <strong key={i} className="text-red-600 font-bold">{p.slice(2, -2)}</strong>;
                }
                return <span key={i}>{p}</span>;
            })}
        </>
    );
}

function TextRow({ item, onSaved }) {
    const [value, setValue] = useState(item.textValue || "");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const isLong = (item.textValue || "").length > 80;

    const save = async () => {
        setMsg(null);
        setBusy(true);
        try {
            const res = await siteContentAPI.update(item.contentKey, { textValue: value });
            if (res?.success) {
                setMsg({ type: "success", text: "Saved." });
                onSaved?.(res.data);
            } else {
                setMsg({ type: "error", text: res?.message || "Save failed." });
            }
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Save failed." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="mb-3">
                <h3 className="text-sm font-bold text-gray-800">{item.label}</h3>
                {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                )}
                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{item.contentKey}</p>
            </div>

            {isLong ? (
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
            )}

            {/* Live preview */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <span className="text-gray-400 mr-1">Preview:</span>
                <PreviewText text={value} />
            </div>

            <div className="flex items-center justify-between mt-3">
                {msg ? (
                    <span className={`text-xs ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {msg.type === "success" ? "✓ " : "✗ "}{msg.text}
                    </span>
                ) : <span />}
                <button
                    disabled={busy || value === item.textValue}
                    onClick={save}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                >
                    {busy ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {busy ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}

export default function DesignHomepageTextsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await siteContentAPI.getByCategory("homepage_text");
                if (res.success) setItems(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSaved = (updated) => {
        setItems((prev) => prev.map((p) => (p.contentKey === updated.contentKey ? updated : p)));
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <Link href="/dashboard/admin/design" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-600 mb-2">
                <FaArrowLeft /> Back to Design
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <FaFont className="text-pink-600" /> Homepage Texts
            </h1>
            <p className="text-gray-500 text-sm mb-2">
                Edit the hero section texts shown on the landing page.
            </p>
            <p className="text-xs text-gray-400 mb-6">
                Tip: wrap a phrase with <code className="bg-gray-100 px-1 rounded">**double-asterisks**</code> to make it bold red in the subtitle.
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <FaSpinner className="animate-spin text-2xl" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
                    No text entries found. Run the seed script to create defaults.
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((it) => (
                        <TextRow key={it.contentKey} item={it} onSaved={handleSaved} />
                    ))}
                </div>
            )}
        </div>
    );
}
