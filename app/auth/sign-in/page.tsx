"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const [showEmailSuggestion, setShowEmailSuggestion] = useState(false)

  useEffect(() => {
    try {
      const last = typeof window !== "undefined" ? localStorage.getItem("lastEmail") : null
      if (last) setEmailSuggestion(last)
    } catch {}
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const msg = error.message?.toLowerCase() || ""
        
        if (msg.includes("email not confirmed")) {
           setError("Verify your email!")
        } 
        else if (msg.includes("invalid login credentials")) {
           setError("Account doesn't exist or wrong password!")
        } 
        else {
           setError(error.message)
        }
        
        setLoading(false)
        return
      }

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("lastEmail", email)
        }
      } catch {}

      // Завантажуємо профіль з Supabase і зберігаємо в localStorage
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle()

          if (profile) {
            const userProfile = {
              nickname: profile.nickname || "",
              totalXP: profile.total_xp || 0,
              currentLevel: profile.current_level || 1,
              maxXP: profile.max_xp || 200,
              sparks: profile.sparks || 0,
              skillXPs: profile.skill_xps || {},
              skillColors: profile.skill_colors || {},
              quests: profile.quests || { plans: [], dailies: [], habits: [] },
              activities: profile.activities || [],
              uiColor: profile.ui_color || "#de6550",
              archivedAreas: profile.archived_areas || [],
            }
            localStorage.setItem("currentUserProfile", JSON.stringify(userProfile))
            if (profile.nickname) {
              localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(userProfile))
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync profile from server:", err)
      }

      router.push("/")
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center font-mono text-primary">
            SIGN IN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => {
                  setError("")
                  setShowEmailSuggestion(true)
                }}
                className="bg-input"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
              {/* English text here now */}
              {showEmailSuggestion && emailSuggestion && (
                <div className="mt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion)
                      setShowEmailSuggestion(false)
                    }}
                    className="px-2 py-1 rounded border border-muted-foreground/20 text-muted-foreground hover:bg-muted/20"
                  >
                    Use: {emailSuggestion}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setError("")}
                className="bg-input"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}