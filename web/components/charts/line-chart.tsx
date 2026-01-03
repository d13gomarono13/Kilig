"use client"

export function LineChart() {
  const data = [
    { month: "Jan", users: 420 },
    { month: "Feb", users: 580 },
    { month: "Mar", users: 740 },
    { month: "Apr", users: 920 },
    { month: "May", users: 1100 },
    { month: "Jun", users: 1350 },
  ]

  const maxUsers = Math.max(...data.map((d) => d.users))
  const chartHeight = 250

  return (
    <div className="w-full">
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b-[2px] border-foreground/20" />
          ))}
        </div>

        {/* Y-axis */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pr-4 text-xs font-mono font-bold">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent}>{Math.round((maxUsers * percent) / 100)}</div>
          ))}
        </div>

        {/* Line and points */}
        <div className="ml-10 h-full relative">
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
            <polyline
              points={data
                .map((item, index) => {
                  const x = (index / (data.length - 1)) * 100
                  const y = 100 - (item.users / maxUsers) * 100
                  return `${x}%,${y}%`
                })
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary"
            />
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100
              const y = 100 - (item.users / maxUsers) * 100
              return (
                <g key={index}>
                  <circle cx={`${x}%`} cy={`${y}%`} r="8" fill="currentColor" className="text-primary" />
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="currentColor"
                    className="text-background"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-10 mt-2 flex justify-between">
        {data.map((item, index) => (
          <div key={index} className="text-xs font-mono font-bold">
            {item.month}
          </div>
        ))}
      </div>
    </div>
  )
}
