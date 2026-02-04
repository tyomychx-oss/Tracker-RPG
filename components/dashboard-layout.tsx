"use client"

import type React from "react"
import { SkillsListEditable } from "@/components/skills-list-editable"
import { SettingsPage } from "@/components/settings-page"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LayoutDashboard, Zap, BarChart3, Settings, LogOut, Menu, Bot, User, Medal, Crown, BookOpen, Store } from "lucide-react"
import { useState, useEffect as useEffectReact } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useNickname, useUIColor, useXP, useSkills, useSkillXP, useSkillColors, useRecentActivity, useQuests, useSparks } from "@/components/providers"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ReferenceArea } from "recharts"
import { DatabaseSync } from "@/components/database-sync"
import { SystemGuide } from "@/components/system-guide"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

const navigation = [
  { name: "Main", icon: LayoutDashboard },
  { name: "Areas", icon: Zap },
  { name: "Shop", icon: Store },
  { name: "Statistics", icon: BarChart3 },
  { name: "Settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ALL HOOKS MUST BE AT THE TOP - React requires hooks to be called in the same order every render
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // All useState hooks
  const [activeNav, setActiveNav] = useState("Main")
  const [mounted, setMounted] = useState(false)
  const [showSystemGuide, setShowSystemGuide] = useState(false)

  // All context hooks - must be called unconditionally
  const { nickname } = useNickname()
  const { uiColor } = useUIColor()
  const { totalXP, currentLevel, maxXP } = useXP()
  const { sparks } = useSparks()

  // Derived values (not hooks)
  const xpProgress = (totalXP / maxXP) * 100

  // All useEffect hooks
  useEffectReact(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (pathname === "/shop") {
      setActiveNav("Shop")
    } else if (pathname === "/") {
      if (activeNav === "Shop") setActiveNav("Main")
    }
  }, [pathname])

  // Handler functions (not hooks)
  const handleNavigation = (name: string) => {
    if (name === "Shop") {
      router.push("/shop")
      return
    }

    if (pathname === "/shop") {
      router.push("/")
      setTimeout(() => setActiveNav(name), 0)
    } else {
      setActiveNav(name)
    }
  }

  const getLevelConfig = (lvl: number) => {
    if (lvl >= 20) {
      return {
        title: "Legend",
        icon: Crown,
        containerStyles:
          "h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-transparent bg-transparent bg-clip-border bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-[0_0_30px_rgba(239,68,68,0.9),0_0_60px_rgba(249,115,22,0.6)] animate-pulse flex items-center justify-center",
        iconColor: "text-orange-300",
        textStyles: "text-orange-300",
      }
    }
    if (lvl >= 15) {
      return {
        title: "Elite",
        icon: Zap,
        containerStyles:
          "h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-violet-500 bg-transparent shadow-[0_0_25px_rgba(139,92,246,0.8)] flex items-center justify-center",
        iconColor: "text-violet-400",
        textStyles: "text-violet-400",
      }
    }
    if (lvl >= 10) {
      return {
        title: "Pro",
        icon: Medal,
        containerStyles:
          "h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-amber-400 bg-transparent shadow-[0_0_20px_rgba(251,191,36,0.7)] flex items-center justify-center",
        iconColor: "text-amber-400",
        textStyles: "text-amber-400",
      }
    }
    if (lvl >= 5) {
      return {
        title: "User",
        icon: User,
        containerStyles:
          "h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-sky-400 bg-transparent shadow-[0_0_15px_rgba(56,189,248,0.6)] flex items-center justify-center",
        iconColor: "text-sky-400",
        textStyles: "text-sky-400",
      }
    }
    return {
      title: "NPC",
      icon: Bot,
      containerStyles:
        "h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-slate-400 bg-transparent shadow-[0_0_10px_rgba(148,163,184,0.4)] flex items-center justify-center",
      iconColor: "text-slate-400",
      textStyles: "text-slate-400",
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-primary font-mono">RPG Life Tracker</h1>
        <p className="text-xs text-muted-foreground mt-1">TRACKER v1.0</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = activeNav === item.name
          const isShop = item.name === "Shop"
          const href = isShop ? "/shop" : "/"
          // Only use uiColor after hydration to prevent mismatch
          const activeColor = mounted ? uiColor : undefined

          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start transition-colors"
              style={
                isActive && activeColor
                  ? {
                    backgroundColor: activeColor,
                    color: "white",
                  }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isActive && activeColor) {
                  e.currentTarget.style.backgroundColor = `${activeColor}33`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <Link href={href} onClick={() => setActiveNav(item.name)}>
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-foreground hover:bg-muted transition-colors mb-2"
          onClick={() => setShowSystemGuide(true)}
        >
          <BookOpen className="mr-3 h-4 w-4" />
          System Manual
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-foreground hover:bg-muted transition-colors"
          onClick={async () => {
            const { createClient } = await import("@/utils/supabase/client")
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = "/auth/sign-in"
          }}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      <DatabaseSync />
      <SystemGuide open={showSystemGuide} onOpenChange={setShowSystemGuide} />
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {mounted ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              )}
              {!mounted ? (
                <>
                  {/* Skeleton that matches server render to prevent hydration mismatch */}
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-slate-400 bg-transparent shadow-[0_0_10px_rgba(148,163,184,0.4)] flex items-center justify-center">
                    <Bot className="h-5 w-5 md:h-6 md:w-6 text-slate-400" />
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <h2 className="text-lg font-semibold">User</h2>
                    <span className="text-xs text-slate-400">NPC</span>
                  </div>
                </>
              ) : (
                (() => {
                  const cfg = getLevelConfig(currentLevel)
                  const Icon = cfg.icon
                  return (
                    <>
                      <div className={cfg.containerStyles}>
                        <Icon className={`h-5 w-5 md:h-6 md:w-6 ${cfg.iconColor}`} />
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <h2 className="text-lg font-semibold">{nickname}</h2>
                        <span className={`text-xs ${cfg.textStyles}`}>{cfg.title}</span>
                      </div>
                    </>
                  )
                })()
              )}
            </div>

            {/* Right side: Sparks Counter + Level/XP */}
            <div className="flex items-center gap-4 ml-auto mr-8">
              {!mounted ? (
                <>
                  {/* Skeleton Sparks Counter */}
                  <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                    <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span className="font-mono font-bold text-orange-500">0</span>
                  </div>

                  {/* Skeleton Level and XP Progress */}
                  <div className="max-w-md w-48 md:w-64">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-mono text-primary">LEVEL 1</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-mono">
                        0 / 200 XP
                      </span>
                    </div>
                    <Progress value={0} className="h-2 md:h-3 bg-secondary">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `0%` }}
                      />
                    </Progress>
                  </div>
                </>
              ) : (
                <>
                  {/* Sparks Counter */}
                  <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                    <Zap className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="font-mono font-bold text-orange-500">{sparks}</span>
                  </div>

                  {/* Level and XP Progress */}
                  <div className="max-w-md w-48 md:w-64">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-mono text-primary">LEVEL {currentLevel}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-mono">
                        {totalXP} / {maxXP} XP
                      </span>
                    </div>
                    <Progress value={xpProgress} className="h-2 md:h-3 bg-secondary">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </Progress>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {(activeNav === "Main" || activeNav === "Shop") && children}
          {activeNav === "Statistics" && <StatisticsContent uiColor={uiColor} />}
          {activeNav === "Areas" && <SkillsListEditable />}
          {activeNav === "Settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}

function StatisticsContent({ uiColor }: { uiColor: string }) {
  return <StatisticsView uiColor={uiColor} />
}

function StatisticsView({ uiColor }: { uiColor: string }) {
  const [hoveredXPIndex, setHoveredXPIndex] = useState<number | null>(null)
  const [hoveredLevelIndex, setHoveredLevelIndex] = useState<number | null>(null)
  const { skills, hasSkills } = useSkills()
  const { skillXPs } = useSkillXP()
  const { skillColors } = useSkillColors()
  const { activities } = useRecentActivity()
  const { quests } = useQuests()
  const { totalXP, currentLevel, maxXP } = useXP()

  let accumulatedXP = totalXP
  let tempLevel = 1
  let tempMax = 200 // або твоє стартове значення
  while (tempLevel < currentLevel) {
    accumulatedXP += tempMax
    tempLevel += 1
    tempMax = Math.floor(tempMax * 1.4) // або твоя формула прогресії
  }

  if (!hasSkills) {
    return (
      <div className="max-w-7xl">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Statistics</h2>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No areas yet. Add areas in the Areas tab!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSkillLevel = (xp: number) => Math.floor(xp / 100) + 1
  const getSkillProgress = (xp: number) => xp % 100

  // Prepare data for pie chart (skill percentages)
  const skillsWithData = skills.map((name) => ({
    name,
    xp: skillXPs[name] || 0,
    color: skillColors[name] || uiColor,
  }))

  const totalSkillXP = skillsWithData.reduce((sum, skill) => sum + skill.xp, 0)

  const pieChartData = skillsWithData
    .filter((skill) => skill.xp > 0)
    .map((skill) => ({
      ...skill,
      value: totalSkillXP > 0 ? Math.round((skill.xp / totalSkillXP) * 100) : 0,
    }))

  // Prepare data for bar chart (skill XP comparison)
  const barChartData = skillsWithData.map((skill) => ({
    name: skill.name,
    XP: skill.xp,
    Level: getSkillLevel(skill.xp),
    color: skill.color,
  }))

  // Prepare data for daily XP progress
  const dailyXPData: Record<string, { total: number; tasks: number; daily: number; habits: number }> = {}
  activities.forEach((activity) => {
    if (typeof activity.xp === "number") {
      const d = new Date(activity.timestamp)
      const monthShort = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
      const day = d.getUTCDate()
      const date = `${monthShort} ${day}`
      dailyXPData[date] = {
        total: (dailyXPData[date]?.total || 0) + activity.xp,
        tasks: dailyXPData[date]?.tasks || 0,
        daily: dailyXPData[date]?.daily || 0,
        habits: dailyXPData[date]?.habits || 0,
      }
    }
  })

  let dailyChartData = Object.entries(dailyXPData)
    .map(([date, stats]) => ({
      date,
      XP: Math.max(0, stats.total),
      Tasks: stats.tasks,
      Daily: stats.daily,
      Habits: stats.habits
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date + ', 2024').getTime()
      const dateB = new Date(b.date + ', 2024').getTime()
      return dateA - dateB
    })
    .slice(-7)

  if (dailyChartData.length > 0) {
    dailyChartData = [{ date: '', XP: 0, Tasks: 0, Daily: 0, Habits: 0 }, ...dailyChartData]
  }

  // Prepare data for skill level comparison
  const levelChartData = skillsWithData.map((skill) => ({
    name: skill.name,
    Level: getSkillLevel(skill.xp),
    color: skill.color,
  }))

  // Calculate quest completion stats
  const allQuests = [...quests.plans, ...quests.dailies, ...quests.habits]
  const completedQuests = allQuests.filter((q) => q.completed).length
  const totalQuests = allQuests.length
  const completionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  // XP by skill category
  const xpBySkill = skillsWithData
    .filter((s) => s.xp > 0)
    .sort((a, b) => b.xp - a.xp)

  return (
    <div className="max-w-7xl space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Statistics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Area Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle style={{ color: uiColor }}>
              AREA DISTRIBUTION (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Complete tasks to earn XP and see distribution!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                          sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A', location: 'dashboard-layout.tsx:264', message: 'Tooltip render', data: { active, payload }, timestamp: Date.now()
                        })
                      }).catch(() => { });
                      // #endregion

                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const percent = d.value;
                      const xp = d.xp;
                      const lvl = Math.floor(xp / 100) + 1;
                      const name = d.name;
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', minWidth: '120px', color: 'var(--foreground)' }}>
                          <div><b>{name}</b></div>
                          <div>{percent}%</div>
                          <div>{xp} XP</div>
                          <div>Lv. {lvl}</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                      <span className="text-sm text-foreground">
                        {value}: {entry.payload.value}%
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Area XP Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle style={{ color: uiColor }}>
              AREA XP COMPARISON
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barChartData}
                  onMouseMove={(state: any) => setHoveredXPIndex(state?.activeTooltipIndex ?? null)}
                  onMouseLeave={() => setHoveredXPIndex(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  {hoveredXPIndex !== null && (
                    <ReferenceArea
                      x1={barChartData[hoveredXPIndex]?.name}
                      x2={barChartData[hoveredXPIndex]?.name}
                      fill="rgba(60,60,65,0.35)"
                      strokeOpacity={0}
                    />
                  )}
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#27272a' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const xp = d.XP;
                      const name = d.name;
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', minWidth: '120px', color: 'var(--foreground)' }}>
                          <div><b>{name}</b></div>
                          <div>XP - {xp}</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="XP" radius={[4, 4, 0, 0]} barSize={70}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily XP Progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle style={{ color: uiColor }}>
              DAILY XP PROGRESS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Complete tasks to see daily progress!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    dailyChartData.length
                      ? [{ date: dailyChartData[0].date, XP: 0 }, ...dailyChartData]
                      : dailyChartData
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.2)' }}
                    content={({ active, payload }) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                          sessionId: 'debug-session', runId: 'run2', hypothesisId: 'B', location: 'dashboard-layout.tsx:334', message: 'Skill XP Comparison Tooltip', data: { active, payload }, timestamp: Date.now()
                        })
                      }).catch(() => { });
                      // #endregion
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const xp = d.XP;
                      const date = d.date;
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', minWidth: '140px', color: 'var(--foreground)' }}>
                          <div><b>{date}</b></div>
                          <div>Daily XP +{xp}</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="XP"
                    stroke={uiColor}
                    strokeWidth={2}
                    dot={{ fill: uiColor, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Area Levels Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle style={{ color: uiColor }}>
              AREA LEVELS COMPARISON
            </CardTitle>
          </CardHeader>
          <CardContent>
            {levelChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={levelChartData}
                  onMouseMove={(state: any) => setHoveredLevelIndex(state?.activeTooltipIndex ?? null)}
                  onMouseLeave={() => setHoveredLevelIndex(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  {hoveredLevelIndex !== null && (
                    <ReferenceArea
                      x1={levelChartData[hoveredLevelIndex]?.name}
                      x2={levelChartData[hoveredLevelIndex]?.name}
                      fill="rgba(60,60,65,0.35)"
                      strokeOpacity={0}
                    />
                  )}
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.2)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const name = d.name;
                      const level = d.Level;
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', minWidth: '120px', color: 'var(--foreground)' }}>
                          <div><b>{name}</b></div>
                          <div>Level - {level}</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="Level" radius={[4, 4, 0, 0]} barSize={70}>
                    {levelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm" style={{ color: uiColor }}>
              TOTAL XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{accumulatedXP.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">Level {currentLevel}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm" style={{ color: uiColor }}>
              QUEST COMPLETION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completionRate}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {completedQuests} / {totalQuests} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm" style={{ color: uiColor }}>
              ACTIVE AREAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{skills.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Areas tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Areas by XP */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle style={{ color: uiColor }}>
            TOP AREAS BY XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          {xpBySkill.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No XP earned yet</p>
          ) : (
            <div className="space-y-4">
              {xpBySkill.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-semibold text-foreground">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="text-sm font-mono text-foreground">Level {getSkillLevel(skill.xp)}</span>
                      <span className="text-sm font-mono text-foreground">{skill.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <Progress
                    value={(skill.xp / (xpBySkill[0]?.xp || 1)) * 100}
                    className="h-2 bg-secondary"
                    style={{ "--progress-color": skill.color } as any}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
