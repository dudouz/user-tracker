"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useInsightsConnectMutation } from "@/hooks/mutations";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "How many sign-ups in the last 7 days?",
  "Top 10 events by volume this week",
  "Show me the referral funnel: landing \u2192 sign-up",
  "Which feature flags are currently rolled out?",
];

type ConnectionState =
  | { status: "unknown" }
  | { status: "checking" }
  | { status: "connected" }
  | { status: "needs_auth"; authUrl: string }
  | { status: "error"; message: string };

export function InsightsChat() {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const {
    mutate: checkConnection,
    data: connectionData,
    error: connectionError,
    isIdle,
    isPending,
  } = useInsightsConnectMutation();

  const connection = deriveConnection({
    isIdle,
    isPending,
    data: connectionData,
    error: connectionError,
  });

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/insights/chat" }),
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    checkConnection();
    const url = new URL(window.location.href);
    if (url.searchParams.get("connected") === "1") {
      toast.success("Arcade gateway connected");
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }
    const errParam = url.searchParams.get("error");
    if (errParam) {
      toast.error(`Arcade auth error: ${errParam}`);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [checkConnection]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function retryConnection() {
    checkConnection();
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status === "streaming" || status === "submitted") return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  const isBusy = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      {connection.status === "needs_auth" && (
        <ConnectBanner authUrl={connection.authUrl} onRetry={retryConnection} />
      )}
      {connection.status === "error" && (
        <ErrorBanner message={connection.message} onRetry={retryConnection} />
      )}

      <Card className="flex-1">
        <CardContent
          ref={listRef}
          className="flex min-h-[45vh] flex-col gap-4 overflow-y-auto py-4"
        >
          {!hasMessages && (
            <EmptyState
              disabled={
                connection.status === "needs_auth" ||
                connection.status === "error"
              }
              onPick={(text) => {
                setInput(text);
                sendMessage({ text });
              }}
            />
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {error && (
            <p className="text-xs text-destructive">
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            connection.status === "connected"
              ? "Ask about sign-ups, funnels, retention…"
              : "Connect Arcade to start asking questions"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={connection.status !== "connected" || isBusy}
          className="min-h-12 flex-1"
        />
        <div className="flex gap-2">
          {isBusy ? (
            <Button type="button" variant="secondary" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={
                !input.trim() ||
                connection.status !== "connected" ||
                isBusy
              }
            >
              Send
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ConnectBanner({
  authUrl,
  onRetry,
}: {
  authUrl: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-l-2 border-l-primary">
      <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium">Connect to Arcade</p>
          <p className="text-xs text-muted-foreground">
            Authorize the MCP gateway so the agent can call PostHog on your
            behalf.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <a href={authUrl} target="_blank" rel="noreferrer">
              Authorize
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={onRetry}>
            I&apos;m done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-l-2 border-l-destructive">
      <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{message}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-xs font-medium">Try a prompt</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(prompt)}
            className={cn(
              "rounded-none border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors",
              "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {isUser ? "You" : "Agent"}
      </span>
      <div
        className={cn(
          "max-w-[90%] rounded-none px-3 py-2 text-xs/relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {message.parts.map((part, i) => (
          <MessagePart key={`${message.id}-${i}`} part={part} />
        ))}
      </div>
    </div>
  );
}

function MessagePart({
  part,
}: {
  part: UIMessage["parts"][number];
}) {
  if (part.type === "text") {
    return <p className="whitespace-pre-wrap">{part.text}</p>;
  }
  if (part.type === "reasoning") {
    return (
      <p className="whitespace-pre-wrap text-muted-foreground italic">
        {part.text}
      </p>
    );
  }
  if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
    const toolPart = part as {
      type: string;
      toolName?: string;
      state?: string;
    };
    const name =
      toolPart.toolName ??
      (part.type.startsWith("tool-") ? part.type.slice(5) : "tool");
    const state = toolPart.state ?? "running";
    const label =
      state === "output-available"
        ? `Called ${name}`
        : state === "output-error"
          ? `${name} failed`
          : `Calling ${name}…`;
    return (
      <span className="my-1 inline-block rounded-none border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
    );
  }
  return null;
}

function deriveConnection({
  isIdle,
  isPending,
  data,
  error,
}: {
  isIdle: boolean;
  isPending: boolean;
  data?: { connected: boolean; authUrl?: string; error?: string };
  error: Error | null;
}): ConnectionState {
  if (isIdle) return { status: "unknown" };
  if (isPending) return { status: "checking" };
  if (error) {
    return { status: "error", message: error.message || "Unknown error" };
  }
  if (data?.connected) return { status: "connected" };
  if (data?.authUrl) return { status: "needs_auth", authUrl: data.authUrl };
  return {
    status: "error",
    message: data?.error ?? "Could not reach Arcade gateway.",
  };
}
