import type { ExpiryAlert } from "@/lib/domain/types";
import type { DocumentStorage, NotificationService } from "@/lib/services/interfaces";

/**
 * Mock document storage — echoes back the data URL as the "stored" location.
 * Production swap: BlobStorage (Vercel Blob) / S3Storage, same interface.
 */
export class MockStorage implements DocumentStorage {
  async upload(file: { name: string; dataUrl: string }): Promise<{ url: string }> {
    return { url: file.dataUrl };
  }
}

/**
 * Mock notifications — records intent without sending anything.
 * Production swap: ResendNotifications / TwilioNotifications, same interface.
 */
export class MockNotifications implements NotificationService {
  async scheduleExpiryReminder(alert: ExpiryAlert): Promise<void> {
    // In production this would enqueue an email/SMS. Here it is a no-op the demo
    // can call safely; we keep the console line so the seam is observable.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[MockNotifications] would remind ${alert.workerName} about ${alert.credentialLabel} (${alert.daysUntilExpiry}d)`);
    }
  }
}
