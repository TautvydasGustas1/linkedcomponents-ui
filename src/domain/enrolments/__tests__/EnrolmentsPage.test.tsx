/* eslint-disable max-len */
import { MockedResponse } from '@apollo/client/testing';
import { createMemoryHistory } from 'history';
import React from 'react';

import { ROUTES } from '../../../constants';
import { fakeAuthenticatedStoreState } from '../../../utils/mockStoreUtils';
import {
  act,
  configure,
  CustomRenderOptions,
  getMockReduxStore,
  loadingSpinnerIsNotInDocument,
  renderWithRoute,
  screen,
  userEvent,
  waitFor,
} from '../../../utils/testUtils';
import { mockedEventResponse } from '../../event/__mocks__/event';
import {
  mockedRegistrationResponse,
  registrationId,
} from '../../registration/__mocks__/registration';
import { mockedUserResponse } from '../../user/__mocks__/user';
import {
  attendees,
  mockedAttendeesResponse,
  mockedWaitingAttendeesResponse,
} from '../__mocks__/enrolmentsPage';
import EnrolmentsPage from '../EnrolmentsPage';

configure({ defaultHidden: true });

const storeState = fakeAuthenticatedStoreState();
const store = getMockReduxStore(storeState);
const route = ROUTES.REGISTRATION_ENROLMENTS.replace(
  ':registrationId',
  registrationId
);

const defaultMocks = [
  mockedAttendeesResponse,
  mockedEventResponse,
  mockedRegistrationResponse,
  mockedUserResponse,
  mockedWaitingAttendeesResponse,
];

beforeEach(() => jest.clearAllMocks());

const findElement = (key: 'createEnrolmentButton') => {
  switch (key) {
    case 'createEnrolmentButton':
      return screen.findByRole('button', { name: /lisää osallistuja/i });
  }
};
const getElement = (
  key: 'attendeeTable' | 'createEnrolmentButton' | 'waitingListTable'
) => {
  switch (key) {
    case 'attendeeTable':
      return screen.getByRole('table', { name: /osallistujat/i });
    case 'createEnrolmentButton':
      return screen.getByRole('button', { name: /lisää osallistuja/i });
    case 'waitingListTable':
      return screen.getByRole('table', { name: /jonopaikat/i });
  }
};

const renderComponent = (
  mocks: MockedResponse[] = defaultMocks,
  renderOptions?: CustomRenderOptions
) =>
  renderWithRoute(<EnrolmentsPage />, {
    mocks,
    routes: [route],
    path: ROUTES.REGISTRATION_ENROLMENTS,
    store,
    ...renderOptions,
  });

test('should render enrolments page', async () => {
  renderComponent();

  await loadingSpinnerIsNotInDocument();

  await findElement('createEnrolmentButton');
  getElement('attendeeTable');
  getElement('waitingListTable');
});

it('scrolls to enrolment table row and calls history.replace correctly (deletes enrolmentId from state)', async () => {
  const history = createMemoryHistory();
  const historyObject = {
    state: { enrolmentId: attendees[0].id },
    pathname: route,
  };
  history.push(historyObject);

  const replaceSpy = jest.spyOn(history, 'replace');

  renderComponent(undefined, { history });

  await loadingSpinnerIsNotInDocument();

  expect(replaceSpy).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: historyObject.pathname })
  );

  const enrolmentRowButton = screen.getAllByRole('button', {
    name: attendees[0].name,
  })[0];
  await waitFor(() => expect(enrolmentRowButton).toHaveFocus());
});

test("should show not found page if registration doesn't exist", async () => {
  renderComponent(undefined, {
    routes: [
      ROUTES.REGISTRATION_ENROLMENTS.replace(':registrationId', 'not-exist'),
    ],
  });

  await screen.findByText(
    'Etsimääsi sisältöä ei löydy. Kirjaudu sisään tai palaa kotisivulle.'
  );
});

test('should move to create enrolment page', async () => {
  const { history } = renderComponent();

  await loadingSpinnerIsNotInDocument();

  const createButton = await findElement('createEnrolmentButton');
  act(() => userEvent.click(createButton));

  expect(history.location.pathname).toBe(
    `/registrations/${registrationId}/enrolments/create`
  );
});
