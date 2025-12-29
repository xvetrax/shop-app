"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "@/components/ui/GoogleLoginButton";

export default function AdminLoginPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signOutUser,
    isAdmin,
    adminConfigured,
  } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/products";

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // ✅ redirectinam tik kai tikrai žinom atsakymą
    if (user && isAdmin === true) router.replace(nextPath);
    if (user && isAdmin === false) router.replace("/");
    // if (isAdmin === null) -> nieko nedarom (pvz. env nesukonfigūruotas)
  }, [loading, user, isAdmin, nextPath, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-gray-600 mb-6">
          Sign in with your admin Google account.
        </p>

        {/* ✅ aiški klaida jei prod'e neįdėtas NEXT_PUBLIC_ADMIN_EMAIL */}
        {!adminConfigured && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-left">
            Missing <b>NEXT_PUBLIC_ADMIN_EMAIL</b> in production environment.
            <div className="mt-2 text-sm text-red-700">
              Add it in your hosting provider env vars and redeploy.
            </div>
          </div>
        )}

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {authError}
          </div>
        )}

        <GoogleLoginButton
          onClick={async () => {
            setAuthError(null);
            try {
              await signInWithGoogle(); // popup
              // redirect happens via useEffect once isAdmin becomes true
            } catch (e: any) {
              console.error("Error signing in with Google:", e);
              setAuthError(e?.message ?? "Login failed. Please try again.");
            }
          }}
        />

        {/* show sign out if logged in but not admin */}
        {user && isAdmin === false && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">
              You are logged in as <b>{user.email}</b> but not an admin.
            </p>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={async () => {
                setAuthError(null);
                try {
                  await signOutUser();
                  router.replace("/admin/login");
                } catch (e: any) {
                  console.error("Error signing out:", e);
                  setAuthError(e?.message ?? "Sign out failed.");
                }
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* jei user yra, bet isAdmin null (pvz env nesukonfigūruotas) */}
        {user && isAdmin === null && (
          <div className="mt-6 text-sm text-neutral-600 text-left">
            You are signed in as <b>{user.email}</b>, but admin access cannot be verified.
          </div>
        )}
      </div>
    </div>
  );
}