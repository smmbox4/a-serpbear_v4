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
});
