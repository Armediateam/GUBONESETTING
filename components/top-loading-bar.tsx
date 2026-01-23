"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Progress } from "@/components/ui/progress"

export function TopLoadingBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Route berubah → mulai loading
    setVisible(true)
    setProgress(10)

    // Simulasi progress REALISTIS (bukan langsung 100)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 200)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pathname])

  useEffect(() => {
    if (!visible) return

    // Saat halaman selesai render
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setProgress(100)

    const timeout = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)

    return () => clearTimeout(timeout)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 z-50 w-full">
      <Progress
        value={progress}
        className="h-1 rounded-none bg-transparent"
      />
    </div>
  )
}
