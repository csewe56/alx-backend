const kue = require('kue');
const queue = kue.createQueue();

// Array containing blacklisted phone numbers
const blacklistedNumbers = [
  '4153518780',
  '4153518781'
];

// Function to send notification
function sendNotification(phoneNumber, message, job, done) {
  // Track job progress
  job.progress(0, 100);
  
  if (blacklistedNumbers.includes(phoneNumber)) {
    // Fail job if phone number is blacklisted
    job.failed(new Error(`Phone number ${phoneNumber} is blacklisted`));
    return done(new Error(`Phone number ${phoneNumber} is blacklisted`));
  }
  
  // Track job progress to 50%
  job.progress(50, 100);
  
  // Log notification details
  console.log(`Sending notification to ${phoneNumber}, with message: ${message}`);
  
  // Complete the job
  done();
}

// Create a queue with Kue
queue.process('push_notification_code_2', 2, (job, done) => {
  // Destructure job data
  const { phoneNumber, message } = job.data;
  
  // Call sendNotification function
  sendNotification(phoneNumber, message, job, done);
});

// Handle job completion
queue.on('job complete', (id, result) => {
  console.log('Thank you!');
});

// Handle job failure
queue.on('job failed', (id, error) => {
  console.error('Job failed:', error.message);
});

console.log('Queue processor started...');

