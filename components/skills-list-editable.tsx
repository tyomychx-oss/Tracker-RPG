"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash2, Archive, ChevronDown, ChevronUp } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useAreaColors, useAreaFilter, useUIColor, useAreaXP, useAreas } from "@/components/providers"

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

export function SkillsListEditable() {
  const { areaColors, setAreaColor } = useAreaColors()
  const { selectedAreas, toggleArea } = useAreaFilter()
  const { uiColor } = useUIColor()
  const { areaXPs, addAreaXP } = useAreaXP()
  const { areas: areasList, addArea, removeArea, archivedAreas, archiveArea, unarchiveArea, renameArea } = useAreas()
  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const [editingSkillName, setEditingSkillName] = useState("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [showCreateSkill, setShowCreateSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillColor, setNewSkillColor] = useState("#de6550")
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [showArchivedAreas, setShowArchivedAreas] = useState(false)

  const skills = (areasList || []).map((name) => {
    const xp = areaXPs?.[name] || 0
    const level = Math.floor(xp / 100) + 1
    return { name, level, xp }
  })

  const archivedAreasList = (archivedAreas || []).map((name) => {
    const xp = areaXPs?.[name] || 0
    const level = Math.floor(xp / 100) + 1
    return { name, level, xp }
  })

  const handleEdit = (skillName: string) => {
    setEditingSkill(skillName)
    setEditingSkillName(skillName)
    setSelectedColor(areaColors[skillName] || uiColor)
    setShowSavedMessage(false)
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleSave = () => {
    if (!editingSkill) return
    const nextName = editingSkillName.trim()
    if (nextName && nextName !== editingSkill) {
      renameArea(editingSkill, nextName, selectedColor)
      setShowSavedMessage(true)
      setTimeout(() => {
        setShowSavedMessage(false)
      }, 2000)
      return
    }
    setAreaColor(editingSkill, selectedColor)
    setShowSavedMessage(true)
    setTimeout(() => {
      setShowSavedMessage(false)
    }, 2000)
  }

  const handleClose = () => {
    setEditingSkill(null)
    setEditingSkillName("")
    setShowSavedMessage(false)
  }

  const handleSkillClick = (skillName: string) => {
    toggleArea(skillName)
  }

  const handleCreateArea = () => {
    setShowCreateSkill(true)
    setNewSkillName("")
    setNewSkillColor("#de6550")
  }

  const handleSaveNewSkill = () => {
    if (newSkillName.trim()) {
      setAreaColor(newSkillName, newSkillColor)
      addArea(newSkillName, newSkillColor)
      addAreaXP(newSkillName, 0)
      setShowCreateSkill(false)
    }
  }

  const handleDeleteClick = (skillName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingSkill(skillName)
  }

  const handleConfirmDelete = () => {
    if (deletingSkill) {
      removeArea(deletingSkill)
      setDeletingSkill(null)
    }
  }

  const handleCancelDelete = () => {
    setDeletingSkill(null)
  }

  const handleArchive = (skillName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    archiveArea(skillName)
  }

  const handleUnarchive = (skillName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    unarchiveArea(skillName)
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle style={{ color: uiColor }}>
            ACTIVE AREAS
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCreateArea} className="h-8 w-8 p-0 hover:bg-secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-4">
              No areas yet. Click + to create your first area!
            </div>
          ) : (
            skills.map((skill, index) => (
              <div
                key={index}
                className={`flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 px-2 -mx-2 rounded transition-colors ${selectedAreas.includes(skill.name) ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
              >
                <div className="flex items-center gap-12">
                  <span className="font-semibold text-foreground">{skill.name}</span>
                  <div className="flex gap-4">
                    <span className="text-sm text-muted-foreground">Level {skill.level}</span>
                    <span className="text-sm text-muted-foreground">{skill.xp} XP</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(skill.name)
                        }}
                        className="h-8 w-8 p-0 hover:bg-secondary"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          archiveArea(skill.name)
                        }}
                        className="h-8 w-8 p-0 hover:bg-secondary"
                        aria-label="Archive"
                      >
                        <Archive className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(skill.name, e)}
                        className="h-8 w-8 p-0 hover:bg-secondary"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))
          )}

        </CardContent>
        <CardContent className="pt-0">
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowArchivedAreas((prev) => !prev)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-full justify-center transition-colors"
            >
              Archive {showArchivedAreas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showArchivedAreas && (
              <div className="space-y-2 mt-3">
                {archivedAreas.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-2">No archived areas</div>
                ) : (
                  archivedAreasList.map((area) => (
                    <div key={area.name} className="flex items-center justify-between py-2 px-2 rounded hover:bg-secondary/50">
                      <span className="text-foreground">{area.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent"
                        onClick={() => unarchiveArea(area.name)}
                      >
                        Unarchive
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Area Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="bg-card border-border" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-primary">EDIT AREA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="skill-name"
                value={editingSkillName}
                onChange={(e) => setEditingSkillName(e.target.value)}
                className="bg-secondary border-border text-foreground"
                placeholder="Area name"
                autoFocus={false}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-foreground">Choose area color</Label>
              <div className="grid grid-cols-6 gap-2">
                {BASIC_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`aspect-square rounded border-2 transition-all w-10 h-10 ${selectedColor === color ? "border-foreground scale-110" : "border-border hover:border-foreground"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex-1">{showSavedMessage && <p className="text-xs text-green-500">Changes saved</p>}</div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Area Dialog */}
      <Dialog open={showCreateSkill} onOpenChange={setShowCreateSkill}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary">CREATE NEW AREA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-skill-name" className="text-foreground">
                Area Name
              </Label>
              <Input
                id="new-skill-name"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="bg-secondary border-border text-foreground"
                placeholder="e.g., Work, Sport, Study..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-foreground">Choose area color</Label>
              <div className="grid grid-cols-6 gap-2">
                {BASIC_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewSkillColor(color)}
                    className={`aspect-square rounded border-2 transition-all w-10 h-10 ${newSkillColor === color ? "border-foreground scale-110" : "border-border hover:border-foreground"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveNewSkill}
              disabled={!newSkillName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Area Confirmation Dialog */}
      <Dialog open={!!deletingSkill} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary">DELETE AREA</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">Do you really want to delete this area?</p>
            <p className="text-sm text-muted-foreground mt-2">
              All tasks associated with "{deletingSkill}" will also be removed.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button onClick={handleCancelDelete} variant="outline" className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
