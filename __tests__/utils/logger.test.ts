describe('logger authEvent success logging toggle', () => {
  const originalEnv = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('logs successful auth events when the toggle is enabled', async () => {
    process.env = { ...originalEnv, LOG_SUCCESS_EVENTS: 'true' };
    jest.resetModules();

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('../../utils/logger');

    logger.authEvent('token_verification_success', 'unit-test', true);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('suppresses successful auth events while still logging failures when the toggle is disabled', async () => {
    process.env = { ...originalEnv, LOG_SUCCESS_EVENTS: 'false' };
    jest.resetModules();

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('../../utils/logger');

    logger.authEvent('token_verification_success', 'unit-test', true);
    expect(consoleSpy).not.toHaveBeenCalled();

    logger.authEvent('token_verification_failed', 'unit-test', false);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
