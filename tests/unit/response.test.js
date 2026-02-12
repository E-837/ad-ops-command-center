/**
 * Unit Tests: Response Helpers
 */

const {
  success,
  error,
  paginated,
  created,
  updated,
  deleted
} = require('../../utils/response');

describe('Response Helpers', () => {
  describe('success()', () => {
    it('should return standardized success response', () => {
      const result = success({ name: 'Test Campaign' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'Test Campaign' });
    });
    
    it('should include metadata if provided', () => {
      const result = success({ name: 'Test' }, { timestamp: '2024-01-01' });
      expect(result.meta).toEqual({ timestamp: '2024-01-01' });
    });
    
    it('should not include meta key if empty', () => {
      const result = success({ name: 'Test' });
      expect(result.meta).toBeUndefined();
    });
  });
  
  describe('error()', () => {
    it('should return standardized error response', () => {
      const result = error('Something went wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });
    
    it('should include details if provided', () => {
      const result = error('Validation failed', { field: 'email' });
      expect(result.details).toEqual({ field: 'email' });
    });
  });
  
  describe('paginated()', () => {
    it('should return paginated response with metadata', () => {
      const items = [1, 2, 3, 4, 5];
      const result = paginated(items, 2, 5, 25);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
      expect(result.meta.pagination).toEqual({
        page: 2,
        pageSize: 5,
        total: 25,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });
    
    it('should correctly calculate hasNextPage', () => {
      const result = paginated([1, 2], 5, 5, 25);
      expect(result.meta.pagination.hasNextPage).toBe(false);
    });
    
    it('should correctly calculate hasPreviousPage', () => {
      const result = paginated([1, 2], 1, 5, 25);
      expect(result.meta.pagination.hasPreviousPage).toBe(false);
    });
  });
  
  describe('created()', () => {
    it('should return creation response', () => {
      const data = { id: '123', name: 'New Campaign' };
      const result = created(data, '123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        resourceId: '123',
        created: true
      });
    });
  });
  
  describe('updated()', () => {
    it('should return update response', () => {
      const data = { id: '123', name: 'Updated Campaign' };
      const result = updated(data, '123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        resourceId: '123',
        updated: true
      });
    });
  });
  
  describe('deleted()', () => {
    it('should return deletion response', () => {
      const result = deleted('123', 'campaign');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        deleted: true,
        resourceId: '123',
        resourceType: 'campaign'
      });
    });
  });
});
