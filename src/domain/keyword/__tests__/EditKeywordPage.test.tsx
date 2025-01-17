import { MockedResponse } from '@apollo/client/testing';
import React from 'react';

import { ROUTES } from '../../../constants';
import { fakeAuthenticatedAuthContextValue } from '../../../utils/mockAuthContextValue';
import {
  act,
  configure,
  renderWithRoute,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../utils/testUtils';
import { mockedUserResponse } from '../../user/__mocks__/user';
import {
  keyword,
  mockedDeleteKeywordResponse,
  mockedInvalidUpdateKeywordResponse,
  mockedKeywordResponse,
  mockedUpdateKeywordResponse,
} from '../__mocks__/editKeywordPage';
import EditKeywordPage from '../EditKeywordPage';

configure({ defaultHidden: true });

const authContextValue = fakeAuthenticatedAuthContextValue();

const defaultMocks = [mockedKeywordResponse, mockedUserResponse];

const route = ROUTES.EDIT_KEYWORD.replace(':id', keyword.id as string);

const renderComponent = (mocks: MockedResponse[] = defaultMocks) =>
  renderWithRoute(<EditKeywordPage />, {
    authContextValue,
    mocks,
    routes: [route],
    path: ROUTES.EDIT_KEYWORD,
  });

const findElement = (key: 'deleteButton' | 'nameInput') => {
  switch (key) {
    case 'deleteButton':
      return screen.findByRole('button', { name: /poista avainsana/i });
    case 'nameInput':
      return screen.findByRole('textbox', { name: /nimi \(suomeksi\)/i });
  }
};

const getElement = (key: 'saveButton') => {
  switch (key) {
    case 'saveButton':
      return screen.getByRole('button', { name: /tallenna/i });
  }
};

test('should scroll to first validation error input field', async () => {
  const user = userEvent.setup();
  renderComponent();

  const nameInput = await findElement('nameInput');
  await act(async () => await user.clear(nameInput));
  const saveButton = getElement('saveButton');
  await act(async () => await user.click(saveButton));

  await waitFor(() => expect(nameInput).toHaveFocus());
});

test('should delete keyword', async () => {
  const user = userEvent.setup();
  const { history } = renderComponent([
    ...defaultMocks,
    mockedDeleteKeywordResponse,
  ]);

  const deleteButton = await findElement('deleteButton');
  await act(async () => await user.click(deleteButton));

  const withinModal = within(screen.getByRole('dialog'));
  const deleteKeywordButton = withinModal.getByRole('button', {
    name: 'Poista avainsana',
  });
  await act(async () => await user.click(deleteKeywordButton));

  await waitFor(() =>
    expect(history.location.pathname).toBe(`/fi/administration/keywords`)
  );
});

test('should update keyword', async () => {
  const user = userEvent.setup();
  const { history } = renderComponent([
    ...defaultMocks,
    mockedUpdateKeywordResponse,
  ]);

  await findElement('nameInput');

  const submitButton = getElement('saveButton');
  await act(async () => await user.click(submitButton));

  await waitFor(() =>
    expect(history.location.pathname).toBe(`/fi/administration/keywords`)
  );
});

test('should show server errors', async () => {
  const user = userEvent.setup();
  renderComponent([...defaultMocks, mockedInvalidUpdateKeywordResponse]);

  await findElement('nameInput');

  const submitButton = getElement('saveButton');
  await act(async () => await user.click(submitButton));

  await screen.findByText(/lomakkeella on seuraavat virheet/i);
  screen.getByText(/Nimi on pakollinen./i);
});
