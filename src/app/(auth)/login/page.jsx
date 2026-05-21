"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MdOutlineRemoveRedEye, MdOutlineVisibilityOff } from "react-icons/md";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import Logo from "@/components/Logo";

const Login = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if already logged in
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === "admin") {
          router.replace("/dashboard/admin/dashboard");
          return;
        } else {
          router.replace("/dashboard/student");
          return;
        }
      }
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminAuth");
    }
    setIsChecking(false);
  }, []);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response?.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (response.data.user.role === "admin") {
          localStorage.setItem(
            "adminAuth",
            JSON.stringify({
              email: response.data.user.email,
              name: response.data.user.name,
              role: response.data.user.role,
              token: response.data.token,
              isAdmin: true,
            })
          );
        }

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        if (response.data.user.role === "admin") {
          router.push("/dashboard/admin/dashboard");
        } else {
          router.push("/dashboard/student");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FF6904] border-t-transparent mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-50">

      {/* Decorative background (light) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF6904]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Main */}
      <div
        className={`relative z-10 w-full max-w-[440px] mx-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block">
            <Logo size="default" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-[#FF6904]" />

          {/* Header */}
          <div className="px-8 pt-8">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Welcome Back</h3>
            <p className="text-slate-500 text-sm">Sign in to your IELTS exam portal</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-6">
            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 bg-red-50 border border-red-200">
                <FiAlertCircle className="text-red-500 flex-shrink-0" size={16} />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6904] transition-colors" size={16} />
                  <input
                    type="email"
                    name="email"
                    id="login-email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#FF6904]/10 ${validationErrors.email ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-[#FF6904]"}`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1.5 text-red-500 text-xs">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6904] transition-colors" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="login-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-11 pr-12 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#FF6904]/10 ${validationErrors.password ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-[#FF6904]"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <MdOutlineVisibilityOff size={18} />
                    ) : (
                      <MdOutlineRemoveRedEye size={18} />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1.5 text-red-500 text-xs">{validationErrors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-[18px] h-[18px] rounded-[5px] border border-slate-300 bg-white flex items-center justify-center transition-all peer-checked:bg-[#FF6904] peer-checked:border-[#FF6904]">
                      {rememberMe && (
                        <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-[#FF6904] hover:text-[#e85d00] transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-[#FF6904] hover:bg-[#e85d00] hover:shadow-lg hover:shadow-[#FF6904]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-3.5 rounded-xl flex items-start gap-3 bg-[#FF6904]/5 border border-[#FF6904]/15">
              <div className="w-5 h-5 rounded-full bg-[#FF6904]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF6904] text-[10px] font-bold">i</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Students:</span> Use your registered email and phone number as password.
              </p>
            </div>

            {/* Back Link */}
            <div className="mt-5 text-center">
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} Jibon Education. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
