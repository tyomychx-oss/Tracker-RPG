"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pin, Pencil, Trash2, Zap, Flame, Plus, RotateCcw } from "lucide-react"

// Ember Glow rarity configuration - BRIGHTER COLORS
const rarityConfig: Record<string, { color: string; glow: string; gradient: string }> = {
    fast: { color: "#a3e635", glow: "rgba(163,230,53,0.5)", gradient: "linear-gradient(135deg, #a3e635, #84cc16)" },
    short: { color: "#38bdf8", glow: "rgba(56,189,248,0.6)", gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)" },
    deep: { color: "#fbbf24", glow: "rgba(251,191,36,0.6)", gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
    hard: { color: "#f87171", glow: "rgba(248,113,113,0.6)", gradient: "linear-gradient(135deg, #f87171, #ef4444)" },
}

interface EmberQuestCardProps {
    quest: any
    category: "plans" | "dailies" | "habits"
    isArchived?: boolean
    skillColor: string
    uiColor: string
    isPinned: boolean
    draggedQuestId: number | null
    onToggleQuest: () => void
    onUndoQuest?: () => void
    onEditQuest: () => void
    onDeleteQuest: () => void
    onArchiveQuest: () => void
    onUnarchiveQuest: () => void
    onUpdateQuest: (updates: any) => void
    onDragStart: () => void
    onDragEnd: () => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: () => void
}

export function EmberQuestCard({
    quest,
    category,
    isArchived = false,
    skillColor,
    uiColor,
    isPinned,
    draggedQuestId,
    onToggleQuest,
    onUndoQuest,
    onEditQuest,
    onDeleteQuest,
    onArchiveQuest,
    onUnarchiveQuest,
    onUpdateQuest,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
}: EmberQuestCardProps) {
    const [hovered, setHovered] = useState(false)
    const r = rarityConfig[quest.rating] || rarityConfig.short

    const isHabit = category === "habits"
    const wTarget = isHabit ? (quest.weeklyTarget || 7) : 1
    const cProgress = isHabit ? (quest.currentWeeklyProgress || 0) : 0
    const baseReward = quest.reward || (quest.rating === "fast" ? 5 : quest.rating === "short" ? 10 : quest.rating === "deep" ? 25 : quest.rating === "hard" ? 50 : 0)
    const displayXp = isHabit ? quest.xp * wTarget : quest.xp
    const displaySparks = isHabit ? baseReward * wTarget : baseReward

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            draggable={isPinned}
            onDragStart={isPinned ? onDragStart : undefined}
            onDragEnd={isPinned ? onDragEnd : undefined}
            onDragOver={isPinned ? onDragOver : undefined}
            onDrop={isPinned ? onDrop : undefined}
            className={`relative overflow-hidden rounded-[16px] ${isPinned ? "cursor-grab active:cursor-grabbing" : ""} ${draggedQuestId === quest.id ? "opacity-50" : ""}`}
            style={{
                border: "5px solid red",
                padding: "1px",
                borderRadius: "16px",
                background: hovered
                    ? `linear-gradient(135deg, ${r.color}88, transparent 40%, ${r.color}44)`
                    : `linear-gradient(135deg, ${r.color}33, transparent 40%, ${r.color}11)`,
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
            }}
        >
            {/* Ember glow effect */}
            <div
                style={{
                    position: "absolute",
                    inset: "-1px",
                    borderRadius: "17px",
                    background: `radial-gradient(ellipse at 20% 50%, ${r.glow}, transparent 70%)`,
                    opacity: hovered ? 0.8 : 0.3,
                    transition: "opacity 0.4s ease",
                    pointerEvents: "none",
                    filter: "blur(8px)",
                }}
            />

            <div
                className="relative overflow-hidden rounded-[15px]"
                style={{
                    position: "relative",
                    borderRadius: "15px",
                    background: "linear-gradient(135deg, rgba(20,20,32,0.95), rgba(15,15,25,0.98))",
                    backdropFilter: "blur(20px)",
                    overflow: "hidden",
                }}
            >
                {/* Main content row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px 20px",
                    }}
                >
                    {/* Animated ember bg */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `radial-gradient(circle at ${hovered ? "30%" : "10%"} 80%, ${r.color}08, transparent 50%)`,
                            transition: "all 0.6s ease",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Pin button */}
                    {!isArchived && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute -top-4 left-[16px] h-4 w-4 p-0 z-10"
                            onClick={() => onUpdateQuest({ pinned: !quest.pinned, pinnedOrder: quest.pinned ? undefined : Date.now() })}
                        >
                            <Pin
                                className="h-3 w-3 rotate-45"
                                style={isPinned ? { color: uiColor, filter: `drop-shadow(0 0 4px ${uiColor})` } : { color: "var(--muted-foreground)", opacity: 0.15 }}
                            />
                        </Button>
                    )}

                    {/* Checkbox — Ember style with Undo Button prefix */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {isHabit && cProgress > 0 && !isArchived && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (quest.completed) {
                                        onToggleQuest();
                                    } else if (onUndoQuest) {
                                        onUndoQuest();
                                    } else {
                                        onUpdateQuest({ currentWeeklyProgress: Math.max(0, cProgress - 1) });
                                    }
                                }}
                                className="flex items-center justify-center w-5 h-5 rounded-md opacity-40 hover:opacity-100 hover:bg-white/10 transition-all text-white/60 mr-2"
                                title="Undo progress"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <div
                        onClick={() => {
                            if (!isArchived) {
                                if (isHabit && cProgress >= wTarget) return; // Disabled
                                onToggleQuest()
                            }
                        }}
                        style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "7px",
                            border: quest.completed ? "none" : `2px solid ${r.color}55`,
                            background: quest.completed ? r.gradient : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: quest.completed ? `0 0 12px ${r.glow}` : "none",
                            transition: "all 0.3s ease",
                            cursor: isArchived || (isHabit && cProgress >= wTarget) ? "default" : "pointer",
                            position: "relative",
                            zIndex: 1,
                            opacity: (isHabit && cProgress >= wTarget) ? 0.5 : 1,
                        }}
                    >
                        {isHabit && !quest.completed ? (
                            <Plus className="h-3 w-3" style={{ color: r.color }} />
                        ) : (
                            quest.completed && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )
                        )}
                    </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
                        {/* Title - LARGER TEXT */}
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: 500,
                                color: quest.completed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.88)",
                                textDecoration: quest.completed ? "line-through" : "none",
                                textDecorationColor: `${r.color}55`,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "var(--font-dm-sans), -apple-system, sans-serif",
                            }}
                        >
                            {quest.title}
                            {isHabit && (
                                <span className="text-orange-500 text-sm ml-2 font-bold inline-flex items-center" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8em" }}>
                                    🔥 {quest.streak || 0} тижнів
                                </span>
                            )}
                        </div>
                        {isHabit && (
                            <div className="flex items-center gap-0.5 mt-1">
                                {[...Array(wTarget)].map((_, i) => (
                                    <Flame key={i} className={`h-3 w-3 ${i < cProgress ? "text-orange-500 fill-orange-500" : "text-muted-foreground opacity-30"}`} />
                                ))}
                            </div>
                        )}
                        {/* Subtitle - BRIGHTER AREA COLOR */}
                        {quest.skill && quest.skill !== "none" && (
                            <div
                                style={{
                                    fontSize: "10px",
                                    color: skillColor,
                                    marginTop: "3px",
                                    fontFamily: "var(--font-crimson-pro), serif",
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    fontStyle: "italic",
                                    opacity: quest.completed ? 0.3 : 1,
                                }}
                            >
                                — {quest.skill}
                            </div>
                        )}

                        {/* Subtasks rendering */}
                        {quest.subtasks && quest.subtasks.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {quest.subtasks.map((subtask: any) => (
                                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                        <div
                                            className={`h-4 w-4 rounded-full border border-muted-foreground cursor-pointer flex items-center justify-center transition-colors ${subtask.completed ? "bg-primary border-primary" : "hover:border-primary"}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (isArchived) return
                                                const updatedSubtasks = quest.subtasks.map((s: any) =>
                                                    s.id === subtask.id ? { ...s, completed: !s.completed } : s
                                                )
                                                onUpdateQuest({ subtasks: updatedSubtasks })
                                            }}
                                        >
                                            {subtask.completed && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                        <span className={`${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexShrink: 0,
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        {/* XP & Sparks */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                            <div
                                style={{
                                    fontSize: "15px",
                                    fontWeight: 400,
                                    color: r.color,
                                    fontFamily: "var(--font-dm-mono), monospace",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                +{displayXp} XP
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 400,
                                    color: "#ffaa44",
                                    whiteSpace: "nowrap",
                                    fontFamily: "var(--font-dm-mono), monospace",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                }}
                            >
                                <Zap className="h-3 w-3" />
                                {displaySparks}
                            </div>
                        </div>

                        {/* Action buttons */}
                        {!isArchived && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "2px",
                                    opacity: hovered ? 0.8 : 0.1,
                                    transition: "opacity 0.3s ease",
                                    marginLeft: "auto",
                                    paddingLeft: "6px",
                                }}
                            >
                                <div
                                    onClick={onEditQuest}
                                    style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "7px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    <Pencil className="h-3 w-3" />
                                </div>
                                <div
                                    onClick={onDeleteQuest}
                                    style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "7px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Archive button INSIDE main container */}
                {quest.completed && !isArchived && (
                    <div style={{ padding: "0 20px 16px", paddingTop: "8px" }}>
                        <button
                            onClick={onArchiveQuest}
                            style={{
                                padding: "8px 28px",
                                borderRadius: "6px",
                                border: `1px solid ${r.color}30`,
                                background: "transparent",
                                color: r.color,
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "var(--font-crimson-pro), serif",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                fontStyle: "italic",
                                transition: "all 0.25s ease",
                                width: "100%",
                            }}
                        >
                            Archive Quest
                        </button>
                    </div>
                )}

                {/* Unarchive button INSIDE main container */}
                {isArchived && (
                    <div style={{ padding: "0 20px 16px", paddingTop: "8px" }}>
                        <button
                            onClick={onUnarchiveQuest}
                            style={{
                                padding: "8px 28px",
                                borderRadius: "6px",
                                border: `1px solid ${r.color}30`,
                                background: "transparent",
                                color: r.color,
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "var(--font-crimson-pro), serif",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                fontStyle: "italic",
                                transition: "all 0.25s ease",
                                width: "100%",
                            }}
                        >
                            Unarchive
                        </button>
                    </div>
                )}
            </div>


        </div>
    )
}
