/**
 * BACKUP SERVICE
 * Handles database backup creation, listing, and restoration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPrismaClient } from '../lib/prisma.js';
import { logAuditAction } from './auditService.js';

const execAsync = promisify(exec);
const prisma = getPrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(PROJECT_ROOT, 'backups');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

/**
 * Trigger a manual database backup
 * @param {number} userId - Admin user ID triggering the backup
 * @param {Object} options - Backup options
 * @returns {Promise<Object>} Backup record
 */
export async function triggerBackup(userId, options = {}) {
  const {
    environment = process.env.NODE_ENV || 'production',
    description = null,
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `testtrack_${environment}_${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Create backup record in database
  const backup = await prisma.backupHistory.create({
    data: {
      filename,
      filepath,
      type: 'MANUAL',
      status: 'IN_PROGRESS',
      environment,
      triggeredBy: userId,
      databaseName: process.env.DB_NAME || 'testtrack',
      databaseHost: process.env.DB_HOST || 'localhost',
      metadata: description ? { description } : null,
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      expiresAt: new Date(Date.now() + (parseInt(process.env.BACKUP_RETENTION_DAYS || '30') * 24 * 60 * 60 * 1000)),
    },
  });

  // Log audit action
  await logAuditAction(userId, 'BACKUP_TRIGGERED', {
    resourceType: 'BACKUP',
    resourceId: backup.id,
    resourceName: filename,
    description: `Manual backup triggered: ${filename}`,
  });

  // Execute backup script asynchronously
  executeBackupScript(backup.id, environment).catch(async (error) => {
    console.error('Backup failed:', error);
    await prisma.backupHistory.update({
      where: { id: backup.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });
  });

  return backup;
}

/**
 * Execute the backup script
 * @param {number} backupId - Backup record ID
 * @param {string} environment - Environment name
 */
async function executeBackupScript(backupId, environment) {
  try {
    const scriptPath = path.join(SCRIPTS_DIR, 'backup-db.sh');
    
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // For Windows, we'll use PowerShell to execute pg_dump directly
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Use pg_dump directly
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      const filename = `testtrack_${environment}_${timestamp}.sql`;
      const backupFile = path.join(BACKUP_DIR, filename);
      const compressedFile = `${backupFile}.gz`;

      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '5432';
      const dbName = process.env.DB_NAME || 'testtrack';
      const dbUser = process.env.DB_USER || 'postgres';
      const dbPassword = process.env.DB_PASSWORD || '';

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: dbPassword };

      // Execute pg_dump
      const pgDumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl --clean --if-exists -F p -f "${backupFile}"`;
      
      await execAsync(pgDumpCmd, { env, maxBuffer: 50 * 1024 * 1024 });

      // Compress using PowerShell
      const compressCmd = `powershell -Command "& {$content = Get-Content '${backupFile}' -Raw; $bytes = [System.Text.Encoding]::UTF8.GetBytes($content); $ms = New-Object System.IO.MemoryStream; $gzip = New-Object System.IO.Compression.GzipStream($ms, [System.IO.Compression.CompressionMode]::Compress); $gzip.Write($bytes, 0, $bytes.Length); $gzip.Close(); [System.IO.File]::WriteAllBytes('${compressedFile}', $ms.ToArray())}"`;
      
      await execAsync(compressCmd, { maxBuffer: 50 * 1024 * 1024 });

      // Remove uncompressed file
      await fs.unlink(backupFile);

      // Get file size
      const stats = await fs.stat(compressedFile);
      const filesize = stats.size;

      // Update backup record
      await prisma.backupHistory.update({
        where: { id: backupId },
        data: {
          filename: path.basename(compressedFile),
          filepath: compressedFile,
          filesize: BigInt(filesize),
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    } else {
      // Unix/Linux: Use bash script
      const { stdout, stderr } = await execAsync(`bash "${scriptPath}" ${environment}`, {
        env: process.env,
        maxBuffer: 50 * 1024 * 1024,
      });

      if (stderr && !stderr.includes('NOTICE')) {
        throw new Error(stderr);
      }

      // Find the created backup file
      const files = await fs.readdir(BACKUP_DIR);
      const latestBackup = files
        .filter(f => f.startsWith(`testtrack_${environment}_`) && f.endsWith('.gz'))
        .sort()
        .pop();

      if (latestBackup) {
        const backupPath = path.join(BACKUP_DIR, latestBackup);
        const stats = await fs.stat(backupPath);

        await prisma.backupHistory.update({
          where: { id: backupId },
          data: {
            filename: latestBackup,
            filepath: backupPath,
            filesize: BigInt(stats.size),
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get list of backups with pagination
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Backups list with pagination
 */
export async function getBackupList(filters = {}) {
  const {
    skip = 0,
    take = 50,
    status = null,
    type = null,
    environment = null,
  } = filters;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (environment) {
    where.environment = environment;
  }

  const [backups, total] = await Promise.all([
    prisma.backupHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: Math.max(0, Number(skip) || 0),
      take: Math.min(100, Math.max(1, Number(take) || 50)),
    }),
    prisma.backupHistory.count({ where }),
  ]);

  // Convert BigInt to string for JSON serialization
  const serializedBackups = backups.map(backup => ({
    ...backup,
    filesize: backup.filesize ? backup.filesize.toString() : null,
  }));

  return {
    backups: serializedBackups,
    total,
    page: Math.floor(skip / take) + 1,
    totalPages: Math.ceil(total / take),
  };
}

/**
 * Get backup details by ID
 * @param {number} backupId - Backup ID
 * @returns {Promise<Object>} Backup details
 */
export async function getBackupById(backupId) {
  const backup = await prisma.backupHistory.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error('Backup not found');
  }

  return {
    ...backup,
    filesize: backup.filesize ? backup.filesize.toString() : null,
  };
}

/**
 * Delete a backup
 * @param {number} backupId - Backup ID
 * @param {number} userId - Admin user ID
 * @returns {Promise<Object>} Deleted backup record
 */
export async function deleteBackup(backupId, userId) {
  const backup = await prisma.backupHistory.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error('Backup not found');
  }

  // Delete physical file if exists
  if (backup.filepath) {
    try {
      await fs.unlink(backup.filepath);
    } catch (error) {
      console.error('Failed to delete backup file:', error);
    }
  }

  // Delete database record
  const deleted = await prisma.backupHistory.delete({
    where: { id: backupId },
  });

  // Log audit action
  await logAuditAction(userId, 'BACKUP_DELETED', {
    resourceType: 'BACKUP',
    resourceId: backupId,
    resourceName: backup.filename,
    description: `Backup deleted: ${backup.filename}`,
  });

  return {
    ...deleted,
    filesize: deleted.filesize ? deleted.filesize.toString() : null,
  };
}

/**
 * Clean up expired backups
 * @returns {Promise<number>} Number of backups cleaned
 */
export async function cleanupExpiredBackups() {
  const expiredBackups = await prisma.backupHistory.findMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
      status: 'COMPLETED',
    },
  });

  let cleanedCount = 0;

  for (const backup of expiredBackups) {
    try {
      // Delete physical file
      if (backup.filepath) {
        await fs.unlink(backup.filepath);
      }

      // Delete database record
      await prisma.backupHistory.delete({
        where: { id: backup.id },
      });

      cleanedCount++;
    } catch (error) {
      console.error(`Failed to cleanup backup ${backup.id}:`, error);
    }
  }

  return cleanedCount;
}

/**
 * Download backup file
 * @param {number} backupId - Backup ID
 * @returns {Promise<Object>} File path and metadata
 */
export async function downloadBackup(backupId) {
  const backup = await prisma.backupHistory.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error('Backup not found');
  }

  if (backup.status !== 'COMPLETED') {
    throw new Error('Backup is not completed');
  }

  if (!backup.filepath) {
    throw new Error('Backup file path not found');
  }

  // Check if file exists
  try {
    await fs.access(backup.filepath);
  } catch (error) {
    throw new Error('Backup file does not exist');
  }

  return {
    filepath: backup.filepath,
    filename: backup.filename,
    mimetype: 'application/gzip',
  };
}
