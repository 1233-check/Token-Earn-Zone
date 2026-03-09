"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
    supabase,
    signUp as supaSignUp,
    signIn as supaSignIn,
    signOut as supaSignOut,
    getUserProfile,
} from "@/lib/supabase";

interface UserProfile {
    id: string;
    email: string;
    unique_id: string;
    full_name: string | null;
    wallet_address: string | null;
    total_balance: number;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const prof = await getUserProfile(userId);
        setProfile(prof);
    };

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
                await fetchProfile(currentSession.user.id);
            }
            setIsLoading(false);
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    // Small delay to allow the trigger to create the users row
                    if (_event === 'SIGNED_IN') {
                        setTimeout(() => fetchProfile(newSession.user.id), 500);
                    } else {
                        await fetchProfile(newSession.user.id);
                    }
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignUp = async (email: string, password: string, fullName?: string) => {
        const { error } = await supaSignUp(email, password, fullName);
        return { error };
    };

    const handleSignIn = async (email: string, password: string) => {
        const { error } = await supaSignIn(email, password);
        return { error };
    };

    const handleSignOut = async () => {
        await supaSignOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                signUp: handleSignUp,
                signIn: handleSignIn,
                signOut: handleSignOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
