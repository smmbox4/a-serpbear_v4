import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/health';
import db from '../../database/database';

jest.mock('../../database/database', () => ({
   __esModule: true,
   default: {
      authenticate: jest.fn(),
   },
}));

describe('/api/health endpoint', () => {
   const createRequest = (method: string = 'GET'): Partial<NextApiRequest> => ({
      method,
   });

   const createResponse = () => {
      const res = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn(),
      } as unknown as NextApiResponse;
      return res;
   };

   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('returns healthy status when database is accessible', async () => {
      (db.authenticate as jest.Mock).mockResolvedValue(undefined);

      const req = createRequest('GET');
      const res = createResponse();

      await handler(req as NextApiRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
         status: 'healthy',
         timestamp: expect.any(String),
         checks: {
            service: 'ok',
            database: 'ok',
         },
      });
   });

   it('returns unhealthy status when database is not accessible', async () => {
      (db.authenticate as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const req = createRequest('GET');
      const res = createResponse();

      await handler(req as NextApiRequest, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
         status: 'unhealthy',
         timestamp: expect.any(String),
         checks: {
            service: 'ok',
            database: 'error',
         },
      });
   });

   it('returns 405 for non-GET requests', async () => {
      const req = createRequest('POST');
      const res = createResponse();

      await handler(req as NextApiRequest, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
         status: 'unhealthy',
         timestamp: expect.any(String),
         checks: {
            service: 'error',
            database: 'error',
         },
         error: 'Method not allowed',
      });
   });

   it('includes valid timestamp in ISO format', async () => {
      (db.authenticate as jest.Mock).mockResolvedValue(undefined);

      const req = createRequest('GET');
      const res = createResponse();

      await handler(req as NextApiRequest, res);

      expect(res.json).toHaveBeenCalled();
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
   });

   it('does not require authentication', async () => {
      // This test ensures the endpoint doesn't call verifyUser or require auth headers
      (db.authenticate as jest.Mock).mockResolvedValue(undefined);

      const req = createRequest('GET');
      const res = createResponse();

      await handler(req as NextApiRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // The health endpoint should work without any authentication
   });
});