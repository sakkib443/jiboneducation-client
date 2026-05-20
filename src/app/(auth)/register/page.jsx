"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUserLock, FaUserShield, FaArrowLeft } from "react-icons/fa";
import Logo from "@/components/Logo";

const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="mx-auto" />
        </div>

        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold mb-8 transition-colors"
        >
          <FaArrowLeft /> Back to Login
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Icon Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-12 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/30">
              <FaUserLock className="text-5xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Registration Not Available
            </h1>
            <p className="text-indigo-100 text-lg">
              Student accounts are created by administrators only
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaUserShield className="text-2xl text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 text-lg mb-2">
                      How to Get Started
                    </h3>
                    <p className="text-indigo-700 leading-relaxed">
                      Student accounts are registered by our administrative team. When you're enrolled for the IELTS exam, an account will be automatically created for you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-lg">What You'll Receive:</h3>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Exam ID</h4>
                    <p className="text-slate-600 text-sm">
                      A unique exam ID (e.g., JEIELTS260001) for your exam session
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Login Credentials</h4>
                    <p className="text-slate-600 text-sm">
                      Your email and password will be provided by the admin after registration
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Dashboard Access</h4>
                    <p className="text-slate-600 text-sm">
                      Full access to your student dashboard, exam modules, and results
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-slate-700 mb-4">
                  Already have an account? Sign in to access your dashboard.
                </p>
                <Link
                  href="/login"
                  className="block w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all text-center"
                >
                  Go to Login Page
                </Link>
              </div>

              {/* Contact Support */}
              <div className="bg-slate-50 rounded-xl p-6 text-center">
                <p className="text-slate-600 text-sm mb-3">
                  Need help or have questions about registration?
                </p>
                <a
                  href="mailto:admin@ielts.com"
                  className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  Contact Administrator →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Jibon Education IELTS Examination System © 2024
        </p>
      </div>
    </div>
  );
};

export default Register;
