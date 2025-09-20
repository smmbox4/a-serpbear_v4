import { render, screen } from '@testing-library/react';
import TopBar from '../../components/common/TopBar';

jest.mock('next/router', () => ({
   useRouter: () => ({
      pathname: '/',
      asPath: '/',
   }),
}));

describe('TopBar Component', () => {
   it('renders without crashing', async () => {
       render(<TopBar showSettings={jest.fn} showAddModal={jest.fn} />);
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });

   it('aligns the back button with the topbar gutter helper', () => {
      const { container } = render(<TopBar showSettings={jest.fn} showAddModal={jest.fn} />);
      const backLink = container.querySelector('.topbar__back');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveClass('topbar__back');
   });
});
