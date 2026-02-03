/**
 * Google Calendar API Client
 * Sync appointments with Google Calendar
 *
 * FREE: Included with Google account
 * Requires OAuth2 access token from NextAuth
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
}

export interface SyncResult {
  success: boolean
  eventId?: string
  error?: string
}

class GoogleCalendarClient {
  private getOAuth2Client(accessToken: string): OAuth2Client {
    const client = new OAuth2Client()
    client.setCredentials({ access_token: accessToken })
    return client
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(accessToken: string, event: CalendarEvent): Promise<SyncResult> {
    try {
      const oauth2Client = this.getOAuth2Client(accessToken)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime.toISOString(),
        },
        end: {
          dateTime: event.endTime.toISOString(),
        },
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: true,
        },
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      })

      return {
        success: true,
        eventId: response.data.id || undefined,
      }
    } catch (error: any) {
      console.error('Google Calendar error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create calendar event',
      }
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<SyncResult> {
    try {
      const oauth2Client = this.getOAuth2Client(accessToken)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      const googleEvent: any = {}

      if (event.title) googleEvent.summary = event.title
      if (event.description) googleEvent.description = event.description
      if (event.location) googleEvent.location = event.location
      if (event.startTime) googleEvent.start = { dateTime: event.startTime.toISOString() }
      if (event.endTime) googleEvent.end = { dateTime: event.endTime.toISOString() }
      if (event.attendees) googleEvent.attendees = event.attendees.map(email => ({ email }))

      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: googleEvent,
      })

      return { success: true, eventId }
    } catch (error: any) {
      console.error('Google Calendar update error:', error)
      return {
        success: false,
        error: error.message || 'Failed to update calendar event',
      }
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(accessToken: string, eventId: string): Promise<SyncResult> {
    try {
      const oauth2Client = this.getOAuth2Client(accessToken)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      })

      return { success: true }
    } catch (error: any) {
      console.error('Google Calendar delete error:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete calendar event',
      }
    }
  }

  /**
   * Get free/busy information for a time range
   * Useful for checking availability before scheduling
   */
  async getFreeBusy(
    accessToken: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ busy: { start: Date; end: Date }[] } | null> {
    try {
      const oauth2Client = this.getOAuth2Client(accessToken)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: 'primary' }],
        },
      })

      const busy = response.data.calendars?.primary?.busy || []
      return {
        busy: busy.map((b: any) => ({
          start: new Date(b.start),
          end: new Date(b.end),
        })),
      }
    } catch (error) {
      console.error('Free/busy query error:', error)
      return null
    }
  }
}

// Singleton instance
export const googleCalendar = new GoogleCalendarClient()
