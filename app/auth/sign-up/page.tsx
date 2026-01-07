"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setLoading(true)

    if (!nickname.trim()) {
      setError("Nickname is required")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nickname: nickname.trim(),
          },
        },
      })

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || ""
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setError("Account already exists. Sign in!")
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      // Успішна реєстрація
      setSuccessMsg("Verify your email!")
      setLoading(false)
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
            SIGN UP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Блок помилки */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Блок успіху */}
          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-md text-green-500 text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-foreground">
                Nickname
              </Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onFocus={() => {
                  setError("")
                  setSuccessMsg("")
                }}
                className="bg-input"
                placeholder="Your name"
                required
                disabled={loading}
              />
            </div>

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
                  setSuccessMsg("")
                }}
                className="bg-input"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
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
                onFocus={() => {
                  setError("")
                  setSuccessMsg("")
                }}
                className="bg-input"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}