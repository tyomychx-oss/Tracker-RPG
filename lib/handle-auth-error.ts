"use client"

import { toast } from "sonner"

/**
 * Checks if an error is an authentication-related error
 */
export function isAuthError(error: any): boolean {
    if (!error) return false

    const message = error?.message?.toLowerCase() || ""
    const code = error?.code || ""

    return (
        message.includes("auth session missing") ||
        message.includes("jwt expired") ||
        message.includes("not logged in") ||
        message.includes("session missing") ||
        message.includes("invalid jwt") ||
        message.includes("refresh token") ||
        code === "PGRST301" || // PostgREST auth error
        code === "401"
    )
}

/**
 * Handles Supabase errors with user-friendly toast notifications
 * Returns true if it was an auth error (so caller can take action)
 */
export function handleSupabaseError(error: any, context?: string): boolean {
    if (!error) return false

    console.error(`Supabase Error${context ? ` (${context})` : ""}:`, error)

    if (isAuthError(error)) {
        toast.error("Session expired", {
            description: "Please log out and log in again.",
            action: {
                label: "Login",
                onClick: () => {
                    window.location.href = "/auth/login"
                }
            },
            duration: 10000 // Show for 10 seconds
        })
        return true
    }

    // Generic database error
    toast.error("Something went wrong", {
        description: error?.message || "Please try again later.",
        duration: 5000
    })
    return false
}

/**
 * Wraps an async function with auth error handling
 */
export async function withAuthErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string
): Promise<T | null> {
    try {
        return await fn()
    } catch (error) {
        handleSupabaseError(error, context)
        return null
    }
}
