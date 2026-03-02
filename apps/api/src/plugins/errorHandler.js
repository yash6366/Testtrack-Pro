/**
 * GLOBAL ERROR HANDLER PLUGIN
 * Catches all errors from routes and services
 * Provides consistent error responses and logging
 */

import { logError } from '../lib/logger.js';

// Custom error classes
export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class PermissionError extends Error {
  constructor(action = 'perform this action') {
    super(`You don't have permission to ${action}`);
    this.name = 'PermissionError';
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

// Middleware for error handling
export async function errorHandlerPlugin(fastify) {
  fastify.setErrorHandler(async (error, request, reply) => {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Log all errors with context
    logError('Unhandled error in request', error, {
      path: request.url,
      method: request.method,
      userId: request.user?.id,
      remoteAddress: request.ip,
      requestId: request.id,
    });
    
    // Handle known error types
    if (error instanceof ValidationError) {
      return reply.code(error.statusCode).send({
        error: 'Validation Failed',
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: isDev ? error.details : undefined,
        requestId: request.id,
      });
    }
    
    if (error instanceof NotFoundError) {
      return reply.code(error.statusCode).send({
        error: 'Not Found',
        code: 'NOT_FOUND',
        message: error.message,
        requestId: request.id,
      });
    }
    
    if (error instanceof PermissionError) {
      return reply.code(error.statusCode).send({
        error: 'Forbidden',
        code: 'PERMISSION_DENIED',
        message: error.message,
        requestId: request.id,
      });
    }

    if (error instanceof UnauthorizedError) {
      return reply.code(error.statusCode).send({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        message: error.message,
        requestId: request.id,
      });
    }
    
    if (error instanceof ConflictError) {
      return reply.code(error.statusCode).send({
        error: 'Conflict',
        code: 'CONFLICT',
        message: error.message,
        requestId: request.id,
      });
    }

    if (error instanceof BadRequestError) {
      return reply.code(error.statusCode).send({
        error: 'Bad Request',
        code: 'BAD_REQUEST',
        message: error.message,
        requestId: request.id,
      });
    }
    
    // Handle Fastify validation errors
    if (error.statusCode === 400 && error.validation) {
      return reply.code(400).send({
        error: 'Invalid Request',
        code: 'INVALID_REQUEST',
        message: 'Request validation failed',
        details: isDev ? error.validation : undefined,
        requestId: request.id,
      });
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint failed
      const field = error.meta?.target?.[0] || 'field';
      return reply.code(409).send({
        error: 'Conflict',
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: `${field} already exists`,
        requestId: request.id,
      });
    }

    if (error.code === 'P2025') {
      // Record not found
      return reply.code(404).send({
        error: 'Not Found',
        code: 'RECORD_NOT_FOUND',
        message: 'The requested record was not found',
        requestId: request.id,
      });
    }
    
    // Default: Don't expose internals in production
    const statusCode = error.statusCode || 500;
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      code: 'INTERNAL_ERROR',
      message: isDev ? error.message : 'An unexpected error occurred',
      requestId: request.id,  // For support reference
    });
  });
}
