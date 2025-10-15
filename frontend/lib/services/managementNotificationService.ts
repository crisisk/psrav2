import { auditLogService } from './auditLogService'
import { emailService } from './emailService'

type NotificationResult = {
  success: boolean
  error?: string
}

export async function sendManagementNotification(auditLogId: string, userId: string): Promise<NotificationResult> {
  try {
    // Verify all sections are complete
    const isComplete = await auditLogService.areAllSectionsComplete(auditLogId)
    
    if (!isComplete) {
      return { 
        success: false, 
        error: 'Cannot notify management - not all audit log sections are complete' 
      }
    }

    // Get management team emails
    const managementEmails = await getManagementTeamEmails()

    // Send notifications
    await emailService.sendBulkEmail({
      recipients: managementEmails,
      subject: 'Audit Log Completed',
      body: `Audit log ${auditLogId} has been completed by user ${userId}. Please review.`,
    })

    return { success: true }

  } catch (error) {
    console.error('[MANAGEMENT_NOTIFICATION_ERROR]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send management notification'
    }
  }
}

async function getManagementTeamEmails(): Promise<string[]> {
  // In real implementation, this would fetch from user service
  return ['management@company.com']
}
