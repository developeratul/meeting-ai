import { checkNotionConnection, getNotionUser } from "@/actions/notion.actions";
import { getNotionToken, setNotionToken } from "@/lib/notion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button, buttonVariants } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function NotionConnection() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["get-notion-token"],
    queryFn: () => getNotionToken(),
  });
  const [tokenInput, setTokenInput] = useState("");
  const mutation = useMutation({
    mutationKey: ["set-notion-token"],
    mutationFn: (token: string) => checkNotionConnection(token),
  });
  const queryClient = useQueryClient();

  if (isPending) {
    return <div>loading...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const handleConnectNotion = async () => {
    if (!tokenInput.trim()) {
      return alert("Please enter a token");
    }

    try {
      const check = await mutation.mutateAsync(tokenInput);

      if (check) {
        setNotionToken(tokenInput);
      } else {
        throw new Error("Invalid Notion Token");
      }

      await queryClient.invalidateQueries({ queryKey: ["get-notion-token"] });
      await queryClient.refetchQueries({ queryKey: ["get-notion-token"] });
      alert("Your Notion Has been Connected Successfully");
    } catch (err) {
      if (err instanceof Error) {
        return alert(err.message);
      }
      alert(JSON.stringify(err));
    }
  };

  if (!data) {
    return (
      <Card className="border-orange-400 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-base text-orange-500">Connect your Notion Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-1 space-y-2">
            <Label htmlFor="token-input">Notion Internal Integration Token</Label>
            <div className="flex items- gap-3">
              <Input
                id="token-input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter token"
                className="flex-1"
              />
              <Button
                disabled={mutation.isPending}
                onClick={handleConnectNotion}
                className="bg-orange-400 hover:bg-orange-400/70 text-black font-semibold"
              >
                {mutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
            <p>
              <Link
                href="https://www.notion.com/help/create-integrations-with-the-notion-api#create-an-internal-integration"
                target="_blank"
                className={buttonVariants({
                  variant: "link",
                  className: "w-auto h-auto px-0 py-0 text-blue-600",
                })}
                referrerPolicy="no-referrer"
              >
                <InfoIcon className="w-4 h-4 " /> How to generate an Internal Integration token
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <NotionConnectionDetails />;
}

function NotionConnectionDetails() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["get-notion-user"],
    queryFn: async () => {
      const token = await getNotionToken();
      if (!token) throw new Error("Notion Token not found");
      const res = await getNotionUser(token!);
      if (res.type === "error") {
        throw new Error(res.message);
      }
      return res.data;
    },
  });
  const queryClient = useQueryClient();

  if (isPending) {
    return <div>loading...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const handleDisconnect = async () => {
    const confirm = window.confirm(
      "Are you sure you want to disconnect your notion integration? You can always reconnect with the token."
    );
    if (!confirm) return;
    await setNotionToken(null);
    await queryClient.invalidateQueries({ queryKey: ["get-notion-token"] });
  };

  return (
    <Alert className="bg-emerald-50 border-emerald-300 flex items-center justify-between">
      <div>
        <AlertTitle className="text-emerald-500 font-semibold">Notion Connected</AlertTitle>
        <AlertDescription>
          Integrated with <b>{data.name}</b>
        </AlertDescription>
      </div>
      <Button size="sm" variant="destructive" className="rounded-full" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </Alert>
  );
}
