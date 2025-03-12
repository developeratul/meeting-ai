import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Check, Database, Loader2, LogOut, MoreVertical, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface NotionDatabase {
  id: string;
  title: string;
}

interface NotionWorkspace {
  name: string;
  icon?: string;
}

export function NotionConnect() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [workspace, setWorkspace] = useState<NotionWorkspace | null>(null);
  const [activeDatabase, setActiveDatabase] = useState<NotionDatabase | null>(null);
  const [integrationToken, setIntegrationToken] = useState("");
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connection = localStorage.getItem("notion_connection");
      if (connection) {
        setIsConnected(true);
        fetchWorkspaceInfo();
        const parsed = JSON.parse(connection);
        if (parsed.database_id) {
          fetchDatabaseInfo(parsed.database_id);
        }
      } else {
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate the token by trying to fetch workspace info
      const response = await fetch("/api/notion/workspace", {
        headers: {
          Authorization: `Bearer ${integrationToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid integration token");
      }

      // Save the token
      localStorage.setItem("notion_connection", JSON.stringify({ access_token: integrationToken }));

      setIsConnected(true);
      setIsTokenDialogOpen(false);
      fetchWorkspaceInfo();
    } catch (error) {
      console.error("Failed to connect:", error);
      setError("Invalid integration token. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaceInfo = async () => {
    try {
      const stored = localStorage.getItem("notion_connection");
      if (!stored) return;

      const { access_token } = JSON.parse(stored);
      const response = await fetch("/api/notion/workspace", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch workspace info");

      const data = await response.json();
      setWorkspace(data.workspace);
    } catch (error) {
      console.error("Failed to fetch workspace:", error);
    }
  };

  const fetchDatabaseInfo = async (databaseId: string) => {
    try {
      const stored = localStorage.getItem("notion_connection");
      if (!stored) return;

      const { access_token } = JSON.parse(stored);
      const response = await fetch(`/api/notion/databases/${databaseId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch database info");

      const data = await response.json();
      setActiveDatabase(data.database);
    } catch (error) {
      console.error("Failed to fetch database:", error);
    }
  };

  const handleDatabaseSelect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current connection info
      const stored = localStorage.getItem("notion_connection");
      if (!stored) return;

      const connection = JSON.parse(stored);

      // Update connection with selected database
      const updatedConnection = {
        ...connection,
        database_id: selectedDatabase,
      };

      // Save updated connection
      localStorage.setItem("notion_connection", JSON.stringify(updatedConnection));

      // Fetch and set the active database info
      await fetchDatabaseInfo(selectedDatabase);

      toast({
        title: "Database connected",
        description: "Your notes will be saved to the selected database",
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save database selection:", error);
      setError("Failed to save database selection");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stored = localStorage.getItem("notion_connection");
      if (!stored) {
        throw new Error("No Notion connection found");
      }

      const { access_token } = JSON.parse(stored);
      const response = await fetch("/api/notion/databases", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch databases");
      }

      const data = await response.json();

      if (!data.databases || data.databases.length === 0) {
        throw new Error(
          "🔒 No databases found! You need to give the integration access:\n\n" +
            "1. Open your Notion database\n" +
            "2. Click ••• in the top right\n" +
            "3. Select 'Add connections'\n" +
            "4. Find and select this integration\n\n" +
            "After sharing, click 'Try Again'"
        );
      }

      setDatabases(data.databases);
      if (data.databases.length === 1) {
        setSelectedDatabase(data.databases[0].id);
      }
    } catch (error) {
      console.error("Failed to load databases:", error);
      setError(error instanceof Error ? error.message : "Failed to load databases");
    } finally {
      setIsLoading(false);
    }
  };

  // Make sure we fetch databases when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchDatabases();
    }
  }, [isOpen]);

  const handleDisconnect = () => {
    // Remove Notion connection from localStorage
    localStorage.removeItem("notion_connection");
    // Reset states
    setIsConnected(false);
    setWorkspace(null);
    setActiveDatabase(null);
    setDatabases([]);
    setSelectedDatabase("");
  };

  if (!isConnected) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Connect with Notion</CardTitle>
            <CardDescription>
              Link your Notion workspace to save meeting notes directly to your databases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsTokenDialogOpen(true)} className="w-full">
              Connect to Notion
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to Notion</DialogTitle>
              <DialogDescription>
                Enter your Notion integration token to connect your workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={integrationToken}
                  onChange={(e) => setIntegrationToken(e.target.value)}
                  placeholder="Enter your integration token"
                  type="password"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>To connect your Notion workspace:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Create an integration at Notion → Settings → Connections → Develop or manage
                      integrations
                    </li>
                    <li>Copy your integration token</li>
                    <li>Go to the database you want to use</li>
                    <li>Click Share in the top right and add your integration</li>
                  </ol>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleConnect} disabled={!integrationToken || isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {workspace?.icon && <img src={workspace.icon} alt="" className="w-6 h-6 rounded" />}
              {workspace?.name || "Notion Workspace"}
            </CardTitle>
            <CardDescription>Connected to Notion</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Change Database
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDisconnect}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {activeDatabase ? (
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              <span>Saving to</span>
              <Badge variant="secondary" className="font-mono">
                {activeDatabase.title}
              </Badge>
              <Check className="w-4 h-4 text-green-500" />
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
              Select a database
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Notion Database</DialogTitle>
            <DialogDescription>Choose where your meeting notes will be saved</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="space-y-4 py-4">
              <div className="text-sm text-red-500">{error}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end">
                <Button onClick={handleDatabaseSelect} disabled={!selectedDatabase || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Selection"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
