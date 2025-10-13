<?php

namespace Sevensa\Monitoring;

/**
 * Health Check Class for PHP Applications
 * 
 * This class provides a comprehensive health check implementation for PHP applications.
 * It includes checks for database connections, Redis, external services, and system resources.
 */
class HealthCheck
{
    /**
     * @var array Configuration options
     */
    private $config;
    
    /**
     * @var \PDO|null Database connection
     */
    private $dbConnection;
    
    /**
     * @var \Redis|null Redis connection
     */
    private $redisConnection;
    
    /**
     * Constructor
     * 
     * @param array $config Configuration options
     */
    public function __construct(array $config = [])
    {
        // Default configuration
        $defaultConfig = [
            // Service info
            'serviceName' => getenv('SERVICE_NAME') ?: 'service',
            'serviceVersion' => getenv('SERVICE_VERSION') ?: '1.0.0',
            
            // Database
            'dbEnabled' => filter_var(getenv('DB_ENABLED') ?: 'true', FILTER_VALIDATE_BOOLEAN),
            'dbHost' => getenv('DB_HOST'),
            'dbPort' => getenv('DB_PORT') ?: 3306,
            'dbName' => getenv('DB_NAME'),
            'dbUser' => getenv('DB_USER'),
            'dbPassword' => getenv('DB_PASSWORD'),
            'dbPasswordFile' => getenv('DB_PASSWORD_FILE'),
            'dbDriver' => getenv('DB_DRIVER') ?: 'mysql',
            
            // Redis
            'redisEnabled' => filter_var(getenv('REDIS_ENABLED') ?: 'true', FILTER_VALIDATE_BOOLEAN),
            'redisHost' => getenv('REDIS_HOST'),
            'redisPort' => getenv('REDIS_PORT') ?: 6379,
            'redisPassword' => getenv('REDIS_PASSWORD'),
            'redisPasswordFile' => getenv('REDIS_PASSWORD_FILE'),
            
            // External services
            'externalServices' => [],
            
            // Thresholds
            'cpuThreshold' => (float) (getenv('CPU_THRESHOLD') ?: 0.9),
            'memoryThreshold' => (float) (getenv('MEMORY_THRESHOLD') ?: 0.9),
            'diskThreshold' => (float) (getenv('DISK_THRESHOLD') ?: 0.9),
            
            // Timeouts
            'dbTimeout' => (int) (getenv('DB_TIMEOUT') ?: 5),
            'redisTimeout' => (int) (getenv('REDIS_TIMEOUT') ?: 5),
            'externalTimeout' => (int) (getenv('EXTERNAL_TIMEOUT') ?: 5),
        ];
        
        // Parse external services from environment variable
        $externalServicesStr = getenv('EXTERNAL_SERVICES');
        if ($externalServicesStr) {
            $services = explode(',', $externalServicesStr);
            foreach ($services as $service) {
                $parts = explode(':', $service, 2);
                if (count($parts) === 2) {
                    $defaultConfig['externalServices'][] = [
                        'name' => $parts[0],
                        'url' => $parts[1],
                    ];
                }
            }
        }
        
        // Merge with provided config
        $this->config = array_merge($defaultConfig, $config);
        
        // Read password from file if specified
        if (!empty($this->config['dbPasswordFile']) && empty($this->config['dbPassword'])) {
            try {
                $this->config['dbPassword'] = trim(file_get_contents($this->config['dbPasswordFile']));
            } catch (\Exception $e) {
                error_log('Failed to read database password file: ' . $e->getMessage());
            }
        }
        
        if (!empty($this->config['redisPasswordFile']) && empty($this->config['redisPassword'])) {
            try {
                $this->config['redisPassword'] = trim(file_get_contents($this->config['redisPasswordFile']));
            } catch (\Exception $e) {
                error_log('Failed to read Redis password file: ' . $e->getMessage());
            }
        }
        
        // Initialize connections
        $this->initDatabaseConnection();
        $this->initRedisConnection();
    }
    
