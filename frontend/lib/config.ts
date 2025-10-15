/**
 * Configuration for PSRA-LTSD Platform
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: 30000,
    retries: 3
  },

  // Application Configuration
  app: {
    name: 'PSRA-LTSD',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },

  // Feature Flags
  features: {
    enableAnalytics: true,
    enableNotifications: true,
    enableExport: true,
    enableBulkOperations: true
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'psra_ltsd',
    ssl: process.env.NODE_ENV === 'production'
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    tokenExpiry: '24h',
    refreshTokenExpiry: '7d'
  },

  // Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['.pdf', '.xlsx', '.csv', '.xml'],
    uploadPath: process.env.UPLOAD_PATH || '/tmp/uploads'
  },

  // Email Configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'noreply@psra-ltsd.com',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587')
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production'
  }
};

export default config;

/**
 * Check if database is enabled
 */
export function isDatabaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true' || false;
}

/**
 * Check if task queue is enabled
 */
export function isTaskQueueEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TASK_QUEUE_ENABLED === 'true' || false;
}

export function isRedisEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REDIS_ENABLED === 'true' || false;
}

export function isNotificationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED === 'true' || true;
}
