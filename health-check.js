/**
 * Health Check Module for Node.js Applications
 * 
 * This module provides a comprehensive health check implementation for Node.js applications.
 * It includes checks for database connections, Redis, external services, and system resources.
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { promisify } = require('util');
const { createClient } = require('redis');
const { Pool } = require('pg');
const axios = require('axios');
const pjson = require('../package.json');

// Configuration with defaults
const config = {
  // Service info
  serviceName: process.env.SERVICE_NAME || 'service',
  serviceVersion: process.env.SERVICE_VERSION || pjson.version,
  
  // Database
  dbEnabled: process.env.DB_ENABLED !== 'false',
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT || 5432,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbPasswordFile: process.env.DB_PASSWORD_FILE,
  
  // Redis
  redisEnabled: process.env.REDIS_ENABLED !== 'false',
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT || 6379,
  redisPassword: process.env.REDIS_PASSWORD,
  redisPasswordFile: process.env.REDIS_PASSWORD_FILE,
  
  // External services
  externalServices: (process.env.EXTERNAL_SERVICES || '').split(',').filter(Boolean).map(service => {
    const [name, url] = service.split(':');
    return { name, url };
  }),
  
  // Thresholds
  cpuThreshold: parseFloat(process.env.CPU_THRESHOLD || '0.9'),
  memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD || '0.9'),
  diskThreshold: parseFloat(process.env.DISK_THRESHOLD || '0.9'),
  
  // Timeouts
  dbTimeout: parseInt(process.env.DB_TIMEOUT || '5000', 10),
  redisTimeout: parseInt(process.env.REDIS_TIMEOUT || '5000', 10),
  externalTimeout: parseInt(process.env.EXTERNAL_TIMEOUT || '5000', 10),
};

// Read password from file if specified
const fs = require('fs');
if (config.dbPasswordFile && !config.dbPassword) {
  try {
    config.dbPassword = fs.readFileSync(config.dbPasswordFile, 'utf8').trim();
  } catch (err) {
    console.error('Failed to read database password file:', err);
  }
}

if (config.redisPasswordFile && !config.redisPassword) {
  try {
    config.redisPassword = fs.readFileSync(config.redisPasswordFile, 'utf8').trim();
  } catch (err) {
    console.error('Failed to read Redis password file:', err);
  }
}

// Database connection pool
let dbPool;
if (config.dbEnabled && config.dbHost && config.dbName && config.dbUser && config.dbPassword) {
  dbPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbName,
    user: config.dbUser,
    password: config.dbPassword,
    connectionTimeoutMillis: config.dbTimeout,
  });
}

// Redis client
let redisClient;
if (config.redisEnabled && config.redisHost) {
  redisClient = createClient({
    url: `redis://${config.redisHost}:${config.redisPort}`,
    password: config.redisPassword,
    socket: {
      connectTimeout: config.redisTimeout,
    },
  });
  
  // Connect to Redis
  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
    }
  })();
  
  // Handle Redis errors
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

/**
 * Check database connection
 * @returns {Promise<Object>} Status object
 */
async function checkDatabase() {
  if (!config.dbEnabled || !dbPool) {
    return { status: 'disabled' };
  }
  
  try {
    const client = await dbPool.connect();
    try {
      const start = Date.now();
      const result = await client.query('SELECT 1');
      const duration = Date.now() - start;
      
      return {
        status: 'ok',
        responseTime: duration,
        connections: {
          total: dbPool.totalCount,
          idle: dbPool.idleCount,
          waiting: dbPool.waitingCount,
        },
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      status: 'error',
      error: err.message,
    };
  }
}

/**
 * Check Redis connection
 * @returns {Promise<Object>} Status object
 */
async function checkRedis() {
  if (!config.redisEnabled || !redisClient) {
    return { status: 'disabled' };
  }
  
  try {
    const start = Date.now();
    await redisClient.ping();
    const duration = Date.now() - start;
    
    return {
      status: 'ok',
      responseTime: duration,
      connected: redisClient.isOpen,
    };
  } catch (err) {
    return {
      status: 'error',
      error: err.message,
    };
  }
}

/**
 * Check external services
 * @returns {Promise<Object>} Status object
 */
async function checkExternalServices() {
  if (!config.externalServices || config.externalServices.length === 0) {
    return { status: 'disabled' };
  }
  
  const results = {};
  
  await Promise.all(
    config.externalServices.map(async (service) => {
      try {
        const start = Date.now();
        const response = await axios.get(service.url, {
          timeout: config.externalTimeout,
          validateStatus: null,
        });
        const duration = Date.now() - start;
        
        results[service.name] = {
          status: response.status >= 200 && response.status < 300 ? 'ok' : 'error',
          statusCode: response.status,
          responseTime: duration,
        };
      } catch (err) {
        results[service.name] = {
          status: 'error',
          error: err.message,
        };
      }
    })
  );
  
  return results;
}

/**
 * Check system resources
 * @returns {Object} Status object
 */
function checkSystem() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = usedMemory / totalMemory;
  
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  
  return {
    status: 'ok',
    cpu: {
      usage: cpuUsage,
      status: cpuUsage < config.cpuThreshold ? 'ok' : 'warning',
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usage: memoryUsage,
      status: memoryUsage < config.memoryThreshold ? 'ok' : 'warning',
    },
    uptime: os.uptime(),
    hostname: os.hostname(),
  };
}

/**
 * Perform a liveness check
 * This is a simple check to determine if the application is running
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: config.serviceName,
    version: config.serviceVersion,
  });
});

/**
 * Perform a readiness check
 * This checks if the application is ready to handle requests
 */
router.get('/readiness', async (req, res) => {
  const [dbStatus, redisStatus, externalStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalServices(),
  ]);
  
  const systemStatus = checkSystem();
  
  const isReady = (
    (dbStatus.status === 'ok' || dbStatus.status === 'disabled') &&
    (redisStatus.status === 'ok' || redisStatus.status === 'disabled') &&
    systemStatus.status === 'ok'
  );
  
  const externalServicesReady = Object.values(externalStatus).every(
    service => service.status === 'ok' || service.status === 'disabled'
  );
  
  const status = isReady && externalServicesReady ? 'ok' : 'error';
  
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    service: config.serviceName,
    version: config.serviceVersion,
    checks: {
      database: dbStatus,
      redis: redisStatus,
      externalServices: externalStatus,
      system: systemStatus,
    },
  });
});

/**
 * Comprehensive health check endpoint
 */
router.get('/', async (req, res) => {
  const startTime = process.hrtime();
  
  const [dbStatus, redisStatus, externalStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalServices(),
  ]);
  
  const systemStatus = checkSystem();
  
  const isHealthy = (
    (dbStatus.status === 'ok' || dbStatus.status === 'disabled') &&
    (redisStatus.status === 'ok' || redisStatus.status === 'disabled') &&
    systemStatus.status === 'ok'
  );
  
  const externalServicesHealthy = Object.values(externalStatus).every(
    service => service.status === 'ok' || service.status === 'disabled'
  );
  
  const status = isHealthy && externalServicesHealthy ? 'ok' : 'error';
  
  const endTime = process.hrtime(startTime);
  const duration = (endTime[0] * 1e3 + endTime[1] / 1e6).toFixed(2);
  
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    service: config.serviceName,
    version: config.serviceVersion,
    duration: `${duration}ms`,
    checks: {
      database: dbStatus,
      redis: redisStatus,
      externalServices: externalStatus,
      system: systemStatus,
    },
  });
});

module.exports = router;
