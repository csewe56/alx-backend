const kue = require('kue');
const { expect } = require('chai');
const sinon = require('sinon');
const { createPushNotificationsJobs } = require('../8-job'); // Adjust path as needed

describe('createPushNotificationsJobs', function() {
  let queue;
  let jobCreationStub;

  beforeEach(function() {
    // Create a queue with Kue
    queue = kue.createQueue();

    // Use test mode to avoid processing jobs
    queue.testMode = true;
    
    // Stub the save method to simulate job creation without actually adding to the queue
    jobCreationStub = sinon.stub(queue, 'create').returns({
      save: (cb) => {
        cb(null); // Simulate successful job creation
      },
    });
  });

  afterEach(function() {
    // Clear the queue
    queue.testMode = false;
    
    // Restore original method
    jobCreationStub.restore();
  });

  it('should throw an error if jobs is not an array', function() {
    expect(() => createPushNotificationsJobs({}, queue)).to.throw('Jobs is not an array');
  });

  it('should create jobs and log messages', function(done) {
    // Array of test jobs
    const jobs = [
      { phoneNumber: '4153518782', message: 'Test message 1' },
      { phoneNumber: '4153518783', message: 'Test message 2' },
    ];

    // Call createPushNotificationsJobs
    createPushNotificationsJobs(jobs, queue);

    // Validate jobs created in test mode
    const jobsInQueue = queue.testMode.jobs;
    expect(jobsInQueue).to.have.lengthOf(2);
    expect(jobsInQueue[0].data).to.deep.equal({ phoneNumber: '4153518782', message: 'Test message 1' });
    expect(jobsInQueue[1].data).to.deep.equal({ phoneNumber: '4153518783', message: 'Test message 2' });

    done();
  });
});

