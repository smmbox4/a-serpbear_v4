import { Op } from 'sequelize';
import { readFile, writeFile } from 'fs/promises';
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

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

describe('refreshAndUpdateKeywords', () => {
  const mockSettings = {
    scraper_type: 'serpapi',
    scrape_retry: true,
  } as SettingsType;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses batched retry queue removal for improved performance', async () => {
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

    // Mock readFile to return a queue with some existing items and the skipped IDs
    const mockQueue = JSON.stringify([1, 2, 3, 4, 5]); // IDs 1,2,3 should be removed
    (readFile as jest.Mock).mockResolvedValue(mockQueue);
    (writeFile as jest.Mock).mockResolvedValue(undefined);

    // Execute the function
    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Verify Op.in was used correctly
    expect(Keyword.update).toHaveBeenCalledWith(
      { updating: false },
      { where: { ID: { [Op.in]: [1, 2, 3] } } },
    );

    // Verify batched file operations
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith(
      `${process.cwd()}/data/failed_queue.json`,
      { encoding: 'utf-8' }
    );

    // Verify writeFile was called with filtered queue (removing IDs 1, 2, 3)
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(
      `${process.cwd()}/data/failed_queue.json`,
      JSON.stringify([4, 5]), // Only IDs 4 and 5 should remain
      { encoding: 'utf-8' }
    );

    // Verify removeFromRetryQueue was NOT called (since we use batched operations now)
    expect(removeFromRetryQueue).not.toHaveBeenCalled();
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

    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Should not perform file operations when no keywords are skipped
    expect(readFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(removeFromRetryQueue).not.toHaveBeenCalled();
  });

  it('handles missing retry queue file gracefully', async () => {
    const mockKeywords = [
      {
        ID: 1,
        domain: 'disabled.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'disabled.com' }),
        update: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled.com', scrape_enabled: false }) },
    ]);

    (Keyword.update as jest.Mock).mockResolvedValue([1]);

    // Mock readFile to reject with ENOENT error (file not found)
    (readFile as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Should handle missing file gracefully without logging error
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(writeFile).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[ERROR] Failed to update retry queue:'));

    consoleSpy.mockRestore();
  });

  it('handles other file errors appropriately', async () => {
    const mockKeywords = [
      {
        ID: 1,
        domain: 'disabled.com',
        get: jest.fn().mockReturnValue({ ID: 1, domain: 'disabled.com' }),
        update: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled.com', scrape_enabled: false }) },
    ]);

    (Keyword.update as jest.Mock).mockResolvedValue([1]);

    // Mock readFile to reject with permission error
    const permissionError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    (readFile as jest.Mock).mockRejectedValue(permissionError);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Should log non-ENOENT errors
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(writeFile).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Failed to update retry queue:', permissionError);

    consoleSpy.mockRestore();
  });

  it('skips writeFile when queue is unchanged', async () => {
    const mockKeywords = [
      {
        ID: 99,
        domain: 'disabled.com',
        get: jest.fn().mockReturnValue({ ID: 99, domain: 'disabled.com' }),
        update: jest.fn(),
      },
    ];

    (Domain.findAll as jest.Mock).mockResolvedValue([
      { get: () => ({ domain: 'disabled.com', scrape_enabled: false }) },
    ]);

    (Keyword.update as jest.Mock).mockResolvedValue([1]);

    // Mock readFile to return a queue without the skipped ID (no changes needed)
    const mockQueue = JSON.stringify([1, 2, 3]); // ID 99 is not in the queue
    (readFile as jest.Mock).mockResolvedValue(mockQueue);
    (writeFile as jest.Mock).mockResolvedValue(undefined);

    await refreshAndUpdateKeywords(mockKeywords, mockSettings);

    // Should read but not write when no changes are needed
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(writeFile).not.toHaveBeenCalled();
  });
});