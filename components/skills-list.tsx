"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAreaColors, useUIColor, useAreaXP, useAreas, useAreaFilter } from "@/components/providers"
import { updateProfile } from "@/lib/supabase-actions"

const BASIC_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#10b981",
    "#059669", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#a855f7",
]

export function SkillsList() {
    const { areaColors } = useAreaColors()
    const { uiColor } = useUIColor()
    const { areaXPs } = useAreaXP()
    const { areas: areasList } = useAreas()
    const { selectedAreas, toggleArea } = useAreaFilter()

    const [editingSkill, setEditingSkill] = useState<string | null>(null)
    const [editingSkillName, setEditingSkillName] = useState("")

    const skills = (areasList || []).map((name) => {
        const xp = areaXPs?.[name] || 0
        const level = Math.floor(xp / 100) + 1
        const progress = xp % 100
        return { name, level, xp, progress }
    })

    const handleEdit = (skillName: string) => {
        setEditingSkill(skillName)
        setEditingSkillName(skillName)
    }

    const handleColorSelect = async (color: string) => {
        if (!editingSkill) return
        const newColors = { ...areaColors, [editingSkill]: color }
        await updateProfile({ skillColors: newColors })
    }

    const handleSaveName = async () => {
        if (!editingSkill || !editingSkillName.trim() || editingSkill === editingSkillName) return

        const newSkillXPs = { ...areaXPs }
        newSkillXPs[editingSkillName] = newSkillXPs[editingSkill] || 0
        delete newSkillXPs[editingSkill]

        const newColors = { ...areaColors }
        newColors[editingSkillName] = newColors[editingSkill] || uiColor
        delete newColors[editingSkill]

        // Handle renaming in areas/archived if needed
        // Assuming areas is derived from skill_colors in SyncManager
        
        await updateProfile({
            skillXPs: newSkillXPs,
            skillColors: newColors
        })
        handleClose()
    }

    const handleClose = () => {
        setEditingSkill(null)
        setEditingSkillName("")
    }

    return (
        <>
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle style={{ color: uiColor }}>
                        ACTIVE AREAS
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(skills || []).length === 0 ? (
                        <div className="text-muted-foreground text-sm text-center py-4">
                            No areas yet. Go to settings to create your first area!
                        </div>
                    ) : (
                        skills.map((skill, index) => {
                            const color = areaColors[skill.name] || uiColor
                            return (
                                <div
                                    key={index}
                                    className={`space-y-2 cursor-pointer transition-all duration-200 group p-2 rounded-lg ${selectedAreas.includes(skill.name) ? "bg-secondary/50 border border-primary/30 shadow-sm" : "hover:bg-secondary/20"
                                        }`}
                                    onClick={() => toggleArea(skill.name)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground group-hover:scale-105 transition-transform origin-left">{skill.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(skill.name) }}
                                                className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground underline"
                                            >
                                                edit
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">lvl {skill.level}</span>
                                            <span className="text-[10px] text-muted-foreground/80">{skill.xp} XP</span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={skill.progress}
                                        className="h-1.5 bg-secondary"
                                        style={{ "--progress-color": color } as React.CSSProperties}
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
                        <DialogTitle className="text-primary">EDIT AREA</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="skill-name" className="text-sm text-foreground">Area Name</Label>
                            <Input id="skill-name" value={editingSkillName} onChange={(e) => setEditingSkillName(e.target.value)} className="bg-secondary border-border text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-foreground">Choose area color</Label>
                            <div className="grid grid-cols-12 gap-1">
                                {BASIC_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className={`aspect-square rounded border transition-all hover:scale-110 ${areaColors[editingSkill || ""] === color ? "border-white ring-1 ring-white" : "border-border"}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button style={{ backgroundColor: uiColor }} className="text-white" onClick={handleSaveName}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
