"use client"

export function AreaChart() {
  const data = [
    { month: "Jan", revenue: 32000 },
    { month: "Feb", revenue: 38000 },
    { month: "Mar", revenue: 35000 },
    { month: "Apr", revenue: 42000 },
    { month: "May", revenue: 48000 },
    { month: "Jun", revenue: 51000 },
    { month: "Jul", revenue: 55000 },
    { month: "Aug", revenue: 62000 },
    { month: "Sep", revenue: 58000 },
    { month: "Oct", revenue: 67000 },
    { month: "Nov", revenue: 72000 },
    { month: "Dec", revenue: 78000 },
  ]

  const maxRevenue = Math.max(...data.map((d) => d.revenue))
  const chartHeight = 300

  return (
    <div className="w-full">
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b-[2px] border-foreground/20" />
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pr-4 text-xs font-mono font-bold">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent}>${((maxRevenue * percent) / 100 / 1000).toFixed(0)}k</div>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end gap-1">
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full relative flex-1 flex items-end">
                  <div
                    className="w-full bg-primary border-[3px] border-foreground transition-all group-hover:bg-accent"
                    style={{ height: `${height}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 mt-2 flex items-center gap-1">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center text-xs font-mono font-bold">
            {item.month}
          </div>
        ))}
      </div>
    </div>
  )
}
