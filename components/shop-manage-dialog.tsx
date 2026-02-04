"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShopReward, useShop } from "@/components/shop-provider"
import { Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useUIColor } from "@/components/providers"

const EXTENDED_REWARD_ICONS = [
    // 🍔 Food & Drinks
    "🍔", "🍟", "🍕", "🌭", "🌮", "🍣", "🍜", "🍦", "🍩", "🍫",
    "☕", "🍵", "🍺", "🍷", "🥃", "🍸", "🥤", "🥛", "🥦", "🥩",

    // 🎮 Fun, Gaming & Media
    "🎮", "🕹️", "🎲", "🎯", "🎰", "🎳", "🎬", "🍿", "🎧", "🎤",
    "🎸", "🎹", "🎨", "📚", "📱", "💻", "📸", "📺", "🎫", "🎪",

    // 🏃 Sport, Health & Body
    "⚽", "🏀", "🥊", "🏋️", "🧘", "🚴", "🏎️", "🏆", "🥇", "💊",
    "💉", "🛁", "🛌", "💇", "💅", "🦷", "🧠", "❤️", "⚡", "🔥",

    // 💸 Luxury, Goals & Shopping
    "💸", "💳", "💎", "🛍️", "🎁", "🚗", "✈️", "🚁", "🏖️", "⛺",
    "🏠", "⌚", "💍", "👠", "👟", "🕶️", "🎒", "🔑", "🛡️", "👑",

    // 💀 Vices, Abstract & Memes
    "🚬", "🔞", "🦄", "👽", "🤖", "👻", "💀", "💩", "🤡", "👺",
    "🤬", "💤", "🚫", "✅", "⚠️", "🆘", "🍀", "🧿", "🔮", "🧸"
]

interface ShopManageDialogProps {
    trigger?: React.ReactNode
    data?: ShopReward
    isEditing?: boolean
}

export function ShopManageDialog({ trigger, data, isEditing = false }: ShopManageDialogProps) {
    const { addReward, updateReward, rewards } = useShop()
    const [open, setOpen] = useState(false)
    const { uiColor } = useUIColor()

    const [title, setTitle] = useState(data?.title || "")
    const [description, setDescription] = useState(data?.description || "")
    const [cost, setCost] = useState(data?.cost?.toString() || "50")
    const [category, setCategory] = useState(data?.category || "General")
    const [isOnMarket, setIsOnMarket] = useState(data?.is_on_market ?? true)
    const [isInWheel, setIsInWheel] = useState(data?.is_in_wheel ?? false)
    const [dropChance, setDropChance] = useState(data?.drop_chance || 10)
    const [icon, setIcon] = useState(data?.icon || "🎁")

    const [isSubmitting, setIsSubmitting] = useState(false)

    const { toast } = useToast()

    // Calculate max drop chance based on other rewards in wheel
    const calculateMaxDropChance = () => {
        const otherRewards = rewards.filter(r =>
            r.is_in_wheel && (!isEditing || r.id !== data?.id)
        )
        const usedPercentage = otherRewards.reduce((sum, r) => sum + r.drop_chance, 0)
        return Math.max(1, 100 - usedPercentage)
    }

    const maxDropChance = calculateMaxDropChance()

    // Adjust drop chance if it exceeds max
    useEffect(() => {
        if (dropChance > maxDropChance) {
            setDropChance(maxDropChance)
        }
    }, [maxDropChance])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const payload = {
                title,
                description,
                cost: parseInt(cost) || 0,
                category,
                is_on_market: isOnMarket,
                is_in_wheel: isInWheel,
                drop_chance: dropChance,
                icon
            }

            if (isEditing && data) {
                await updateReward(data.id, payload)
                toast({ title: "Success", description: "Reward updated successfully." })
            } else {
                await addReward(payload)
                toast({ title: "Success", description: "Reward created successfully!" })
            }

            setIsSubmitting(false)
            setOpen(false)
            if (!isEditing) {
                setTitle("")
                setDescription("")
                setCost("50")
                setCategory("General")
                setIsOnMarket(true)
                setIsInWheel(false)
                setDropChance(10)
                setIcon("🎁")
            }
        } catch (error: any) {
            console.error("Failed to save reward:", error?.message || error || "Unknown error")
            if (error?.code || error?.details || error?.hint) {
                console.error("Error details:", {
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                })
            }
            toast({
                title: "Error",
                description: error?.message || "Failed to save reward. Please try again.",
                variant: "destructive"
            })
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button
                        className="w-full sm:w-auto text-white hover:opacity-90 min-w-[140px] transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: uiColor }}
                        onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.boxShadow = `0 0 15px ${uiColor}80`
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.boxShadow = ''
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Reward
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Reward" : "Create New Reward"}</DialogTitle>
                    <DialogDescription className="sr-only">Manage your shop rewards</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            placeholder="e.g. Order Pizza"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="bg-input"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Cost (⚡)</Label>
                        <Input
                            type="number"
                            value={cost}
                            onChange={e => setCost(e.target.value)}
                            className="bg-input"
                            min="0"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Textarea
                            placeholder="Details..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="bg-input resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-4xl">{icon}</div>
                                <span className="text-sm text-muted-foreground">Selected Icon</span>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                                <div className="grid grid-cols-8 gap-1">
                                    {EXTENDED_REWARD_ICONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={`text-2xl p-2 rounded hover:bg-secondary transition-colors ${icon === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-background'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 py-3 px-4 bg-secondary/30 rounded-lg">
                        <Checkbox
                            id="on-market"
                            checked={isOnMarket}
                            onCheckedChange={(c) => setIsOnMarket(c as boolean)}
                            className="h-5 w-5"
                        />
                        <Label htmlFor="on-market" className="font-semibold cursor-pointer text-base">
                            Add on market
                        </Label>
                    </div>

                    <div className="flex items-center space-x-3 py-3 px-4 bg-secondary/30 rounded-lg">
                        <Checkbox
                            id="in-wheel"
                            checked={isInWheel}
                            onCheckedChange={(c) => setIsInWheel(c as boolean)}
                            className="h-5 w-5"
                        />
                        <Label htmlFor="in-wheel" className="font-semibold cursor-pointer text-base">
                            Add in Spin Wheel
                        </Label>
                    </div>

                    {isInWheel && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label>Drop Chance</Label>
                                <span className="text-sm font-mono font-bold" style={{ color: uiColor }}>
                                    {dropChance}%
                                </span>
                            </div>
                            <div className="relative px-2">
                                <Slider
                                    value={[Number.isFinite(dropChance) ? dropChance : 1]}
                                    onValueChange={(val) => setDropChance(val[0] || 1)}
                                    min={1}
                                    max={Number.isFinite(maxDropChance) && maxDropChance > 1 ? maxDropChance : 100}
                                    step={1}
                                    className="w-full"
                                    style={{
                                        // @ts-ignore
                                        '--slider-color': uiColor
                                    }}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>1%</span>
                                    <span>{maxDropChance}%</span>
                                </div>
                            </div>
                            {maxDropChance < 100 && (
                                <p className="text-xs text-muted-foreground">
                                    Max {maxDropChance}% (other rewards use {100 - maxDropChance}%)
                                </p>
                            )}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Reward")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
