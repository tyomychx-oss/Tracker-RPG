"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import { useSparks, useRecentActivity } from "@/components/providers"
import { handleSupabaseError } from "@/lib/handle-auth-error"
import { toast } from "sonner"

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
    addReward: (reward: Omit<ShopReward, "id">) => Promise<void>
    updateReward: (id: string, reward: Partial<ShopReward>) => Promise<void>
    deleteReward: (id: string) => Promise<void>
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
    const { sparks, setSparks } = useSparks()
    const { setActivities } = useRecentActivity()

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
        if (sparks < reward.cost) {
            toast.error("Insufficient Sparks")
            return false
        }

        const previousSparks = sparks
        // Optimistic UI update
        setSparks(prev => Math.max(0, prev - reward.cost))

        // OPTIMISTIC UI: Activity History (Global RPG Activity)
        setActivities(prev => [{
            id: Date.now(),
            action: `Purchased: ${reward.title}`,
            sparks: -reward.cost,
            timestamp: Date.now()
        }, ...prev])

        // OPTIMISTIC UI: Shop History (Local Shop Transactions)
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            reward_snapshot: reward.title,
            cost: reward.cost,
            type: "purchase",
            created_at: new Date().toISOString()
        }
        setTransactions(prev => [newTransaction, ...prev])

        // Update sparks in profile
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { error } = await supabase
                .from("user_profiles")
                .update({ sparks: Math.max(0, sparks - reward.cost) })
                .eq("user_id", session.user.id)

            if (error) {
                console.error("Failed to sync shop purchase:", error)
                toast.error("Failed to sync purchase")
                // Note: Revert logic could be added here
                return false
            }
        }

        await recordTransaction(reward.title, reward.cost, "purchase")
        return true
    }

    const spinWheel = async (): Promise<ShopReward | any | null> => {
        const SPIN_COST = 35
        if (sparks < SPIN_COST) {
            toast.error("Insufficient Sparks")
            return null
        }

        const pool = rewards.filter(r => r.is_in_wheel)
        if (pool.length === 0) return null

        // Weighted random selection based on drop_chance (out of 100%)
        let random = Math.random() * 100

        let winner: any = { id: 'empty', title: 'Empty', icon: null }
        for (const reward of pool) {
            random -= reward.drop_chance
            if (random <= 0) {
                winner = reward
                break
            }
        }

        // OPTIMISTIC UI: Sparks
        setSparks(prev => Math.max(0, prev - SPIN_COST))

        // OPTIMISTIC UI: Activity History (Global RPG Activity)
        setActivities(prev => [{
            id: Date.now(),
            action: `Wheel Spin: ${winner.title}`,
            sparks: -SPIN_COST,
            timestamp: Date.now()
        }, ...prev])

        // OPTIMISTIC UI: Shop History (Local Shop Transactions)
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            reward_snapshot: winner.title,
            cost: SPIN_COST,
            type: "wheel_spin",
            created_at: new Date().toISOString()
        }
        setTransactions(prev => [newTransaction, ...prev])

        // Update sparks in profile
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            await supabase
                .from("user_profiles")
                .update({ sparks: Math.max(0, sparks - SPIN_COST) })
                .eq("user_id", session.user.id)
        }

        await recordTransaction(winner.title, SPIN_COST, "wheel_spin")
        return winner
    }

    const addReward = async (rewardData: Omit<ShopReward, "id">) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const tempId = crypto.randomUUID()
        const newReward: ShopReward = { ...rewardData, id: tempId }

        // Optimistic update
        const previousRewards = [...rewards]
        setRewards(prev => [newReward, ...prev])

        try {
            const { data, error } = await supabase
                .from("shop_rewards")
                .insert({ ...rewardData, user_id: session.user.id })
                .select()
                .maybeSingle()

            if (error) throw error
            
            // Replace temp item with real data from DB
            setRewards(prev => prev.map(r => r.id === tempId ? data : r))
            await recordTransaction(rewardData.title, 0, "item_created")
        } catch (error) {
            setRewards(previousRewards)
            throw error
        }
    }

    const updateReward = async (id: string, rewardData: Partial<ShopReward>) => {
        const previousRewards = [...rewards]
        
        // Optimistic update
        setRewards(prev => prev.map(r => r.id === id ? { ...r, ...rewardData } : r))

        try {
            const { error } = await supabase
                .from("shop_rewards")
                .update(rewardData)
                .eq("id", id)

            if (error) throw error
            await recordTransaction(rewardData.title || "Reward", 0, "item_updated")
        } catch (error) {
            setRewards(previousRewards)
            throw error
        }
    }

    const deleteReward = async (id: string) => {
        const previousRewards = [...rewards]
        const rewardToDelete = rewards.find(r => r.id === id)
        
        // Optimistic update
        setRewards(prev => prev.filter(r => r.id !== id))

        try {
            const { error } = await supabase
                .from("shop_rewards")
                .delete()
                .eq("id", id)

            if (error) throw error
            if (rewardToDelete) {
                await recordTransaction(rewardToDelete.title, 0, "item_deleted")
            }
        } catch (error) {
            setRewards(previousRewards)
            throw error
        }
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
            spinWheel,
            addReward,
            updateReward,
            deleteReward
        }}>
            {children}
        </ShopContext.Provider>
    )
}