    /**
     * Initialize database connection
     */
    private function initDatabaseConnection()
    {
        if (!$this->config['dbEnabled'] || empty($this->config['dbHost']) || 
            empty($this->config['dbName']) || empty($this->config['dbUser'])) {
            return;
        }
        
        try {
            $dsn = '';
            switch ($this->config['dbDriver']) {
                case 'mysql':
                    $dsn = "mysql:host={$this->config['dbHost']};port={$this->config['dbPort']};dbname={$this->config['dbName']};charset=utf8mb4";
                    break;
                case 'pgsql':
                    $dsn = "pgsql:host={$this->config['dbHost']};port={$this->config['dbPort']};dbname={$this->config['dbName']}";
                    break;
                default:
                    throw new \Exception("Unsupported database driver: {$this->config['dbDriver']}");
            }
            
            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_TIMEOUT => $this->config['dbTimeout'],
            ];
            
            $this->dbConnection = new \PDO(
                $dsn,
                $this->config['dbUser'],
                $this->config['dbPassword'],
                $options
            );
        } catch (\Exception $e) {
            error_log('Failed to initialize database connection: ' . $e->getMessage());
            $this->dbConnection = null;
        }
    }
    
    /**
     * Initialize Redis connection
     */
    private function initRedisConnection()
    {
        if (!$this->config['redisEnabled'] || empty($this->config['redisHost']) || !class_exists('Redis')) {
            return;
        }
        
        try {
            $this->redisConnection = new \Redis();
            $this->redisConnection->connect(
                $this->config['redisHost'],
                $this->config['redisPort'],
                $this->config['redisTimeout']
            );
            
            if (!empty($this->config['redisPassword'])) {
                $this->redisConnection->auth($this->config['redisPassword']);
            }
        } catch (\Exception $e) {
            error_log('Failed to initialize Redis connection: ' . $e->getMessage());
            $this->redisConnection = null;
        }
    }
    
    /**
     * Check database connection
     * 
     * @return array Status object
     */
    public function checkDatabase()
    {
        if (!$this->config['dbEnabled'] || $this->dbConnection === null) {
            return ['status' => 'disabled'];
        }
        
        try {
            $startTime = microtime(true);
            $stmt = $this->dbConnection->query('SELECT 1');
            $stmt->fetchColumn();
            $duration = (microtime(true) - $startTime) * 1000; // Convert to ms
            
            return [
                'status' => 'ok',
                'responseTime' => round($duration, 2),
                'connections' => [
                    'active' => 1, // Basic info, would need more for detailed stats
                ],
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Check Redis connection
     * 
     * @return array Status object
     */
    public function checkRedis()
    {
        if (!$this->config['redisEnabled'] || $this->redisConnection === null) {
            return ['status' => 'disabled'];
        }
        
        try {
            $startTime = microtime(true);
            $this->redisConnection->ping();
            $duration = (microtime(true) - $startTime) * 1000; // Convert to ms
            
            return [
                'status' => 'ok',
                'responseTime' => round($duration, 2),
                'connected' => true,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Check external services
     * 
     * @return array Status object
     */
    public function checkExternalServices()
    {
        if (empty($this->config['externalServices'])) {
            return ['status' => 'disabled'];
        }
        
        $results = [];
        
        foreach ($this->config['externalServices'] as $service) {
            try {
                $startTime = microtime(true);
                
                $ch = curl_init($service['url']);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['externalTimeout']);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $this->config['externalTimeout']);
                curl_setopt($ch, CURLOPT_HEADER, true);
                curl_setopt($ch, CURLOPT_NOBODY, true);
                
                $response = curl_exec($ch);
                $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $duration = (microtime(true) - $startTime) * 1000; // Convert to ms
                
                curl_close($ch);
                
                $results[$service['name']] = [
                    'status' => ($statusCode >= 200 && $statusCode < 300) ? 'ok' : 'error',
                    'statusCode' => $statusCode,
                    'responseTime' => round($duration, 2),
                ];
            } catch (\Exception $e) {
                $results[$service['name']] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Check system resources
     * 
     * @return array Status object
     */
    public function checkSystem()
    {
        // Memory usage
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = $this->getMemoryLimitBytes();
        $memoryPercentage = ($memoryLimit > 0) ? $memoryUsage / $memoryLimit : 0;
        
        // CPU usage (simplified, not as accurate as in Node.js or Python)
        $cpuUsage = $this->getCpuUsage();
        
        // Disk usage
        $diskTotal = disk_total_space('/');
        $diskFree = disk_free_space('/');
        $diskUsed = $diskTotal - $diskFree;
        $diskPercentage = ($diskTotal > 0) ? $diskUsed / $diskTotal : 0;
        
        return [
            'status' => 'ok',
            'cpu' => [
                'usage' => $cpuUsage,
                'status' => $cpuUsage < $this->config['cpuThreshold'] ? 'ok' : 'warning',
            ],
            'memory' => [
                'total' => $memoryLimit,
                'used' => $memoryUsage,
                'usage' => $memoryPercentage,
                'status' => $memoryPercentage < $this->config['memoryThreshold'] ? 'ok' : 'warning',
            ],
            'disk' => [
                'total' => $diskTotal,
                'free' => $diskFree,
                'used' => $diskUsed,
                'usage' => $diskPercentage,
                'status' => $diskPercentage < $this->config['diskThreshold'] ? 'ok' : 'warning',
            ],
            'uptime' => $this->getServerUptime(),
            'hostname' => gethostname(),
        ];
    }
    
    /**
     * Get memory limit in bytes
     * 
     * @return int Memory limit in bytes
     */
    private function getMemoryLimitBytes()
    {
        $memoryLimit = ini_get('memory_limit');
        if ($memoryLimit === '-1') {
            return PHP_INT_MAX;
        }
        
        $unit = strtolower(substr($memoryLimit, -1));
        $value = (int) substr($memoryLimit, 0, -1);
        
        switch ($unit) {
            case 'g':
                $value *= 1024;
                // fall through
            case 'm':
                $value *= 1024;
                // fall through
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }
    
    /**
     * Get CPU usage (simplified)
     * 
     * @return float CPU usage (0-1)
     */
    private function getCpuUsage()
    {
        // This is a simplified approach and not very accurate
        // For better results, use system monitoring tools or extensions
        
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            return $load[0] / max(1, $this->getCpuCores());
        }
        
        return 0;
    }
    
    /**
     * Get number of CPU cores
     * 
     * @return int Number of CPU cores
     */
    private function getCpuCores()
    {
        // Try to get from /proc/cpuinfo on Linux
        if (is_file('/proc/cpuinfo')) {
            $cpuinfo = file_get_contents('/proc/cpuinfo');
            preg_match_all('/^processor/m', $cpuinfo, $matches);
            $count = count($matches[0]);
            if ($count > 0) {
                return $count;
            }
        }
        
        // Try to get from shell command
        if (function_exists('shell_exec')) {
            // For Windows
            if (strtolower(PHP_OS) === 'winnt') {
                $cores = shell_exec('echo %NUMBER_OF_PROCESSORS%');
                if ($cores !== false) {
                    return (int) $cores;
                }
            }
            
            // For Linux/Unix/Mac
            $cores = shell_exec('nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null');
            if ($cores !== false) {
                return (int) $cores;
            }
        }
        
        // Default to 1 if we can't determine
        return 1;
    }
    
    /**
     * Get server uptime in seconds
     * 
     * @return int Server uptime in seconds
     */
    private function getServerUptime()
    {
        // Try to get from /proc/uptime on Linux
        if (is_file('/proc/uptime')) {
            $uptime = file_get_contents('/proc/uptime');
            $uptime = explode(' ', $uptime);
            return (float) $uptime[0];
        }
        
        // Try to get from shell command
        if (function_exists('shell_exec')) {
            $uptime = shell_exec('uptime -s 2>/dev/null');
            if ($uptime !== false) {
                $uptimeDate = strtotime(trim($uptime));
                if ($uptimeDate !== false) {
                    return time() - $uptimeDate;
                }
            }
        }
        
        // Default to 0 if we can't determine
        return 0;
    }
    
    /**
     * Perform a liveness check
     * 
     * @return array Liveness check result
     */
    public function livenessCheck()
    {
        return [
            'status' => 'ok',
            'timestamp' => date('c'),
            'service' => $this->config['serviceName'],
            'version' => $this->config['serviceVersion'],
        ];
    }
    
    /**
     * Perform a readiness check
     * 
     * @return array Readiness check result
     */
    public function readinessCheck()
    {
        $dbStatus = $this->checkDatabase();
        $redisStatus = $this->checkRedis();
        $externalStatus = $this->checkExternalServices();
        $systemStatus = $this->checkSystem();
        
        $isReady = (
            ($dbStatus['status'] === 'ok' || $dbStatus['status'] === 'disabled') &&
            ($redisStatus['status'] === 'ok' || $redisStatus['status'] === 'disabled') &&
            $systemStatus['status'] === 'ok'
        );
        
        $externalServicesReady = true;
        foreach ($externalStatus as $service) {
            if (is_array($service) && isset($service['status']) && $service['status'] !== 'ok' && $service['status'] !== 'disabled') {
                $externalServicesReady = false;
                break;
            }
        }
        
        $status = ($isReady && $externalServicesReady) ? 'ok' : 'error';
        
        return [
            'status' => $status,
            'timestamp' => date('c'),
            'service' => $this->config['serviceName'],
            'version' => $this->config['serviceVersion'],
            'checks' => [
                'database' => $dbStatus,
                'redis' => $redisStatus,
                'externalServices' => $externalStatus,
                'system' => $systemStatus,
            ],
        ];
    }
    
    /**
     * Perform a comprehensive health check
     * 
     * @return array Health check result
     */
    public function healthCheck()
    {
        $startTime = microtime(true);
        
        $dbStatus = $this->checkDatabase();
        $redisStatus = $this->checkRedis();
        $externalStatus = $this->checkExternalServices();
        $systemStatus = $this->checkSystem();
        
        $isHealthy = (
            ($dbStatus['status'] === 'ok' || $dbStatus['status'] === 'disabled') &&
            ($redisStatus['status'] === 'ok' || $redisStatus['status'] === 'disabled') &&
            $systemStatus['status'] === 'ok'
        );
        
        $externalServicesHealthy = true;
        foreach ($externalStatus as $service) {
            if (is_array($service) && isset($service['status']) && $service['status'] !== 'ok' && $service['status'] !== 'disabled') {
                $externalServicesHealthy = false;
                break;
            }
        }
        
        $status = ($isHealthy && $externalServicesHealthy) ? 'ok' : 'error';
        $duration = (microtime(true) - $startTime) * 1000; // Convert to ms
        
        return [
            'status' => $status,
            'timestamp' => date('c'),
            'service' => $this->config['serviceName'],
            'version' => $this->config['serviceVersion'],
            'duration' => round($duration, 2) . 'ms',
            'checks' => [
                'database' => $dbStatus,
                'redis' => $redisStatus,
                'externalServices' => $externalStatus,
                'system' => $systemStatus,
            ],
        ];
    }
    
    /**
     * Handle health check request
     * 
     * @param string $type Type of health check (liveness, readiness, or health)
     * @return array Health check result
     */
    public function handleRequest($type = 'health')
    {
        switch ($type) {
            case 'liveness':
                return $this->livenessCheck();
            case 'readiness':
                return $this->readinessCheck();
            case 'health':
            default:
                return $this->healthCheck();
        }
    }
    
    /**
     * Output health check result as JSON
     * 
     * @param string $type Type of health check (liveness, readiness, or health)
     * @return void
     */
    public function outputJson($type = 'health')
    {
        $result = $this->handleRequest($type);
        $status = ($result['status'] === 'ok') ? 200 : 503;
        
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($result, JSON_PRETTY_PRINT);
    }
}

// Example usage in a health check endpoint:
/*
require_once 'HealthCheck.php';

$healthCheck = new \Sevensa\Monitoring\HealthCheck();

// Determine the type of check from the URL
$requestUri = $_SERVER['REQUEST_URI'];
$type = 'health';

if (strpos($requestUri, '/health/liveness') !== false) {
    $type = 'liveness';
} elseif (strpos($requestUri, '/health/readiness') !== false) {
    $type = 'readiness';
}

$healthCheck->outputJson($type);
*/
