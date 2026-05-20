// Exam Prefetch Cache
// ====================
// When user clicks a module card and the instruction video popup opens,
// we silently start fetching the exam data in the background. By the time
// the user clicks "Skip" / "Continue", the data is already in memory and
// the exam page can render instantly.
//
// Cache lives in module-level memory (per browser tab). Falls back to
// sessionStorage so a hard navigation still finds it.

import { listeningAPI, readingAPI, writingAPI } from "./api";

const memCache = new Map();    // key -> { data, ts }
const inflight = new Map();    // key -> Promise
const TTL_MS = 30 * 60 * 1000; // 30 min — exam set rarely changes mid-session

const buildKey = (module, setNumber) => `${module}:${setNumber}`;

const ssGet = (key) => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(`prefetch:${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.ts) return null;
        if (Date.now() - parsed.ts > TTL_MS) return null;
        return parsed.data;
    } catch {
        return null;
    }
};

const ssSet = (key, data) => {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(
            `prefetch:${key}`,
            JSON.stringify({ data, ts: Date.now() })
        );
    } catch {
        // sessionStorage might be full — ignore
    }
};

const apiFor = (module) => {
    if (module === "listening") return listeningAPI;
    if (module === "reading") return readingAPI;
    if (module === "writing") return writingAPI;
    return null;
};

// Read cached data synchronously (mem first, then sessionStorage).
// Returns null if not cached.
export const getPrefetched = (module, setNumber) => {
    if (!module || setNumber == null) return null;
    const key = buildKey(module, setNumber);

    const mem = memCache.get(key);
    if (mem && Date.now() - mem.ts < TTL_MS) return mem.data;

    const ss = ssGet(key);
    if (ss) {
        memCache.set(key, { data: ss, ts: Date.now() });
        return ss;
    }
    return null;
};

// Kick off (or join) a background fetch. Safe to call repeatedly — duplicates
// are deduped via the inflight map. Never throws; resolves to data or null.
export const prefetchModule = (module, setNumber) => {
    if (!module || setNumber == null) return Promise.resolve(null);

    const key = buildKey(module, setNumber);

    const cached = getPrefetched(module, setNumber);
    if (cached) return Promise.resolve(cached);

    if (inflight.has(key)) return inflight.get(key);

    const api = apiFor(module);
    if (!api || typeof api.getForExam !== "function") return Promise.resolve(null);

    const p = (async () => {
        try {
            const res = await api.getForExam(setNumber);
            if (res?.success && res.data) {
                memCache.set(key, { data: res.data, ts: Date.now() });
                ssSet(key, res.data);
                return res.data;
            }
            return null;
        } catch {
            return null;
        } finally {
            inflight.delete(key);
        }
    })();

    inflight.set(key, p);
    return p;
};

// Fetch with cache: use prefetched if available, otherwise fetch and cache.
export const fetchModuleData = async (module, setNumber) => {
    const cached = getPrefetched(module, setNumber);
    if (cached) return cached;
    return prefetchModule(module, setNumber);
};

// Manual invalidation (rarely needed on client)
export const invalidatePrefetch = (module, setNumber) => {
    if (module && setNumber != null) {
        const key = buildKey(module, setNumber);
        memCache.delete(key);
        if (typeof window !== "undefined") {
            try { window.sessionStorage.removeItem(`prefetch:${key}`); } catch {}
        }
    }
};
