/** Turns a failed save into a message that tells the user their work is safe. */
export function saveErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : "";
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline)
    return "You're offline — your answers are still on screen. Reconnect and press submit again.";
  if (!raw || /fetch|network|load failed|timeout|502|503|504/i.test(raw))
    return "We couldn't save that just now. Your answers are still on screen — please try again.";
  return raw;
}
