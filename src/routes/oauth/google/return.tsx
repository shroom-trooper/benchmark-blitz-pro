import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/google/return")({
  head: () => ({
    meta: [
      { title: "Connecting Google · Benchmark" },
      { name: "description", content: "Finishing your Google connection." },
      { property: "og:title", content: "Connecting Google · Benchmark" },
      { property: "og:description", content: "Finishing your Google connection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing connection…");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed", code?: string) => {
      window.opener?.postMessage({ type, connectorId: params.get("connector_id") ?? "", code: code ?? null }, window.location.origin);
      window.close();
    };
    if (params.get("success") !== "true") {
      setMessage("The connection didn't complete. You can close this window.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      setMessage("Connection completed without a code. Background sync needs offline access enabled.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);
  return <p className="p-10 text-center text-muted-foreground">{message}</p>;
}
