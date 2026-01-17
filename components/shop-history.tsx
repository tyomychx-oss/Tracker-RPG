"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useShop } from "@/components/shop-provider"
import { History, ShoppingBag, Sparkles } from "lucide-react"

export function ShopHistory() {
    const { transactions } = useShop()

    const formatTimestamp = (timestamp: string) => {
        const d = new Date(timestamp)
        const now = new Date()
        const diff = (now.getTime() - d.getTime()) / 1000

        if (diff < 60) return "Just now"
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Shop Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No purchases yet.</p>
                ) : (
                    transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-sm group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-1.5 rounded-full ${tx.type === 'wheel_spin' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'}`}>
                                    {tx.type === 'wheel_spin' ? <Sparkles className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate font-medium text-foreground">{tx.reward_snapshot}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{tx.type === 'wheel_spin' ? 'Wheel Win' : 'Purchase'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="font-mono text-orange-500 font-bold text-xs">-{tx.cost} ⚡</span>
                                <span className="text-[10px] text-muted-foreground">{formatTimestamp(tx.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
