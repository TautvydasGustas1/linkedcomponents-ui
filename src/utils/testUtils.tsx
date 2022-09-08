/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { AnyAction, getDefaultMiddleware, Store } from '@reduxjs/toolkit';
import {
  act,
  createEvent,
  fireEvent,
  render,
  RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { createMemoryHistory, History } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import {
  Route,
  Routes,
  unstable_HistoryRouter as Router,
} from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import wait from 'waait';

import { testId } from '../common/components/loadingSpinner/LoadingSpinner';
import { defaultStoreState } from '../constants';
import { createCache } from '../domain/app/apollo/apolloClient';
import { store as reduxStore } from '../domain/app/store/store';
import { ThemeProvider } from '../domain/app/theme/Theme';
import { AuthContext } from '../domain/auth/AuthContext';
import { AuthContextProps } from '../domain/auth/types';
import { StoreState } from '../types';
import { authContextDefaultValue } from '../utils/mockAuthContextValue';

export type CustomRenderOptions = {
  authContextValue?: AuthContextProps;
  history?: History;
  mocks?: MockedResponse[];
  path?: string;
  routes?: string[];
  store?: Store<StoreState, AnyAction>;
};

type CustomRender = {
  (ui: React.ReactElement, options?: CustomRenderOptions): CustomRenderResult;
};

type CustomRenderResult = RenderResult & { history: History };

const arrowUpKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 38, key: 'ArrowUp' });

const arrowDownKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 40, key: 'ArrowDown' });

const arrowLeftKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 38, key: 'ArrowLeft' });

const arrowRightKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 38, key: 'ArrowRight' });

const enterKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 13, key: 'Enter' });

const escKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 27, key: 'Escape' });

const tabKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 9, key: 'Tab' });

const customRender: CustomRender = (
  ui,
  {
    authContextValue = authContextDefaultValue,
    mocks,
    routes = ['/'],
    history = createMemoryHistory({ initialEntries: routes }),
    store = reduxStore,
  } = {}
) => {
  const Wrapper: React.FC<React.PropsWithChildren<unknown>> = ({
    children,
  }) => (
    <AuthContext.Provider value={authContextValue}>
      <Provider store={store}>
        <ThemeProvider>
          <MockedProvider cache={createCache()} mocks={mocks}>
            <Router history={history}>{children}</Router>
          </MockedProvider>
        </ThemeProvider>
      </Provider>
    </AuthContext.Provider>
  );

  const renderResult = render(ui, { wrapper: Wrapper });
  return { ...renderResult, history };
};

const actWait = (amount?: number): Promise<void> => act(() => wait(amount));

const mockString = (size: number): string =>
  [...Array(size)].map(() => Math.random().toString(36)[2]).join('');

type MockFileArgs = {
  name?: string;
  size?: number;
  type?: string;
};

const mockFile = ({
  name = 'testfile.png',
  size = 0,
  type = 'image/png',
}: MockFileArgs): File => {
  const content = mockString(size);

  return new File([content], name, {
    type,
  });
};

const renderWithRoute: CustomRender = (
  ui,
  {
    authContextValue = authContextDefaultValue,
    mocks = [],
    path = '/',
    routes = ['/'],
    history = createMemoryHistory({ initialEntries: routes }),
    store = reduxStore,
  } = {}
) => {
  const Wrapper: React.FC<React.PropsWithChildren<unknown>> = ({
    children,
  }) => (
    <AuthContext.Provider value={authContextValue}>
      <Provider store={store}>
        <ThemeProvider>
          <MockedProvider cache={createCache()} mocks={mocks}>
            <Router history={history}>
              <Routes>
                <Route path={path} element={children} />
              </Routes>
            </Router>
          </MockedProvider>
        </ThemeProvider>
      </Provider>
    </AuthContext.Provider>
  );

  const renderResult = render(ui, { wrapper: Wrapper });
  return { ...renderResult, history };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const getMockReduxStore = (initialState: StoreState = defaultStoreState) => {
  const middlewares = getDefaultMiddleware({
    serializableCheck: false,
  });

  return configureMockStore<StoreState>(middlewares)(initialState);
};

type PasteEvent = {
  clipboardData: {
    types: string[];
    getData: (type: string) => string;
  };
};

const createPasteEvent = (html: string): PasteEvent => {
  const text = html.replace('<[^>]*>', '');
  return {
    clipboardData: {
      types: ['text/plain', 'text/html'],
      getData: (type) => (type === 'text/plain' ? text : html),
    },
  };
};

const pasteToTextEditor = (
  editor: Element | Node | Document | Window,
  text: string
): void => {
  const eventProperties = createPasteEvent(text);
  const pasteEvent = createEvent.paste(editor, eventProperties);
  fireEvent(editor, pasteEvent);
};

const loadingSpinnerIsNotInDocument = async (timeout = 5000): Promise<void> =>
  waitFor(
    () => {
      expect(screen.queryAllByTestId(testId)).toHaveLength(0);
    },
    { timeout }
  );

export {
  actWait,
  arrowDownKeyPressHelper,
  arrowLeftKeyPressHelper,
  arrowRightKeyPressHelper,
  arrowUpKeyPressHelper,
  createPasteEvent,
  enterKeyPressHelper,
  escKeyPressHelper,
  getMockReduxStore,
  loadingSpinnerIsNotInDocument,
  mockFile,
  mockString,
  pasteToTextEditor,
  customRender as render,
  renderWithRoute,
  tabKeyPressHelper,
};

// re-export everything
export * from '@testing-library/react';
export { render as defaultRender } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
