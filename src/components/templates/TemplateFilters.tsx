
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, LayoutList } from "lucide-react";

interface TemplateFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export function TemplateFilters({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search templates..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className={viewMode === "grid" ? "bg-primary/10" : ""}
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="sr-only">Grid view</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={viewMode === "list" ? "bg-primary/10" : ""}
          onClick={() => setViewMode("list")}
        >
          <LayoutList className="h-4 w-4" />
          <span className="sr-only">List view</span>
        </Button>
      </div>
    </div>
  );
}
