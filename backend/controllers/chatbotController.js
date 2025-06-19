const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getChatbotResponse = async (req, res) => {
  try {
    const { message, groceryList } = req.body;
    
    // Create a model with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a prompt that includes the user's available groceries
    let prompt = "You are a helpful food assistant that provides recipe suggestions and answers food-related questions. ";
    
    if (groceryList && groceryList.length > 0) {
      prompt += `The user has these groceries: ${groceryList.map(item => item.name).join(', ')}. `;
      
      // Include expiry information if available to prioritize ingredients expiring soon
      const expiringItems = groceryList
        .filter(item => item.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
        .slice(0, 5);
      
      if (expiringItems.length > 0) {
        prompt += `These items are expiring soon: ${expiringItems.map(item => 
          `${item.name} (expires: ${new Date(item.expiryDate).toLocaleDateString()})`
        ).join(', ')}. `;
      }
    }
    
    prompt += `Provide concise, practical advice. User's question: ${message}`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    res.status(200).json({
      success: true,
      message: text
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your request',
      error: error.message
    });
  }
};

// Function to get personalized recipe suggestions
exports.getRecipeSuggestions = async (req, res) => {
  try {
    const { groceryList, dietary } = req.body;
    
    if (!groceryList || groceryList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No grocery items provided'
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Sort groceries by expiry date to prioritize
    const sortedGroceries = [...groceryList].sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    
    const prompt = `
    As a culinary expert, suggest 3 recipes using these ingredients:
    ${sortedGroceries.map(item => item.name).join(', ')}.
    
    ${dietary ? `Dietary preferences: ${dietary}` : ''}
    
    Please prioritize using these soon-to-expire ingredients:
    ${sortedGroceries.slice(0, 5).map(item => 
      item.expiryDate ? `${item.name} (expires: ${new Date(item.expiryDate).toLocaleDateString()})` : item.name
    ).join(', ')}.
    
    IMPORTANT: Your entire response must be valid JSON only, with this exact structure:
    {
      "recipes": [
        {
          "name": "Recipe Name",
          "ingredients": ["Ingredient 1", "Ingredient 2"],
          "instructions": "Brief cooking instructions",
          "usesExpiringItems": true/false
        }
      ]
    }
    
    Do not include any additional text, explanations, or markdown formatting outside the JSON structure.
    Focus on practical, easy-to-make recipes.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Try to parse the JSON response
      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (e) {
        // If direct parsing fails, try to extract JSON using regex
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract valid JSON from the response');
        }
      }
      
      // Validate that we have a recipes array
      if (!jsonData.recipes || !Array.isArray(jsonData.recipes)) {
        throw new Error('Response did not contain a valid recipes array');
      }
      
      res.status(200).json({
        success: true,
        data: jsonData
      });
    } catch (e) {
      console.error('JSON parsing error:', e, 'Raw text:', text);
      
      // Return the text response with a partial success indicator
      res.status(200).json({
        success: true,
        message: text,
        parsingError: true
      });
    }
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error generating recipe suggestions. Please try again.',
      error: error.message
    });
  }
};