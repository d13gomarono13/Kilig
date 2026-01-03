"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, Mail, Phone, MapPin, MoreVertical } from "lucide-react"
import { useState, Suspense } from "react"
import { CustomerModal } from "@/components/customer-modal"

const customers = [
  {
    id: 1,
    name: "John Anderson",
    email: "john.anderson@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    status: "active",
    orders: 24,
    totalSpent: 12450,
    joinDate: "2023-01-15",
  },
  {
    id: 2,
    name: "Sarah Mitchell",
    email: "sarah.mitchell@email.com",
    phone: "+1 (555) 234-5678",
    location: "Los Angeles, CA",
    status: "active",
    orders: 18,
    totalSpent: 8920,
    joinDate: "2023-02-22",
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+1 (555) 345-6789",
    location: "San Francisco, CA",
    status: "inactive",
    orders: 31,
    totalSpent: 15670,
    joinDate: "2022-11-08",
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 456-7890",
    location: "Austin, TX",
    status: "active",
    orders: 12,
    totalSpent: 6340,
    joinDate: "2023-05-12",
  },
  {
    id: 5,
    name: "David Thompson",
    email: "david.thompson@email.com",
    phone: "+1 (555) 567-8901",
    location: "Seattle, WA",
    status: "active",
    orders: 27,
    totalSpent: 13890,
    joinDate: "2023-03-30",
  },
  {
    id: 6,
    name: "Jessica Williams",
    email: "jessica.williams@email.com",
    phone: "+1 (555) 678-9012",
    location: "Chicago, IL",
    status: "pending",
    orders: 5,
    totalSpent: 2340,
    joinDate: "2023-11-18",
  },
]

function CustomersContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof customers)[0] | null>(null)

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || customer.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold uppercase mb-2">Customers</h1>
              <p className="text-sm font-mono text-muted-foreground">MANAGE YOUR CUSTOMER BASE</p>
            </div>
            <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="brutalist-card bg-card p-4">
              <p className="text-sm font-bold uppercase text-muted-foreground mb-1">Total Customers</p>
              <p className="text-3xl font-bold font-mono">{customers.length}</p>
            </div>
            <div className="brutalist-card bg-card p-4">
              <p className="text-sm font-bold uppercase text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {customers.filter((c) => c.status === "active").length}
              </p>
            </div>
            <div className="brutalist-card bg-card p-4">
              <p className="text-sm font-bold uppercase text-muted-foreground mb-1">Inactive</p>
              <p className="text-3xl font-bold font-mono text-muted-foreground">
                {customers.filter((c) => c.status === "inactive").length}
              </p>
            </div>
            <div className="brutalist-card bg-card p-4">
              <p className="text-sm font-bold uppercase text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold font-mono text-accent">
                {customers.filter((c) => c.status === "pending").length}
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-[3px] border-foreground bg-background font-mono focus:shadow-[4px_4px_0px_0px] focus:shadow-foreground transition-shadow outline-none"
              />
            </div>
            <div className="flex gap-2 border-[3px] border-foreground">
              {["all", "active", "inactive", "pending"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-6 py-3 font-bold uppercase text-sm border-r-[3px] last:border-r-0 border-foreground transition-colors ${
                    filterStatus === status ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Customer List */}
          <div className="brutalist-card bg-card p-6">
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border-[3px] border-foreground p-4 hover:shadow-[4px_4px_0px_0px] hover:shadow-foreground transition-all cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold uppercase">{customer.name}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-bold uppercase border-[2px] border-foreground ${
                            customer.status === "active"
                              ? "bg-primary text-primary-foreground"
                              : customer.status === "inactive"
                                ? "bg-muted text-muted-foreground"
                                : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {customer.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold font-mono">{customer.orders}</p>
                        <p className="text-xs uppercase text-muted-foreground">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold font-mono">${(customer.totalSpent / 1000).toFixed(1)}k</p>
                        <p className="text-xs uppercase text-muted-foreground">Spent</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="brutalist-button bg-background"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {selectedCustomer && <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersContent />
    </Suspense>
  )
}
