const mongoose = require('mongoose');

const GrocerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unit: {
    type: String,
    default: 'item'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  notes: {
    type: String
  }
});

module.exports = mongoose.model('Grocery', GrocerySchema);