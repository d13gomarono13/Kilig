"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

interface RealtimeData {
  activeUsers: number
  requestsPerMinute: number
  averageResponseTime: number
  errorRate: number
}

export function RealtimeStats() {
  const [data, setData] = useState<RealtimeData>({
    activeUsers: 1245,
    requestsPerMinute: 3420,
    averageResponseTime: 124,
    errorRate: 0.3,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        activeUsers: Math.max(1000, prev.activeUsers + Math.floor(Math.random() * 40 - 20)),
        requestsPerMinute: Math.max(2000, prev.requestsPerMinute + Math.floor(Math.random() * 200 - 100)),
        averageResponseTime: Math.max(80, prev.averageResponseTime + Math.floor(Math.random() * 20 - 10)),
        errorRate: Math.max(0.1, Math.min(2, prev.errorRate + (Math.random() * 0.2 - 0.1))),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="brutalist-card bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase mb-1">Real-Time Monitoring</h2>
          <p className="text-sm font-mono text-muted-foreground">LIVE SYSTEM METRICS</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          <Activity className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-[3px] border-foreground p-4 bg-muted">
          <p className="text-sm font-bold uppercase text-muted-foreground mb-2">Active Users</p>
          <p className="text-3xl font-bold font-mono">{data.activeUsers.toLocaleString()}</p>
          <div className="mt-2 h-1 bg-foreground/20">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: "75%" }} />
          </div>
        </div>

        <div className="border-[3px] border-foreground p-4 bg-muted">
          <p className="text-sm font-bold uppercase text-muted-foreground mb-2">Requests/min</p>
          <p className="text-3xl font-bold font-mono">{data.requestsPerMinute.toLocaleString()}</p>
          <div className="mt-2 h-1 bg-foreground/20">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: "82%" }} />
          </div>
        </div>

        <div className="border-[3px] border-foreground p-4 bg-muted">
          <p className="text-sm font-bold uppercase text-muted-foreground mb-2">Avg Response</p>
          <p className="text-3xl font-bold font-mono">{data.averageResponseTime}ms</p>
          <div className="mt-2 h-1 bg-foreground/20">
            <div className="h-full bg-chart-4 transition-all duration-500" style={{ width: "68%" }} />
          </div>
        </div>

        <div className="border-[3px] border-foreground p-4 bg-muted">
          <p className="text-sm font-bold uppercase text-muted-foreground mb-2">Error Rate</p>
          <p className="text-3xl font-bold font-mono">{data.errorRate.toFixed(2)}%</p>
          <div className="mt-2 h-1 bg-foreground/20">
            <div className="h-full bg-destructive transition-all duration-500" style={{ width: "15%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
