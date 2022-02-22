import { createMemoryHistory } from 'history';

import { ROUTES } from '../../../constants';
import { fakeAuthenticatedStoreState } from '../../../utils/mockStoreUtils';
import {
  act,
  CustomRenderOptions,
  getMockReduxStore,
  loadingSpinnerIsNotInDocument,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../utils/testUtils';
import { mockedUserResponse } from '../../user/__mocks__/user';
import {
  keywordSetNames,
  keywordSets,
  mockedKeywordSetsResponse,
} from '../__mocks__/keywordSetsPage';
import KeywordSetsPage from '../KeywordSetsPage';

const storeState = fakeAuthenticatedStoreState();
const defaultStore = getMockReduxStore(storeState);

const defaultMocks = [mockedKeywordSetsResponse, mockedUserResponse];
const route = ROUTES.KEYWORD_SETS;

const renderComponent = ({
  mocks = defaultMocks,
  routes = [route],
  store = defaultStore,
  ...restRenderOptions
}: CustomRenderOptions = {}) =>
  render(<KeywordSetsPage />, { mocks, routes, store, ...restRenderOptions });

const findElement = (key: 'title') => {
  switch (key) {
    case 'title':
      return screen.findByRole('heading', { name: 'Avainsanaryhmät' });
  }
};

const getElement = (
  key:
    | 'breadcrumb'
    | 'createKeywordSetButton'
    | 'searchInput'
    | 'sortNameButton'
    | 'table'
) => {
  switch (key) {
    case 'breadcrumb':
      return screen.getByRole('navigation', { name: 'Murupolku' });
    case 'createKeywordSetButton':
      return screen.getByRole('button', { name: 'Lisää avainsanaryhmä' });
    case 'searchInput':
      return screen.getByRole('searchbox', { name: 'Hae avainsanaryhmiä' });
    case 'sortNameButton':
      return screen.getByRole('button', { name: /nimi/i });
    case 'table':
      return screen.getByRole('table', {
        name: 'Avainsanaryhmät, järjestys Id, nouseva',
      });
  }
};

test('should render keyword sets page', async () => {
  renderComponent();

  await findElement('title');
  await loadingSpinnerIsNotInDocument();
  getElement('breadcrumb');
  getElement('createKeywordSetButton');
  getElement('searchInput');
  getElement('table');
  screen.getByRole('button', { name: keywordSetNames[0] });
});

test('should open create keyword set page', async () => {
  const { history } = renderComponent();

  await findElement('title');
  await loadingSpinnerIsNotInDocument();

  const createKeywordSetButton = getElement('createKeywordSetButton');
  userEvent.click(createKeywordSetButton);

  expect(history.location.pathname).toBe('/fi/admin/keyword-sets/create');
});

test('should add sort parameter to search query', async () => {
  const { history } = renderComponent();

  await loadingSpinnerIsNotInDocument();

  const sortNameButton = getElement('sortNameButton');
  act(() => userEvent.click(sortNameButton));

  expect(history.location.search).toBe('?sort=name');
});

it('scrolls to keyword row and calls history.replace correctly (deletes keywordSetId from state)', async () => {
  const history = createMemoryHistory();
  const historyObject = {
    state: { keywordSetId: keywordSets.data[0].id },
    pathname: route,
  };
  history.push(historyObject);

  const replaceSpy = jest.spyOn(history, 'replace');

  renderComponent({ history });

  await loadingSpinnerIsNotInDocument();
  const keywordSetButton = screen.getByRole('button', {
    name: keywordSetNames[0],
  });

  expect(replaceSpy).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: historyObject.pathname })
  );

  await waitFor(() => expect(keywordSetButton).toHaveFocus());
});