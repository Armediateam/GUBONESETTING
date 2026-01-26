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
    const startTimer = setTimeout(() => {
      setVisible(true)
      setProgress(10)

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
    }, 0)

    return () => {
      clearTimeout(startTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pathname])

  useEffect(() => {
    if (!visible) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const finishFrame = setTimeout(() => setProgress(100), 0)

    const timeout = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)

    return () => {
      clearTimeout(finishFrame)
      clearTimeout(timeout)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 z-50 w-full">
      <Progress value={progress} className="h-1 rounded-none bg-transparent" />
    </div>
  )
}
