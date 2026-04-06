"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useNickname, useUIColor, useXP, useAreaXP, useSkills, useRecentActivity, useQuests, useSparks } from "@/components/providers"
import { resetAllUserProgress } from "@/lib/supabase-actions"
import { toast } from "sonner"

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
  const { setXPState, addXP, removeXP } = useXP()
  const { setAreaXPs } = useAreaXP()
  const { skills } = useSkills()
  const { setActivities, addActivity } = useRecentActivity()
  const { quests, setQuests, setTaskSnapshots } = useQuests()
  const { setSparks } = useSparks()
  const [tempNickname, setTempNickname] = useState(nickname)
  const [showNicknameSaved, setShowNicknameSaved] = useState(false)
  const [showColorSaved, setShowColorSaved] = useState(false)
  const [showRemoveProgressDialog, setShowRemoveProgressDialog] = useState(false)
  const [showAddXP, setShowAddXP] = useState(false)
  const [showRemoveXP, setShowRemoveXP] = useState(false)
  const [addXPValue, setAddXPValue] = useState("")
  const [removeXPValue, setRemoveXPValue] = useState("")

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

  const handleRemoveProgress = async () => {
    try {
      // 1. Backend call
      await resetAllUserProgress()

      // 2. Optimistic UI update
      setXPState({ totalXP: 0, currentLevel: 1, maxXP: 200 })
      setAreaXPs({})
      setActivities([])
      setSparks(0)
      setTaskSnapshots({})
      
      // Reset all quests to incomplete while preserving them
      const resetQuestsData = {
        plans: (quests.plans || []).map((q: any) => ({ ...q, completed: false })),
        dailies: (quests.dailies || []).map((q: any) => ({ ...q, completed: false, completedCount: 0 })),
        habits: (quests.habits || []).map((q: any) => ({ ...q, completed: false, streak: 0 }))
      }
      setQuests(resetQuestsData)

      // 3. LocalStorage cleanup (for backup/persistence if used)
      const storedProfile = localStorage.getItem("currentUserProfile")
      if (storedProfile) {
        const profile = JSON.parse(storedProfile)
        profile.totalXP = 0
        profile.currentLevel = 1
        profile.skillXPs = {}
        profile.activities = []
        profile.sparks = 0
        profile.taskSnapshots = {}
        profile.quests = resetQuestsData
        localStorage.setItem("currentUserProfile", JSON.stringify(profile))
        localStorage.setItem(`userProfile_${profile.nickname}`, JSON.stringify(profile))
      }

      toast.success("Progress completely reset")
      setShowRemoveProgressDialog(false)
    } catch (error) {
      console.error("Reset failed:", error)
      toast.error("Failed to reset progress. Please try again.")
    }
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
              This color will be applied to headings like Active Areas, Active Quests, and other UI elements
            </p>
            {showColorSaved && <p className="text-sm text-green-500">Color updated successfully</p>}
            <div className="grid grid-cols-6 gap-3 mt-4">
              {INTERFACE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className="flex items-center justify-center p-2 transition-transform hover:scale-105"
                >
                  <div
                    className={`w-10 h-10 rounded-full ${uiColor === color.value ? "ring-2 ring-foreground" : ""}`}
                    style={{ backgroundColor: color.value }}
                  />
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => {
                setShowAddXP(true)
                setShowRemoveXP(false)
              }}
              className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-600"
            >
              Add XP
            </Button>
            <Button
              onClick={() => {
                setShowRemoveXP(true)
                setShowAddXP(false)
              }}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600"
            >
              Remove XP
            </Button>
          </div>
          <div>
            <Button
              onClick={() => setShowRemoveProgressDialog(true)}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600"
            >
              Remove ALL progress
            </Button>
          </div>

          {showAddXP && (
            <div className="space-y-2">
              <Label htmlFor="add-xp" className="text-foreground">Amount to add</Label>
              <Input
                id="add-xp"
                type="number"
                min={0}
                value={addXPValue}
                onChange={(e) => setAddXPValue(e.target.value)}
                className="bg-input font-mono"
                placeholder="Enter XP"
              />
              <Button
                onClick={() => {
                  const val = Math.max(0, Number(addXPValue || "0"))
                  if (val > 0) {
                    addXP(val)
                    addActivity(`Account: Added XP`, val)
                    setAddXPValue("")
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm add
              </Button>
            </div>
          )}

          {showRemoveXP && (
            <div className="space-y-2">
              <Label htmlFor="remove-xp" className="text-foreground">Amount to remove</Label>
              <Input
                id="remove-xp"
                type="number"
                min={0}
                value={removeXPValue}
                onChange={(e) => setRemoveXPValue(e.target.value)}
                className="bg-input font-mono"
                placeholder="Enter XP"
              />
              <Button
                onClick={() => {
                  const val = Math.max(0, Number(removeXPValue || "0"))
                  if (val > 0) {
                    removeXP(val)
                    addActivity(`Account: Removed XP`, -val)
                    setRemoveXPValue("")
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Confirm remove
              </Button>
            </div>
          )}
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
