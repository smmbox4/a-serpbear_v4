import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import NotificationSettings from '../../../components/settings/NotificationSettings';
import { useSendNotifications } from '../../../services/settings';

jest.mock('../../../services/settings');

const useSendNotificationsMock = useSendNotifications as jest.Mock;

const buildSettings = (overrides: Partial<SettingsType> = {}): SettingsType => ({
   scraper_type: 'none',
   notification_interval: 'daily',
   notification_email: 'notify@example.com',
   notification_email_from: 'no-reply@example.com',
   notification_email_from_name: 'SerpBear',
   smtp_server: 'smtp.example.com',
   smtp_port: '587',
   smtp_tls_servername: '',
   smtp_username: 'smtp-user',
   smtp_password: 'smtp-pass',
   search_console: true,
   search_console_client_email: '',
   search_console_private_key: '',
   keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
   ...overrides,
});

describe('NotificationSettings manual trigger', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   it('calls the send notifications mutation when the button is clicked', () => {
      const mutate = jest.fn();
      useSendNotificationsMock.mockReturnValue({ mutate, isLoading: false });

      render(
         <NotificationSettings
            settings={buildSettings()}
            settingsError={null}
            updateSettings={jest.fn()}
         />,
      );

      const triggerButton = screen.getByRole('button', { name: /send notifications now/i });
      expect(triggerButton).toBeEnabled();

      fireEvent.click(triggerButton);

      expect(mutate).toHaveBeenCalledTimes(1);
   });

   it('disables the button while notifications are being sent', () => {
      const mutate = jest.fn();
      useSendNotificationsMock.mockReturnValue({ mutate, isLoading: true });

      render(
         <NotificationSettings
            settings={buildSettings()}
            settingsError={null}
            updateSettings={jest.fn()}
         />,
      );

      const triggerButton = screen.getByRole('button', { name: /send notifications now/i });

      expect(triggerButton).toBeDisabled();
   });
});
