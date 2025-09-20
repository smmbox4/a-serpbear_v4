import { writeFile, readFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import handler from '../../pages/api/settings';
import * as settingsApi from '../../pages/api/settings';
import verifyUser from '../../utils/verifyUser';

jest.mock('../../utils/verifyUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../scrapers/index', () => ({
  __esModule: true,
  default: [],
}));

jest.mock('next/config', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const encryptMock = jest.fn((value: string) => value);
const readFileMock = readFile as unknown as jest.Mock;
const verifyUserMock = verifyUser as unknown as jest.Mock;
const writeFileMock = writeFile as unknown as jest.Mock;
const getConfigMock = getConfig as unknown as jest.Mock;
const originalEnv = process.env;

jest.mock('cryptr', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    encrypt: encryptMock,
  })),
}));

describe('PUT /api/settings validation and errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConfigMock.mockReset();
    getConfigMock.mockReturnValue({ publicRuntimeConfig: { version: '1.0.0' } });
    process.env = { ...originalEnv, SECRET: 'secret' };
    verifyUserMock.mockReturnValue('authorized');
    encryptMock.mockClear();
    readFileMock.mockReset();
    writeFileMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 when settings payload is missing', async () => {
    const req = {
      method: 'PUT',
      body: {},
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(verifyUserMock).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Settings payload is required.' });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('returns 500 when persisting encrypted settings fails', async () => {
    writeFileMock.mockRejectedValue(new Error('disk full'));

    const req = {
      method: 'PUT',
      body: { settings: { scaping_api: 'value', smtp_password: 'password' } },
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(writeFileMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update settings.', details: 'disk full' });
  });
});

describe('GET /api/settings and configuration requirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConfigMock.mockReset();
    getConfigMock.mockReturnValue({ publicRuntimeConfig: { version: '1.0.0' } });
    process.env = { ...originalEnv, SECRET: 'secret' };
    verifyUserMock.mockReturnValue('authorized');
    encryptMock.mockClear();
    readFileMock.mockReset();
    writeFileMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns settings when loading settings succeeds', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({})).mockResolvedValueOnce(JSON.stringify([]));

    const req = {
      method: 'GET',
      headers: {},
      query: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(verifyUserMock).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        version: '1.0.0',
      }),
    });
  });

  it('returns settings when runtime config is missing', async () => {
    getConfigMock.mockReturnValue(undefined);
    readFileMock.mockResolvedValueOnce(JSON.stringify({})).mockResolvedValueOnce(JSON.stringify([]));

    const req = {
      method: 'GET',
      headers: {},
      query: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(getConfigMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        version: undefined,
      }),
    });
  });

  it('returns settings successfully', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({})).mockResolvedValueOnce(JSON.stringify([]));

    const settings = await settingsApi.getAppSettings();

    expect(settings).toEqual(expect.objectContaining({
      scraper_type: expect.any(String),
      available_scapers: expect.any(Array),
    }));
  });

  it('returns defaults when files are missing', async () => {
    readFileMock.mockRejectedValueOnce(new Error('missing settings')).mockRejectedValueOnce(new Error('missing failed queue'));
    writeFileMock.mockResolvedValue(undefined);

    const settings = await settingsApi.getAppSettings();

    expect(settings).toEqual(expect.objectContaining({
      scraper_type: 'none',
      available_scapers: expect.any(Array),
    }));
    expect(writeFileMock).toHaveBeenCalled();
  });
});
