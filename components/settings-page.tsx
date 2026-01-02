"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useNickname, useUIColor, useXP, useSkillXP, useSkills, useRecentActivity, useQuests } from "@/components/providers"

const INTERFACE_COLORS = [
  { name: "Terracotta", value: "#de6550" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
]

export function SettingsPage() {
  const { nickname, setNickname } = useNickname()
  const { uiColor, setUIColor } = useUIColor()
  const { resetXP } = useXP()
  const { skillXPs, removeSkillXP, resetSkillXPs } = useSkillXP()
  const { resetSkills } = useSkills()
  const { activities, resetActivities } = useRecentActivity()
  const { resetQuests } = useQuests()
  const [tempNickname, setTempNickname] = useState(nickname)
  const [showNicknameSaved, setShowNicknameSaved] = useState(false)
  const [showColorSaved, setShowColorSaved] = useState(false)
  const [showRemoveProgressDialog, setShowRemoveProgressDialog] = useState(false)

  const handleSaveNickname = () => {
    setNickname(tempNickname)
    setShowNicknameSaved(true)
    setTimeout(() => {
      setShowNicknameSaved(false)
    }, 2000)
  }

  const handleColorSelect = (color: string) => {
    setUIColor(color)
    setShowColorSaved(true)
    setTimeout(() => {
      setShowColorSaved(false)
    }, 2000)
  }

  const handleRemoveProgress = () => {
    // Manually clear taskSnapshots in localStorage as it's not managed by a global context
    const storedProfile = localStorage.getItem("currentUserProfile")
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      profile.taskSnapshots = {}
      localStorage.setItem("currentUserProfile", JSON.stringify(profile))
      localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
    }

    // Reset state via contexts
    resetXP()
    resetSkillXPs()
    resetSkills()
    resetActivities()
    resetQuests()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground font-mono" style={{ color: uiColor }}>
            PROFILE SETTINGS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="nickname" className="text-foreground">
              Nickname
            </Label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  id="nickname"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="bg-input"
                  placeholder="Enter your nickname"
                />
                {showNicknameSaved && <p className="text-sm text-green-500 mt-2">Changes saved</p>}
              </div>
              <Button onClick={handleSaveNickname} className="bg-green-600 hover:bg-green-700 text-white">
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground font-mono" style={{ color: uiColor }}>
            INTERFACE COLOR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-foreground">Choose interface color</Label>
            <p className="text-sm text-muted-foreground">
              This color will be applied to headings like Active Skills, Active Quests, and other UI elements
            </p>
            {showColorSaved && <p className="text-sm text-green-500">Color updated successfully</p>}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {INTERFACE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    uiColor === color.value ? "border-foreground bg-secondary" : "border-border hover:border-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full" style={{ backgroundColor: color.value }} />
                  <span className="text-xs text-foreground font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground font-mono" style={{ color: uiColor }}>
            ACCOUNT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowRemoveProgressDialog(true)}
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
          >
            Remove progress
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showRemoveProgressDialog} onOpenChange={setShowRemoveProgressDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-mono" style={{ color: uiColor }}>
              REMOVE ALL PROGRESS
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Are you sure you want to remove all progress? This will reset:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-muted-foreground">
              <li>All XP (total and skills)</li>
              <li>All levels (character and skills)</li>
              <li>All statistics and activity history</li>
              <li>All quest completion status</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              This action cannot be undone. Your skills, quests, and settings will be preserved.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveProgressDialog(false)}
              className="bg-transparent"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleRemoveProgress()
                setShowRemoveProgressDialog(false)
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
