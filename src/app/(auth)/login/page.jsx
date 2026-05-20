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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-400 border-t-transparent mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #0d1b2a 30%, #1a1a3e 60%, #0d1b2a 100%)' }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0,188,212,0.4) 0%, transparent 70%)',
            animation: mounted ? 'float 8s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
            animation: mounted ? 'float 10s ease-in-out infinite reverse' : 'none',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(0,188,212,0.3) 0%, transparent 60%)',
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating dots */}
        {mounted && (
          <>
            <div className="absolute top-[15%] left-[10%] w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-40" style={{ animation: 'pulse-dot 3s ease-in-out infinite' }} />
            <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-indigo-400 rounded-full opacity-30" style={{ animation: 'pulse-dot 4s ease-in-out infinite 1s' }} />
            <div className="absolute bottom-[20%] left-[20%] w-1 h-1 bg-cyan-300 rounded-full opacity-30" style={{ animation: 'pulse-dot 3.5s ease-in-out infinite 0.5s' }} />
            <div className="absolute bottom-[35%] right-[10%] w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-20" style={{ animation: 'pulse-dot 5s ease-in-out infinite 2s' }} />
            <div className="absolute top-[60%] left-[5%] w-1 h-1 bg-teal-400 rounded-full opacity-25" style={{ animation: 'pulse-dot 4.5s ease-in-out infinite 1.5s' }} />
          </>
        )}
      </div>

      {/* Main Card */}
      <div
        className={`relative z-10 w-full max-w-[460px] mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block bg-white px-5 py-2 rounded-xl shadow-lg border border-white/20">
            <Logo size="small" />
          </Link>
        </div>

        {/* Glass Card */}
        <div
          className="backdrop-blur-xl rounded-2xl border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 25px 60px -10px rgba(0,0,0,0.5), 0 0 40px -15px rgba(0,188,212,0.15)',
          }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-2">
            <h3 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome Back</h3>
            <p className="text-slate-400 text-sm">
              Sign in to your IELTS exam portal
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-4">
            {/* Error */}
            {error && (
              <div
                className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <FiAlertCircle className="text-red-400 flex-shrink-0" size={16} />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                  <input
                    type="email"
                    name="email"
                    id="login-email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: validationErrors.email
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => {
                      if (!validationErrors.email) e.target.style.border = '1px solid rgba(0,188,212,0.5)';
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = '0 0 20px -5px rgba(0,188,212,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = validationErrors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)';
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1.5 text-red-400 text-xs">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="login-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: validationErrors.password
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => {
                      if (!validationErrors.password) e.target.style.border = '1px solid rgba(0,188,212,0.5)';
                      e.target.style.background = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = '0 0 20px -5px rgba(0,188,212,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = validationErrors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)';
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPassword ? (
                      <MdOutlineVisibilityOff size={18} />
                    ) : (
                      <MdOutlineRemoveRedEye size={18} />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1.5 text-red-400 text-xs">{validationErrors.password}</p>
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
                    <div className="w-[18px] h-[18px] rounded-[5px] border transition-all peer-checked:bg-cyan-500 peer-checked:border-cyan-500"
                      style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                    >
                      {rememberMe && (
                        <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full relative py-3 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{
                  background: loading
                    ? 'rgba(0,188,212,0.3)'
                    : 'linear-gradient(135deg, #00bcd4 0%, #0097a7 50%, #00838f 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px -5px rgba(0,188,212,0.4)',
                }}
              >
                {/* Hover shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
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
            <div
              className="mt-6 p-3.5 rounded-xl flex items-start gap-3"
              style={{
                background: 'rgba(0,188,212,0.06)',
                border: '1px solid rgba(0,188,212,0.1)',
              }}
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-[10px]">ℹ</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Students:</span> Use your registered email and phone number as password.
              </p>
            </div>

            {/* Back Link */}
            <div className="mt-5 text-center">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
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
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Jibon Education. All rights reserved.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(15px, -20px); }
          66% { transform: translate(-10px, 15px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Login;
