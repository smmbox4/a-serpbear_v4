import { render } from '@testing-library/react';

const ORIGINAL_ENV = { ...process.env };

describe('Branding components', () => {
   afterEach(() => {
      process.env = { ...ORIGINAL_ENV };
      jest.resetModules();
   });

   it('falls back to the default icon when white-label is disabled', async () => {
      jest.resetModules();
      process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_WHITE_LABEL: 'false', NEXT_PUBLIC_PLATFORM_NAME: '' };
      const brandingModule = await import('../../components/common/Branding');
      const { BrandTitle } = brandingModule;
      const { container } = render(<BrandTitle />);
      expect(container.querySelector('svg')).toBeInTheDocument();
   });

   it('renders the custom logo and platform name when white-label is enabled', async () => {
      jest.resetModules();
      process.env = {
         ...ORIGINAL_ENV,
         NEXT_PUBLIC_WHITE_LABEL: 'true',
         NEXT_PUBLIC_PLATFORM_NAME: 'Acme Rankings',
         WHITE_LABEL_LOGO_FILE: 'brand.svg',
      };
      const brandingModule = await import('../../components/common/Branding');
      const { BrandTitle } = brandingModule;
      const { getByAltText } = render(<BrandTitle />);
      const logo = getByAltText('Acme Rankings logo') as HTMLImageElement;
      expect(logo).toBeInTheDocument();
      expect(logo.src).toContain('/api/branding/logo');
   });
});
