/* eslint-disable no-console */

import { MockedResponse } from '@apollo/client/testing';
import { FormikState } from 'formik';
import { advanceTo, clear } from 'jest-date-mock';
import React from 'react';

import {
  EMPTY_MULTI_LANGUAGE_OBJECT,
  FORM_NAMES,
  LE_DATA_LANGUAGES,
} from '../../../constants';
import { fakeAuthenticatedStoreState } from '../../../utils/mockStoreUtils';
import {
  act,
  configure,
  getMockReduxStore,
  loadingSpinnerIsNotInDocument,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../utils/testUtils';
import {
  imageFields,
  mockedImageResponse,
  mockedImagesResponse,
  mockedUpdateImageResponse,
} from '../../image/__mocks__/image';
import {
  mockedAudienceKeywordSetResponse,
  mockedTopicsKeywordSetResponse,
} from '../../keywordSet/__mocks__/keywordSets';
import { mockedLanguagesResponse } from '../../language/__mocks__/language';
import {
  mockedOrganizationResponse,
  organizationId,
} from '../../organization/__mocks__/organization';
import { mockedOrganizationAncestorsResponse } from '../../organization/__mocks__/organizationAncestors';
import {
  mockedFilteredPlacesResponse,
  mockedPlaceResponse,
  mockedPlacesResponse,
  placeAtId,
} from '../../place/__mocks__/place';
import { mockedUserResponse } from '../../user/__mocks__/user';
import {
  eventValues,
  keywordAtId,
  keywordName,
  mockedCreateDraftEventResponse,
  mockedCreatePublicEventResponse,
  mockedCreateSubEventsResponse,
  mockedInvalidCreateDraftEventResponse,
  mockedKeywordResponse,
  mockedKeywordsResponse,
  mockedUmbrellaEventsResponse,
} from '../__mocks__/createEventPage';
import { EVENT_FIELDS, EVENT_INITIAL_VALUES } from '../constants';
import CreateEventPage from '../CreateEventPage';
import { EventFormFields } from '../types';

configure({ defaultHidden: true });

const defaultMocks = [
  mockedImagesResponse,
  mockedImageResponse,
  mockedKeywordResponse,
  mockedKeywordsResponse,
  mockedUmbrellaEventsResponse,
  mockedAudienceKeywordSetResponse,
  mockedTopicsKeywordSetResponse,
  mockedLanguagesResponse,
  mockedPlaceResponse,
  mockedPlacesResponse,
  // PlaceSelector component requires second mock. https://github.com/apollographql/react-apollo/issues/617
  mockedFilteredPlacesResponse,
  mockedFilteredPlacesResponse,
  mockedOrganizationResponse,
  mockedOrganizationAncestorsResponse,
  mockedUserResponse,
];

const state = fakeAuthenticatedStoreState();
const store = getMockReduxStore(state);

const renderComponent = (mocks: MockedResponse[] = defaultMocks) =>
  render(<CreateEventPage />, { mocks, store });

beforeEach(() => {
  // values stored with FormikPersist will also be available in other tests unless you run
  sessionStorage.clear();
});

afterAll(() => {
  // Clear system time
  clear();
});

const setFormValues = (values: EventFormFields) => {
  const state: FormikState<EventFormFields> = {
    errors: {},
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
    touched: {},
    values,
  };

  jest.spyOn(sessionStorage, 'getItem').mockImplementation((key: string) => {
    switch (key) {
      case FORM_NAMES.EVENT_FORM:
        return JSON.stringify(state);
      default:
        return '';
    }
  });
};

const getElement = (
  key:
    | 'description'
    | 'keyword'
    | 'name'
    | 'publish'
    | 'saveDraft'
    | 'superEvent'
) => {
  switch (key) {
    case 'description':
      return screen.getByRole('textbox', {
        name: /tapahtuman kuvaus suomeksi/i,
      });
    case 'keyword':
      return screen.getByRole('checkbox', { name: keywordName });
    case 'name':
      return screen.getByRole('textbox', {
        name: /tapahtuman otsikko suomeksi/i,
      });
    case 'publish':
      return screen.getByRole('button', {
        name: 'Julkaise tapahtuma',
      });
    case 'saveDraft':
      return screen.getByRole('button', {
        name: 'Tallenna luonnos',
      });
    case 'superEvent':
      return screen.getByRole('combobox', {
        name: new RegExp('Kattotapahtuma'),
      });
  }
};

const findElement = (key: 'keyword' | 'nameSv' | 'superEvent') => {
  switch (key) {
    case 'keyword':
      return screen.findByRole('checkbox', { name: keywordName });
    case 'nameSv':
      return screen.findByRole('textbox', {
        name: /tapahtuman otsikko ruotsiksi/i,
      });
    case 'superEvent':
      return screen.findByRole(
        'combobox',
        { name: new RegExp('Kattotapahtuma') },
        { timeout: 10000 }
      );
  }
};

test('should focus to first validation error when trying to save draft event', async () => {
  const user = userEvent.setup();
  renderComponent();

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  const saveDraftButton = getElement('saveDraft');

  await act(async () => await user.click(saveDraftButton));

  await waitFor(() => expect(nameTextbox).toHaveFocus());
});

test('should focus to validation error of swedish name when trying to save draft event', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    [EVENT_FIELDS.EVENT_INFO_LANGUAGES]: [
      LE_DATA_LANGUAGES.FI,
      LE_DATA_LANGUAGES.SV,
    ],
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
  });
  const user = userEvent.setup();

  renderComponent();

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const saveDraftButton = getElement('saveDraft');
  await act(async () => await user.click(saveDraftButton));

  const nameSvTextbox = await findElement('nameSv');
  await waitFor(() => expect(nameSvTextbox).toHaveFocus());
});

