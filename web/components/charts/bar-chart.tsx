"use client"

export function BarChart() {
  const data = [
    { category: "Electronics", sales: 45000 },
    { category: "Clothing", sales: 32000 },
    { category: "Food", sales: 28000 },
    { category: "Books", sales: 18000 },
    { category: "Sports", sales: 22000 },
  ]

  const maxSales = Math.max(...data.map((d) => d.sales))

  return (
    <div className="w-full space-y-4">
      {data.map((item, index) => {
        const percentage = (item.sales / maxSales) * 100
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm uppercase">{item.category}</span>
              <span className="font-mono font-bold text-sm">${(item.sales / 1000).toFixed(0)}k</span>
            </div>
            <div className="h-10 border-[3px] border-foreground bg-muted relative overflow-hidden">
              <div
                className="h-full bg-primary border-r-[3px] border-foreground transition-all hover:bg-accent"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
