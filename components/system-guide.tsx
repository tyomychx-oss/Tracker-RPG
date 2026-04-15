"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Swords, BarChart3, Dices, ShoppingBag, UserCheck, Zap } from "lucide-react"

export function SystemGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary fill-primary" />
            SYSTEM MANUAL
          </DialogTitle>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Protocol v2.4 | Hero Guidelines</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-10 pb-10">
            {/* 1. Quest Protocols */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-2">
                <Swords className="h-6 w-6 text-primary" />
                <h2>1. Quest Protocols</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-foreground">The Mini-Quest Rule:</span> Every grand goal is just a series of <span className="font-bold text-primary">15–30 minute actions</span>. Break tasks down to keep momentum high and friction low.
                </p>
                <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border/50">
                  <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Rarity Tiers</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span><span className="font-bold">Common (White):</span> Daily routine & small tasks.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span><span className="font-bold">Rare (Blue):</span> Significant progress or focused work.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span><span className="font-bold">Epic (Purple):</span> High-impact milestones.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span><span className="font-bold">Legendary (Gold):</span> Life-changing achievements.</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  <span className="font-bold text-foreground not-italic">Difficulty Scaling:</span> Higher rarity increases both the XP and Gold rewards but demands more cognitive energy.
                </p>
              </div>
            </section>

            {/* 2. Economy & XP */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h2>2. Economy & XP</h2>
              </div>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-bold text-foreground">Experience (XP):</span> Earned by completing quests. Accumulate XP to level up your character and unlock new shop tiers.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-bold text-foreground">Gold ($):</span> Your primary currency. Earned based on quest rarity and priority. Use it in the Gacha Forge or the Item Shop.</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-sm">
                    <span className="font-bold text-primary">Priority Multipliers:</span> High-priority tasks (High/Urgent) act as <span className="font-bold underline decoration-2 underline-offset-4">multipliers</span> for your rewards. Focus on what moves the needle.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. The Gacha Forge */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-2">
                <Dices className="h-6 w-6 text-primary" />
                <h2>3. The Gacha Forge</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm"><span className="font-bold text-foreground">Luck Wheel:</span> A probability-based reward system.</p>
                <p className="text-sm"><span className="font-bold text-foreground">Fair Odds:</span> The visual area of each segment represents its actual drop chance. A <span className="font-bold text-primary">10% chance</span> takes exactly 10% of the wheel&apos;s surface.</p>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-white">The &quot;Empty&quot; Zone:</span> If the total odds of active rewards are under 100%, the remaining space is the <span className="text-slate-500 font-bold">Empty</span> sector. No win, but a valuable lesson in probability.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Inventory & Shop */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-2">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h2>4. Inventory & Shop</h2>
              </div>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-bold text-foreground">Consumables:</span> Buy items to boost your productivity. Some items increase XP gain for a duration, while others protect your streak.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-bold text-foreground">Item Storage:</span> All won or purchased items are stored in your Inventory. Activate them only when you are ready for a sprint.</p>
                </div>
              </div>
            </section>

            {/* 5. Character & Sync */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-2">
                <UserCheck className="h-6 w-6 text-primary" />
                <h2>5. Character & Sync</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm"><span className="font-bold text-foreground">Cloud Identity:</span> Your progress is synced in real-time with Supabase. Whether on mobile or desktop, your journey remains intact.</p>
                <p className="text-sm"><span className="font-bold text-foreground">Route Guarding:</span> Only authenticated Heroes can access the System. Your data is protected by your personal account.</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

