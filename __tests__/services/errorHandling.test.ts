/**
 * Test for improved error handling in service functions
 * This test verifies that HTML error responses are handled gracefully without JSON parsing errors
 */

// Mock window.location.origin
Object.defineProperty(window, 'location', {
   value: {
      origin: 'http://localhost:3000'
   },
   writable: true
});

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
   useRouter: () => ({
      push: mockPush,
      pathname: '/test',
      query: { slug: 'test-domain' }
   })
}));

// Mock react-query
const mockInvalidateQueries = jest.fn();
jest.mock('react-query', () => ({
   useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries
   }),
   useMutation: (fn: any, options: any) => ({
      mutate: async (data: any) => {
         try {
            await fn(data);
            if (options.onSuccess) options.onSuccess();
         } catch (error) {
            if (options.onError) options.onError(error);
            throw error;
         }
      }
   }),
   useQuery: () => ({})
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
   __esModule: true,
   default: jest.fn()
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Improved Error Handling in Services', () => {
   beforeEach(() => {
      mockFetch.mockClear();
      mockPush.mockClear();
      mockInvalidateQueries.mockClear();
   });

   it('should handle HTML error responses from /api/refresh gracefully', async () => {
      // Mock HTML error response (simulating Next.js error page)
      mockFetch.mockResolvedValueOnce({
         status: 400,
         headers: {
            get: jest.fn().mockReturnValue('text/html')
         },
         text: jest.fn().mockResolvedValue('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Internal Server Error</h1></body></html>')
      } as any);

      const { useRefreshKeywords } = require('../../services/keywords');
      
      const refreshMutation = useRefreshKeywords(() => {});
      
      try {
         await refreshMutation.mutate({ ids: [], domain: 'example.com' });
         fail('Expected error to be thrown');
      } catch (error) {
         expect(error).toBeInstanceOf(Error);
         expect((error as Error).message).toBe('Server error (400): Please try again later');
         // Verify that we don't get JSON parsing error
         expect((error as Error).message).not.toContain('Unexpected token');
      }
   });

   it('should handle HTML error responses from /api/ideas gracefully', async () => {
      // Mock HTML error response
      mockFetch.mockResolvedValueOnce({
         status: 500,
         headers: {
            get: jest.fn().mockReturnValue('text/html')
         },
         text: jest.fn().mockResolvedValue('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Internal Server Error</h1></body></html>')
      } as any);

      const { useMutateKeywordIdeas } = require('../../services/adwords');
      const mockRouter = { push: mockPush, pathname: '/test', query: { slug: 'test-domain' } };
      
      const ideasMutation = useMutateKeywordIdeas(mockRouter, () => {});
      
      try {
         await ideasMutation.mutate({ keywords: ['test'] });
         fail('Expected error to be thrown');
      } catch (error) {
         expect(error).toBeInstanceOf(Error);
         expect((error as Error).message).toBe('Server error (500): Please try again later');
         // Verify that we don't get JSON parsing error
         expect((error as Error).message).not.toContain('Unexpected token');
      }
   });

   it('should still handle valid JSON error responses correctly', async () => {
      // Mock valid JSON error response
      mockFetch.mockResolvedValueOnce({
         status: 400,
         headers: {
            get: jest.fn().mockReturnValue('application/json')
         },
         json: jest.fn().mockResolvedValue({ error: 'Invalid domain provided' })
      } as any);

      const { useRefreshKeywords } = require('../../services/keywords');
      const refreshMutation = useRefreshKeywords(() => {});
      
      try {
         await refreshMutation.mutate({ ids: [], domain: 'example.com' });
         fail('Expected error to be thrown');
      } catch (error) {
         expect(error).toBeInstanceOf(Error);
         expect((error as Error).message).toBe('Invalid domain provided');
      }
   });

   it('should handle response parsing errors gracefully', async () => {
      // Mock response that throws error when trying to read JSON
      mockFetch.mockResolvedValueOnce({
         status: 400,
         headers: {
            get: jest.fn().mockReturnValue('application/json')
         },
         json: jest.fn().mockRejectedValue(new Error('Unexpected token'))
      } as any);

      const { useRefreshKeywords } = require('../../services/keywords');
      const refreshMutation = useRefreshKeywords(() => {});
      
      try {
         await refreshMutation.mutate({ ids: [], domain: 'example.com' });
         fail('Expected error to be thrown');
      } catch (error) {
         expect(error).toBeInstanceOf(Error);
         expect((error as Error).message).toBe('Server error (400): Please try again later');
      }
   });
});