test('should focus to select component in case of validation error', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    hasUmbrella: true,
  });
  const user = userEvent.setup();

  renderComponent();

  await loadingSpinnerIsNotInDocument();

  const superEventSelect = await findElement('superEvent');

  const publishButton = getElement('publish');
  await act(async () => await user.click(publishButton));

  await waitFor(() => expect(superEventSelect).toHaveFocus());
});

test('should focus to text editor component in case of validation error', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
    shortDescription: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.shortDescription,
    },
  });
  const user = userEvent.setup();

  renderComponent();

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const descriptionTextbox = getElement('description');

  const publishButton = getElement('publish');
  await act(async () => await user.click(publishButton));

  await waitFor(() => expect(descriptionTextbox).toHaveFocus());
});

test('should focus to event times error if none event time exists', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    publisher: organizationId,
    description: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.description,
    },
    eventTimes: [],
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
    shortDescription: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.shortDescription,
    },
  });
  const user = userEvent.setup();

  renderComponent();

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const publishButton = getElement('publish');
  await act(async () => await user.click(publishButton));

  const error = await screen.findByText(/vähintään 1 ajankohta vaaditaan/i);
  await waitFor(() => expect(error).toHaveFocus());
});

test('should focus to first main category checkbox if none main category is selected', async () => {
  advanceTo('2020-12-20');

  setFormValues({
    ...EVENT_INITIAL_VALUES,
    publisher: organizationId,
    description: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.description,
    },
    eventTimes: [eventValues.eventTimes[0]],
    images: [imageFields.atId],
    imageDetails: imageFields,
    isVerified: true,
    keywords: [],
    location: placeAtId,
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
    shortDescription: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.shortDescription,
    },
  });

  const mocks: MockedResponse[] = [
    ...defaultMocks,
    mockedCreateSubEventsResponse,
    mockedCreatePublicEventResponse,
    mockedUpdateImageResponse,
  ];
  const user = userEvent.setup();

  renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));
  const keywordCheckbox = await findElement('keyword');

  const publishButton = getElement('publish');
  await act(async () => await user.click(publishButton));

  await waitFor(() => expect(keywordCheckbox).toHaveFocus());
});

test('should show server errors', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    eventTimes: [eventValues.eventTimes[0]],
    isVerified: true,
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
  });
  const mocks = [...defaultMocks, mockedInvalidCreateDraftEventResponse];
  const user = userEvent.setup();

  renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const saveDraftButton = getElement('saveDraft');
  await act(async () => await user.click(saveDraftButton));

  await screen.findByText(/lomakkeella on seuraavat virheet/i);
  screen.getByText(/lopetusaika ei voi olla menneisyydessä./i);
});

test('should route to event completed page after saving draft event', async () => {
  setFormValues({
    ...EVENT_INITIAL_VALUES,
    eventTimes: [eventValues.eventTimes[0]],
    isVerified: true,
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
  });
  const mocks = [...defaultMocks, mockedCreateDraftEventResponse];
  const user = userEvent.setup();

  const { history } = renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const saveDraftButton = getElement('saveDraft');
  await act(async () => await user.click(saveDraftButton));

  await waitFor(
    () =>
      expect(history.location.pathname).toBe(
        `/fi/events/completed/${eventValues.id}`
      ),
    { timeout: 20000 }
  );
});

test('should route to event completed page after publishing event', async () => {
  advanceTo('2020-12-20');

  setFormValues({
    ...EVENT_INITIAL_VALUES,
    publisher: organizationId,
    description: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.description,
    },
    eventTimes: eventValues.eventTimes,
    images: [imageFields.atId],
    imageDetails: imageFields,
    isVerified: true,
    keywords: [keywordAtId],
    location: placeAtId,
    name: { ...EMPTY_MULTI_LANGUAGE_OBJECT, fi: eventValues.name },
    shortDescription: {
      ...EMPTY_MULTI_LANGUAGE_OBJECT,
      fi: eventValues.shortDescription,
    },
  });

  const mocks: MockedResponse[] = [
    ...defaultMocks,
    mockedCreateSubEventsResponse,
    mockedCreatePublicEventResponse,
    mockedUpdateImageResponse,
  ];
  const user = userEvent.setup();

  const { history } = renderComponent(mocks);

  await loadingSpinnerIsNotInDocument();

  const nameTextbox = getElement('name');
  await waitFor(() => expect(nameTextbox).toHaveValue(eventValues.name));

  const publishButton = getElement('publish');
  await act(async () => await user.click(publishButton));

  await waitFor(
    () =>
      expect(history.location.pathname).toBe(
        `/fi/events/completed/${eventValues.id}`
      ),
    { timeout: 20000 }
  );
});
