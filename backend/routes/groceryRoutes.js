const express = require('express');
const router = express.Router();
const { getGroceries, addGrocery, updateGrocery, deleteGrocery } = require('../controllers/groceryController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getGroceries)
  .post(protect, addGrocery);

router.route('/:id')
  .put(protect, updateGrocery)
  .delete(protect, deleteGrocery);

module.exports = router;