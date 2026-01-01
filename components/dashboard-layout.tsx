"use client"

import type React from "react"
import { SkillsListEditable } from "@/components/skills-list-editable"
import { SettingsPage } from "@/components/settings-page"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LayoutDashboard, Zap, BarChart3, Settings, LogOut } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNickname, useUIColor, useXP, useSkills, useSkillXP, useSkillColors, useRecentActivity, useQuests } from "@/components/providers"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts"

const navigation = [
  { name: "Main", icon: LayoutDashboard },
  { name: "Skills", icon: Zap },
  { name: "Statistics", icon: BarChart3 },
  { name: "Settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeNav, setActiveNav] = useState("Main")
  const { nickname } = useNickname()
  const { uiColor } = useUIColor()
  const { totalXP, currentLevel, maxXP } = useXP()
  const xpProgress = (totalXP / maxXP) * 100

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-primary font-mono">VIBECODING</h1>
          <p className="text-xs text-muted-foreground mt-1">TRACKER v1.0</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={activeNav === item.name ? "default" : "ghost"}
              className="w-full justify-start transition-colors"
              style={
                activeNav === item.name
                  ? {
                      backgroundColor: uiColor,
                      color: "white",
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (activeNav !== item.name) {
                  e.currentTarget.style.backgroundColor = `${uiColor}33`
                }
              }}
              onMouseLeave={(e) => {
                if (activeNav !== item.name) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
              onClick={() => setActiveNav(item.name)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 transition-colors"
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {getInitials(nickname)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{nickname}</h2>
                <p className="text-sm text-muted-foreground">Level {currentLevel} Tracker</p>
              </div>
            </div>

            <div className="flex-1 max-w-md ml-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-primary">LEVEL {currentLevel}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {totalXP} / {maxXP} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-3 bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </Progress>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {activeNav === "Main" && children}
          {activeNav === "Statistics" && <StatisticsContent uiColor={uiColor} />}
          {activeNav === "Skills" && <SkillsListEditable />}
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
  const { skills, hasSkills } = useSkills()
  const { skillXPs } = useSkillXP()
  const { skillColors } = useSkillColors()
  const { activities } = useRecentActivity()
  const { quests } = useQuests()
  const { totalXP, currentLevel } = useXP()

  if (!hasSkills) {
    return (
      <div className="max-w-7xl">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Statistics</h2>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No skills yet. Add skills in the Skills tab!</p>
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
  const dailyXPData: Record<string, number> = {}
  activities.forEach((activity) => {
    if (activity.xp && activity.xp > 0) {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyXPData[date] = (dailyXPData[date] || 0) + activity.xp
    }
  })

  const dailyChartData = Object.entries(dailyXPData)
    .map(([date, xp]) => ({ date, XP: xp }))
    .sort((a, b) => {
      const dateA = new Date(a.date + ', 2024').getTime()
      const dateB = new Date(b.date + ', 2024').getTime()
      return dateA - dateB
    })
    .slice(-14) // Last 14 days

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
        {/* Pie Chart - Skill Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono" style={{ color: uiColor }}>
              SKILL DISTRIBUTION (%)
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
                    fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361',{
                      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
                        sessionId:'debug-session',runId:'run1',hypothesisId:'A',location:'dashboard-layout.tsx:264',message:'Tooltip render',data:{active,payload},timestamp:Date.now()
                      })
                    }).catch(()=>{});
                    // #endregion

                    if (!active || !payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    const percent = d.value;
                    const xp = d.xp;
                    const lvl = Math.floor(xp / 100) + 1;
                    const name = d.name;
                    return (
                      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'6px',padding:'8px',minWidth:'120px',color:'var(--foreground)'}}>
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

        {/* Bar Chart - Skill XP Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono" style={{ color: uiColor }}>
              SKILL XP COMPARISON
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361',{
                        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                          sessionId:'debug-session',runId:'run2',hypothesisId:'B',location:'dashboard-layout.tsx:334',message:'Skill XP Comparison Tooltip',data:{active,payload},timestamp:Date.now()
                        })
                      }).catch(()=>{});
                      // #endregion
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const xp = d.XP;
                      const name = d.name;
                      return (
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'6px',padding:'8px',minWidth:'120px',color:'var(--foreground)'}}>
                          <div><b>{name}</b></div>
                          <div>{xp} XP</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="XP" radius={[4, 4, 0, 0]}>
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
            <CardTitle className="font-mono" style={{ color: uiColor }}>
              DAILY XP PROGRESS (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Complete tasks to see daily progress!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361',{
                        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                          sessionId:'debug-session',runId:'run2',hypothesisId:'B',location:'dashboard-layout.tsx:334',message:'Skill XP Comparison Tooltip',data:{active,payload},timestamp:Date.now()
                        })
                      }).catch(()=>{});
                      // #endregion
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const xp = d.XP;
                      const name = d.name;
                      return (
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'6px',padding:'8px',minWidth:'120px',color:'var(--foreground)'}}>
                          <div><b>{name}</b></div>
                          <div>{xp} XP</div>
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

        {/* Skill Levels Comparison */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono" style={{ color: uiColor }}>
              SKILL LEVELS COMPARISON
            </CardTitle>
          </CardHeader>
          <CardContent>
            {levelChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={levelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/252e63c3-cf19-4629-b606-81d571c6b361',{
                        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                          sessionId:'debug-session',runId:'run2',hypothesisId:'B',location:'dashboard-layout.tsx:334',message:'Skill XP Comparison Tooltip',data:{active,payload},timestamp:Date.now()
                        })
                      }).catch(()=>{});
                      // #endregion
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      const xp = d.XP;
                      const name = d.name;
                      return (
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'6px',padding:'8px',minWidth:'120px',color:'var(--foreground)'}}>
                          <div><b>{name}</b></div>
                          <div>{xp} XP</div>
                        </div>
                      );
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="Level" radius={[4, 4, 0, 0]}>
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
            <CardTitle className="font-mono text-sm" style={{ color: uiColor }}>
              TOTAL XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalXP.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">Level {currentLevel}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono text-sm" style={{ color: uiColor }}>
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
            <CardTitle className="font-mono text-sm" style={{ color: uiColor }}>
              ACTIVE SKILLS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{skills.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Skills tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills by XP */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono" style={{ color: uiColor }}>
            TOP SKILLS BY XP
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
                      <span
                        className="font-semibold text-foreground"
                        style={{ color: skill.color }}
                      >
                        {skill.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Level {getSkillLevel(skill.xp)})
                      </span>
                    </div>
                    <span className="text-sm font-mono text-foreground">{skill.xp.toLocaleString()} XP</span>
                  </div>
                  <Progress
                    value={(skill.xp / (xpBySkill[0]?.xp || 1)) * 100}
                    className="h-2 bg-secondary"
                    style={{ "--skill-color": skill.color } as any}
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
