const axios = require('axios');

class TodoistClient {
  constructor() {
    this.baseURL = 'https://api.todoist.com/rest/v2';
    this.clientId = process.env.TODOIST_CLIENT_ID;
    this.clientSecret = process.env.TODOIST_CLIENT_SECRET;
  }

  // Get authorization URL
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'data:read_write',
      state: state,
      response_type: 'code'
    });
    
    return `https://todoist.com/oauth/authorize?${params.toString()}`;
  }

  // Exchange code for access token
  async getAccessToken(code) {
    try {
      const response = await axios.post('https://todoist.com/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code'
      });
      
      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get Todoist access token');
    }
  }

  // Get user tasks
  async getTasks(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch Todoist tasks');
    }
  }

  // Create a new task
  async createTask(accessToken, taskData) {
    try {
      const response = await axios.post(`${this.baseURL}/tasks`, taskData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to create Todoist task');
    }
  }

  // Complete a task
  async completeTask(accessToken, taskId) {
    try {
      await axios.post(`${this.baseURL}/tasks/${taskId}/close`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return true;
    } catch (error) {
      throw new Error('Failed to complete Todoist task');
    }
  }
}

module.exports = new TodoistClient();
