"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShopReward, useShop } from "@/components/shop-provider"
import { useUIColor, useSparks } from "@/components/providers"
import { ShoppingCart, Trash2, Edit } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ShopManageDialog } from "@/components/shop-manage-dialog"

export function ShopRewardCard({ reward }: { reward: ShopReward }) {
    const { buyReward, deleteReward } = useShop()
    const { sparks } = useSparks()
    const { uiColor } = useUIColor()
    const [isBuying, setIsBuying] = useState(false)

    const canAfford = sparks >= reward.cost

    const handleBuy = async () => {
        if (!canAfford) return
        setIsBuying(true)

        const success = await buyReward(reward)

        setIsBuying(false)
        if (success) {
            toast.success(`Purchased ${reward.title}!`, {
                description: `Spent ${reward.cost} sparks.`
            })
        } else {
            toast.error("Not enough sparks!")
        }
    }

    const handleDelete = async () => {
        if (confirm("Delete this reward?")) {
            await deleteReward(reward.id)
            toast.success("Reward deleted")
        }
    }

    // Rarity-based border styling
    const getRarityStyle = (cost: number) => {
        if (cost >= 200) {
            return {
                borderClass: "border-yellow-500",
                glowClass: "shadow-[0_0_15px_rgba(234,179,8,0.4)]"
            }
        } else if (cost >= 150) {
            return {
                borderClass: "border-red-500",
                glowClass: ""
            }
        } else if (cost >= 100) {
            return {
                borderClass: "border-purple-500",
                glowClass: ""
            }
        } else if (cost >= 50) {
            return {
                borderClass: "border-blue-500",
                glowClass: ""
            }
        } else {
            return {
                borderClass: "border-border",
                glowClass: ""
            }
        }
    }

    const rarityStyle = getRarityStyle(reward.cost)

    return (
        <Card className={`bg-card overflow-hidden hover:border-primary/50 transition-all group relative ${rarityStyle.borderClass} ${rarityStyle.glowClass}`}>
            <CardContent className="p-3">
                <div className="flex flex-row justify-between items-center gap-2">
                    {/* Left Side: Icon + Title + Description */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-4xl shrink-0">{reward.icon || "🎁"}</div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-foreground leading-tight truncate">
                                {reward.title}
                            </h3>
                            {reward.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {reward.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Price + Buy Button (with actions below) */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Price */}
                        <div className="font-mono font-black text-xl text-orange-500 flex items-center gap-0.5">
                            {reward.cost} ⚡
                        </div>

                        {/* Buy Button with Actions Below */}
                        <div className="relative">
                            {/* Buy Button - Centered */}
                            <Button
                                size="sm"
                                className="font-bold transition-all active:scale-95 h-9 text-sm px-4"
                                style={{ backgroundColor: canAfford ? uiColor : undefined }}
                                disabled={!canAfford || isBuying}
                                onClick={handleBuy}
                            >
                                {isBuying ? "..." : <ShoppingCart className="h-4 w-4 mr-1" />}
                                BUY
                            </Button>

                            {/* Edit/Delete Actions - Absolutely positioned below */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ShopManageDialog trigger={
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                } data={reward} isEditing />
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={handleDelete}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
