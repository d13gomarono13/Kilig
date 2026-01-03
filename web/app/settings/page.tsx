"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Save, User, Bell, Shield, Palette, Database } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold uppercase mb-2">Settings</h1>
              <p className="text-sm font-mono text-muted-foreground">CONFIGURE YOUR DASHBOARD</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* Profile Settings */}
          <div className="brutalist-card bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 border-[3px] border-foreground bg-primary">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase">Profile Settings</h2>
                <p className="text-sm font-mono text-muted-foreground">UPDATE YOUR PERSONAL INFORMATION</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="John Anderson"
                  className="w-full px-4 py-3 border-[3px] border-foreground bg-background font-mono focus:shadow-[4px_4px_0px_0px] focus:shadow-foreground transition-shadow outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue="john@example.com"
                  className="w-full px-4 py-3 border-[3px] border-foreground bg-background font-mono focus:shadow-[4px_4px_0px_0px] focus:shadow-foreground transition-shadow outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Company</label>
                <input
                  type="text"
                  defaultValue="Stack Dashboard Inc."
                  className="w-full px-4 py-3 border-[3px] border-foreground bg-background font-mono focus:shadow-[4px_4px_0px_0px] focus:shadow-foreground transition-shadow outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Role</label>
                <select className="w-full px-4 py-3 border-[3px] border-foreground bg-background font-mono focus:shadow-[4px_4px_0px_0px] focus:shadow-foreground transition-shadow outline-none">
                  <option>Administrator</option>
                  <option>Manager</option>
                  <option>User</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="brutalist-card bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 border-[3px] border-foreground bg-accent">
                <Bell className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase">Notification Settings</h2>
                <p className="text-sm font-mono text-muted-foreground">MANAGE YOUR ALERT PREFERENCES</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", description: "Receive updates via email" },
                { key: "push", label: "Push Notifications", description: "Browser push notifications" },
                { key: "sms", label: "SMS Notifications", description: "Text message alerts" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border-[3px] border-foreground">
                  <div>
                    <p className="font-bold uppercase">{item.label}</p>
                    <p className="text-sm text-muted-foreground font-mono">{item.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                    className={`w-16 h-8 border-[3px] border-foreground transition-colors ${
                      notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 border-[2px] border-foreground bg-background transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? "translate-x-8" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <div className="brutalist-card bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border-[3px] border-foreground bg-destructive">
                  <Shield className="h-6 w-6 text-destructive-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase">Security</h2>
                  <p className="text-sm font-mono text-muted-foreground">ACCOUNT PROTECTION</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase w-full">
                  Change Password
                </Button>
                <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase w-full">
                  Enable 2FA
                </Button>
                <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase w-full">
                  View Sessions
                </Button>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="brutalist-card bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border-[3px] border-foreground bg-chart-3">
                  <Palette className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase">Appearance</h2>
                  <p className="text-sm font-mono text-muted-foreground">CUSTOMIZE YOUR INTERFACE</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase mb-2">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="brutalist-button bg-primary text-primary-foreground p-4 font-bold uppercase">
                      Light
                    </button>
                    <button className="brutalist-button bg-background p-4 font-bold uppercase">Dark</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase mb-2">Density</label>
                  <select className="w-full px-4 py-3 border-[3px] border-foreground bg-background font-mono">
                    <option>Comfortable</option>
                    <option>Compact</option>
                    <option>Spacious</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Database Settings */}
          <div className="brutalist-card bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 border-[3px] border-foreground bg-chart-4">
                <Database className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase">Data Management</h2>
                <p className="text-sm font-mono text-muted-foreground">EXPORT AND BACKUP OPTIONS</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase">
                Export Data
              </Button>
              <Button className="brutalist-button bg-secondary text-secondary-foreground font-bold uppercase">
                Backup Database
              </Button>
              <Button className="brutalist-button bg-destructive text-destructive-foreground font-bold uppercase">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
