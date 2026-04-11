"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useShop } from "@/components/shop-provider"
import { useUIColor, useSparks } from "@/components/providers"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, Trophy, Settings2 } from "lucide-react"
import { ShopManageDialog } from "@/components/shop-manage-dialog"

export function ShopGacha() {
    const { spinWheel, rewards } = useShop()
    const { uiColor } = useUIColor()
    const { sparks } = useSparks()
    const [isSpinning, setIsSpinning] = useState(false)
    const [winner, setWinner] = useState<any | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Wheel state
    const [rotation, setRotation] = useState(0)
    const [transitionStyle, setTransitionStyle] = useState("none")
    
    const pool = rewards.filter(r => r.is_in_wheel)
    const SPIN_DURATION = 4000
    const SPIN_COST = 35

    const handleSpin = async () => {
        if (pool.length === 0 || sparks < SPIN_COST || isSpinning) return

        setIsSpinning(true)
        setWinner(null)
        
        // 1. Get the logical result from the backend/provider
        const result = await spinWheel()

        if (!result) {
            setIsSpinning(false)
            return
        }

        // 2. Calculate the exact rotation needed
        const winnerIndex = pool.findIndex(r => r.id === result.id)
        const anglePerSlice = 360 / pool.length
        
        // The slice is positioned clockwise. 
        // Slice 0 starts at 0deg. 
        // Slice i center is at (i * anglePerSlice) + (anglePerSlice / 2)
        const winnerCenter = (winnerIndex * anglePerSlice) + (anglePerSlice / 2)
        
        // To center the winner at the TOP (0deg), we need to rotate the wheel by -winnerCenter.
        // We add current rotation to keep it spinning forward.
        const extraSpins = 5
        const currentRotationBase = rotation - (rotation % 360)
        const targetRotation = currentRotationBase + (extraSpins * 360) + (360 - winnerCenter)

        // 3. Start Visual Animation
        setTransitionStyle(`transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0, 0.15, 1)`)
        setRotation(targetRotation)

        // 4. Show Result Dialog after animation finishes
        setTimeout(() => {
            setWinner(result)
            setIsOpen(true)
            setIsSpinning(false)
        }, SPIN_DURATION + 300)
    }

    return (
        <>
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 md:p-10 text-center">
                <div className="absolute inset-0 opacity-10 blur-3xl bg-gradient-radial from-orange-500 to-transparent" />

                <div className="relative z-10 flex flex-col items-center gap-8">
                    {/* Wheel Container */}
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* The Indicator Pin */}
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 z-30 filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                            <div className="w-6 h-8 bg-yellow-500 clip-path-pin" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/50" />
                        </div>

                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-[12px] border-secondary shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.5)] z-20 pointer-events-none" />
                        
                        {/* Glowing Border */}
                        <div className="absolute -inset-2 rounded-full border-2 border-orange-500/20 animate-pulse pointer-events-none" />

                        {/* The Wheel itself */}
                        <div 
                            className="absolute inset-0 rounded-full overflow-hidden transition-transform will-change-transform bg-background"
                            style={{ 
                                transform: `rotate(${rotation}deg)`,
                                transition: transitionStyle,
                                background: `conic-gradient(${pool.map((_, i) => {
                                    const angle = 360 / pool.length;
                                    const colors = [
                                        "rgba(222, 101, 80, 0.8)",
                                        "rgba(30, 41, 59, 0.8)",
                                        "rgba(251, 146, 60, 0.8)",
                                        "rgba(15, 23, 42, 0.8)"
                                    ];
                                    const c = colors[i % colors.length];
                                    return `${c} ${i * angle}deg ${(i + 1) * angle}deg`;
                                }).join(", ")})`
                            }}
                        >
                            {pool.map((item, i) => {
                                const angle = 360 / pool.length
                                const midAngle = (i * angle) + (angle / 2)
                                
                                return (
                                    <div 
                                        key={item.id}
                                        className="absolute inset-0"
                                        style={{ transform: `rotate(${midAngle}deg)` }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-8 md:mt-12 flex flex-col items-center gap-1">
                                            <span className="text-2xl md:text-3xl filter drop-shadow-md">{item.icon || "🎁"}</span>
                                            <span className="text-[10px] md:text-xs font-bold text-white max-w-[60px] line-clamp-1 leading-tight uppercase tracking-tighter opacity-80">
                                                {item.title}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Center Cap */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary border-4 border-border shadow-xl z-30 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-orange-500 animate-spin-slow" />
                        </div>
                    </div>

                    <div className="p-1 px-4 rounded-full bg-background/50 border border-border text-sm font-mono text-muted-foreground mt-4">
                        Rewards Pool: <span className="text-foreground font-bold">{pool.length}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className={`h-16 px-8 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0 transition-all hover:scale-105 ${
                                sparks >= SPIN_COST ? "shadow-[0_0_20px_rgba(234,88,12,0.8)]" : "opacity-50 grayscale cursor-not-allowed"
                            }`}
                            onClick={handleSpin}
                            disabled={isSpinning || pool.length === 0 || sparks < SPIN_COST}
                        >
                            {isSpinning ? (
                                <><Loader2 className="mr-3 h-6 w-6 animate-spin" />SPINNING...</>
                            ) : (
                                <>SPIN ({SPIN_COST} ⚡)</>
                            )}
                        </Button>
                        <PoolManager />
                    </div>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md border-2 border-orange-500/50 bg-black/95 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-bold text-orange-500">
                            REWARD UNLOCKED!
                        </DialogTitle>
                        <DialogDescription className="sr-only">Win result</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-8 space-y-6">
                        <div className="h-28 w-28 rounded-full bg-orange-500/20 flex items-center justify-center animate-bounce border-2 border-orange-500/30">
                            <Trophy className="h-16 w-16 text-orange-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-sm uppercase tracking-widest">Fortune favors you with</p>
                            <h3 className="text-3xl font-black max-w-[300px] leading-tight">
                                {winner?.title}
                            </h3>
                        </div>
                        <Button 
                            onClick={() => setIsOpen(false)} 
                            className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 font-bold h-12 text-lg"
                        >
                            ADD TO INVENTORY
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function PoolManager() {
    const { rewards, updateReward, deleteReward } = useShop()
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-16 w-16 rounded-full border-border bg-background/50 hover:bg-background">
                    <Settings2 className="h-6 w-6 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Configure Reward Wheel</DialogTitle>
                    <DialogDescription className="sr-only">Settings</DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
                    {rewards.length === 0 ? (
                        <p className="text-center text-muted-foreground">No rewards created yet.</p>
                    ) : (
                        rewards.map(reward => (
                            <div key={reward.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border border-border/50">
                                <Checkbox
                                    id={`pool-${reward.id}`}
                                    checked={reward.is_in_wheel}
                                    onCheckedChange={(checked) => updateReward(reward.id, { is_in_wheel: checked as boolean })}
                                />
                                <div className="text-2xl">{reward.icon || "🎁"}</div>
                                <div className="flex-1">
                                    <Label htmlFor={`pool-${reward.id}`} className="cursor-pointer font-medium text-foreground">{reward.title}</Label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span className="font-mono text-primary">Weight: {reward.drop_chance}%</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <ShopManageDialog
                                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Settings2 className="h-4 w-4" /></Button>}
                                        data={reward}
                                        isEditing
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:text-destructive"
                                        onClick={() => { if (confirm(`Delete "${reward.title}"?`)) deleteReward(reward.id) }}
                                    >
                                        <span className="text-lg">🗑️</span>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}