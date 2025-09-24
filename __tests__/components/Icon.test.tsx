import { render } from '@testing-library/react';
import Icon from '../../components/common/Icon';

describe('Icon Component', () => {
   it('renders without crashing', async () => {
       render(<Icon type='logo' size={24} />);
       expect(document.querySelector('svg')).toBeInTheDocument();
   });

   it('returns null when icon type is unknown', async () => {
       render(<Icon type='unknown-icon' size={24} />);
       expect(document.querySelector('svg')).not.toBeInTheDocument();
   });
});
