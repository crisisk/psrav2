import nodemailer from 'nodemailer';
import { config, isNotificationEnabled } from './config';

export interface NotificationData {
  type: 'certificate_created' | 'certificate_failed' | 'system_alert' | 'bulk_import_complete';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly enabled = isNotificationEnabled;

  constructor() {
    if (this.enabled) {
      const secure = config.smtp.port === 465;
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port ?? 587,
        secure,
        auth: {
          user: config.smtp.user!,
          pass: config.smtp.pass!,
        },
      });
    }
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.info('[notification]', notification.type, notification.title, notification.message);
      return true;
    }

    try {
      const emailContent = this.generateEmailContent(notification);

      const mailOptions = {
        from: `"PSRA Origin Checker" <${config.smtp.from}>`,
        to: config.smtp.user,
        subject: `[PSRA] ${notification.title}`,
        html: emailContent,
        priority: this.mapPriority(notification.priority),
      } satisfies nodemailer.SendMailOptions;

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  private generateEmailContent(notification: NotificationData): string {
    const priorityColor = this.getPriorityColor(notification.priority);
    const timestamp = new Date().toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${priorityColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: ${priorityColor}; color: white; margin-bottom: 15px; }
            .data-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .timestamp { color: #888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PSRA Origin Checker</h1>
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              <div class="priority-badge">${notification.priority} priority</div>
              <div class="timestamp">Timestamp: ${timestamp}</div>
              <h3>Notification Details</h3>
              <p><strong>Type:</strong> ${notification.type.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Message:</strong></p>
              <p>${notification.message}</p>
              ${notification.data ? `
                <div class="data-section">
                  <h4>Additional Data</h4>
                  <pre>${JSON.stringify(notification.data, null, 2)}</pre>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from the PSRA Origin Checker system.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low':
      default: return '#28a745';
    }
  }

  private mapPriority(priority: string): 'high' | 'normal' | 'low' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'normal';
      case 'low':
      default:
        return 'low';
    }
  }

  async notifyCertificateCreated(certificateId: string, productSku: string, isConform: boolean) {
    await this.sendNotification({
      type: 'certificate_created',
      title: 'New Certificate Generated',
      message: `A new origin certificate has been generated for product ${productSku}. Result: ${isConform ? 'CONFORMING' : 'NON-CONFORMING'}`,
      data: { certificateId, productSku, isConform },
      priority: isConform ? 'low' : 'medium',
    });
  }

  async notifyCertificateFailed(productSku: string, error: string) {
    await this.sendNotification({
      type: 'certificate_failed',
      title: 'Certificate Generation Failed',
      message: `Failed to generate certificate for product ${productSku}. Error: ${error}`,
      data: { productSku, error },
      priority: 'high',
    });
  }

  async notifySystemAlert(message: string, data?: any) {
    await this.sendNotification({
      type: 'system_alert',
      title: 'System Alert',
      message,
      data,
      priority: 'high',
    });
  }

  async notifyBulkImportComplete(importType: string, imported: number, total: number, errors: string[]) {
    await this.sendNotification({
      type: 'bulk_import_complete',
      title: 'Bulk Import Completed',
      message: `Bulk import of ${importType} completed. Imported: ${imported}/${total} records.`,
      data: { importType, imported, total, errors },
      priority: errors.length ? 'medium' : 'low',
    });
  }
}

export const notificationService = new NotificationService();
