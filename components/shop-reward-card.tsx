"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useShop, ShopReward } from "@/components/shop-provider"
import { useUIColor, useSparks } from "@/components/providers"
import { Trash2, Edit } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ShopManageDialog } from "@/components/shop-manage-dialog"

export function ShopRewardCard({ reward }: { reward: ShopReward }) {
    const { buyReward, deleteReward } = useShop()
    const { sparks } = useSparks()
    const { uiColor } = useUIColor()
    const [isBuying, setIsBuying] = useState(false)

    const canAfford = sparks >= reward.cost

    // Логіка кольорів рамки та фону залежно від ціни (Рідкість)
    const getRarityStyles = (cost: number) => {
        if (cost >= 200) return "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.15)] bg-gradient-to-r from-yellow-500/10 to-transparent"
        if (cost >= 150) return "border-red-500 bg-gradient-to-r from-red-500/10 to-transparent"
        if (cost >= 100) return "border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent"
        if (cost >= 50) return "border-blue-500 bg-gradient-to-r from-blue-500/10 to-transparent"
        return "border-border bg-card" // 0-49 (Звичайний)
    }

    const handleBuy = async () => {
        if (!canAfford || isBuying) return
        setIsBuying(true)
        try {
            const success = await buyReward(reward)
            if (success) {
                toast.success(`Purchased ${reward.title}!`)
            } else {
                toast.error("Purchase failed. Check your balance.")
            }
        } catch (error) {
            toast.error("An unexpected error occurred.")
        } finally {
            setIsBuying(false)
        }
    }

    const handleDelete = async () => {
        if (confirm("Delete this reward?")) {
            await deleteReward(reward.id)
            toast.success("Reward deleted")
        }
    }

    return (
        <Card className={`transition-all hover:scale-[1.01] overflow-hidden ${getRarityStyles(reward.cost)}`}>
            {/* Використовуємо flex-row для горизонтального вигляду */}
            <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-4">

                {/* ЛІВА ЧАСТИНА: Іконка + Інформація */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Велика іконка */}
                    <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-background/40 border border-white/5 flex items-center justify-center text-3xl shadow-inner">
                        {reward.icon || "🎁"}
                    </div>

                    {/* Текст */}
                    <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-base sm:text-lg leading-tight truncate pr-2 text-foreground">
                            {reward.title}
                        </h3>
                        {reward.description && (
                            <p className="text-xs text-muted-foreground truncate hidden sm:block mt-1">
                                {reward.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* ПРАВА ЧАСТИНА: Ціна + Кнопки */}
                <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">

                    {/* Ціна (Великі цифри) */}
                    <div className="text-right">
                        <div className={`font-mono font-black text-xl sm:text-2xl leading-none ${canAfford ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                            {reward.cost} <span className="text-yellow-500 text-lg">⚡</span>
                        </div>
                    </div>

                    {/* Кнопка Купити */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleBuy}
                            disabled={!canAfford || isBuying}
                            className={`font-bold h-10 px-4 sm:px-6 shadow-md transition-all duration-300 active:scale-95 ${canAfford ? 'hover:scale-105' : ''}`}
                            style={{
                                backgroundColor: canAfford ? uiColor : undefined,
                                // @ts-ignore
                                '--hover-glow': canAfford ? `0 0 15px ${uiColor}80` : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (canAfford) {
                                    (e.target as HTMLElement).style.boxShadow = `0 0 15px ${uiColor}80`
                                }
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.boxShadow = ''
                            }}
                        >
                            {isBuying ? "..." : "BUY"}
                        </Button>

                        {/* Кнопки редагування (менш помітні) */}
                        <div className="flex flex-col gap-1 ml-1 border-l border-border/50 pl-2">
                            <ShopManageDialog
                                trigger={
                                    <button className="h-5 w-5 p-0 bg-transparent border-none outline-none cursor-pointer text-gray-500 hover:text-white transition-all duration-200 flex items-center justify-center hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]">
                                        <Edit className="h-3 w-3" />
                                    </button>
                                }
                                data={reward}
                                isEditing
                            />
                            <button
                                className="h-5 w-5 p-0 bg-transparent border-none outline-none cursor-pointer text-gray-500 hover:text-white transition-all duration-200 flex items-center justify-center hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}