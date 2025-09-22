import { act, render, waitFor } from '@testing-library/react';
import AdWordsSettings from '../../components/settings/AdWordsSettings';

const toastMock = jest.fn();

jest.mock('react-hot-toast', () => ({
   __esModule: true,
   default: (...args: unknown[]) => toastMock(...args),
}));

const mutateMock = jest.fn();

jest.mock('../../services/adwords', () => ({
   useTestAdwordsIntegration: jest.fn(() => ({ mutate: mutateMock, isLoading: false })),
   useMutateKeywordsVolume: jest.fn(() => ({ mutate: mutateMock, isLoading: false })),
}));

describe('AdWordsSettings postMessage integration', () => {
   const baseSettings = {
      adwords_client_id: 'client',
      adwords_client_secret: 'secret',
      adwords_developer_token: 'dev',
      adwords_account_id: '123-456-7890',
      adwords_refresh_token: 'token',
      keywordsColumns: [],
   } as any;

   const noop = () => undefined;

   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('handles successful integration messages', async () => {
      const performUpdate = jest.fn().mockResolvedValue(undefined);
      render(
         <AdWordsSettings
            settings={baseSettings}
            settingsError={null}
            updateSettings={noop}
            performUpdate={performUpdate}
            closeSettings={noop}
         />,
      );

      await act(async () => {
         window.dispatchEvent(new MessageEvent('message', {
            origin: window.location.origin,
            data: { type: 'adwordsIntegrated', status: 'success' },
         }));
      });

      await waitFor(() => {
         expect(performUpdate).toHaveBeenCalled();
      });
      expect(toastMock).toHaveBeenCalledWith('Google Ads has been integrated successfully!', { icon: '✔️' });
   });

   it('shows the upstream error message when integration fails', async () => {
      render(
         <AdWordsSettings
            settings={baseSettings}
            settingsError={null}
            updateSettings={noop}
            performUpdate={noop}
            closeSettings={noop}
         />,
      );

      const detail = 'Custom integration error';
      await act(async () => {
         window.dispatchEvent(new MessageEvent('message', {
            origin: window.location.origin,
            data: { type: 'adwordsIntegrated', status: 'error', message: detail },
         }));
      });

      expect(toastMock).toHaveBeenCalledWith(detail, { icon: '⚠️' });
   });
});
