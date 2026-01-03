"use client"

import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { TrendingUp, Users, DollarSign, Activity, Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AreaChart } from "@/components/charts/area-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { useState } from "react"

const timeRanges = ["7D", "30D", "90D", "1Y", "ALL"]

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState("30D")

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold uppercase mb-2">Analytics</h1>
              <p className="text-sm font-mono text-muted-foreground">COMPREHENSIVE DATA INSIGHTS</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex border-[3px] border-foreground">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-4 py-2 font-bold font-mono text-sm border-r-[3px] last:border-r-0 border-foreground transition-colors ${
                      selectedRange === range ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value="$124,592"
              change="+32.4% vs last period"
              changeType="positive"
              icon={DollarSign}
            />
            <StatCard
              title="Total Users"
              value="8,549"
              change="+18.2% vs last period"
              changeType="positive"
              icon={Users}
            />
            <StatCard
              title="Avg. Session"
              value="4m 32s"
              change="+8.1% vs last period"
              changeType="positive"
              icon={Activity}
            />
            <StatCard
              title="Growth Rate"
              value="23.1%"
              change="-2.4% vs last period"
              changeType="negative"
              icon={TrendingUp}
            />
          </div>

          {/* Revenue Chart */}
          <div className="brutalist-card bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold uppercase mb-1">Revenue Overview</h2>
                <p className="text-sm font-mono text-muted-foreground">MONTHLY PERFORMANCE</p>
              </div>
              <Calendar className="h-6 w-6" />
            </div>
            <AreaChart />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="brutalist-card bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold uppercase mb-1">User Growth</h2>
                <p className="text-sm font-mono text-muted-foreground">NEW USERS PER MONTH</p>
              </div>
              <LineChart />
            </div>

            {/* Category Performance */}
            <div className="brutalist-card bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold uppercase mb-1">Category Performance</h2>
                <p className="text-sm font-mono text-muted-foreground">SALES BY CATEGORY</p>
              </div>
              <BarChart />
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="brutalist-card bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold uppercase mb-1">Traffic Sources</h2>
              <p className="text-sm font-mono text-muted-foreground">WHERE YOUR VISITORS COME FROM</p>
            </div>
            <div className="space-y-4">
              {[
                { source: "Direct", visitors: "12,453", percentage: 42, color: "bg-primary" },
                { source: "Organic Search", visitors: "8,721", percentage: 30, color: "bg-accent" },
                { source: "Social Media", visitors: "5,234", percentage: 18, color: "bg-chart-3" },
                { source: "Referral", visitors: "2,891", percentage: 10, color: "bg-chart-4" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase">{item.source}</span>
                    <span className="font-mono font-bold">{item.visitors}</span>
                  </div>
                  <div className="h-8 border-[3px] border-foreground bg-muted relative overflow-hidden">
                    <div
                      className={`h-full ${item.color} border-r-[3px] border-foreground flex items-center justify-end pr-2`}
                      style={{ width: `${item.percentage}%` }}
                    >
                      <span className="font-mono font-bold text-sm text-foreground">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="brutalist-card bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold uppercase mb-1">Top Pages</h2>
              <p className="text-sm font-mono text-muted-foreground">MOST VISITED PAGES</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-[3px] border-foreground">
                    <th className="text-left py-3 px-4 font-bold uppercase text-sm">Page</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-sm">Views</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-sm">Avg. Time</th>
                    <th className="text-left py-3 px-4 font-bold uppercase text-sm">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { page: "/dashboard", views: "15,234", time: "3m 24s", bounce: "32.4%" },
                    { page: "/products", views: "12,891", time: "4m 12s", bounce: "28.1%" },
                    { page: "/about", views: "9,456", time: "2m 45s", bounce: "45.6%" },
                    { page: "/contact", views: "7,823", time: "1m 56s", bounce: "52.3%" },
                    { page: "/pricing", views: "6,234", time: "3m 08s", bounce: "38.9%" },
                  ].map((row, index) => (
                    <tr key={index} className="border-b-[2px] border-foreground last:border-b-0">
                      <td className="py-3 px-4 font-mono">{row.page}</td>
                      <td className="py-3 px-4 font-mono font-bold">{row.views}</td>
                      <td className="py-3 px-4 font-mono">{row.time}</td>
                      <td className="py-3 px-4 font-mono">{row.bounce}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
