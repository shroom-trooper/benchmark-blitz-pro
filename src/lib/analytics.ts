import posthog from "posthog-js";

let ready = false;

function host() {
  const region = import.meta.env['VITE_LOVABLE_CONNECTOR_POSTHOG_REGION'] || "eu";
  return region === "us" ? "https://us.i.posthog.com" : "https://eu.i.posthog.com";
}

export function initAnalytics() {
  if (ready || typeof window === "undefined") return;
  const token = import.meta.env['VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY'];
  if (!token) return;
  posthog.init(token, {
    api_host: host(),
    capture_pageview: false,
    person_profiles: "identified_only",
  });
  ready = true;
}

export function trackPageview(path: string) {
  if (!ready) return;
  posthog.capture("$pageview", { $current_url: window.location.href, path });
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!ready) return;
  posthog.capture(event, properties);
}

export function identifyUser(id: string, properties?: Record<string, unknown>) {
  if (!ready) return;
  posthog.identify(id, properties);
}

export function resetAnalytics() {
  if (!ready) return;
  posthog.reset();
}
