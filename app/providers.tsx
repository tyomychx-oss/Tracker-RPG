"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import {
    XPProvider,
    QuestsProvider,
    AreaXPProvider,
    AreaColorsProvider,
    AreasProvider,
    AreaFilterProvider,
    RecentActivityProvider,
    UIColorProvider,
    NicknameProvider,
    SparksProvider,
} from "@/components/providers"
import { ShopProvider } from "@/components/shop-provider"

export function Providers({ children }: { children: ReactNode }) {
    // Suppress hydration warnings caused by browser extensions (e.g., Avast)
    // that inject attributes like bis_skin_checked="1"
    useEffect(() => {
        const originalError = console.error
        console.error = (...args: any[]) => {
            if (
                typeof args[0] === 'string' &&
                (args[0].includes('Hydration failed') ||
                    args[0].includes('There was an error while hydrating') ||
                    args[0].includes('bis_skin_checked'))
            ) {
                // Suppress these specific warnings from browser extensions
                return
            }
            originalError.apply(console, args)
        }

        return () => {
            console.error = originalError
        }
    }, [])

    return (
        <XPProvider>
            <QuestsProvider>
                <AreaXPProvider>
                    <AreaColorsProvider>
                        <AreasProvider>
                            <AreaFilterProvider>
                                <RecentActivityProvider>
                                    <UIColorProvider>
                                        <NicknameProvider>
                                            <SparksProvider>
                                                <ShopProvider>
                                                    {children}
                                                </ShopProvider>
                                            </SparksProvider>
                                        </NicknameProvider>
                                    </UIColorProvider>
                                </RecentActivityProvider>
                            </AreaFilterProvider>
                        </AreasProvider>
                    </AreaColorsProvider>
                </AreaXPProvider>
            </QuestsProvider>
        </XPProvider>
    )
}
