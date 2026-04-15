"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Swords, BarChart3, Dices, ShoppingBag, UserCheck, Zap } from "lucide-react"

export function SystemGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
            <Zap className="h-8 w-8 text-primary fill-primary" />
            SYSTEM MANUAL
          </DialogTitle>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Protocol v2.4 | Hero Guidelines</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2 h-full">
          <Accordion type="single" collapsible className="space-y-4 pb-8">
            {/* 1. Quest Protocols */}
            <AccordionItem value="protocols" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <Swords className="h-6 w-6 text-primary" />
                  <span>1. Quest Protocols</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
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
              </AccordionContent>
            </AccordionItem>

            {/* 2. Economy & XP */}
            <AccordionItem value="economy" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span>2. Economy & XP</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
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
              </AccordionContent>
            </AccordionItem>

            {/* 3. The Gacha Forge */}
            <AccordionItem value="gacha" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <Dices className="h-6 w-6 text-primary" />
                  <span>3. The Gacha Forge</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <p className="text-sm"><span className="font-bold text-foreground">Luck Wheel:</span> A probability-based reward system.</p>
                <p className="text-sm"><span className="font-bold text-foreground">Fair Odds:</span> The visual area of each segment represents its actual drop chance. A <span className="font-bold text-primary">10% chance</span> takes exactly 10% of the wheel&apos;s surface.</p>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-white">The &quot;Empty&quot; Zone:</span> If the total odds of active rewards are under 100%, the remaining space is the <span className="text-slate-500 font-bold">Empty</span> sector. No win, but a valuable lesson in probability.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Inventory & Shop */}
            <AccordionItem value="shop" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <span>4. Inventory & Shop</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-bold text-foreground">Consumables:</span> Buy items to boost your productivity. Some items increase XP gain for a duration, while others protect your streak.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-bold text-foreground">Item Storage:</span> All won or purchased items are stored in your Inventory. Activate them only when you are ready for a sprint.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Character & Sync */}
            <AccordionItem value="sync" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <span>5. Character & Sync</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <p className="text-sm"><span className="font-bold text-foreground">Cloud Identity:</span> Your progress is synced in real-time with Supabase. Whether on mobile or desktop, your journey remains intact.</p>
                <p className="text-sm"><span className="font-bold text-foreground">Route Guarding:</span> Only authenticated Heroes can access the System. Your data is protected by your personal account.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}


