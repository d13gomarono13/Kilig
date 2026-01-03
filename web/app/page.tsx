"use client"

import { Activity, Zap, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { Player } from "@revideo/player-react"
import project from "../revideo/project"
import { toast } from "sonner"

interface AgentLog {
  id: string
  author: string
  text: string
  timestamp: string
  type: 'info' | 'success' | 'error'
}

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const addLog = (author: string, text: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      author,
      text,
      timestamp: new Date().toLocaleTimeString(),
      type
    }])
  }

  const handleGenerate = async () => {
    if (!prompt) return
    
    setIsGenerating(true)
    setLogs([]) // Clear previous logs
    addLog('System', 'Initializing pipeline...', 'info')

    try {
      const response = await fetch('http://localhost:8080/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      })

      if (!response.ok) throw new Error('Failed to connect to backend')

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              if (data.type === 'project_created') {
                addLog('System', `Project Created: ${data.projectId}`, 'success')
              }
              
              if (data.type === 'agent_event') {
                addLog(data.author, data.text || 'Thinking...', 'info')
              }

              if (data.type === 'error') {
                addLog('System', `Error: ${data.message}`, 'error')
                toast.error(data.message)
              }

              if (data.type === 'done') {
                addLog('System', 'Pipeline Finished.', 'success')
                setIsGenerating(false)
                toast.success('Video Generated!')
              }
            } catch (e) {
              console.error('Parse error', e)
            }
          }
        }
      }
    } catch (error: any) {
      addLog('System', `Connection Failed: ${error.message}`, 'error')
      setIsGenerating(false)
      toast.error('Failed to trigger agents')
    }
  }

  return (
    <>
      {/* Header */}
      <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">Kilig Studio</h1>
            <p className="text-sm font-mono text-muted-foreground">AUTOMATED VIDEO PRODUCTION</p>
          </div>
          <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
            New Project
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 lg:p-8 space-y-8">
        
        {/* Creation Input */}
        <div className="brutalist-card bg-card p-6">
          <h2 className="text-2xl font-bold uppercase mb-4">Start Creating</h2>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={isGenerating}
              placeholder="Paste ArXiv URL or Topic (e.g. 'Transformer Architecture')..." 
              className="flex-1 p-4 border-[3px] border-foreground font-mono text-lg outline-none focus:bg-muted transition-colors disabled:opacity-50"
            />
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="brutalist-button bg-accent text-accent-foreground font-bold uppercase px-8 h-auto text-lg"
            >
              {isGenerating ? <Activity className="mr-2 h-5 w-5 animate-pulse" /> : <Zap className="mr-2 h-5 w-5" />}
              {isGenerating ? 'Working...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          
          {/* Left: Agent Logs */}
          <div className="lg:col-span-1 brutalist-card bg-background flex flex-col overflow-hidden">
            <div className="p-4 border-b-[3px] border-foreground bg-muted flex justify-between items-center">
              <h3 className="font-bold uppercase flex items-center gap-2">
                <Terminal className="h-5 w-5" /> Agent Logs
              </h3>
              <span className={`text-xs font-mono px-2 py-1 border-[2px] border-foreground ${isGenerating ? 'bg-yellow-400' : 'bg-green-400'}`}>
                {isGenerating ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-3 bg-white">
              {logs.length === 0 && (
                <div className="opacity-50 text-center mt-10">
                  <p>{'>'} System ready.</p>
                  <p>{'>'} Awaiting input...</p>
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="opacity-50">[{log.timestamp}]</span>
                  <div className="flex-1">
                    <span className={`font-bold uppercase mr-2 ${ 
                      log.author === 'root' ? 'text-purple-600' :
                      log.author === 'scientist' ? 'text-blue-600' :
                      log.author === 'narrative_architect' ? 'text-pink-600' :
                      log.author === 'designer' ? 'text-orange-600' :
                      log.type === 'error' ? 'text-red-600' : 'text-foreground'
                    }`}>
                      {log.author}:
                    </span>
                    <span className={log.type === 'error' ? 'text-red-600 font-bold' : ''}>
                      {log.text}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Right: Player/Canvas */}
          <div className="lg:col-span-2 brutalist-card bg-black p-0 overflow-hidden relative flex flex-col">
            <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]">
               <Player
                 project={project}
                 controls
                 style={{ width: '100%', height: '100%' }}
               />
            </div>
            <div className="p-2 bg-muted border-t-[3px] border-foreground flex justify-between items-center px-4">
               <span className="font-mono text-xs font-bold uppercase">Scene: Intro</span>
               <div className="flex gap-2">
                  <span className="w-3 h-3 bg-red-500 border border-black rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 border border-black rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 border border-black rounded-full"></span>
               </div>
            </div>
          </div>

        </div>

      </div>
    </>
  )
}