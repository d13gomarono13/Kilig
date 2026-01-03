"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical, User, Clock } from "lucide-react"
import { useState } from "react"

interface Task {
  id: number
  title: string
  description: string
  assignee: string
  priority: "low" | "medium" | "high"
  tags: string[]
  dueDate: string
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

const initialColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    tasks: [
      {
        id: 1,
        title: "Design new landing page",
        description: "Create mockups for the updated landing page design",
        assignee: "Sarah M.",
        priority: "high",
        tags: ["design", "urgent"],
        dueDate: "2024-01-20",
      },
      {
        id: 2,
        title: "Update API documentation",
        description: "Add new endpoints to the API docs",
        assignee: "Mike J.",
        priority: "medium",
        tags: ["docs", "backend"],
        dueDate: "2024-01-25",
      },
      {
        id: 3,
        title: "Fix mobile navigation",
        description: "Mobile menu not working on iOS devices",
        assignee: "John A.",
        priority: "high",
        tags: ["bug", "mobile"],
        dueDate: "2024-01-18",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: 4,
        title: "Implement authentication",
        description: "Add JWT-based authentication system",
        assignee: "Emily R.",
        priority: "high",
        tags: ["backend", "security"],
        dueDate: "2024-01-22",
      },
      {
        id: 5,
        title: "Create user dashboard",
        description: "Build the main user dashboard with analytics",
        assignee: "David T.",
        priority: "medium",
        tags: ["frontend", "ui"],
        dueDate: "2024-01-28",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    tasks: [
      {
        id: 6,
        title: "Code review: Payment integration",
        description: "Review Stripe payment integration PR",
        assignee: "Jessica W.",
        priority: "high",
        tags: ["review", "payments"],
        dueDate: "2024-01-19",
      },
      {
        id: 7,
        title: "QA testing: Search feature",
        description: "Test the new search functionality",
        assignee: "Tom B.",
        priority: "medium",
        tags: ["qa", "testing"],
        dueDate: "2024-01-21",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: 8,
        title: "Setup CI/CD pipeline",
        description: "Configure GitHub Actions for automated deployment",
        assignee: "Mike J.",
        priority: "low",
        tags: ["devops", "automation"],
        dueDate: "2024-01-15",
      },
      {
        id: 9,
        title: "Database optimization",
        description: "Optimize slow queries and add indexes",
        assignee: "Sarah M.",
        priority: "medium",
        tags: ["backend", "performance"],
        dueDate: "2024-01-16",
      },
    ],
  },
]

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null)

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, columnId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return

    const newColumns = columns.map((col) => {
      if (col.id === draggedTask.columnId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id),
        }
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, draggedTask.task],
        }
      }
      return col
    })

    setColumns(newColumns)
    setDraggedTask(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold uppercase mb-2">Kanban Board</h1>
              <p className="text-sm font-mono text-muted-foreground">PROJECT TASK MANAGEMENT</p>
            </div>
            <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                {/* Column Header */}
                <div className="brutalist-card bg-card p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold uppercase">{column.title}</h2>
                    <span className="px-3 py-1 text-sm font-bold font-mono border-[2px] border-foreground bg-muted">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Tasks */}
                <div
                  className="flex-1 space-y-4 min-h-[400px] p-2 border-[3px] border-dashed border-foreground/30"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                      className="brutalist-card bg-card p-4 cursor-move hover:shadow-[6px_6px_0px_0px] hover:shadow-foreground transition-all"
                    >
                      {/* Priority Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2 py-1 text-xs font-bold uppercase border-[2px] border-foreground ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                        <button className="p-1 hover:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Task Title & Description */}
                      <h3 className="font-bold text-lg mb-2">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{task.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-mono border-[2px] border-foreground bg-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Task Footer */}
                      <div className="flex items-center justify-between pt-3 border-t-[2px] border-foreground">
                        <div className="flex items-center gap-2 text-sm font-mono">
                          <User className="h-4 w-4" />
                          {task.assignee}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Task Button */}
                  <button className="w-full p-4 border-[3px] border-dashed border-foreground hover:bg-muted hover:border-solid transition-all">
                    <Plus className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
