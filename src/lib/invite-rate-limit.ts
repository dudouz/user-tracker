const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

type Bucket = { count: number; windowStart: number };
const inviteSendByUser = new Map<string, Bucket>();

/**
 * In-memory per-user cap for invite emails. Resets every hour. Adequate for
 * a single server instance; for horizontal scale, replace with Redis/Upstash.
 */
export function tryConsumeInviteSendSlot(userId: string): boolean {
  const now = Date.now();
  const existing = inviteSendByUser.get(userId);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    inviteSendByUser.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (existing.count >= MAX_PER_WINDOW) {
    return false;
  }
  existing.count += 1;
  return true;
}

/** Test helper so Vitest can reset the in-memory map between tests. */
export function resetInviteSendRateLimitForTests(): void {
  inviteSendByUser.clear();
}
