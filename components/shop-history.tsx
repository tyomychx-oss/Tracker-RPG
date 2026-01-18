"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useShop } from "@/components/shop-provider"
import { History, ShoppingBag, Sparkles, Plus, Trash2, Edit } from "lucide-react"

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

    const getActivityConfig = (type: string) => {
        switch (type) {
            case 'purchase':
                return {
                    icon: ShoppingBag,
                    label: 'Purchase',
                    bgColor: 'bg-blue-500/10',
                    textColor: 'text-blue-500',
                    showCost: true
                }
            case 'wheel_spin':
                return {
                    icon: Sparkles,
                    label: 'Wheel Win',
                    bgColor: 'bg-yellow-500/10',
                    textColor: 'text-yellow-500',
                    showCost: true
                }
            case 'item_created':
                return {
                    icon: Plus,
                    label: 'Created',
                    bgColor: 'bg-green-500/10',
                    textColor: 'text-green-500',
                    showCost: false
                }
            case 'item_deleted':
                return {
                    icon: Trash2,
                    label: 'Deleted',
                    bgColor: 'bg-red-500/10',
                    textColor: 'text-red-500',
                    showCost: false
                }
            case 'item_updated':
                return {
                    icon: Edit,
                    label: 'Updated',
                    bgColor: 'bg-purple-500/10',
                    textColor: 'text-purple-500',
                    showCost: false
                }
            default:
                return {
                    icon: History,
                    label: 'Activity',
                    bgColor: 'bg-gray-500/10',
                    textColor: 'text-gray-500',
                    showCost: false
                }
        }
    }

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Shop Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
                ) : (
                    transactions.map(tx => {
                        const config = getActivityConfig(tx.type)
                        const Icon = config.icon

                        return (
                            <div key={tx.id} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                                        <Icon className="h-3 w-3" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate font-medium text-foreground">{tx.reward_snapshot}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{config.label}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0 pl-2">
                                    {config.showCost && (
                                        <span className="font-mono text-orange-500 font-bold text-xs">-{tx.cost} ⚡</span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">{formatTimestamp(tx.created_at)}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
