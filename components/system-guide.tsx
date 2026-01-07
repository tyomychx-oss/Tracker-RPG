"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

export function SystemGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center font-mono text-primary">System Manual</DialogTitle>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="quests">
            <AccordionTrigger>Quest Protocols ⚔️</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-foreground font-semibold">Tasks (Plans)</div>
                <div className="text-sm text-muted-foreground">One-time missions. Execute once → Get XP → Archive.</div>
                <div className="text-xs text-muted-foreground">Use for: Work projects, specific errands, learning goals.</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-foreground font-semibold">Dailies</div>
                <div className="text-sm text-muted-foreground">Recurring rituals. Strict loops.</div>
                <div className="text-xs text-muted-foreground">Rules: They auto-reset. If you miss the window, you lose the progress.</div>
                <div className="text-xs text-muted-foreground">Use for: Morning routine, Gym schedule, Vitamins.</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-foreground font-semibold">Habits</div>
                <div className="text-sm text-muted-foreground">Behavioral tracking. Spam-clickable.</div>
                <div className="text-xs text-muted-foreground">Use for: Tracking water intake (+), Focus blocks (+), or Bad habits (-).</div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="priority">
            <AccordionTrigger>Priority & XP Economy 📊</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Fast</Badge>
                <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/30">Short</Badge>
                <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/30">Deep</Badge>
                <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Hard</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-foreground">🟢 Fast (&lt; 15 min)</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>Reply to emails</li>
                    <li>Clean desktop</li>
                    <li>Pay bills</li>
                    <li>Quick bug fix</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-foreground">🔵 Short (30 - 60 min)</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>Gym workout</li>
                    <li>Write a social post</li>
                    <li>Read 1 chapter</li>
                    <li>Weekly review</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-foreground">🟣 Deep (1 - 2 hours)</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>Deep coding session</li>
                    <li>Write an article/newsletter</li>
                    <li>Study complex topic</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-foreground">🔴 Hard (&gt; 3 hours or High Friction)</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>Finish course project</li>
                    <li>Taxes/bureaucracy</li>
                    <li>Launch a product</li>
                    <li>General cleaning</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="navigation">
            <AccordionTrigger>Navigation & Filters 🧭</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="text-sm text-foreground">Focus Mode</div>
              <div className="text-xs text-muted-foreground">Click any Area Name in the sidebar to isolate quests for that specific skill.</div>
              <div className="text-sm text-foreground">Global View</div>
              <div className="text-xs text-muted-foreground">Click the active area again to return to the dashboard view.</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  )
}
