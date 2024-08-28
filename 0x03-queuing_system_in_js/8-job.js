const kue = require('kue');
const queue = kue.createQueue();

/**
 * Create push notification jobs in the queue.
 * @param {Array} jobs - Array of job objects to be added to the queue.
 * @param {Object} queue - Kue queue instance.
 */
function createPushNotificationsJobs(jobs, queue) {
  // Validate jobs parameter
  if (!Array.isArray(jobs)) {
    throw new Error('Jobs is not an array');
  }

  // Process each job in the array
  jobs.forEach(job => {
    const { phoneNumber, message } = job;
    
    // Create a job in the queue
    const jobId = queue.create('push_notification_code_3', {
      phoneNumber,
      message
    }).save(err => {
      if (err) {
        console.error('Error creating job:', err);
      } else {
        console.log(`Notification job created: ${jobId}`);
      }
    });
  });
}

// Set up event listeners for job events
queue.on('job complete', (id) => {
  console.log(`Notification job ${id} completed`);
});

queue.on('job failed', (id, error) => {
  console.error(`Notification job ${id} failed: ${error.message}`);
});

queue.on('job progress', (id, progress) => {
  console.log(`Notification job ${id} ${progress}% complete`);
});

console.log('Job creation script started...');

