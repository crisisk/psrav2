import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Pool } from 'pg';
import { auditService } from '../audit-service';
import { taskQueue } from '../task-queue';

export interface ETLJobConfig {
  id: string;
  name: string;
  source: 'addon_package' | 'taric_api' | 'hmrc_api' | 'csv_file';
  sourceConfig: any;
  destination: 'hs_codes' | 'origin_rules' | 'trade_agreements';
  schedule?: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ETLResult {
  jobId: string;
  startTime: Date;
  endTime: Date;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: string[];
  success: boolean;
}

export class ETLService {
  private pool: Pool;
  private jobs: Map<string, ETLJobConfig> = new Map();

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    
    this.initializeETLTables();
    this.loadETLJobs();
  }

  private async initializeETLTables(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS etl_jobs (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          source VARCHAR(100) NOT NULL,
          source_config JSONB NOT NULL,
          destination VARCHAR(100) NOT NULL,
          schedule VARCHAR(100),
          enabled BOOLEAN DEFAULT true,
          last_run TIMESTAMP WITH TIME ZONE,
          next_run TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS etl_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id VARCHAR(255) REFERENCES etl_jobs(id),
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          records_processed INTEGER DEFAULT 0,
          records_successful INTEGER DEFAULT 0,
          records_failed INTEGER DEFAULT 0,
          errors JSONB,
          success BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      console.log('ETL tables initialized successfully');
    } catch (error) {
      console.error('Error initializing ETL tables:', error);
    }
  }

  private async loadETLJobs(): Promise<void> {
    try {
      // Load default ETL jobs for addon packages
      const defaultJobs: ETLJobConfig[] = [
        {
          id: 'ceta_rules_import',
          name: 'CETA Origin Rules Import',
          source: 'addon_package',
          sourceConfig: {
            packagePath: '/tmp/addons_extracted/',
            rulesPath: 'data/rules/CETA/',
            filePattern: '*.yaml'
          },
          destination: 'origin_rules',
          schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
          enabled: true
        },
        {
          id: 'tca_rules_import',
          name: 'EU-UK-TCA Origin Rules Import',
          source: 'addon_package',
          sourceConfig: {
            packagePath: '/tmp/addons_extracted/',
            rulesPath: 'data/rules/EU-UK-TCA/',
            filePattern: '*.yaml'
          },
          destination: 'origin_rules',
          schedule: '0 2 * * 0',
          enabled: true
        },
        {
          id: 'epa_rules_import',
          name: 'EU-JP-EPA Origin Rules Import',
          source: 'addon_package',
          sourceConfig: {
            packagePath: '/tmp/addons_extracted/',
            rulesPath: 'data/rules/EU-JP-EPA/',
            filePattern: '*.yaml'
          },
          destination: 'origin_rules',
          schedule: '0 2 * * 0',
          enabled: true
        },
        {
          id: 'cn_taric_import',
          name: 'CN TARIC Data Import',
          source: 'addon_package',
          sourceConfig: {
            packagePath: '/tmp/addons_extracted/',
            dataPath: 'cn_taric/',
            filePattern: '*.csv'
          },
          destination: 'hs_codes',
          schedule: '0 1 * * 1', // Weekly on Monday at 1 AM
          enabled: true
        }
      ];

      for (const job of defaultJobs) {
        this.jobs.set(job.id, job);
        await this.saveETLJob(job);
      }

      console.log(`Loaded ${defaultJobs.length} ETL jobs`);
    } catch (error) {
      console.error('Error loading ETL jobs:', error);
    }
  }

