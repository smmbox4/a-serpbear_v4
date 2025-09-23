import { render, screen } from '@testing-library/react';
import PageLoader from '../../components/common/PageLoader';

describe('PageLoader', () => {
   it('renders an overlay while loading', () => {
      render(
         <PageLoader isLoading label='Loading test'>
            <div>Child content</div>
         </PageLoader>,
      );

      const overlay = screen.getByTestId('page-loader-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed');
      expect(screen.getByText('Child content')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Loading test' })).toBeInTheDocument();
   });

   it('hides the overlay when loading finishes', () => {
      const { container } = render(
         <PageLoader isLoading={false}>
            <div>Loaded content</div>
         </PageLoader>,
      );

      expect(screen.queryByTestId('page-loader-overlay')).not.toBeInTheDocument();
      expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
   });

   it('uses default label when none provided', () => {
      render(
         <PageLoader isLoading>
            <div>Content</div>
         </PageLoader>,
      );

      expect(screen.getByRole('status', { name: 'Loading content' })).toBeInTheDocument();
   });

   it('does not have redundant sr-only text for accessibility', () => {
      render(
         <PageLoader isLoading label='Test loading'>
            <div>Content</div>
         </PageLoader>,
      );

      const status = screen.getByRole('status', { name: 'Test loading' });
      const srOnlySpan = status.querySelector('.sr-only');
      expect(srOnlySpan).toBeNull();
   });
});