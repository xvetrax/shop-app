"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { auth as firebaseAuth } from "@/lib/firebase";
import {
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  /** true/false kai žinom, null kai dar “neapsisprendėm” */
  isAdmin: boolean | null;

  /** ar sukonfigūruotas NEXT_PUBLIC_ADMIN_EMAIL */
  adminConfigured: boolean;

  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ svarbu: NEXT_PUBLIC_* turi būti sukonfigūruotas produkcijoje
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const adminConfigured = useMemo(() => ADMIN_EMAIL.length > 0, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = useMemo((): boolean | null => {
    // kol kraunam auth state — neteisiam
    if (loading) return null;

    // jei nėra user — nėra admin
    if (!user?.email) return false;

    // jei prod'e neįdėtas env — geriau grąžinti null (kad UI rodytų klaidą, o ne mestų į home)
    if (!adminConfigured) return null;

    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user, loading, adminConfigured]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  };

  const signOutUser = async () => {
    await signOut(firebaseAuth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        adminConfigured,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export const auth = firebaseAuth;