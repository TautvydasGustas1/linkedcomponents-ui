import { MockedProvider, MockedResponse } from '@apollo/react-testing';
import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import { createMemoryHistory, History } from 'history';
import React from 'react';
import { Route, Router } from 'react-router-dom';
import wait from 'waait';

import { ThemeProvider } from '../domain/app/theme/Theme';

type CustomRender = {
  (
    ui: React.ReactElement,
    options?: {
      history?: History;
      mocks?: MockedResponse[];
      path?: string;
      routes?: string[];
    }
  ): CustomRenderResult;
};

type CustomRenderResult = RenderResult & { history: History };

export const arrowUpKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 38, key: 'ArrowUp' });

export const arrowDownKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 40, key: 'ArrowDown' });

export const enterKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 13, key: 'Enter' });

export const escKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 27, key: 'Escape' });

export const tabKeyPressHelper = (el?: HTMLElement): boolean =>
  fireEvent.keyDown(el || document, { code: 9, key: 'Tab' });

const customRender: CustomRender = (
  ui,
  {
    mocks,
    routes = ['/'],
    history = createMemoryHistory({ initialEntries: routes }),
  } = {}
) => {
  const Wrapper: React.FC = ({ children }) => (
    <ThemeProvider>
      <MockedProvider mocks={mocks}>
        <Router history={history}>{children}</Router>
      </MockedProvider>
    </ThemeProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper });
  return { ...renderResult, history };
};

const actWait = (amount?: number): Promise<void> => act(() => wait(amount));

const renderWithRoute: CustomRender = (
  ui,
  {
    mocks = [],
    path = '/',
    routes = ['/'],
    history = createMemoryHistory({ initialEntries: routes }),
  } = {}
) => {
  const Wrapper: React.FC = ({ children }) => (
    <ThemeProvider>
      <MockedProvider mocks={mocks}>
        <Router history={history}>
          <Route exact path={path}>
            {children}
          </Route>
        </Router>
      </MockedProvider>
    </ThemeProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper });
  return { ...renderResult, history };
};

export { actWait, customRender as render, renderWithRoute };

// re-export everything
export * from '@testing-library/react';
export { render as defaultRender } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
