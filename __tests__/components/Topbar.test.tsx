import fs from 'fs';
import path from 'path';
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

   it('applies the mobile edge-to-edge helper via global CSS', () => {
      const globalsPath = path.join(process.cwd(), 'styles', 'globals.css');
      const css = fs.readFileSync(globalsPath, 'utf8');

      const mobileTopbarRule = new RegExp(
         '@media \\(max-width: 760px\\)\\s*{\\s*\\.topbar {[^}]*margin-inline: '
         + 'calc\\(-1 \\* var\\(--layout-inline\\)\\);[^}]*padding-inline: var\\(--layout-inline\\);',
      );
      const mobileBodyOverride = /@media \(max-width: 760px\)\s*{\s*body\s*{/;

      expect(css).toMatch(mobileTopbarRule);
      expect(css).not.toMatch(mobileBodyOverride);
   });
});
