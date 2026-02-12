/**
 * Unit Tests: Error Classes
 */

const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  APIError,
  RateLimitError
} = require('../../utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and default status code', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });
    
    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 503);
      expect(error.statusCode).toBe(503);
    });
  });
  
  describe('ValidationError', () => {
    it('should have status code 400', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
    
    it('should include details if provided', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const error = new ValidationError('Invalid input', details);
      expect(error.details).toEqual(details);
    });
  });
  
  describe('NotFoundError', () => {
    it('should have status code 404', () => {
      const error = new NotFoundError('Campaign');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Campaign not found');
    });
    
    it('should include identifier in message', () => {
      const error = new NotFoundError('Campaign', 'camp-123');
      expect(error.message).toBe('Campaign not found: camp-123');
      expect(error.identifier).toBe('camp-123');
    });
  });
  
  describe('UnauthorizedError', () => {
    it('should have status code 401', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized access');
    });
  });
  
  describe('APIError', () => {
    it('should have status code 502', () => {
      const error = new APIError('API request failed');
      expect(error.statusCode).toBe(502);
    });
    
    it('should include platform information', () => {
      const error = new APIError('API request failed', 'meta-ads');
      expect(error.platform).toBe('meta-ads');
    });
  });
  
  describe('RateLimitError', () => {
    it('should have status code 429', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
    });
    
    it('should include retryAfter if provided', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      expect(error.retryAfter).toBe(60);
    });
  });
});
