// ════════════════════════════════════════════════
//  Grocery Name Validator Middleware
//  Checks that submitted grocery names are
//  plausible food/grocery items before saving.
// ════════════════════════════════════════════════

// Curated food keyword list grouped by category
const FOOD_KEYWORDS = [
  // Fruits
  'apple','apples','mango','mangoes','banana','bananas','orange','oranges',
  'grape','grapes','strawberry','strawberries','blueberry','blueberries',
  'raspberry','raspberries','blackberry','blackberries','cherry','cherries',
  'peach','peaches','plum','plums','pear','pears','pineapple','watermelon',
  'melon','cantaloupe','honeydew','kiwi','lemon','lemons','lime','limes',
  'coconut','papaya','guava','pomegranate','fig','figs','date','dates',
  'apricot','apricots','avocado','avocados','dragonfruit','lychee','muskmelon',
  'jackfruit','custard apple','passion fruit','star fruit','persimmon',
  'mulberry','gooseberry','cranberry','cranberries','tangerine','clementine',
  'mandarin','grapefruit','nectarine','quince','tamarind','plantain',

  // Vegetables
  'onion','onions','tomato','tomatoes','potato','potatoes','carrot','carrots',
  'spinach','broccoli','cauliflower','cabbage','lettuce','cucumber','cucumbers',
  'capsicum','bell pepper','pepper','peppers','chilli','chili','chilies',
  'garlic','ginger','celery','leek','leeks','zucchini','eggplant','brinjal',
  'pumpkin','beetroot','radish','turnip','parsnip','asparagus','artichoke',
  'corn','sweet corn','peas','beans','green beans','french beans','runner beans',
  'broad beans','chickpeas','lentils','lentil','kidney beans','black beans',
  'soybeans','edamame','mushroom','mushrooms','yam','sweet potato','taro',
  'kale','arugula','bok choy','pak choi','spring onion','shallot','shallots',
  'fennel','okra','bitter gourd','bottle gourd','ridge gourd','drumstick',
  'raw banana','banana flower','lotus root','bamboo shoots','watercress',

  // Dairy
  'milk','butter','cheese','yogurt','yoghurt','curd','cream','ghee',
  'paneer','cottage cheese','mozzarella','cheddar','parmesan','brie','gouda',
  'ricotta','feta','cream cheese','sour cream','whipped cream','condensed milk',
  'evaporated milk','buttermilk','kefir','skimmed milk','full cream milk',
  'lactose free milk','almond milk','oat milk','soy milk','coconut milk',
  'ice cream','gelato','custard','pudding','whey','casein','dairy',

  // Meat & Seafood
  'chicken','beef','pork','lamb','mutton','turkey','duck','goat',
  'fish','salmon','tuna','cod','tilapia','sardine','sardines','mackerel',
  'prawn','prawns','shrimp','crab','lobster','squid','octopus','clam','clams',
  'mussel','mussels','oyster','oysters','scallop','scallops','anchovy','anchovies',
  'mince','ground beef','steak','sausage','sausages','bacon','ham','salami',
  'pepperoni','chorizo','meatball','meatballs','kebab','liver','kidney',
  'chicken breast','chicken thigh','chicken wings','drumstick','fillet',

  // Grains & Bakery
  'rice','wheat','flour','bread','roti','chapati','naan','pita',
  'pasta','noodles','oats','oatmeal','barley','quinoa','millet','sorghum',
  'cornmeal','semolina','maida','rava','sooji','poha','vermicelli',
  'cereal','granola','muesli','biscuit','biscuits','cracker','crackers',
  'toast','bagel','croissant','muffin','bun','roll','wrap','tortilla',
  'couscous','bulgur','spelt','rye','buckwheat','corn flour','tapioca',
  'bread crumbs','breadcrumbs','croutons','waffle','pancake mix',

  // Snacks
  'chips','crisps','popcorn','nuts','peanuts','almonds','cashews','walnuts',
  'pistachios','hazelnuts','pecans','macadamia','trail mix','granola bar',
  'protein bar','energy bar','chocolate','dark chocolate','white chocolate',
  'candy','sweets','gummy','jelly beans','marshmallow','cookies','cake',
  'brownie','donut','pretzel','rice cake','corn chips','tortilla chips',
  'nachos','pretzels','seeds','sunflower seeds','pumpkin seeds','flaxseeds',
  'chia seeds','sesame seeds','dried fruit','raisins','dried mango',

  // Beverages
  'juice','orange juice','apple juice','water','sparkling water','soda',
  'cola','soft drink','tea','coffee','green tea','black tea','herbal tea',
  'milk tea','energy drink','sports drink','lemonade','smoothie','shake',
  'beer','wine','whiskey','rum','vodka','gin','champagne','kombucha',
  'coconut water','almond milk','oat milk','protein shake','hot chocolate',
  'cocoa','matcha','chai','espresso','cappuccino','latte',

  // Frozen
  'frozen peas','frozen corn','frozen beans','frozen berries','frozen fish',
  'frozen chicken','frozen pizza','frozen vegetables','ice cream','sorbet',
  'frozen fries','french fries','frozen burger','frozen paratha','frozen bread',
  'frozen shrimp','frozen prawns','frozen edamame','frozen spinach',

  // Canned & Packaged
  'canned tomatoes','canned tuna','canned salmon','canned beans','canned corn',
  'canned peas','canned soup','canned fruit','canned chickpeas','baked beans',
  'tomato paste','tomato sauce','pasta sauce','pesto','salsa','jam','jelly',
  'marmalade','honey','syrup','maple syrup','ketchup','mustard','mayonnaise',
  'soy sauce','hot sauce','vinegar','oil','olive oil','coconut oil',
  'sunflower oil','vegetable oil','sesame oil','pickle','pickles','relish',

  // Condiments & Spices
  'salt','pepper','sugar','brown sugar','cinnamon','turmeric','cumin',
  'coriander','cardamom','cloves','nutmeg','paprika','chilli powder',
  'garam masala','curry powder','oregano','basil','thyme','rosemary',
  'bay leaf','bay leaves','star anise','vanilla','yeast','baking soda',
  'baking powder','cornstarch','gelatin','saffron','fenugreek','mustard seeds',

  // Generic food terms
  'food','grocery','groceries','produce','organic','fresh','natural',
  'vegetable','fruit','meat','seafood','dairy','grain','snack','beverage',
  'egg','eggs','tofu','tempeh','seitan','protein','supplement','vitamin',
  'butter','spread','margarine','lard','stock','broth','soup','sauce',
  'dip','hummus','guacamole','salad','dressing','marinade','spice','herb'
];

