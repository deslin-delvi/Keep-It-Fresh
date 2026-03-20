const express = require('express');
const router  = express.Router();
const { getGroceries, addGrocery, updateGrocery, deleteGrocery } = require('../controllers/groceryController');
const { protect }            = require('../middleware/auth');
const validateGroceryName    = require('../middleware/validateGrocery');

router.route('/')
  .get(protect, getGroceries)
  .post(protect, validateGroceryName, addGrocery);   // ← validated

router.route('/:id')
  .put(protect, validateGroceryName, updateGrocery)  // ← validated
  .delete(protect, deleteGrocery);

module.exports = router;