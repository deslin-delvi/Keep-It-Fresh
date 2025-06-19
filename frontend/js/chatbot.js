document.addEventListener('DOMContentLoaded', function() {
    // Add chatbot HTML to the page
    const chatbotHTML = `
      <div class="chatbot-toggle">
        <i class="fas fa-robot"></i>
      </div>
      <div class="chatbot-container chatbot-hidden">
        <div class="chatbot-header">
          <span>Recipe Assistant</span>
          <span class="close-chatbot">×</span>
        </div>
        <div class="chatbot-messages">
          <div class="message bot-message">
            Hi there! I can suggest recipes with your available ingredients or answer any food-related questions. How can I help you today?
          </div>
        </div>
        <div class="chatbot-input">
          <input type="text" placeholder="Ask about recipes, cooking tips..." />
          <button>Send</button>
        </div>
      </div>
    `;
    
    // Insert the chatbot HTML
    const chatbotContainer = document.createElement('div');
    chatbotContainer.innerHTML = chatbotHTML;
    document.body.appendChild(chatbotContainer);
    
    // Get DOM elements
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbot = document.querySelector('.chatbot-container');
    const closeButton = document.querySelector('.close-chatbot');
    const messageContainer = document.querySelector('.chatbot-messages');
    const inputField = document.querySelector('.chatbot-input input');
    const sendButton = document.querySelector('.chatbot-input button');
    
    // Check auth status on load
    checkAuthStatus();
    
    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', function() {
      chatbot.classList.toggle('chatbot-hidden');
      // Focus input field when chatbot is opened
      if (!chatbot.classList.contains('chatbot-hidden')) {
        inputField.focus();
      }
    });
    
    // Close chatbot
    closeButton.addEventListener('click', function() {
      chatbot.classList.add('chatbot-hidden');
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    inputField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Function to check if authentication token is valid
    function checkAuthStatus() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found in localStorage');
        return false;
      }
      
      // Simple check if token looks like a JWT (not foolproof)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Token does not appear to be in valid JWT format');
        return false;
      }
      
      console.log('Token found in localStorage:', token.substring(0, 10) + '...');
      return true;
    }
    
    // Unified function to send API requests
    function sendToAPI(endpoint, data) {
      return fetch(`/api/chatbot/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (response.status === 401) {
          console.error('Authentication error - please log in again');
          // You could redirect to login page here
          // window.location.href = '/login.html';
          throw new Error('Authentication failed - please log in again');
        }
        if (!response.ok) {
          console.error('API error:', response.status, response.statusText);
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      });
    }
    
    // Function to send a message to the chatbot
    function sendMessage() {
      const message = inputField.value.trim();
      if (message === '') return;
      
      // Check if user is authenticated
      if (!localStorage.getItem('token')) {
        addMessage('You need to be logged in to use this feature. Please log in and try again.', 'bot');
        return;
      }
      
      // Add user message to chat
      addMessage(message, 'user');
      inputField.value = '';
      
      // Show typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'message bot-message typing-indicator';
      typingIndicator.textContent = 'Thinking...';
      messageContainer.appendChild(typingIndicator);
      scrollToBottom();
      
      // Get user's grocery list from localStorage or fetch from the server
      getGroceryList().then(groceryList => {
        // Check if grocery list is empty
        if (!groceryList || groceryList.length === 0) {
          // No groceries available, send a default message for recipe requests
          if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('make with') || message.toLowerCase().includes('cook with')) {
            addMessage("I don't have access to your grocery list right now. Please log in again or add some items to your list first.", 'bot');
            messageContainer.removeChild(typingIndicator);
            return;
          }
        }
        
        // Handle recipe commands specially
        if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('make with') || message.toLowerCase().includes('cook with')) {
          // Send to recipe suggestion endpoint
          sendToAPI('recipes', {
            groceryList,
            dietary: getDietaryPreferences()
          })
          .then(data => {
            // Remove typing indicator
            messageContainer.removeChild(typingIndicator);
            
            if (data.success) {
              if (data.data && data.data.recipes) {
                // Add recipe suggestions to chat (JSON format)
                addRecipeSuggestions(data.data.recipes);
              } else if (data.message) {
                // Try to extract JSON from the text response
                try {
                  const jsonMatch = data.message.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const extractedJson = JSON.parse(jsonMatch[0]);
                    if (extractedJson.recipes) {
                      addRecipeSuggestions(extractedJson.recipes);
                      return;
                    }
                  }
                } catch (e) {
                  console.warn('Could not extract JSON from response:', e);
                }
                
                // If no JSON could be extracted, display as plain text
                addTextRecipeResponse(data.message);
              }
            } else {
              // Log the actual error message for debugging
              console.error('Recipe generation error:', data.error);
              addMessage('Sorry, I encountered an error generating recipe suggestions. Please try again.', 'bot');
            }
          })
          .catch(error => {
            handleError(error, typingIndicator);
          });
        } else {
          // Send to general chat endpoint
          sendToAPI('chat', {
            message,
            groceryList
          })
          .then(data => {
            // Remove typing indicator
            messageContainer.removeChild(typingIndicator);
            
            if (data.success) {
              // Add bot response to chat
              addMessage(data.message, 'bot');
            } else {
              addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
          })
          .catch(error => {
            // Handle error and remove typing indicator
            handleError(error, typingIndicator);
          });
        }
      }).catch(error => {
        // Handle error getting grocery list
        messageContainer.removeChild(typingIndicator);
        console.error('Error getting grocery list:', error);
        addMessage('Sorry, I encountered an error accessing your grocery list. Please try again.', 'bot');
      });
    }
    
    // Function to add a message to the chat
    function addMessage(message, sender) {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${sender}-message`;
      messageElement.textContent = message;
      messageContainer.appendChild(messageElement);
      scrollToBottom();
    }
    
    // Function to add text recipe response when JSON parsing fails
    function addTextRecipeResponse(text) {
      const recipeElement = document.createElement('div');
      recipeElement.className = 'message bot-message';
      recipeElement.innerHTML = text.replace(/\n/g, '<br>');
      messageContainer.appendChild(recipeElement);
      scrollToBottom();
    }
    
    // Function to add recipe suggestions to the chat
    function addRecipeSuggestions(recipes) {
      recipes.forEach(recipe => {
        const recipeElement = document.createElement('div');
        recipeElement.className = `message bot-message recipe-suggestion ${recipe.usesExpiringItems ? 'recipe-expiring' : ''}`;
        
        let recipeHTML = `<h3>${recipe.name}</h3>`;
        
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          recipeHTML += '<strong>Ingredients:</strong><ul>';
          recipe.ingredients.forEach(ingredient => {
            recipeHTML += `<li>${ingredient}</li>`;
          });
          recipeHTML += '</ul>';
        }
        
        if (recipe.instructions) {
          recipeHTML += `<strong>Instructions:</strong><p>${recipe.instructions}</p>`;
        }
        
        if (recipe.usesExpiringItems) {
          recipeHTML += '<p><em>Uses ingredients that expire soon!</em></p>';
        }
        
        recipeElement.innerHTML = recipeHTML;
        messageContainer.appendChild(recipeElement);
      });
      
      scrollToBottom();
    }
    
    // Function to get the user's grocery list
    function getGroceryList() {
        return new Promise((resolve, reject) => {
          // Try to get from localStorage first
          try {
            const groceryData = localStorage.getItem('groceryList');
            if (groceryData) {
              const parsedData = JSON.parse(groceryData);
              console.log('Using grocery list from localStorage:', parsedData);
              resolve(parsedData);
              return;
            }
          } catch (e) {
            console.warn('Error parsing grocery list from localStorage:', e);
          }
          
          // Add this console.log to debug token
          console.log('Token used for grocery request:', localStorage.getItem('token'));
          
          // If not in localStorage, fetch from server
          fetch('/api/groceries', {
            method: 'GET',
            headers: {
              'x-auth-token': localStorage.getItem('token') || ''
            }
          })
          .then(response => {
            console.log('Grocery API response status:', response.status);
            if (!response.ok) {
              console.error('Error fetching grocery list:', response.status);
              return { success: false, error: `HTTP error ${response.status}` };
            }
            return response.json();
          })
          .then(data => {
            console.log('Grocery API response data:', data);
            
            if (data.success && data.groceries) {
              // Save to localStorage for future use
              localStorage.setItem('groceryList', JSON.stringify(data.groceries));
              resolve(data.groceries);
            } else {
              console.log('No groceries found in API response or response format incorrect');
              resolve([]); // Empty array if no groceries found
            }
          })
          .catch(error => {
            console.error('Error fetching grocery list:', error);
            resolve([]); // Empty array on error
          });
        });
      }
    
    // Function to get dietary preferences (placeholder - implement based on your app)
    function getDietaryPreferences() {
      // This could be stored in localStorage or fetched from user settings
      return localStorage.getItem('dietaryPreferences') || '';
    }
    
    // Function to handle errors
    function handleError(error, typingIndicator) {
      if (typingIndicator && typingIndicator.parentNode) {
        messageContainer.removeChild(typingIndicator);
      }
      console.error('Error:', error);
      
      // Provide more specific error messages based on error type
      if (error.message && error.message.includes('Authentication failed')) {
        addMessage('Please log in to continue using the chatbot.', 'bot');
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    }
    
    // Function to scroll to the bottom of the chat
    function scrollToBottom() {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  });