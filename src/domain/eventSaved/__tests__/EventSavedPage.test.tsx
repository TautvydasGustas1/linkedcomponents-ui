import { MockedResponse } from '@apollo/client/testing';
import React from 'react';

import { ROUTES } from '../../../constants';
import { EventDocument, PublicationStatus } from '../../../generated/graphql';
import { fakeEvent } from '../../../utils/mockDataUtils';
import {
  act,
  actWait,
  configure,
  loadingSpinnerIsNotInDocument,
  renderWithRoute,
  screen,
  userEvent,
  waitFor,
} from '../../../utils/testUtils';
import translations from '../../app/i18n/fi.json';
import EventSavedPage from '../EventSavedPage';

configure({ defaultHidden: true });

const eventId = 'hel:123';
const route = ROUTES.EVENT_SAVED.replace(':id', eventId);

const getMocks = (publicationStatus: PublicationStatus): MockedResponse[] => {
  const event = fakeEvent({ id: eventId, publicationStatus });
  const eventResponse = { data: { event: event } };
  const mockedEventReponse = {
    request: {
      query: EventDocument,
      variables: { id: eventId, createPath: undefined },
    },
    result: eventResponse,
  };

  return [mockedEventReponse];
};

const getElement = (
  key:
    | 'addEventButton'
    | 'backToEventsButton'
    | 'draftSavedHeading'
    | 'publishedHeading'
) => {
  switch (key) {
    case 'addEventButton':
      return screen.getByRole('button', {
        name: translations.common.buttonAddEvent,
      });
    case 'backToEventsButton':
      return screen.getByRole('button', {
        name: translations.eventSavedPage.buttonBackToEvents,
      });
    case 'draftSavedHeading':
      return screen.getByRole('heading', {
        name: translations.eventSavedPage.titleDraftSaved,
      });
    case 'publishedHeading':
      return screen.getByRole('heading', {
        name: translations.eventSavedPage.titlePublished,
      });
  }
};

const renderComponent = (mocks: MockedResponse[]) =>
  renderWithRoute(<EventSavedPage />, {
    mocks,
    routes: [route],
    path: ROUTES.EVENT_SAVED,
  });

test('should render all components for draft event', async () => {
  const mocks = getMocks(PublicationStatus.Draft);
  renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();
  getElement('draftSavedHeading');
  getElement('backToEventsButton');
  getElement('addEventButton');
});

test('should render all components for published event', async () => {
  const mocks = getMocks(PublicationStatus.Public);

  renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();
  getElement('publishedHeading');
  getElement('backToEventsButton');
  getElement('addEventButton');
});

test('should route to event list page', async () => {
  const user = userEvent.setup();
  const mocks = getMocks(PublicationStatus.Draft);
  const { history } = renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();
  getElement('draftSavedHeading');
  await actWait(100);

  const backToEventsButton = getElement('backToEventsButton');
  await act(async () => await user.click(backToEventsButton));

  await waitFor(() => expect(history.location.pathname).toBe('/fi/events'), {
    timeout: 10000,
  });
});

test('should route to create event page', async () => {
  const user = userEvent.setup();
  const mocks = getMocks(PublicationStatus.Draft);
  const { history } = renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();
  getElement('draftSavedHeading');
  await actWait(100);

  const addEventButton = getElement('addEventButton');
  await act(async () => await user.click(addEventButton));

  await waitFor(
    () => expect(history.location.pathname).toBe('/fi/events/create'),
    { timeout: 10000 }
  );
});
