const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;

if (REDIS_URL) {
  console.log('Connecting DB to Redis at:', REDIS_URL);
  redisClient = new Redis(REDIS_URL);
  redisClient.on('error', (err) => {
    console.error('Redis DB Client connection error:', err.message);
  });
} else {
  console.log('Using local file storage (jobs.json) for jobs.');
}

const DB_FILE = path.join(__dirname, '../jobs.json');

function readLocalDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to jobs.json:', err.message);
  }
}

async function getJob(id) {
  if (redisClient) {
    try {
      const data = await redisClient.get(`job:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Failed to get job from Redis:', err.message);
      return null;
    }
  } else {
    return readLocalDB()[id] || null;
  }
}

async function saveJob(id, jobData) {
  if (redisClient) {
    try {
      const existing = await getJob(id) || {};
      const updated = { ...existing, ...jobData, id };
      await redisClient.set(`job:${id}`, JSON.stringify(updated));
      await redisClient.expire(`job:${id}`, 86400); // expire in 24 hours
      return updated;
    } catch (err) {
      console.error('Failed to save job to Redis:', err.message);
      return null;
    }
  } else {
    const db = readLocalDB();
    const existing = db[id] || {};
    const updated = { ...existing, ...jobData, id };
    db[id] = updated;
    writeLocalDB(db);
    return updated;
  }
}

module.exports = {
  getJob,
  saveJob
};
