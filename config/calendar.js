const { google } = require('googleapis');

class GoogleCalendarClient {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
  }

  // Get authorization URL
  getAuthUrl(state) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state
    });
  }

  // Exchange code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      throw new Error('Failed to get Google Calendar tokens');
    }
  }

  // Set credentials
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get calendar events
  async getEvents(tokens, timeMin = null, timeMax = null) {
    try {
      this.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items;
    } catch (error) {
      throw new Error('Failed to fetch calendar events');
    }
  }

  // Create calendar event
  async createEvent(tokens, eventData) {
    try {
      this.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: eventData
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to create calendar event');
    }
  }

  // Update calendar event
  async updateEvent(tokens, eventId, eventData) {
    try {
      this.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: eventData
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to update calendar event');
    }
  }

  // Delete calendar event
  async deleteEvent(tokens, eventId) {
    try {
      this.setCredentials(tokens);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to delete calendar event');
    }
  }
}

module.exports = new GoogleCalendarClient();
