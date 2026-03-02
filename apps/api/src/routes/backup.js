/**
 * ADMIN BACKUP ROUTES
 * Endpoints for backup management (trigger, list, download, delete)
 */

import { requireAuth, requirePermission } from '../lib/rbac.js';
import {
  triggerBackup,
  getBackupList,
  getBackupById,
  deleteBackup,
  downloadBackup,
  cleanupExpiredBackups,
} from '../services/backupService.js';

/**
 * Register backup routes
 * @param {FastifyInstance} fastify
 */
export default async function backupRoutes(fastify) {
  // Trigger manual backup
  fastify.post(
    '/trigger',
    {
      preHandler: [requireAuth, requirePermission('system:backup:create')],
    },
    async (request, reply) => {
      try {
        const { environment, description } = request.body || {};

        const backup = await triggerBackup(request.user.id, {
          environment,
          description,
        });

        reply.code(202).send({
          success: true,
          message: 'Backup triggered successfully',
          data: backup,
        });
      } catch (error) {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Failed to trigger backup',
          message: error.message,
        });
      }
    },
  );

  // Get list of backups
  fastify.get(
    '/list',
    {
      preHandler: [requireAuth, requirePermission('system:backup:read')],
    },
    async (request, reply) => {
      try {
        const { page = 1, take = 50, status, type, environment } = request.query;

        const skip = (parseInt(page) - 1) * parseInt(take);

        const result = await getBackupList({
          skip,
          take: parseInt(take),
          status,
          type,
          environment,
        });

        reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Failed to fetch backups',
          message: error.message,
        });
      }
    },
  );

  // Get backup details
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth, requirePermission('system:backup:read')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const backup = await getBackupById(parseInt(id));

        reply.send({
          success: true,
          data: backup,
        });
      } catch (error) {
        request.log.error(error);
        const statusCode = error.message === 'Backup not found' ? 404 : 500;

        reply.code(statusCode).send({
          success: false,
          error: 'Failed to fetch backup',
          message: error.message,
        });
      }
    },
  );

  // Download backup file
  fastify.get(
    '/:id/download',
    {
      preHandler: [requireAuth, requirePermission('system:backup:download')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { filepath, filename, mimetype } = await downloadBackup(parseInt(id));

        reply.header('Content-Type', mimetype);
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);

        const stream = fastify.platformatic
          ? require('fs').createReadStream(filepath)
          : await import('fs').then(fs => fs.default.createReadStream(filepath));

        reply.send(stream);
      } catch (error) {
        request.log.error(error);
        const statusCode = error.message.includes('not found') ? 404 : 500;

        reply.code(statusCode).send({
          success: false,
          error: 'Failed to download backup',
          message: error.message,
        });
      }
    },
  );

  // Delete backup
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth, requirePermission('system:backup:delete')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const deleted = await deleteBackup(parseInt(id), request.user.id);

        reply.send({
          success: true,
          message: 'Backup deleted successfully',
          data: deleted,
        });
      } catch (error) {
        request.log.error(error);
        const statusCode = error.message === 'Backup not found' ? 404 : 500;

        reply.code(statusCode).send({
          success: false,
          error: 'Failed to delete backup',
          message: error.message,
        });
      }
    },
  );

  // Cleanup expired backups
  fastify.post(
    '/cleanup',
    {
      preHandler: [requireAuth, requirePermission('system:backup:delete')],
    },
    async (request, reply) => {
      try {
        const cleanedCount = await cleanupExpiredBackups();

        reply.send({
          success: true,
          message: `Cleaned up ${cleanedCount} expired backup(s)`,
          data: { cleanedCount },
        });
      } catch (error) {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Failed to cleanup backups',
          message: error.message,
        });
      }
    },
  );
}
