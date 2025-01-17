import React from 'react';

import { testId as loadingSpinnerTestId } from '../../../../common/components/loadingSpinner/LoadingSpinner';
import {
  fakeAuthContextValue,
  fakeAuthenticatedAuthContextValue,
} from '../../../../utils/mockAuthContextValue';
import {
  act,
  configure,
  render,
  screen,
  userEvent,
} from '../../../../utils/testUtils';
import translations from '../../../app/i18n/fi.json';
import { AuthContextProps } from '../../types';
import LogoutPage from '../LogoutPage';

configure({ defaultHidden: true });

const renderComponent = (authContextValue?: AuthContextProps) =>
  render(<LogoutPage />, { routes: ['/fi/events'], authContextValue });

const getElement = (key: 'buttonHome' | 'buttonSignIn' | 'text') => {
  switch (key) {
    case 'buttonHome':
      return screen.getByRole('button', { name: 'Takaisin etusivulle' });
    case 'buttonSignIn':
      return screen.getByRole('button', { name: 'Kirjaudu sisään' });
    case 'text':
      return screen.getByText(translations.logoutPage.text);
  }
};

test('should render logout page', () => {
  renderComponent();

  getElement('text');
  getElement('buttonSignIn');
  getElement('buttonHome');
});

test('should route to home page', async () => {
  const user = userEvent.setup();
  const { history } = renderComponent();

  await act(async () => await user.click(getElement('buttonHome')));

  expect(history.location.pathname).toBe('/fi/');
});

test('should start login process', async () => {
  const user = userEvent.setup();

  const signIn = jest.fn();
  const authContextValue = fakeAuthContextValue({ signIn });
  renderComponent(authContextValue);

  await act(async () => await user.click(getElement('buttonSignIn')));

  expect(signIn).toBeCalled();
});

test('should redirect to home page when user is authenticated', () => {
  const authContextValue = fakeAuthenticatedAuthContextValue();

  const { history } = renderComponent(authContextValue);

  expect(history.location.pathname).toBe('/fi/');
});

test('should render loading spinner when loading authenticion state', () => {
  const authContextValue = fakeAuthContextValue({ isLoading: true });

  renderComponent(authContextValue);

  expect(screen.getByTestId(loadingSpinnerTestId)).toBeInTheDocument();
});
