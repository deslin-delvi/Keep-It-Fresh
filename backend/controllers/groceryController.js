const Grocery = require('../models/Grocery');

// @desc    Get all groceries for a user
// @route   GET /api/groceries
// @access  Private
// @desc    Get all groceries for a user
// @route   GET /api/groceries
// @access  Private
const getGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find({ user: req.user._id });
    // Change the response format to match what your chatbot expects
    res.json({ success: true, groceries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new grocery item
// @route   POST /api/groceries
// @access  Private
const addGrocery = async (req, res) => {
  try {
    const { name, quantity, unit, purchaseDate, expiryDate, category, notes } = req.body;

    const grocery = new Grocery({
      user: req.user._id,
      name,
      quantity,
      unit,
      purchaseDate: purchaseDate || new Date(),
      expiryDate,
      category,
      notes
    });

    const createdGrocery = await grocery.save();
    res.status(201).json(createdGrocery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a grocery item
// @route   PUT /api/groceries/:id
// @access  Private
const updateGrocery = async (req, res) => {
  try {
    const { name, quantity, unit, purchaseDate, expiryDate, category, notes } = req.body;

    const grocery = await Grocery.findById(req.params.id);

    if (!grocery) {
      return res.status(404).json({ message: 'Grocery not found' });
    }

    // Check if user owns the grocery item
    if (grocery.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    grocery.name = name || grocery.name;
    grocery.quantity = quantity || grocery.quantity;
    grocery.unit = unit || grocery.unit;
    grocery.purchaseDate = purchaseDate || grocery.purchaseDate;
    grocery.expiryDate = expiryDate || grocery.expiryDate;
    grocery.category = category || grocery.category;
    grocery.notes = notes || grocery.notes;

    const updatedGrocery = await grocery.save();
    res.json(updatedGrocery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a grocery item
// @route   DELETE /api/groceries/:id
// @access  Private
const deleteGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);

    if (!grocery) {
      return res.status(404).json({ message: 'Grocery not found' });
    }

    // Check if user owns the grocery item
    if (grocery.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await grocery.deleteOne();
    res.json({ message: 'Grocery removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getGroceries,
  addGrocery,
  updateGrocery,
  deleteGrocery
};