"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useShop } from "@/components/shop-provider"
import { useSparks } from "@/components/providers"
import { ShopGacha } from "@/components/shop-gacha"
import { ShopRewardCard } from "@/components/shop-reward-card"
import { ShopHistory } from "@/components/shop-history"
import { ShopManageDialog } from "@/components/shop-manage-dialog"
import { Zap, Store } from "lucide-react"

// Import RarityList from shop-gacha file
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
                            className="flex items-center justify-between px-2 py-1 rounded bg-background/30"
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

export default function ShopPage() {
    const { rewards, isLoading } = useShop()
    const { sparks } = useSparks()

    // Filter to show only rewards that are on the market, sorted by cost (expensive to cheap)
    const marketRewards = rewards
        .filter(r => r.is_on_market)
        .sort((a, b) => b.cost - a.cost)

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Store className="h-8 w-8 text-primary" />
                            MARKETPLACE
                        </h1>
                        <p className="text-muted-foreground mt-1">Exchange your sparks for real-world rewards.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-secondary/30 px-6 py-3 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Balance</span>
                        <div className="flex items-center gap-2">
                            <Zap className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
                            <span className="text-3xl font-mono font-bold text-orange-500">{sparks}</span>
                        </div>
                    </div>
                </header>

                {/* Gacha Section */}
                <section>
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-2/3">
                            <ShopGacha />
                        </div>
                        {rewards.filter(r => r.is_in_wheel).length > 0 && (
                            <div className="hidden lg:block lg:w-1/3">
                                <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 h-full">
                                    <RarityList rewards={rewards.filter(r => r.is_in_wheel)} />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content: Catalogue */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between bg-card/50 p-4 rounded-xl border border-border">
                            <h2 className="text-lg font-semibold text-foreground">Reward Catalogue</h2>
                            <ShopManageDialog />
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-[130px] bg-card/50 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : marketRewards.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">No rewards on the market. Create your first one!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {marketRewards.map(reward => (
                                    <ShopRewardCard key={reward.id} reward={reward} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: History */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-6">
                            <ShopHistory />
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    )
}
