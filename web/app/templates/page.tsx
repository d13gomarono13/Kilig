import { Button } from "@/components/ui/button"
import { FileVideo } from "lucide-react"

export default function TemplatesPage() {
  return (
    <>
      <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">Templates</h1>
            <p className="text-sm font-mono text-muted-foreground">START FROM A PRESET</p>
          </div>
          <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
            New Template
          </Button>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="brutalist-card bg-card p-12 text-center">
          <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold uppercase">No Templates Found</h2>
          <p className="text-sm font-mono text-muted-foreground mt-2">
            Create a custom project to save it as a template.
          </p>
        </div>
      </div>
    </>
  )
}
