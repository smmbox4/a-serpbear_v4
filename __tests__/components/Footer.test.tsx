import { render, screen } from '@testing-library/react';
import Footer from '../../components/common/Footer';
import { getBranding } from '../../utils/branding';

const { platformName } = getBranding();

const footerMatcher = (version: string) => (_: string, element?: Element | null) =>
   element?.tagName === 'SPAN' &&
   element.textContent?.replace(/\s+/g, ' ').trim() === `${platformName} v${version} by Vontainment`;

describe('Footer component', () => {
   it('renders the default version with a Vontainment link', () => {
      render(<Footer currentVersion='' />);
      expect(screen.getByText(footerMatcher('3.0.0'))).toBeVisible();
      const link = screen.getByRole('link', { name: 'Vontainment' });
      expect(link).toHaveAttribute('href', 'https://vontainment.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
   });

   it('renders a provided version number', () => {
      render(<Footer currentVersion='9.9.9' />);
      expect(screen.getByText(footerMatcher('9.9.9'))).toBeVisible();
   });
});
