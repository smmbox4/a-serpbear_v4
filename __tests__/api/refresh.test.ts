import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import handler from '../../pages/api/refresh';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import Domain from '../../database/models/domain';
import verifyUser from '../../utils/verifyUser';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { getAppSettings } from '../../pages/api/settings';

jest.mock('../../database/database', () => ({
  __esModule: true,
  default: { sync: jest.fn() },
}));

jest.mock('../../database/models/keyword', () => ({
  __esModule: true,
  default: { findAll: jest.fn(), update: jest.fn() },
}));

jest.mock('../../database/models/domain', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));

jest.mock('../../utils/verifyUser');

jest.mock('../../pages/api/settings', () => ({
  __esModule: true,
  getAppSettings: jest.fn(),
}));

jest.mock('../../utils/refresh', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../utils/scraper', () => ({
  scrapeKeywordFromGoogle: jest.fn(),
  retryScrape: jest.fn(),
  removeFromRetryQueue: jest.fn(),
}));

describe('/api/refresh', () => {
  const req = { method: 'POST', query: {}, headers: {} } as unknown as NextApiRequest;
  let res: NextApiResponse;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    jest.clearAllMocks();

    (db.sync as jest.Mock).mockResolvedValue(undefined);
    (verifyUser as jest.Mock).mockReturnValue('authorized');
    (getAppSettings as jest.Mock).mockResolvedValue({ scraper_type: 'serpapi' });
    (Keyword.update as jest.Mock).mockResolvedValue([1]);
  });

  it('rejects requests with no valid keyword IDs', async () => {
    req.query = { id: 'abc,NaN' };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No valid keyword IDs provided' });
    expect(Keyword.findAll).not.toHaveBeenCalled();
  });

  it('returns serialized scraper errors from refreshAndUpdateKeywords', async () => {
    req.query = { id: '1', domain: 'example.com' };

    const keywordRecord = { ID: 1, domain: 'example.com' };
    (Keyword.findAll as jest.Mock).mockResolvedValue([keywordRecord]);
    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'example.com', scrape_enabled: true }) },
    ]);

    (refreshAndUpdateKeywords as jest.Mock).mockRejectedValue(new Error('scraper failed'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'scraper failed' });
    expect(Keyword.update).toHaveBeenCalledWith(
      { updating: true },
      { where: { ID: { [Op.in]: [1] } } },
    );
  });
});
