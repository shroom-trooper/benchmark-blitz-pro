/**
 * Calendar provider adapter. Detection, attachment processing, generation and
 * delivery depend only on this interface, so Google Calendar can be added as a
 * second implementation later.
 */
export type NormalizedEvent = {
  externalEventId: string;
  externalCalendarId: string;
  subject: string | null;
  description: string | null; // already sanitized
  startsAt: string;
  endsAt: string;
  timezone: string | null;
  organizer: string | null;
  attendeeCount: number | null;
  hasExternalAttendee: boolean;
  meetingUrl: string | null;
  isCancelled: boolean;
  isRecurring: boolean;
  isAllDay: boolean;
  hasAttachments: boolean;
  lastModifiedAt: string | null;
  removed?: boolean;
};

export type AttachmentMeta = {
  externalAttachmentId: string;
  kind: "file" | "item" | "reference";
  filename: string;
  mimeType: string | null;
  size: number | null;
};

export type SyncPage = { events: NormalizedEvent[]; deltaToken: string | null };

export interface CalendarProvider {
  id: "microsoft" | "google";
  connectorId: string;
  scopes: string[];
  /** Initial bounded window sync (or restart when delta token expired). */
  initialSync(key: string, windowStart: Date, windowEnd: Date, ownDomain: string | null): Promise<SyncPage>;
  deltaSync(key: string, deltaToken: string, ownDomain: string | null): Promise<SyncPage>;
  getEvent(key: string, externalEventId: string, ownDomain: string | null): Promise<NormalizedEvent | null>;
  listAttachmentMeta(key: string, externalEventId: string): Promise<AttachmentMeta[]>;
  getAttachment(key: string, externalEventId: string, attachmentId: string): Promise<{ base64: string; mime: string } | null>;
  getAccount(key: string): Promise<{ id: string | null; email: string | null }>;
}

export class ProviderAuthError extends Error {
  constructor() {
    super("reauthorization_required");
  }
}
export class DeltaExpiredError extends Error {
  constructor() {
    super("delta_expired");
  }
}
