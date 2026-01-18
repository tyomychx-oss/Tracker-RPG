"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import { useSparks } from "@/components/providers"

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
            // Get current user (more reliable than session for RLS)
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                console.error("Auth error:", userError)
                throw new Error("You must be logged in to create rewards")
            }

            console.log("Creating reward for user:", user.id)

            // Insert with user_id - FIXED: Using explicit fields and Array syntax
            const { data, error } = await supabase
                .from("shop_rewards")
                .insert([
                    {
                        title: reward.title,
                        description: reward.description,
                        cost: reward.cost,
                        category: reward.category,
                        is_on_market: reward.is_on_market,
                        is_in_wheel: reward.is_in_wheel,
                        drop_chance: reward.drop_chance,
                        icon: reward.icon,
                        user_id: user.id
                    }
                ])
                .select()
                .single()

            if (error) {
                console.error("Error adding reward:", error.message || "Unknown error")
                console.error("Error details:", {
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                })
                throw error
            }

            if (data) {
                console.log("Reward created successfully:", data)
                setRewards(prev => [data, ...prev])
                // Log activity
                await recordTransaction(data.title, 0, "item_created")
            }

            return data
        } catch (error: any) {
            console.error("Failed to add reward:", error?.message || error)
            if (error?.code || error?.details || error?.hint) {
                console.error("Additional error info:", {
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                })
            }
            throw error
        }
    }

    const updateReward = async (id: string, updates: Partial<ShopReward>) => {
        const { error } = await supabase
            .from("shop_rewards")
            .update(updates)
            .eq("id", id)

        if (!error) {
            setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        }
    }

    const deleteReward = async (id: string) => {
        // Get reward name before deleting
        const reward = rewards.find(r => r.id === id)

        const { error } = await supabase
            .from("shop_rewards")
            .delete()
            .eq("id", id)

        if (!error) {
            setRewards(prev => prev.filter(r => r.id !== id))
            // Log activity
            if (reward) {
                await recordTransaction(reward.title, 0, "item_deleted")
            }
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