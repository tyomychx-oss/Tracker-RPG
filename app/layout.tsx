import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gamified Life RPG",
  description: "A minimalist cyberpunk dashboard for tracking your life like an RPG",
  generator: "v0.app",
  icons: {
    icon: "/brand-logo.jpg",
    apple: "/brand-logo.jpg",
  },
}

import { Providers } from "@/app/providers"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
