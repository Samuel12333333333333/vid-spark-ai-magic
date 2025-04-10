
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, SlidersHorizontal, Rows3, Grid2X2 } from "lucide-react";
import { Link } from "react-router-dom";
import { RecentProjects } from "@/components/dashboard/RecentProjects";

export default function VideosPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Mock data for videos
  const allVideos = [
    {
      id: "1",
      title: "Product Launch Announcement",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Today",
    },
    {
      id: "2",
      title: "Social Media Ad",
      thumbnail: "/placeholder.svg",
      status: "processing" as const,
      date: "Today",
    },
    {
      id: "3",
      title: "Educational Tutorial",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Yesterday",
    },
    {
      id: "4",
      title: "Company Overview",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Last week",
    },
    {
      id: "5",
      title: "Feature Explanation",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Last week",
    },
    {
      id: "6",
      title: "Customer Testimonial",
      thumbnail: "/placeholder.svg",
      status: "failed" as const,
      date: "Last week",
    },
  ];

  // Filter videos based on status
  const filteredVideos = filterStatus === "all" 
    ? allVideos 
    : allVideos.filter(video => video.status === filterStatus);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Videos</h1>
          <p className="text-muted-foreground">Manage all your created videos</p>
        </div>
        <Button className="bg-smartvid-600 hover:bg-smartvid-700" asChild>
          <Link to="/dashboard/generator">
            <Plus className="mr-2 h-4 w-4" />
            Create New Video
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search videos..." 
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="border rounded-md flex">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="icon"
              className={view === "grid" ? "bg-muted" : ""}
              onClick={() => setView("grid")}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              className={view === "list" ? "bg-muted" : ""}
              onClick={() => setView("list")}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Videos</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          <TabsTrigger value="trash">Trash</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-6">
          {filteredVideos.length > 0 ? (
            <RecentProjects projects={filteredVideos} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No videos found matching your criteria</p>
              <Button asChild>
                <Link to="/dashboard/generator">Create Your First Video</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="pt-6">
          <RecentProjects projects={allVideos.slice(0, 3)} />
        </TabsContent>
        
        <TabsContent value="shared" className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't shared any videos yet</p>
            <Button asChild>
              <Link to="/dashboard/videos">Go to My Videos</Link>
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="trash" className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your trash is empty</p>
            <Button asChild variant="outline">
              <Link to="/dashboard/videos">Go to My Videos</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
