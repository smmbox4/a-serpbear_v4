import { render, screen } from '@testing-library/react';
import SpinnerMessage from '../../components/common/SpinnerMessage';

describe('SpinnerMessage', () => {
   it('renders a spinner with an accessible label', () => {
      render(<SpinnerMessage label='Loading keywords' />);

      const status = screen.getByRole('status', { name: 'Loading keywords' });
      expect(status).toBeInTheDocument();
      expect(status.querySelector('svg')).not.toBeNull();
   });
});
