"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useShop } from "@/components/shop-provider"
import { useUIColor, useSparks } from "@/components/providers"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, Trophy, Settings2 } from "lucide-react"
// IMPORT FIXED: Import at the top level
import { ShopManageDialog } from "@/components/shop-manage-dialog"

export function ShopGacha() {
    const { spinWheel, rewards } = useShop()
    const { uiColor } = useUIColor()
    const { sparks } = useSparks()
    const [isSpinning, setIsSpinning] = useState(false)
    // TYPE FIXED: Allow any properties (like icon) on winner
    const [winner, setWinner] = useState<any | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Roulette state
    const [rouletteItems, setRouletteItems] = useState<any[]>([])
    const [rouletteOffset, setRouletteOffset] = useState(0)
    const [rouletteTransition, setRouletteTransition] = useState("none")

    const pool = rewards.filter(r => r.is_in_wheel)
    const ITEM_WIDTH = 120 // Width of each card in roulette
    const VISIBLE_ITEMS = 5 // Number of items visible in the window

    const handleSpin = async () => {
        if (pool.length === 0 || sparks < 35) return

        setIsSpinning(true)
        setWinner(null)
        setRouletteTransition("none")
        setRouletteOffset(0)

        const spinDuration = 4000 // 4 seconds
        const targetIndex = 30 // The index we will land on

        // 1. Get the result first
        const result = await spinWheel()

        if (!result) {
            setIsSpinning(false)
            return
        }

        // 2. Build the strip
        const stripLength = targetIndex + 5
        const newRouletteItems = []
        for (let i = 0; i < stripLength; i++) {
            if (i === targetIndex) {
                newRouletteItems.push(result)
            } else {
                newRouletteItems.push(pool[Math.floor(Math.random() * pool.length)])
            }
        }
        setRouletteItems(newRouletteItems)

        // 3. Start Animation
        requestAnimationFrame(() => {
            const randomOffset = (Math.random() - 0.5) * 0.8 * ITEM_WIDTH
            const windowCenter = (VISIBLE_ITEMS * ITEM_WIDTH) / 2
            const itemCenter = (targetIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2)
            const finalOffset = -(itemCenter - windowCenter) + randomOffset

            setTimeout(() => {
                setRouletteTransition(`transform ${spinDuration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`)
                setRouletteOffset(finalOffset)
            }, 50)

            // 4. Show Result Dialog after animation
            setTimeout(() => {
                setWinner(result)
                setIsOpen(true)
                setIsSpinning(false)
            }, spinDuration + 500)
        })
    }

    return (
        <>
            {/* Main Gacha Card */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 md:p-10 text-center">
                {/* Ambient Glow */}
                <div className="absolute inset-0 opacity-10 blur-3xl bg-gradient-radial from-orange-500 to-transparent" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    {/* Roulette Window */}
                    <div className="relative h-[140px] w-full max-w-[600px] bg-black/40 border-y-4 border-yellow-500/30 overflow-hidden shadow-inner flex items-center mb-4">
                        {/* Center Indicator */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-500 z-30 -translate-x-1/2 shadow-[0_0_10px_#eab308]" />
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 -mt-1 text-yellow-500 z-30">▼</div>
                        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 -mb-1 text-yellow-500 z-30">▲</div>

                        {/* Scrolling Strip */}
                        {isSpinning || rouletteItems.length > 0 ? (
                            <div
                                className="flex items-center h-full pl-[50%]"
                                style={{
                                    transform: `translateX(${rouletteOffset}px)`,
                                    transition: rouletteTransition,
                                    width: "max-content",
                                    willChange: "transform"
                                }}
                            >
                                {rouletteItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="shrink-0 flex items-center justify-center p-2"
                                        style={{ width: `${ITEM_WIDTH}px`, height: "100%" }}
                                    >
                                        <div className="w-full h-24 rounded-lg flex flex-col items-center justify-center p-2 text-center text-xs font-bold border bg-card border-border text-muted-foreground">
                                            <div className="text-2xl mb-1">{item.icon || "🎁"}</div>
                                            <span className="line-clamp-2">{item.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pool.length > 0 ? (
                            <div className="flex items-center h-full justify-center gap-2">
                                {pool.slice(0, VISIBLE_ITEMS).map((item, i) => (
                                    <div
                                        key={item.id}
                                        className="shrink-0 flex items-center justify-center p-2"
                                        style={{ width: `${ITEM_WIDTH}px`, height: "100%" }}
                                    >
                                        <div className="w-full h-24 rounded-lg flex flex-col items-center justify-center p-2 text-center text-xs font-bold border bg-card border-border text-muted-foreground">
                                            <div className="text-2xl mb-1">{item.icon || "🎁"}</div>
                                            <span className="line-clamp-2">{item.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 tracking-widest font-mono uppercase">
                                Ready to Spin
                            </div>
                        )}

                        {/* Gradients to fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card to-transparent z-20 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card to-transparent z-20 pointer-events-none" />
                    </div>

                    <div className="p-1 px-4 rounded-full bg-background/50 border border-border text-sm font-mono text-muted-foreground">
                        Pool Size: <span className="text-foreground font-bold">{pool.length}</span> items
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className={`h-16 px-8 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0 transition-all hover:scale-105 ${sparks >= 35 ? "shadow-[0_0_20px_rgba(234,88,12,0.8)] animate-pulse" : "shadow-none opacity-50 grayscale cursor-not-allowed"
                                }`}
                            onClick={handleSpin}
                            disabled={isSpinning || pool.length === 0 || sparks < 35}
                        >
                            {isSpinning ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    FORGING...
                                </>
                            ) : pool.length === 0 ? (
                                "Add items to Spin"
                            ) : (
                                <>
                                    SPIN (35 ⚡)
                                </>
                            )}
                        </Button>

                        <PoolManager />
                    </div>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md border-2 border-yellow-500/50 bg-black/95">
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-bold text-yellow-500">
                            FATE HAS SPOKEN!
                        </DialogTitle>
                        <DialogDescription className="sr-only">Your spin result</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-8 space-y-6">
                        <div className="h-24 w-24 rounded-full bg-yellow-500/20 flex items-center justify-center animate-bounce">
                            <Trophy className="h-12 w-12 text-yellow-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-sm uppercase tracking-widest">You won</p>
                            <h3 className="text-2xl font-bold text-white max-w-[250px] mx-auto leading-tight">
                                {winner?.title}
                            </h3>
                        </div>
                        <Button onClick={() => setIsOpen(false)} className="w-full max-w-xs bg-yellow-600 hover:bg-yellow-700 text-white font-bold">
                            CLAIM REWARD
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function RarityList({ rewards }: { rewards: any[] }) {
    // Sort by drop_chance ascending (rarest first) and take top 8 (to avoid scrollbar)
    const sortedRewards = [...rewards]
        .sort((a, b) => a.drop_chance - b.drop_chance)
        .slice(0, 8)

    const legendary = sortedRewards.filter(r => r.drop_chance < 7)
    const epic = sortedRewards.filter(r => r.drop_chance >= 7 && r.drop_chance < 15)
    const rare = sortedRewards.filter(r => r.drop_chance >= 15 && r.drop_chance < 36)
    const common = sortedRewards.filter(r => r.drop_chance >= 36)

    const RaritySection = ({ title, items, color, glowColor }: any) => {
        if (items.length === 0) return null

        return (
            <div className="mb-3">
                <h3
                    className="text-xs font-bold mb-1.5 uppercase tracking-wider"
                    style={{
                        color: color,
                        textShadow: `0 0 8px ${glowColor}, 0 0 15px ${glowColor}`
                    }}
                >
                    {title}
                </h3>
                <div className="space-y-0.5">
                    {items.map((reward: any) => (
                        <div
                            key={reward.id}
                            className="flex items-center justify-between text-xs px-2 py-1 rounded bg-background/30"
                        >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-sm">{reward.icon || "🎁"}</span>
                                <span className="truncate text-sm" style={{ color }}>{reward.title}</span>
                            </div>
                            <span
                                className="font-mono font-bold ml-2 shrink-0 text-xs"
                                style={{ color }}
                            >
                                {reward.drop_chance}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <h2 className="text-sm font-bold mb-3 text-foreground border-b border-border pb-2">
                Rarity List
            </h2>
            <div className="space-y-2">
                <RaritySection
                    title="Legendary"
                    items={legendary}
                    color="#FFD700"
                    glowColor="#FFD700"
                />
                <RaritySection
                    title="Epic"
                    items={epic}
                    color="#DC143C"
                    glowColor="#DC143C"
                />
                <RaritySection
                    title="Rare"
                    items={rare}
                    color="#9370DB"
                    glowColor="#9370DB"
                />
                <RaritySection
                    title="Common"
                    items={common}
                    color="#C0C0C0"
                    glowColor="#C0C0C0"
                />
            </div>
        </>
    )
}

function PoolManager() {
    const { rewards, updateReward, deleteReward } = useShop()
    // REPAIR: Require removed, using top-level import

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-16 w-16 rounded-full border-border bg-background/50 hover:bg-background">
                    <Settings2 className="h-6 w-6 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Manage Fate Pool</DialogTitle>
                    <DialogDescription className="sr-only">Configure which rewards appear in the wheel</DialogDescription>
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
                                    <Label htmlFor={`pool-${reward.id}`} className="cursor-pointer font-medium text-foreground">
                                        {reward.title}
                                    </Label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span className="font-mono">{reward.cost}⚡</span>
                                        {reward.is_in_wheel && (
                                            <span className="font-mono text-primary">Drop: {reward.drop_chance}%</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <ShopManageDialog
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        }
                                        data={reward}
                                        isEditing
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:text-destructive"
                                        onClick={() => {
                                            if (confirm(`Delete "${reward.title}"?`)) {
                                                deleteReward(reward.id)
                                            }
                                        }}
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