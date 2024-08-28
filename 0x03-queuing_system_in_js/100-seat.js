const express = require('express');
const redis = require('redis');
const kue = require('kue');
const { promisify } = require('util');

// Create an Express app
const app = express();
const port = 1245;

// Create Redis client and promisify its methods
const redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

// Initialize Kue queue
const queue = kue.createQueue();

// Initialize available seats and reservationEnabled
const initialSeats = 50;
let reservationEnabled = true;

// Set initial available seats in Redis
setAsync('available_seats', initialSeats);

// Function to reserve seats
async function reserveSeat(number) {
  await setAsync('available_seats', number);
}

// Function to get current available seats
async function getCurrentAvailableSeats() {
  const seats = await getAsync('available_seats');
  return parseInt(seats, 10) || 0;
}

// Route to get the number of available seats
app.get('/available_seats', async (req, res) => {
  try {
    const seats = await getCurrentAvailableSeats();
    res.json({ available_seats: seats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve available seats' });
  }
});

// Route to reserve a seat
app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    return res.json({ status: 'Reservations are blocked' });
  }

  const job = queue.create('reserve_seat').save(err => {
    if (err) {
      return res.json({ status: 'Reservation failed' });
    }
    res.json({ status: 'Reservation in process' });
  });
});

// Process the queue
queue.process('reserve_seat', async (job, done) => {
  try {
    const currentSeats = await getCurrentAvailableSeats();
    if (currentSeats <= 0) {
      reservationEnabled = false;
      return done(new Error('Not enough seats available'));
    }
    await reserveSeat(currentSeats - 1);
    done();
  } catch (err) {
    done(err);
  }
});

// Route to process the queue
app.get('/process', async (req, res) => {
  res.json({ status: 'Queue processing' });

  queue.process('reserve_seat', async (job, done) => {
    try {
      const currentSeats = await getCurrentAvailableSeats();
      if (currentSeats <= 0) {
        reservationEnabled = false;
        return done(new Error('Not enough seats available'));
      }
      await reserveSeat(currentSeats - 1);
      console.log(`Seat reservation job ${job.id} completed`);
      done();
    } catch (err) {
      console.error(`Seat reservation job ${job.id} failed: ${err.message}`);
      done(err);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

