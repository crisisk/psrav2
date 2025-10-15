/**
 * Telemetry event tracking for PSRA-LTSD
 * Simple event logging for onboarding and user actions
 */

interface TelemetryEvent {
  type: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private enabled: boolean = true;

  /**
   * Track onboarding start event
   */
  onboardingStarted(context: string) {
    this.track('onboarding_started', { context });
  }

  /**
   * Track onboarding completed event
   */
  onboardingCompleted(context: string, duration: number) {
    this.track('onboarding_completed', { context, duration });
  }

  /**
   * Track file upload event
   */
  fileUploaded(fileName: string, size: number) {
    this.track('file_uploaded', { fileName, size });
  }

  /**
   * Track origin check started event
   */
  originCheckStarted(personaLabel: string) {
    this.track('origin_check_started', { personaLabel });
  }

  /**
   * Track LTSD generated event
   */
  ltsdGenerated(personaLabel: string, durationMs: number, metadata?: Record<string, any>) {
    this.track('ltsd_generated', { personaLabel, durationMs, ...metadata });
  }

  /**
   * Track origin check success event
   */
  originCheckSuccess(personaLabel: string, durationMs: number, metadata?: Record<string, any>) {
    this.track('origin_check_success', { personaLabel, durationMs, ...metadata });
  }

  /**
   * Track validation event
   */
  validationCompleted(result: 'success' | 'error', details?: any) {
    this.track('validation_completed', { result, details });
  }

  /**
   * Track error modal viewed event
   */
  errorModalViewed(title: string, metadata?: Record<string, any>) {
    this.track('error_modal_viewed', { title, ...metadata });
  }

  /**
   * Generic event tracking
   */
  private track(type: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      type,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(event);

    // In production, this would send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('[Telemetry]', event);
    }
  }

  /**
   * Get all tracked events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const telemetry = new TelemetryService();
