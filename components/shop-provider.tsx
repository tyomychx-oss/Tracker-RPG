"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
    transactions: Transaction[]
    isLoading: boolean
    addReward: (reward: Omit<ShopReward, "id" | "created_at">) => Promise<void>
    updateReward: (id: string, updates: Partial<ShopReward>) => Promise<void>
    deleteReward: (id: string) => Promise<void>
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
    const { sparks, removeSparks } = useSparks()

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const [rewardsResult, transactionsResult] = await Promise.all([
                supabase
                    .from("shop_rewards")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("transactions")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .order("created_at", { ascending: false })
                    .limit(50)
            ])

            if (rewardsResult.data) setRewards(rewardsResult.data)
            if (transactionsResult.data) setTransactions(transactionsResult.data)
            setIsLoading(false)
        }
        fetchData()
    }, [])

    const addReward = async (reward: Omit<ShopReward, "id" | "created_at">) => {
        try {
            // Get fresh session
            const { data: { session }, error: authError } = await supabase.auth.getSession()

            console.log("Shop addReward Auth Check:", session?.user?.id)

            // Check for auth errors with user-friendly toast
            if (authError || !session?.user) {
                handleSupabaseError(authError || new Error("Session missing"), "addReward")
                throw new Error("Session expired. Please log in again.")
            }

            // Insert with session.user.id
            const { data, error } = await supabase
                .from("shop_rewards")
                .insert({
                    title: reward.title,
                    description: reward.description,
                    cost: reward.cost,
                    category: reward.category,
                    is_on_market: reward.is_on_market,
                    is_in_wheel: reward.is_in_wheel,
                    drop_chance: reward.drop_chance,
                    icon: reward.icon,
                    user_id: session.user.id
                })
                .select()
                .single()

            if (error) {
                handleSupabaseError(error, "addReward insert")
                throw error
            }

            if (data) {
                setRewards(prev => [data, ...prev])
                await recordTransaction(data.title, 0, "item_created")
            }

            return data
        } catch (error) {
            // Re-throw after handling (caller may want to know)
            throw error
        }
    }

    const updateReward = async (id: string, updates: Partial<ShopReward>) => {
        try {
            const { data: { session }, error: authError } = await supabase.auth.getSession()

            console.log("Shop updateReward Auth Check:", session?.user?.id)

            if (authError || !session?.user) {
                handleSupabaseError(authError || new Error("Session missing"), "updateReward")
                throw new Error("Session expired. Please log in again.")
            }

            const { error } = await supabase
                .from("shop_rewards")
                .update(updates)
                .eq("id", id)
                .eq("user_id", session.user.id)

            if (error) {
                handleSupabaseError(error, "updateReward")
                throw error
            }

            setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        } catch (error) {
            throw error
        }
    }

    const deleteReward = async (id: string) => {
        try {
            const { data: { session }, error: authError } = await supabase.auth.getSession()

            console.log("Shop deleteReward Auth Check:", session?.user?.id)

            if (authError || !session?.user) {
                handleSupabaseError(authError || new Error("Session missing"), "deleteReward")
                throw new Error("Session expired. Please log in again.")
            }

            const reward = rewards.find(r => r.id === id)

            const { error } = await supabase
                .from("shop_rewards")
                .delete()
                .eq("id", id)
                .eq("user_id", session.user.id)

            if (error) {
                handleSupabaseError(error, "deleteReward")
                throw error
            }

            setRewards(prev => prev.filter(r => r.id !== id))
            if (reward) {
                await recordTransaction(reward.title, 0, "item_deleted")
            }
        } catch (error) {
            throw error
        }
    }

    const recordTransaction = async (rewardName: string, cost: number, type: "purchase" | "wheel_spin" | "item_created" | "item_deleted" | "item_updated") => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
            .from("transactions")
            .insert({
                user_id: session.user.id,
                reward_snapshot: rewardName,
                cost,
                type
            })
            .select()
            .single()

        if (data && !error) {
            setTransactions(prev => [data, ...prev])
        }
    }

    const buyReward = async (reward: ShopReward): Promise<boolean> => {
        if (sparks < reward.cost) return false

        removeSparks(reward.cost)
        await recordTransaction(reward.title, reward.cost, "purchase")
        return true
    }

    const spinWheel = async (): Promise<ShopReward | null> => {
        const SPIN_COST = 35
        if (sparks < SPIN_COST) return null

        const pool = rewards.filter(r => r.is_in_wheel)
        if (pool.length === 0) return null

        removeSparks(SPIN_COST)

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
            transactions,
            isLoading,
            addReward,
            updateReward,
            deleteReward,
            buyReward,
            spinWheel
        }}>
            {children}
        </ShopContext.Provider>
    )
}