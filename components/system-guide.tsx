"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Swords, BarChart3, Dices, ShoppingBag, UserCheck, Zap, Target } from "lucide-react"

export function SystemGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
            <Zap className="h-8 w-8 text-primary fill-primary" />
            SYSTEM MANUAL
          </DialogTitle>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">QuestLife Protocol | Welcome, Hero</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2 h-full">
          <Accordion type="single" collapsible className="space-y-4 pb-8">
            {/* 1. Quest Framework */}
            <AccordionItem value="framework" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <Swords className="h-6 w-6 text-primary" />
                  <span>1. Quest Framework</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4 text-muted-foreground">
                <p className="text-sm leading-relaxed text-foreground">
                  The efficiency of your journey depends on how you categorize your efforts. We use a four-tier classification system:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <p className="text-sm font-bold text-foreground">🟢 Fast (30s – 3m)</p>
                    <p className="text-xs">Quick administrative tasks or small errands.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <p className="text-sm font-bold text-foreground">🔵 Short (3m – 10m)</p>
                    <p className="text-xs">Single-step tasks requiring light focus.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <p className="text-sm font-bold text-foreground">🟣 Deep (10m – 1h)</p>
                    <p className="text-xs">Focused work blocks requiring concentration.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <p className="text-sm font-bold text-foreground">🔴 Hard (1h+)</p>
                    <p className="text-xs">Complex projects or high-friction activities.</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm italic">
                    <span className="font-bold text-primary not-italic">Strategy Tip:</span> Use <span className="font-bold text-foreground">Subtasks</span> to break down Hard items into manageable components to maintain momentum.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Activity Categories */}
            <AccordionItem value="categories" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <Target className="h-6 w-6 text-primary" />
                  <span>2. Activity Categories</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1 bg-sky-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground italic">Tasks</p>
                      <p className="text-xs text-muted-foreground">Standard one-off actions. Once completed, they are moved to your archive and rewards are issued immediately.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 bg-amber-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground italic">Dailies</p>
                      <p className="text-xs text-muted-foreground">Recurring rituals and routines. You can customize the <span className="font-bold">reset time</span> and frequency (e.g., three times per day, or every two days).</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 bg-rose-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground italic">Habits</p>
                      <p className="text-xs text-muted-foreground">Long-term discipline tracking (e.g., Gym 3x/week). Monitor your <span className="font-bold">Streaks</span> and receive large XP payouts at the end of each successful week.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Sparks Economy */}
            <AccordionItem value="economy" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <Zap className="h-6 w-6 text-primary" />
                  <span>3. Sparks Economy</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    <span className="font-bold">Sparks</span> are the universal energy currency of QuestLife.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Every completed quest generates Sparks. The volume of energy received is directly proportional to the <span className="font-bold text-foreground">Effort Class</span> (Fast to Hard) you assigned to the task.
                  </p>
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                    <p className="text-sm font-bold text-primary">Effort = Reward</p>
                    <p className="text-xs text-muted-foreground">Higher friction items yield significantly more Sparks for use in the Forge.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Gacha & Market */}
            <AccordionItem value="gacha" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <span>4. Gacha & Market</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">The Gacha Forge</p>
                    <p className="text-xs text-muted-foreground mt-1">Spin the wheel for <span className="font-bold text-primary">35 Sparks</span>. The visual area of each slice perfectly represents your actual chance of winning the reward.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <p className="text-sm font-bold text-orange-600">The Marketplace</p>
                    <p className="text-xs text-muted-foreground mt-1">Visit the Market to define your own rewards. Use your Sparks to &quot;buy&quot; the right to enjoy IRL activities like gaming, scrolling, or snacks. Productivity pays for your relaxation.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Data & Sync */}
            <AccordionItem value="sync" className="border-none">
              <AccordionTrigger className="flex items-center gap-3 text-xl font-bold p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all hover:no-underline [&[data-state=open]]:bg-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <span>5. Data & Sync</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 px-2 space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-foreground"><span className="font-bold">Real-time Cloud Sync:</span> Your status is securely persisted via Supabase. Switch between devices without losing your progress or streaks.</p>
                  <p className="text-sm text-foreground"><span className="font-bold">Auth Guard protection:</span> The route guarding system ensures your personal data and inventory are only accessible by your authenticated Hero account.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}


