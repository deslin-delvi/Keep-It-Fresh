// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    // Redirect to home page if on login or register page
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('register.html') || 
        window.location.pathname === '/' || 
        window.location.pathname === '/index.html') {
      window.location.href = './home.html';
    }
  } else {
    // Redirect to login page if on home page
    if (window.location.pathname.includes('home.html')) {
      window.location.href = './login.html';
    }
  }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

// Handle login form
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data._id,
          name: data.name,
          email: data.email
        }));
        
        // Redirect to home page
        window.location.href = './home.html';
      } else {
        errorMessage.textContent = data.message || 'Login failed';
      }
    } catch (error) {
      errorMessage.textContent = 'An error occurred. Please try again.';
      console.error('Login error:', error);
    }
  });
}

// Handle register form
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorMessage = document.getElementById('error-message');
    
    // Check if passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data._id,
          name: data.name,
          email: data.email
        }));
        
        // Redirect to home page
        window.location.href = './home.html';
      } else {
        errorMessage.textContent = data.message || 'Registration failed';
      }
    } catch (error) {
      errorMessage.textContent = 'An error occurred. Please try again.';
      console.error('Registration error:', error);
    }
  });
}