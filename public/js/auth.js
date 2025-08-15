// Authentication module
class Auth {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = this.token ? this.parseJWT(this.token) : null;
    this.baseURL = window.location.origin;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    // Show register link
    const showRegisterLink = document.getElementById('showRegister');
    if (showRegisterLink) {
      showRegisterLink.addEventListener('click', this.showRegisterForm.bind(this));
    }

    // Show login link
    const showLoginLink = document.getElementById('showLogin');
    if (showLoginLink) {
      showLoginLink.addEventListener('click', this.showLoginForm.bind(this));
    }

    // Logout button (if on main page)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }

    // Check if user is authenticated and redirect accordingly
    this.checkAuthState();
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      this.showLoading(e.target);
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        this.user = data.user;
        this.showNotification('Login successful!', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        this.showNotification(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      this.hideLoading(e.target);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      this.showLoading(e.target);
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        this.user = data.user;
        this.showNotification('Account created successfully!', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        this.showNotification(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      this.hideLoading(e.target);
    }
  }

  showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
  }

  showLoginForm(e) {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  }

  logout() {
    this.removeToken();
    this.user = null;
    this.showNotification('Logged out successfully', 'info');
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  isTokenExpired() {
    if (!this.user || !this.user.exp) return true;
    return Date.now() >= this.user.exp * 1000;
  }

  isAuthenticated() {
    return this.token && this.user && !this.isTokenExpired();
  }

  checkAuthState() {
    const currentPath = window.location.pathname;
    
    if (this.isAuthenticated()) {
      // User is authenticated
      if (currentPath === '/login.html') {
        window.location.href = '/';
      }
    } else {
      // User is not authenticated
      if (currentPath !== '/login.html' && currentPath !== '/') {
        window.location.href = '/login.html';
      }
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.removeToken();
      this.user = null;
      window.location.href = '/login.html';
      throw new Error('Authentication expired');
    }

    return response;
  }

  showLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';
    }
  }

  hideLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      const isLogin = form.id === 'loginForm';
      submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseURL}/auth/profile`);
      const data = await response.json();
      
      if (response.ok) {
        return data.user;
      } else {
        throw new Error(data.error || 'Failed to get profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseURL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return data.user;
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.auth = new Auth();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
