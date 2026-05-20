"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === "admin") {
                    // Already logged in as admin, go to dashboard
                    router.replace("/dashboard/admin/dashboard");
                } else {
                    // Logged in but not admin, go to student dashboard
                    router.replace("/dashboard/student");
                }
            } catch (e) {
                // Invalid data, go to login
                router.replace("/login");
            }
        } else {
            // Not logged in, go to login page
            router.replace("/login");
        }
    }, [router]);

    // Show loading while redirecting
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Redirecting...</p>
            </div>
        </div>
    );
}
