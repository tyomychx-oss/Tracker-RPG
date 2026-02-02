"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pin, Pencil, Trash2, Zap } from "lucide-react"

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

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            draggable={isPinned}
            onDragStart={isPinned ? onDragStart : undefined}
            onDragEnd={isPinned ? onDragEnd : undefined}
            onDragOver={isPinned ? onDragOver : undefined}
            onDrop={isPinned ? onDrop : undefined}
            className={`relative ${isPinned ? "cursor-grab active:cursor-grabbing" : ""} ${draggedQuestId === quest.id ? "opacity-50" : ""}`}
            style={{
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

                    {/* Checkbox — Ember style */}
                    <div
                        onClick={() => {
                            if (!isArchived) {
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
                            cursor: isArchived ? "default" : "pointer",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        {quest.completed && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
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
                        </div>
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
                                +{quest.xp} XP
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
                                {(quest as any).reward || (quest.rating === "fast" ? 5 : quest.rating === "short" ? 10 : quest.rating === "deep" ? 25 : quest.rating === "hard" ? 50 : 0)}
                            </div>
                        </div>

                        {/* Streak for habits */}
                        {category === "habits" && (
                            <span className="text-xs flex items-center gap-1 ml-1">
                                <span>🔥</span>
                                {(quest as any).streak || 0}
                            </span>
                        )}

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
