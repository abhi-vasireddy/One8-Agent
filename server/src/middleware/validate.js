import { ZodError } from 'zod';
import { badRequest } from '../utils/api-response.js';

/**
 * Validation middleware using Zod schemas
 * Usage: validate(myZodSchema) 
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return badRequest(res, 'Validation failed', details);
      }
      next(err);
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return badRequest(res, 'Invalid query parameters', details);
      }
      next(err);
    }
  };
};
