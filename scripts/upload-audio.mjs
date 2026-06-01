/**
 * Upload listening MP3 files to Vercel Blob Storage
 * then update MongoDB with the returned URLs.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=xxx node scripts/upload-audio.mjs
 */

import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load server .env for DB URL
dotenv.config({
    path: join(__dirname, "../../jiboneducation-server/.env"),
});

const DATABASE_URL = process.env.DATABASE_URL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
    console.error("❌  BLOB_READ_WRITE_TOKEN not set. Run:");
    console.error("   BLOB_READ_WRITE_TOKEN=xxx node scripts/upload-audio.mjs");
    process.exit(1);
}

// ── file map: testNumber → absolute path ────────────────────────────────────
const BASE = join(__dirname, "../public/New folder");
const CONVERTED = join(BASE, "converted_mp3");

const FILES = {
    11: join(CONVERTED, "mock11.mp3"),
    12: join(BASE, "mock 12/10012 Listening Audio.mp3"),
    13: join(BASE, "mock 13/10013-Listening.mp3"),
    14: join(CONVERTED, "mock14.mp3"),
    15: join(CONVERTED, "mock15.mp3"),
    16: join(CONVERTED, "mock16.mp3"),
    17: join(CONVERTED, "mock17.mp3"),
    18: join(CONVERTED, "mock18.mp3"),
    19: join(CONVERTED, "mock19.mp3"),
    20: join(CONVERTED, "mock20.mp3"),
};

// ── helpers ─────────────────────────────────────────────────────────────────
async function uploadFile(testNumber, filePath) {
    const buffer = readFileSync(filePath);
    const blobName = `ielts/audio/listening-mock-${String(testNumber).padStart(2, "0")}.mp3`;
    console.log(`⬆️  Uploading mock ${testNumber} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)...`);
    const { url } = await put(blobName, buffer, {
        access: "public",
        token: BLOB_TOKEN,
        contentType: "audio/mpeg",
    });
    console.log(`✅  mock ${testNumber} → ${url}`);
    return url;
}

// ── main ────────────────────────────────────────────────────────────────────
(async () => {
    // Connect DB
    await mongoose.connect(DATABASE_URL);
    console.log("🗄️  DB connected\n");

    const db = mongoose.connection.db;
    const results = {};

    for (const [num, filePath] of Object.entries(FILES)) {
        const testNumber = Number(num);
        try {
            const url = await uploadFile(testNumber, filePath);
            results[testNumber] = url;

            // Update DB
            const res = await db.collection("listeningtests").updateOne(
                { testNumber },
                { $set: { mainAudioUrl: url } }
            );
            if (res.modifiedCount) {
                console.log(`   💾 DB updated for test ${testNumber}\n`);
            } else {
                console.log(`   ⚠️  DB: no doc found for testNumber ${testNumber}\n`);
            }
        } catch (err) {
            console.error(`❌  mock ${testNumber} FAILED:`, err.message);
        }
    }

    console.log("\n── Summary ──────────────────────────────────────────");
    for (const [num, url] of Object.entries(results)) {
        console.log(`  Test ${num}: ${url}`);
    }

    await mongoose.disconnect();
    console.log("\n🏁  Done.");
})();
