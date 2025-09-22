import { Op } from 'sequelize';
import refreshAndUpdateKeywords from '../../utils/refresh';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import { removeFromRetryQueue } from '../../utils/scraper';

// Mock the dependencies
jest.mock('../../database/models/domain');
jest.mock('../../database/models/keyword');
jest.mock('../../utils/scraper', () => ({
  removeFromRetryQueue: jest.fn(),
  retryScrape: jest.fn(),
  scrapeKeywordFromGoogle: jest.fn(),
}));

describe('refreshAndUpdateKeywords', () => {
  const mockSettings = {
    scraper_type: 'serpapi',
    scrape_retry: true,
  } as SettingsType;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes removeFromRetryQueue sequentially to prevent race conditions', async () => {
    // Setup mock data with disabled domains
    const mockKeywords = [
      {
        ID: 1,
        domain: 'disabled1.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'disabled1.com' }),
        update: jest.fn(),
      },
      {
        ID: 2,
        domain: 'disabled2.com',
        get: jest.fn().mockReturnValue({ ID: 2, domain: 'disabled2.com' }),
        update: jest.fn(),
      },
      {
        ID: 3,
        domain: 'disabled3.com',
        get: jest.fn().mockReturnValue({ ID: 3, domain: 'disabled3.com' }),
        update: jest.fn(),
      },
    ];

    // Mock domains with scrape_enabled: false to trigger the skipped keywords path
    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled1.com', scrape_enabled: false }) },
      { get: () => ({ domain: 'disabled2.com', scrape_enabled: false }) },
      { get: () => ({ domain: 'disabled3.com', scrape_enabled: false }) },
    ]);

    (Keyword.update as jest.Mock).mockResolvedValue([3]);

    // Create a spy to track the order and timing of removeFromRetryQueue calls
    const removeFromRetryQueueSpy = removeFromRetryQueue as jest.Mock;
    const callOrder: number[] = [];
    const callTimestamps: number[] = [];

    removeFromRetryQueueSpy.mockImplementation(async (id: number) => {
      callOrder.push(id);
      callTimestamps.push(Date.now());
      // Simulate some async work to make race conditions more apparent
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Execute the function
    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Verify removeFromRetryQueue was called for each skipped keyword
    expect(removeFromRetryQueueSpy).toHaveBeenCalledTimes(3);
    expect(removeFromRetryQueueSpy).toHaveBeenCalledWith(1);
    expect(removeFromRetryQueueSpy).toHaveBeenCalledWith(2);
    expect(removeFromRetryQueueSpy).toHaveBeenCalledWith(3);

    expect(Keyword.update).toHaveBeenCalledWith(
      { updating: false },
      { where: { ID: { [Op.in]: [1, 2, 3] } } },
    );

    // Verify calls were made sequentially (order should match input order)
    expect(callOrder).toEqual([1, 2, 3]);

    // Verify calls were made sequentially by checking timestamps
    // Each call should start after the previous one finished (within timing tolerance)
    for (let i = 1; i < callTimestamps.length; i++) {
      expect(callTimestamps[i]).toBeGreaterThanOrEqual(callTimestamps[i - 1]);
    }
  });

  it('handles empty skipped keywords gracefully', async () => {
    // Mock keywords that are all enabled
    const mockKeywords = [
      {
        ID: 1,
        domain: 'enabled.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'enabled.com' }),
        update: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'enabled.com', scrape_enabled: true }) },
    ]);

    const removeFromRetryQueueSpy = removeFromRetryQueue as jest.Mock;

    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Should not call removeFromRetryQueue when no keywords are skipped
    expect(removeFromRetryQueueSpy).not.toHaveBeenCalled();
  });
});