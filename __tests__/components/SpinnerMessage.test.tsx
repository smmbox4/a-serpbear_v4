import { render, screen } from '@testing-library/react';
import SpinnerMessage from '../../components/common/SpinnerMessage';

describe('SpinnerMessage', () => {
   it('renders a spinner with an accessible label', () => {
      render(<SpinnerMessage label='Loading keywords' />);

      const status = screen.getByRole('status', { name: 'Loading keywords' });
      expect(status).toBeInTheDocument();
      expect(status.querySelector('svg')).not.toBeNull();
   });

   it('renders with default label when none provided', () => {
      render(<SpinnerMessage />);

      const status = screen.getByRole('status', { name: 'Loading data' });
      expect(status).toBeInTheDocument();
   });

   it('applies custom className', () => {
      render(<SpinnerMessage className='custom-class' />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('custom-class');
   });

   it('does not have redundant sr-only text for accessibility', () => {
      render(<SpinnerMessage label='Test loading' />);

      const status = screen.getByRole('status', { name: 'Test loading' });
      const srOnlySpan = status.querySelector('.sr-only');
      expect(srOnlySpan).toBeNull();
   });
});
