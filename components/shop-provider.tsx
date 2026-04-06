"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import { useSparks } from "@/components/providers"
import { handleSupabaseError } from "@/lib/handle-auth-error"

export interface ShopReward {
    id: string
    title: string
    description?: string | null
    cost: number
    category: string
    is_on_market: boolean
    is_in_wheel: boolean
    drop_chance: number
    icon: string | null
    created_at?: string
}

export interface Transaction {
    id: string
    reward_snapshot: string
    cost: number
    type: "purchase" | "wheel_spin" | "item_created" | "item_deleted" | "item_updated"
    created_at: string
}

interface ShopContextType {
    rewards: ShopReward[]
    setRewards: React.Dispatch<React.SetStateAction<ShopReward[]>>
    transactions: Transaction[]
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
    isLoading: boolean
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
    buyReward: (reward: ShopReward) => Promise<boolean>
    spinWheel: () => Promise<ShopReward | null>
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function useShop() {
    const context = useContext(ShopContext)
    if (!context) throw new Error("useShop must be used within ShopProvider")
    return context
}

export function ShopProvider({ children }: { children: ReactNode }) {
    const [rewards, setRewards] = useState<ShopReward[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { sparks } = useSparks()

    const supabase = createClient()

    const recordTransaction = async (rewardName: string, cost: number, type: Transaction["type"]) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase
            .from("transactions")
            .insert({
                user_id: session.user.id,
                reward_snapshot: rewardName,
                cost,
                type
            })
    }

    const buyReward = async (reward: ShopReward): Promise<boolean> => {
        if (sparks < reward.cost) return false

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return false

        // Update sparks in profile
        await supabase
            .from("user_profiles")
            .update({ sparks: Math.max(0, sparks - reward.cost) })
            .eq("user_id", session.user.id)

        await recordTransaction(reward.title, reward.cost, "purchase")
        return true
    }

    const spinWheel = async (): Promise<ShopReward | null> => {
        const SPIN_COST = 35
        if (sparks < SPIN_COST) return null

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return null

        const pool = rewards.filter(r => r.is_in_wheel)
        if (pool.length === 0) return null

        // Update sparks in profile
        await supabase
            .from("user_profiles")
            .update({ sparks: Math.max(0, sparks - SPIN_COST) })
            .eq("user_id", session.user.id)

        // Weighted random selection based on drop_chance
        const totalWeight = pool.reduce((sum, r) => sum + r.drop_chance, 0)
        let random = Math.random() * totalWeight

        let winner = pool[0]
        for (const reward of pool) {
            random -= reward.drop_chance
            if (random <= 0) {
                winner = reward
                break
            }
        }

        await recordTransaction(winner.title, SPIN_COST, "wheel_spin")
        return winner
    }

    return (
        <ShopContext.Provider value={{
            rewards,
            setRewards,
            transactions,
            setTransactions,
            isLoading,
            setIsLoading,
            buyReward,
            spinWheel
        }}>
            {children}
        </ShopContext.Provider>
    )
}