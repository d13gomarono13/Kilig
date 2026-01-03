"use client"

import { X, Mail, Phone, MapPin, Calendar, ShoppingCart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomerModalProps {
  customer: {
    name: string
    email: string
    phone: string
    location: string
    status: string
    orders: number
    totalSpent: number
    joinDate: string
  }
  onClose: () => void
}

export function CustomerModal({ customer, onClose }: CustomerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={onClose}>
      <div
        className="brutalist-card bg-background p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold uppercase mb-2">{customer.name}</h2>
            <span
              className={`inline-block px-3 py-1 text-xs font-bold uppercase border-[2px] border-foreground ${
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
          <Button variant="outline" size="icon" className="brutalist-button bg-background" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border-[3px] border-foreground p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5" />
              <span className="text-sm font-bold uppercase">Email</span>
            </div>
            <p className="font-mono">{customer.email}</p>
          </div>
          <div className="border-[3px] border-foreground p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5" />
              <span className="text-sm font-bold uppercase">Phone</span>
            </div>
            <p className="font-mono">{customer.phone}</p>
          </div>
          <div className="border-[3px] border-foreground p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-bold uppercase">Location</span>
            </div>
            <p className="font-mono">{customer.location}</p>
          </div>
          <div className="border-[3px] border-foreground p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-bold uppercase">Join Date</span>
            </div>
            <p className="font-mono">{new Date(customer.joinDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="brutalist-card bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 border-[2px] border-foreground bg-primary">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold uppercase">Total Orders</span>
            </div>
            <p className="text-4xl font-bold font-mono">{customer.orders}</p>
          </div>
          <div className="brutalist-card bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 border-[2px] border-foreground bg-accent">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-sm font-bold uppercase">Total Spent</span>
            </div>
            <p className="text-4xl font-bold font-mono">${customer.totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mb-6">
          <h3 className="text-xl font-bold uppercase mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[
              { id: "#ORD-1234", date: "2024-01-15", amount: 234.5, status: "delivered" },
              { id: "#ORD-1235", date: "2024-01-10", amount: 456.78, status: "shipped" },
              { id: "#ORD-1236", date: "2024-01-05", amount: 123.45, status: "processing" },
            ].map((order, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border-[3px] border-foreground bg-muted"
              >
                <div>
                  <p className="font-bold font-mono">{order.id}</p>
                  <p className="text-sm text-muted-foreground font-mono">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono">${order.amount}</p>
                  <p className="text-sm uppercase text-primary">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase flex-1">
            Send Email
          </Button>
          <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase flex-1">
            Edit Details
          </Button>
        </div>
      </div>
    </div>
  )
}
