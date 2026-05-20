"use client";

import { useEffect, useState } from "react";
import { siteContentAPI } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// In-memory cache so multiple components hitting the same keys don't refetch
const cache = new Map(); // key -> data
let bulkPromise = null;

/**
 * Fetch multiple site content entries by keys. Returns a map { [key]: entry }.
 * Provides defaultValues fallback if API fails or entry is missing.
 *
 * @param {string[]} keys
 * @param {Record<string, { textValue?: string; videoSource?: string; videoUrl?: string }>} defaults
 */
export function useSiteContent(keys, defaults = {}) {
    const keyList = Array.isArray(keys) ? keys : [];
    const cacheKey = keyList.slice().sort().join("|");

    const initial = {};
    for (const k of keyList) {
        initial[k] = cache.get(k) || defaults[k] || null;
    }

    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(() => keyList.some((k) => !cache.has(k)));

    useEffect(() => {
        if (!keyList.length) return;
        const missing = keyList.filter((k) => !cache.has(k));
        if (missing.length === 0) {
            // hydrate from cache
            const next = {};
            for (const k of keyList) next[k] = cache.get(k);
            setData(next);
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await siteContentAPI.getBulk(missing);
                if (res?.success && Array.isArray(res.data)) {
                    for (const item of res.data) {
                        cache.set(item.contentKey, item);
                    }
                }
            } catch (e) {
                // silent fallback to defaults
            }
            if (cancelled) return;
            const next = {};
            for (const k of keyList) {
                next[k] = cache.get(k) || defaults[k] || null;
            }
            setData(next);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

    return { data, loading };
}

/** Resolve a video entry to a playable URL the <video> / <iframe> tag can use. */
export function getVideoSrc(entry, fallback = "") {
    if (!entry || !entry.videoUrl) return fallback;
    if (entry.videoSource === "youtube") {
        try {
            const u = new URL(entry.videoUrl);
            if (u.hostname.includes("youtu.be")) {
                return `https://www.youtube.com/embed${u.pathname}`;
            }
            if (u.hostname.includes("youtube.com")) {
                const id = u.searchParams.get("v");
                if (id) return `https://www.youtube.com/embed/${id}`;
                if (u.pathname.startsWith("/embed/")) return entry.videoUrl;
            }
            return entry.videoUrl;
        } catch {
            return entry.videoUrl;
        }
    }
    if (entry.videoSource === "local" && entry.videoUrl.startsWith("/uploads/")) {
        // Local server upload — served by Express at /uploads via the API host
        return API_ORIGIN + entry.videoUrl;
    }
    // cloudinary or local-public-folder paths (e.g. /video/xxx.mp4)
    return entry.videoUrl;
}

export function isYouTube(entry) {
    return entry?.videoSource === "youtube";
}

/**
 * Render a string with **bold** markers as JSX, mirroring the homepage hero subtitle.
 */
export function renderBoldMarkers(text, BoldComp = "strong", boldClassName = "") {
    if (!text) return null;
    const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
            const inner = p.slice(2, -2);
            return BoldComp === "strong"
                ? <strong key={i} className={boldClassName}>{inner}</strong>
                : <BoldComp key={i} className={boldClassName}>{inner}</BoldComp>;
        }
        return p;
    });
}
