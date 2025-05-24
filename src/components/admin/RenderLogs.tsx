
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminService, RenderLog } from "@/services/adminService";
import { Search, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function RenderLogs() {
  const [logs, setLogs] = useState<RenderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7");

  useEffect(() => {
    loadLogs();
  }, [statusFilter, dateFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter !== "all") filters.status = statusFilter;
      
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter);
        const date = new Date();
        date.setDate(date.getDate() - days);
        filters.dateFrom = date.toISOString();
      }
      
      const data = await adminService.getRenderLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error("Error loading render logs:", error);
      toast.error("Failed to load render logs");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryRender = async (renderId: string) => {
    try {
      await adminService.retryRender(renderId);
      toast.success("Render retry initiated");
      loadLogs();
    } catch (error) {
      console.error("Error retrying render:", error);
      toast.error("Failed to retry render");
    }
  };

  const handleDeleteRender = async (renderId: string) => {
    try {
      await adminService.deleteRender(renderId);
      toast.success("Render deleted successfully");
      loadLogs();
    } catch (error) {
      console.error("Error deleting render:", error);
      toast.error("Failed to delete render");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === "" || 
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.render_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.template_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Render Activity Logs</h1>
        <p className="text-muted-foreground">Monitor all video rendering activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, render ID, or template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Render Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Render Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Render ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.user_email || "Unknown"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.render_id?.substring(0, 8) || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.template_name || "N/A"}</TableCell>
                    <TableCell>
                      {log.duration ? `${log.duration}s` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(log.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.error_message && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs truncate max-w-24" title={log.error_message}>
                            {log.error_message}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {log.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryRender(log.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRender(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No render logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
