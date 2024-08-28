const express = require('express');
const redis = require('redis');
const { promisify } = require('util');

// Create an Express app
const app = express();
const port = 1245;

// Create a Redis client and promisify its methods
const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

// Sample product data
const listProducts = [
  { id: 1, name: 'Suitcase 250', price: 50, stock: 4 },
  { id: 2, name: 'Suitcase 450', price: 100, stock: 10 },
  { id: 3, name: 'Suitcase 650', price: 350, stock: 2 },
  { id: 4, name: 'Suitcase 1050', price: 550, stock: 5 }
];

// Function to get an item by ID
function getItemById(id) {
  return listProducts.find(product => product.id === id);
}

// Route to get the list of products
app.get('/list_products', (req, res) => {
  res.json(listProducts);
});

// Route to get a product by ID
app.get('/list_products/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const product = getItemById(itemId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  try {
    const reservedStock = await getCurrentReservedStockById(itemId);
    res.json({ ...product, currentStock: product.stock - reservedStock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reserved stock' });
  }
});

// Function to reserve stock in Redis
async function reserveStockById(itemId, stock) {
  await setAsync(`item.${itemId}`, stock);
}

// Function to get current reserved stock from Redis
async function getCurrentReservedStockById(itemId) {
  const reservedStock = await getAsync(`item.${itemId}`);
  return parseInt(reservedStock, 10) || 0;
}

// Route to reserve a product
app.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const product = getItemById(itemId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  try {
    const reservedStock = await getCurrentReservedStockById(itemId);
    if (product.stock - reservedStock <= 0) {
      return res.status(403).json({ error: 'Not enough stock available' });
    }

    await reserveStockById(itemId, reservedStock + 1);
    res.json({ message: 'Product reserved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reserve product' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

