"use client"

import React from "react"

interface DebugPanelProps {
  userId: string | null
  realtimeStatus: "connecting" | "connected" | "disconnected"
}

export function DebugPanel({ userId, realtimeStatus }: DebugPanelProps) {
  const shortId = userId ? userId.slice(-5) : "----"
  const statusColor = 
    realtimeStatus === "connected" ? "bg-green-500" :
    realtimeStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"

  const statusLabel = 
    realtimeStatus === "connected" ? "LIVE" :
    realtimeStatus === "connecting" ? "SYNCING" : "OFFLINE"

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-zinc-900/90 border border-zinc-700 text-zinc-300 p-3 rounded-lg shadow-2xl font-mono text-[10px] flex items-center gap-4 backdrop-blur-sm select-none border-l-4 border-l-primary/50">
      <div className="flex flex-col">
        <span className="text-zinc-500 uppercase tracking-tighter text-[8px]">Session ID</span>
        <span className="text-zinc-100 font-bold tracking-widest">{shortId.toUpperCase()}</span>
      </div>
      
      <div className="h-8 w-[1px] bg-zinc-800" />
      
      <div className="flex flex-col items-start min-w-[60px]">
        <span className="text-zinc-500 uppercase tracking-tighter text-[8px]">Realtime</span>
        <div className="flex items-center gap-2 mt-0.5">
          <div className={`h-2 w-2 rounded-full ${statusColor} ${realtimeStatus === "connected" ? "shadow-[0_0_8px_rgba(34,197,94,0.6)]" : ""} ${realtimeStatus === "connecting" ? "animate-pulse" : ""}`} />
          <span className={`font-black text-[9px] ${realtimeStatus === "connected" ? "text-green-500" : "text-zinc-400"}`}>
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
