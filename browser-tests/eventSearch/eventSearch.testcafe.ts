/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import TestController, { RequestLogger } from 'testcafe';

import { SUPPORTED_LANGUAGES, supportedLanguages } from '../../src/constants';
import { EventFieldsFragment } from '../../src/generated/graphql';
import { findCookieConsentModal } from '../cookieConsentModal/cookieConsentModal.components';
import {
  getEvents,
  getPlace,
  getPlaces,
  getPublisher,
} from '../data/eventData';
import { getExpectedEventContext, isLocalized } from '../utils/event.utils';
import { isInternetLocation } from '../utils/place.utils';
import {
  getRandomSentence,
  selectRandomValuesFromArray,
} from '../utils/random.utils';
import { requestLogger } from '../utils/requestLogger';
import { getEnvUrl, LINKED_EVENTS_URL } from '../utils/settings';
import {
  clearDataToPrintOnFailure,
  setDataToPrintOnFailure,
} from '../utils/testcafe.utils';
import { getUrlUtils } from '../utils/url.utils';
import { getEventSearchPage } from './eventSearch.components';

const eventSearchLogger = RequestLogger(new RegExp(LINKED_EVENTS_URL), {
  logResponseBody: true,
  stringifyResponseBody: true,
});

let eventSearchPage: ReturnType<typeof getEventSearchPage>;
let urlUtils: ReturnType<typeof getUrlUtils>;

fixture('Event search page')
  .page(getEnvUrl('/fi/search'))
  .beforeEach(async (t) => {
    clearDataToPrintOnFailure(t);
    eventSearchPage = getEventSearchPage(t);
    urlUtils = getUrlUtils(t);
  })
  .afterEach(async () => {
    requestLogger.clear();
    eventSearchLogger.clear();
  })
  .requestHooks([requestLogger, eventSearchLogger]);

test('shows places in filter options', async (t) => {
  const cookieConsentModal = await findCookieConsentModal(t);
  await cookieConsentModal.actions.acceptAllCookies();

  await eventSearchPage.pageIsLoaded();

  const places = getPlaces(eventSearchLogger);
  await t.expect(places.length).gt(0);

  const searchBanner = await eventSearchPage.findSearchBanner();
  await searchBanner.actions.openPlaceFilters();

  for (const place of selectRandomValuesFromArray(places, 3)) {
    await searchBanner.actions.selectPlaceFilter(place);
  }
});

test('Search url by event name shows event card data for an event', async (t) => {
  const cookieConsentModal = await findCookieConsentModal(t);
  await cookieConsentModal.actions.acceptAllCookies();

  await eventSearchPage.pageIsLoaded();

  const locale = SUPPORTED_LANGUAGES.FI;
  const [event] = getEvents(eventSearchLogger).filter((event) =>
    isLocalized(event, locale)
  );
  const eventLocation = getPlace(eventSearchLogger, event);
  const eventPublisher = getPublisher(eventSearchLogger, event);

  setDataToPrintOnFailure(
    t,
    'expectedEvent',
    getExpectedEventContext(event, 'startTime', 'endTime')
  );

  await urlUtils.actions.navigateToSearchUrl(getRandomSentence(event.name.fi));
  const searchResults = await eventSearchPage.findSearchResultList();
  const eventCard = await searchResults.eventCard(event);
  if (eventPublisher) {
    await eventCard.expectations.publisherIsPresent(eventPublisher);
  }
  if (eventLocation && !isInternetLocation(eventLocation)) {
    await eventCard.expectations.addressIsPresent(eventLocation);
  }
  await eventCard.actions.clickEventLink();
  await urlUtils.expectations.urlChangedToEventPage(event);
});

test('Free text search finds event by free text search', async (t) => {
  const cookieConsentModal = await findCookieConsentModal(t);
  await cookieConsentModal.actions.acceptAllCookies();

  await eventSearchPage.pageIsLoaded();

  const [event] = getEvents(eventSearchLogger).filter((event) =>
    isLocalized(event, SUPPORTED_LANGUAGES.FI)
  );
  const eventLocation = getPlace(eventSearchLogger, event);

  setDataToPrintOnFailure(t, 'expectedEvent', getExpectedEventContext(event));
  const eventLanguages = supportedLanguages.filter((locale) =>
    isLocalized(event, locale)
  );

  for (const locale of eventLanguages) {
    await testSearchEventByText(t, event, event.name[locale], 'name');
    await testSearchEventByText(
      t,
      event,
      event.shortDescription[locale],
      'shortDescription'
    );
    await testSearchEventByText(
      t,
      event,
      event.description[locale],
      'description'
    );

    if (eventLocation) {
      const eventWithLocation = {
        ...event,
        location: eventLocation,
      };
      await testSearchEventByText(
        t,
        eventWithLocation,
        eventLocation.name[locale],
        'location'
      );

      if (!isInternetLocation(eventLocation)) {
        await testSearchEventByText(
          t,
          eventWithLocation,
          eventLocation.streetAddress[locale],
          'location'
        );
      }
    }
  }
});

const testSearchEventByText = async (
  t: TestController,
  event: EventFieldsFragment,
  freeText: string,
  expectedField?: keyof EventFieldsFragment
) => {
  if (!freeText) {
    return;
  }
  const randomSentenceFromText = getRandomSentence(freeText);
  const searchBanner = await eventSearchPage.findSearchBanner();
  await searchBanner.actions.inputSearchTextAndPressEnter(
    randomSentenceFromText
  );
  const searchResults = await eventSearchPage.findSearchResultList();
  await searchResults.eventCard(event, expectedField);
  await searchBanner.actions.clickClearFiltersButton();
  clearDataToPrintOnFailure(t);
};