// Build a Set for O(1) lookups
const FOOD_SET = new Set(FOOD_KEYWORDS.map(k => k.toLowerCase()));

/**
 * Check if a name contains at least one food keyword
 * Handles multi-word names like "full cream milk", "cherry tomatoes"
 */
function isFoodItem(name) {
  const normalized = name.toLowerCase().trim();

  // Direct full match
  if (FOOD_SET.has(normalized)) return true;

  // Check each word in the name
  const words = normalized.split(/\s+/);
  for (const word of words) {
    // Strip common plurals for matching
    const singular = word.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
    if (FOOD_SET.has(word) || FOOD_SET.has(singular)) return true;
  }

  // Check if any food keyword is contained in the full name
  // Handles cases like "cherry tomatoes" matching "tomato"
  for (const keyword of FOOD_KEYWORDS) {
    if (normalized.includes(keyword)) return true;
  }

  return false;
}

// Categories that are too broad to validate — allow any name
const SKIP_VALIDATION_CATEGORIES = new Set([
  'snacks', 'beverages', 'frozen', 'canned', 'general'
]);

const validateGroceryName = (req, res, next) => {
  const { name, category } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Grocery name is required.'
    });
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Grocery name is too short.'
    });
  }

  if (trimmed.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Grocery name is too long (max 100 characters).'
    });
  }

  // Block names with numbers only or special characters only
  if (/^[^a-zA-Z]+$/.test(trimmed)) {
    return res.status(400).json({
      success: false,
      message: 'Grocery name must contain letters.'
    });
  }

  // Skip food keyword validation for loose categories
  if (SKIP_VALIDATION_CATEGORIES.has(category)) {
    return next();
  }

  // Strict categories: fruits, vegetables, dairy, meat, grains
  if (!isFoodItem(trimmed)) {
    return res.status(400).json({
      success: false,
      message: `"${trimmed}" doesn't appear to be a valid ${category} item. Please enter a real food name.`
    });
  }

  next();
};

module.exports = validateGroceryName;