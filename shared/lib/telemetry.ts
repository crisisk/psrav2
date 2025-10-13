/**
 * Telemetry & Analytics Event Tracking
 * Integrates with Sentry, OTEL, or custom analytics providers
 */

type TelemetryEvent =
  | 'persona_home_click'
  | 'dashboard_mount'
  | 'dashboard_metric_click'
  | 'dashboard_action'
  | 'cfo_mount'
  | 'supplier_mount'
  | 'cta_click'
  | 'table_filter'
  | 'assessment_open'
  | 'coo_request_sent'
  | 'coo_upload_start'
  | 'coo_upload_complete'
  | 'coo_file_selected'
  | 'bom_file_selected'
  | 'origin_check_submit'
  | 'origin_check_success'
  | 'origin_check_error'
  | 'ltsd_generate_start'
  | 'ltsd_generate_success'
  | 'ltsd_generate_error'
  | 'ltsd_download'
  | 'ltsd_finalize_start'
  | 'ltsd_finalize_success'
  | 'ltsd_finalize_error'
  | 'xai_open'
  | 'xai_section_expand'
  | 'xai_copy'
  | 'finalize_attempt'
  | 'finalize_success'
  | 'filter_action'
  | 'support_ticket_submit'
  | 'trends_data_loaded'
  | 'demo_anchor_navigate'
  | 'demo_modal_open'
  | string; // Allow any string for flexibility

interface TelemetryPayload {
  [key: string]: any;
}

/**
 * Track a telemetry event
 * @param event - Event name
 * @param payload - Additional event data
 */
export function trackEvent(event: TelemetryEvent, payload?: TelemetryPayload): void {
  // In production, send to Sentry, OTEL, or analytics provider
  // For now, log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Telemetry] ${event}`, payload);
  }

  // Example: Sentry breadcrumb
  // if (typeof window !== 'undefined' && (window as any).Sentry) {
  //   (window as any).Sentry.addBreadcrumb({
  //     category: 'user-action',
  //     message: event,
  //     data: payload,
  //     level: 'info',
  //   });
  // }

  // Example: Custom analytics
  // if (typeof window !== 'undefined' && (window as any).analytics) {
  //   (window as any).analytics.track(event, payload);
  // }
}

/**
 * Track page view
 * @param path - Page path
 * @param title - Page title
 */
export function trackPageView(path: string, title?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Telemetry] Page View: ${path}`, { title });
  }

  // Example: Google Analytics
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', 'page_view', {
  //     page_path: path,
  //     page_title: title,
  //   });
  // }
}

/**
 * Track performance metric
 * @param metric - Metric name (e.g., 'LCP', 'FID', 'CLS')
 * @param value - Metric value
 */
export function trackPerformance(metric: string, value: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Telemetry] Performance: ${metric} = ${value}`);
  }

  // Example: Web Vitals to analytics
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', metric, {
  //     value: Math.round(metric === 'CLS' ? value * 1000 : value),
  //     event_category: 'Web Vitals',
  //   });
  // }
}

/**
 * Fetch telemetry data from the API
 * @returns Promise with telemetry data
 */
export async function fetchTelemetry(): Promise<any> {
  try {
    const response = await fetch('/api/telemetry');
    if (!response.ok) {
      throw new Error('Failed to fetch telemetry');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return {
      events: [],
      metrics: {},
      pageViews: []
    };
  }
}
