"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const NovaApp = dynamic(() => import("@/components/nova/app-shell").then((m) => m.NovaApp), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-white shadow-lg">
          N
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    </div>
  ),
})

export default function Page() {
  return <NovaApp />
}
