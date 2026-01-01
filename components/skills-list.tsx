"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSkillColors, useUIColor, useSkillXP, useSkills } from "@/components/providers"

const BASIC_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#10b981",
  "#059669",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#a855f7",
]

export function SkillsList() {
  const { skillColors } = useSkillColors()
  const { uiColor } = useUIColor()
  const { skillXPs } = useSkillXP()
  const { skills: skillsList } = useSkills()
  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const [editingSkillName, setEditingSkillName] = useState("")

  const skills = skillsList.map((name) => {
    const xp = skillXPs[name] || 0
    const level = Math.floor(xp / 100) + 1
    const nextLevelXP = level * 100
    const progress = xp % 100
    return { name, level, xp, nextLevelXP, progress }
  })

  const handleEdit = (skillName: string) => {
    setEditingSkill(skillName)
    setEditingSkillName(skillName)
  }

  const handleColorSelect = (color: string) => {
    if (editingSkill) {
      // Placeholder for setting skill color, implementation needed
    }
  }

  const handleClose = () => {
    setEditingSkill(null)
    setEditingSkillName("")
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono" style={{ color: uiColor }}>
            ACTIVE SKILLS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-4">
              No skills yet. Go to Skills tab to create your first skill!
            </div>
          ) : (
            skills.map((skill, index) => {
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">lvl {skill.level}</span>
                      <span className="text-[10px] text-muted-foreground/80">{skill.xp} XP</span>
                    </div>
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
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary font-mono">EDIT SKILL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name" className="text-sm text-foreground">
                Skill Name
              </Label>
              <Input
                id="skill-name"
                value={editingSkillName}
                onChange={(e) => setEditingSkillName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Choose skill color</Label>
              <div className="grid grid-cols-12 gap-1">
                {BASIC_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="aspect-square rounded border border-border hover:border-foreground transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
