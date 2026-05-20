"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children, role }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      // login না করলে redirect
      router.replace("/login");
      return;
    }

    const userObj = JSON.parse(user);
    if (role && userObj.role !== role) {
      // role mismatch হলে redirect
      router.replace("/login");
      return;
    }
  }, [router, role]);

  return <>{children}</>;
};

export default ProtectedRoute;
