import { Button } from "@/components/ui/button"
import { Film } from "lucide-react"

export default function VideosPage() {
  return (
    <>
      <header className="border-b-[5px] border-foreground bg-background p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">My Videos</h1>
            <p className="text-sm font-mono text-muted-foreground">YOUR GENERATED CONTENT</p>
          </div>
          <Button className="brutalist-button bg-primary text-primary-foreground font-bold uppercase">
            Upload Video
          </Button>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        <div className="brutalist-card bg-card p-12 text-center">
          <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold uppercase">No Videos Yet</h2>
          <p className="text-sm font-mono text-muted-foreground mt-2">
            Go to the Studio to generate your first video.
          </p>
        </div>
      </div>
    </>
  )
}
