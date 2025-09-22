import { fireEvent, render, screen } from '@testing-library/react';
import DomainItem from '../../components/domains/DomainItem';
import { dummyDomain } from '../../__mocks__/data';

const toggleMutationMock = jest.fn();
const updateThumbMock = jest.fn();

jest.mock('../../services/domains', () => ({
   useUpdateDomainToggles: jest.fn(() => ({
      mutateAsync: toggleMutationMock,
      isLoading: false,
   })),
}));

jest.mock('react-hot-toast', () => ({
   __esModule: true,
   default: jest.fn(),
}));

const defaultProps = {
   domain: dummyDomain,
   selected: false,
   isConsoleIntegrated: false,
   thumb: '',
   updateThumb: updateThumbMock,
   screenshotsEnabled: true,
};

describe('DomainItem Component', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('renders without crashing', async () => {
      const { container } = render(<DomainItem {...defaultProps} />);
      expect(container.querySelector('.domItem')).toBeInTheDocument();
   });

   it('renders keywords and average position stats', async () => {
      const { container } = render(<DomainItem {...defaultProps} />);
      const domStatsKeywords = container.querySelector('.dom_stats div:nth-child(1)');
      const domStatsAvg = container.querySelector('.dom_stats div:nth-child(2)');
      expect(domStatsKeywords?.textContent).toBe('Keywords10');
      expect(domStatsAvg?.textContent).toBe('Avg position24');
   });

   it('updates domain thumbnail when reload button is clicked', async () => {
      const { container } = render(<DomainItem {...defaultProps} />);
      const reloadThumbBtn = container.querySelector('.domain_thumb button');
      expect(reloadThumbBtn).toBeInTheDocument();
      if (reloadThumbBtn) {
         fireEvent.click(reloadThumbBtn);
      }
      expect(updateThumbMock).toHaveBeenCalledWith(dummyDomain.domain);
   });

   it('hides screenshot reload button when screenshots are disabled', () => {
      const { container } = render(<DomainItem {...defaultProps} screenshotsEnabled={false} />);
      expect(container.querySelector('.domain_thumb button')).not.toBeInTheDocument();
   });

   it('optimistically toggles tracking state', async () => {
      toggleMutationMock.mockResolvedValueOnce(undefined);
      render(<DomainItem {...defaultProps} />);

      const toggle = screen.getByLabelText('Track keyword positions');
      fireEvent.click(toggle);

      expect(toggleMutationMock).toHaveBeenCalledWith({
         domain: dummyDomain,
         domainSettings: { scrape_enabled: false },
      });
   });

   it('optimistically toggles notifications state', async () => {
      toggleMutationMock.mockResolvedValueOnce(undefined);
      render(<DomainItem {...defaultProps} />);

      const toggle = screen.getByLabelText('Send notification emails');
      fireEvent.click(toggle);

      expect(toggleMutationMock).toHaveBeenCalledWith({
         domain: dummyDomain,
         domainSettings: { notify_enabled: false },
      });
   });
});
