import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import KeywordIdeasTable from '../../components/ideas/KeywordIdeasTable';
import { useFetchKeywords } from '../../services/keywords';

jest.mock('next/router', () => ({
   useRouter: () => ({
      pathname: '/domain/ideas/example-domain',
      push: jest.fn(),
      query: { slug: 'example-domain' },
   }),
}));

jest.mock('../../hooks/useIsMobile', () => jest.fn(() => [false]));
jest.mock('../../hooks/useWindowResize', () => jest.fn());

jest.mock('../../services/keywords', () => ({
   useAddKeywords: () => ({ mutate: jest.fn() }),
   useFetchKeywords: jest.fn(),
}));

jest.mock('../../services/adwords', () => ({
   useMutateFavKeywordIdeas: () => ({ mutate: jest.fn(), isLoading: false }),
}));

jest.mock('../../services/domains', () => ({
   fetchDomains: jest.fn().mockResolvedValue({ domains: [] }),
}));

const useFetchKeywordsMock = useFetchKeywords as jest.MockedFunction<typeof useFetchKeywords>;

describe('KeywordIdeasTable DRY Principle Implementation', () => {
   let queryClient: QueryClient;

   const mockDomain: DomainType = {
      ID: 1,
      domain: 'example.com',
      slug: 'example-com',
      notification: true,
      notification_interval: 'daily',
      notification_emails: '',
      lastUpdated: '2024-01-01T00:00:00.000Z',
      added: '2024-01-01T00:00:00.000Z',
   };

   const mockIdeaKeywords: IdeaKeyword[] = [
      {
         uid: 'tracked-keyword-id',
         keyword: 'tracked keyword',
         competition: 'MEDIUM',
         country: 'US',
         domain: 'example.com',
         competitionIndex: 50,
         monthlySearchVolumes: { '2024-01': '1000' },
         avgMonthlySearches: 1000,
         added: Date.now(),
         updated: Date.now(),
         position: 0,
      },
      {
         uid: 'new-keyword-id',
         keyword: 'new keyword',
         competition: 'LOW',
         country: 'US',
         domain: 'example.com',
         competitionIndex: 25,
         monthlySearchVolumes: { '2024-01': '500' },
         avgMonthlySearches: 500,
         added: Date.now(),
         updated: Date.now(),
         position: 0,
      },
   ];

   const mockTrackedKeywords: KeywordType[] = [
      {
         ID: 1,
         keyword: 'tracked keyword',
         device: 'desktop',
         country: 'US',
         domain: 'example.com',
         lastUpdated: '2024-01-01T00:00:00.000Z',
         added: '2024-01-01T00:00:00.000Z',
         position: 5,
         volume: 1000,
         sticky: false,
         history: {},
         lastResult: [],
         url: 'https://example.com',
         tags: [],
         updating: false,
         lastUpdateError: false,
      },
   ];

   beforeEach(() => {
      queryClient = new QueryClient({
         defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
         },
      });

      useFetchKeywordsMock.mockReturnValue({
         keywordsData: { keywords: mockTrackedKeywords },
         keywordsLoading: false,
      } as any);
   });

   afterEach(() => {
      queryClient.clear();
      jest.clearAllMocks();
   });

   it('should implement DRY principle by computing isTracked once in finalKeywords', () => {
      render(
         <QueryClientProvider client={queryClient}>
            <KeywordIdeasTable
               domain={mockDomain}
               keywords={mockIdeaKeywords}
               favorites={[]}
               isLoading={false}
               noIdeasDatabase={false}
               isAdwordsIntegrated={true}
               showFavorites={false}
               setShowFavorites={jest.fn()}
            />
         </QueryClientProvider>,
      );

      // Check that tracked keyword is rendered with disabled button
      const trackedKeywordButton = screen.getByLabelText(/keyword already tracked/i);
      expect(trackedKeywordButton).toBeDisabled();
      expect(trackedKeywordButton).toHaveAttribute('aria-disabled', 'true');

      // Check that new keyword is rendered with enabled button
      const newKeywordButton = screen.getByLabelText(/select keyword idea/i);
      expect(newKeywordButton).toBeEnabled();
      expect(newKeywordButton).not.toHaveAttribute('aria-disabled', 'true');
   });

   it('should prevent selection of tracked keywords', () => {
      render(
         <QueryClientProvider client={queryClient}>
            <KeywordIdeasTable
               domain={mockDomain}
               keywords={mockIdeaKeywords}
               favorites={[]}
               isLoading={false}
               noIdeasDatabase={false}
               isAdwordsIntegrated={true}
               showFavorites={false}
               setShowFavorites={jest.fn()}
            />
         </QueryClientProvider>,
      );

      // Try to click the tracked keyword button
      const trackedKeywordButton = screen.getByLabelText(/keyword already tracked/i);
      fireEvent.click(trackedKeywordButton);

      // Should not show the "Add Keywords to Tracker" section
      expect(screen.queryByText('Add Keywords to Tracker')).not.toBeInTheDocument();

      // Click the new keyword button
      const newKeywordButton = screen.getByLabelText(/select keyword idea/i);
      fireEvent.click(newKeywordButton);

      // Should show the "Add Keywords to Tracker" section
      expect(screen.getByText('Add Keywords to Tracker')).toBeInTheDocument();
   });
});