import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon }: StatCardProps) {
  const changeColor = {
    positive: "text-primary",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  }[changeType]

  return (
    <div className="brutalist-card bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold uppercase text-muted-foreground mb-2">{title}</p>
          <p className="text-4xl font-bold font-mono mb-2">{value}</p>
          {change && <p className={`text-sm font-bold font-mono ${changeColor}`}>{change}</p>}
        </div>
        <div className="p-3 border-[3px] border-foreground bg-primary">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </div>
  )
}