  async runETLJob(jobId: string): Promise<ETLResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`ETL job ${jobId} not found`);
    }

    const startTime = new Date();
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      console.log(`Starting ETL job: ${job.name}`);
      
      switch (job.source) {
        case 'addon_package':
          const result = await this.processAddonPackage(job);
          recordsProcessed = result.processed;
          recordsSuccessful = result.successful;
          recordsFailed = result.failed;
          errors.push(...result.errors);
          break;
          
        case 'csv_file':
          // Implementation for CSV file processing
          break;
          
        default:
          throw new Error(`Unsupported source type: ${job.source}`);
      }

      const endTime = new Date();
      const success = recordsFailed === 0;

      // Update job last run time
      job.lastRun = endTime;
      await this.saveETLJob(job);

      // Log ETL run
      await this.logETLRun({
        jobId,
        startTime,
        endTime,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        errors,
        success
      });

      // Audit log
      await auditService.logBulkImport(
        'system',
        job.destination,
        job.name,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        endTime.getTime() - startTime.getTime()
      );

      // Send notification
      await taskQueue.queueEmailNotification({
        to: 'admin@sevensa.nl',
        subject: `ETL Job Completed: ${job.name}`,
        body: `
          ETL Job: ${job.name}
          Status: ${success ? 'Success' : 'Partial Failure'}
          
          Records Processed: ${recordsProcessed}
          Records Successful: ${recordsSuccessful}
          Records Failed: ${recordsFailed}
          
          Duration: ${endTime.getTime() - startTime.getTime()}ms
          
          ${errors.length > 0 ? `Errors:\n${errors.join('\n')}` : ''}
        `
      });

      return {
        jobId,
        startTime,
        endTime,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        errors,
        success
      };

    } catch (error) {
      const endTime = new Date();
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      await this.logETLRun({
        jobId,
        startTime,
        endTime,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        errors,
        success: false
      });

      throw error;
    }
  }

  private async processAddonPackage(job: ETLJobConfig): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const { packagePath, rulesPath, filePattern } = job.sourceConfig;
      const fullPath = path.join(packagePath, rulesPath || '');
      
      // Find all matching files
      const files = await this.findFiles(fullPath, filePattern);
      
      for (const file of files) {
        try {
          processed++;
          
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            await this.processYAMLFile(file, job.destination);
          } else if (file.endsWith('.csv')) {
            await this.processCSVFile(file, job.destination);
          }
          
          successful++;
        } catch (error) {
          failed++;
          errors.push(`Error processing ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`Error processing addon package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { processed, successful, failed, errors };
  }

  private async findFiles(directory: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Simple pattern matching (could be enhanced with glob)
          if (pattern === '*.*' || entry.name.endsWith(pattern.replace('*', ''))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
    }
    
    return files;
  }

  private async processYAMLFile(filePath: string, destination: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.load(content) as any;
      
      if (destination === 'origin_rules') {
        await this.importOriginRules(data, filePath);
      }
    } catch (error) {
      throw new Error(`Error processing YAML file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processCSVFile(filePath: string, destination: string): Promise<void> {
    // CSV processing implementation would go here
    // For now, just log that we found a CSV file
    console.log(`Found CSV file for processing: ${filePath}`);
  }

  private async importOriginRules(data: any, filePath: string): Promise<void> {
    try {
      // Extract trade agreement from file path
      const tradeAgreement = this.extractTradeAgreementFromPath(filePath);
      const hsCode = this.extractHSCodeFromPath(filePath);
      
      if (data.rules && Array.isArray(data.rules)) {
        for (const rule of data.rules) {
          await this.pool.query(`
            INSERT INTO origin_rules (
              hs_code, trade_agreement, rule_text, conditions, priority, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (hs_code, trade_agreement, rule_text) DO UPDATE SET
              conditions = EXCLUDED.conditions,
              priority = EXCLUDED.priority,
              updated_at = NOW()
          `, [
            hsCode,
            tradeAgreement,
            rule.text || rule.description || 'Imported rule',
            JSON.stringify(rule.conditions || {}),
            rule.priority || 1
          ]);
        }
      } else if (data.rule_text || data.description) {
        // Single rule format
        await this.pool.query(`
          INSERT INTO origin_rules (
            hs_code, trade_agreement, rule_text, conditions, priority, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (hs_code, trade_agreement, rule_text) DO UPDATE SET
            conditions = EXCLUDED.conditions,
            priority = EXCLUDED.priority,
            updated_at = NOW()
        `, [
          hsCode,
          tradeAgreement,
          data.rule_text || data.description,
          JSON.stringify(data.conditions || {}),
          data.priority || 1
        ]);
      }
    } catch (error) {
      throw new Error(`Error importing origin rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTradeAgreementFromPath(filePath: string): string {
    if (filePath.includes('CETA')) return 'CETA';
    if (filePath.includes('EU-UK-TCA')) return 'EU-UK-TCA';
    if (filePath.includes('EU-JP-EPA')) return 'EU-JP-EPA';
    return 'UNKNOWN';
  }

  private extractHSCodeFromPath(filePath: string): string {
    const match = filePath.match(/hs(\d+)/i);
    return match ? match[1] : '0000';
  }

  private async saveETLJob(job: ETLJobConfig): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO etl_jobs (
          id, name, source, source_config, destination, schedule, enabled, last_run, next_run
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          source = EXCLUDED.source,
          source_config = EXCLUDED.source_config,
          destination = EXCLUDED.destination,
          schedule = EXCLUDED.schedule,
          enabled = EXCLUDED.enabled,
          last_run = EXCLUDED.last_run,
          next_run = EXCLUDED.next_run,
          updated_at = NOW()
      `, [
        job.id,
        job.name,
        job.source,
        JSON.stringify(job.sourceConfig),
        job.destination,
        job.schedule,
        job.enabled,
        job.lastRun,
        job.nextRun
      ]);
    } catch (error) {
      console.error('Error saving ETL job:', error);
    }
  }

  private async logETLRun(result: ETLResult): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO etl_runs (
          job_id, start_time, end_time, records_processed, records_successful, 
          records_failed, errors, success
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        result.jobId,
        result.startTime,
        result.endTime,
        result.recordsProcessed,
        result.recordsSuccessful,
        result.recordsFailed,
        JSON.stringify(result.errors),
        result.success
      ]);
    } catch (error) {
      console.error('Error logging ETL run:', error);
    }
  }

  async getETLJobs(): Promise<ETLJobConfig[]> {
    return Array.from(this.jobs.values());
  }

  async getETLJobHistory(jobId: string, limit: number = 50): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT * FROM etl_runs 
      WHERE job_id = $1 
      ORDER BY start_time DESC 
      LIMIT $2
    `, [jobId, limit]);
    
    return result.rows;
  }

  async runAllEnabledJobs(): Promise<ETLResult[]> {
    const results: ETLResult[] = [];
    
    for (const job of this.jobs.values()) {
      if (job.enabled) {
        try {
          const result = await this.runETLJob(job.id);
          results.push(result);
        } catch (error) {
          console.error(`Error running ETL job ${job.id}:`, error);
        }
      }
    }
    
    return results;
  }
}

// Singleton instance
export const etlService = new ETLService();
