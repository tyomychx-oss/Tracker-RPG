"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { useSkillColors, useSkillXP, useSkills } from "@/components/providers"

export function CharacterStats() {
  const { skillColors } = useSkillColors()
  const { skillXPs } = useSkillXP()
  const { skills: skillsList } = useSkills()

  const skillsWithData = skillsList.map((name) => ({
    name,
    xp: skillXPs[name] || 0,
    color: skillColors[name] || "#de6550",
  }))

  const totalXP = skillsWithData.reduce((sum, skill) => sum + skill.xp, 0)

  const personalityData = skillsWithData
    .filter((skill) => skill.xp > 0)
    .map((skill) => ({
      ...skill,
      value: totalXP > 0 ? Math.round((skill.xp / totalXP) * 100) : 0,
    }))

  const skills = skillsWithData.map(({ name, xp }) => {
    const level = Math.floor(xp / 100) + 1
    const progress = xp % 100
    return { name, level, progress }
  })

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary font-mono">PERSONALITY COMPOSITION</CardTitle>
        </CardHeader>
        <CardContent>
          {skillsList.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No areas yet. Add areas in the Areas tab to get started!
            </div>
          ) : personalityData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No statistics yet. Complete tasks to earn XP!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={personalityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {personalityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
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

      <Card className="bg-card border-border">
          <CardHeader>
          <CardTitle className="text-accent font-mono">ACTIVE AREAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsList.length === 0 ? (
              <div className="text-muted-foreground text-sm text-center py-4">
              No areas yet. Add areas in the Areas tab!
              </div>
            ) : (
              skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{skill.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{skill.progress}%</span>
                </div>
                <Progress
                  value={skill.progress}
                  className="h-2 bg-secondary"
                  style={
                    {
                      "--progress-color": skillColors[skill.name] || "#de6550",
                    } as React.CSSProperties
                  }
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
