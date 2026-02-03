/**
 * Resend Email Client
 * Transactional email service
 *
 * FREE TIER: 3,000 emails/month
 * https://resend.com/
 */

import { Resend } from 'resend'

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface TemplateVariables {
  firstName?: string
  lastName?: string
  email?: string
  propertyName?: string
  propertyAddress?: string
  propertyPrice?: string
  viewingDate?: string
  viewingTime?: string
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  [key: string]: any
}

class EmailClient {
  private client: Resend | null = null
  private fromEmail: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      this.client = new Resend(apiKey)
    }
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com'
  }

  /**
   * Send a single email
   */
  async send({ to, subject, html, from, replyTo }: EmailTemplate) {
    if (!this.client) {
      console.warn('Resend not configured - email would be sent:', { to, subject })
      return { success: false, error: 'Resend not configured' }
    }

    try {
      const result = await this.client.emails.send({
        from: from || this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        replyTo,
      })

      return { success: true, data: result }
    } catch (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value || ''))
    }
    return rendered
  }

  /**
   * Send viewing confirmation email
   */
  async sendViewingConfirmation(
    to: string,
    variables: TemplateVariables & { propertyAddress: string; viewingDate: string; viewingTime: string }
  ) {
    const html = this.renderTemplate(
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5f8d;">Property Viewing Confirmed</h2>
        <p>Hi {{firstName}},</p>
        <p>Your property viewing has been scheduled for:</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📍 Property:</strong> {{propertyAddress}}</p>
          <p style="margin: 10px 0 0;"><strong>📅 Date:</strong> {{viewingDate}}</p>
          <p style="margin: 10px 0 0;"><strong>⏰ Time:</strong> {{viewingTime}}</p>
        </div>
        <p>If you need to reschedule, please reply to this email.</p>
        <p>Best regards,<br>{{agentName}}</p>
      </div>
      `,
      variables
    )

    return this.send({
      to,
      subject: `Property Viewing Confirmed - ${variables.propertyAddress}`,
      html,
    })
  }

  /**
   * Send property alert email (when new listing matches lead criteria)
   */
  async sendPropertyAlert(
    to: string,
    variables: TemplateVariables & { propertyName: string; propertyAddress: string; propertyPrice: string }
  ) {
    const html = this.renderTemplate(
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5f8d;">New Property Matching Your Criteria</h2>
        <p>Hi {{firstName}},</p>
        <p>A new property just hit the market that matches what you're looking for!</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #2c5f8d;">{{propertyName}}</h3>
          <p style="margin: 5px 0;">📍 {{propertyAddress}}</p>
          <p style="margin: 5px 0;">💰 Price: {{propertyPrice}}</p>
        </div>
        <p>Would you like to schedule a viewing?</p>
        <p>Best regards,<br>{{agentName}}</p>
      </div>
      `,
      variables
    )

    return this.send({
      to,
      subject: `New Property Alert - ${variables.propertyName}`,
      html,
    })
  }

  /**
   * Send follow-up email to leads
   */
  async sendFollowUp(to: string, variables: TemplateVariables) {
    const html = this.renderTemplate(
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5f8d;">Following Up</h2>
        <p>Hi {{firstName}},</p>
        <p>I wanted to follow up and see if you're still interested in finding your dream property.</p>
        <p>I have several new listings that might be perfect for you. Would you like me to send you some options?</p>
        <p>Best regards,<br>{{agentName}}</p>
        <p style="font-size: 12px; color: #64748b;">
          📱 {{agentPhone}}<br>
          ✉️ {{agentEmail}}
        </p>
      </div>
      `,
      variables
    )

    return this.send({
      to,
      subject: 'Following Up - Your Property Search',
      html,
    })
  }

  /**
   * Send reminder email (24h before viewing)
   */
  async sendViewingReminder(
    to: string,
    variables: TemplateVariables & { propertyAddress: string; viewingDate: string; viewingTime: string }
  ) {
    const html = this.renderTemplate(
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5f8d;">Reminder: Property Viewing Tomorrow</h2>
        <p>Hi {{firstName}},</p>
        <p>This is a friendly reminder about your upcoming viewing:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📍 Property:</strong> {{propertyAddress}}</p>
          <p style="margin: 10px 0 0;"><strong>📅 Date:</strong> {{viewingDate}}</p>
          <p style="margin: 10px 0 0;"><strong>⏰ Time:</strong> {{viewingTime}}</p>
        </div>
        <p>See you there!</p>
        <p>Best regards,<br>{{agentName}}</p>
      </div>
      `,
      variables
    )

    return this.send({
      to,
      subject: `Reminder: Property Viewing Tomorrow - ${variables.propertyAddress}`,
      html,
    })
  }

  /**
   * Bulk send to multiple leads
   */
  async bulkSend(to: string[], subject: string, html: string) {
    const results = []
    // Send in batches of 50 (Resend limit)
    for (let i = 0; i < to.length; i += 50) {
      const batch = to.slice(i, i + 50)
      const result = await this.send({ to: batch, subject, html })
      results.push(result)
      // Rate limiting: wait 1 second between batches
      if (i + 50 < to.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    return results
  }
}

// Singleton instance
export const emailClient = new EmailClient()
