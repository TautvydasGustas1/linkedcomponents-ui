import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  ServerError,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import * as Sentry from '@sentry/browser';
import { RestLink } from 'apollo-link-rest';
import snakeCase from 'lodash/snakeCase';
import { toast } from 'react-toastify';

import {
  Event,
  EventsResponse,
  Image,
  ImagesResponse,
  Keyword,
  KeywordSet,
  KeywordSetsResponse,
  KeywordsResponse,
  LanguagesResponse,
  Organization,
  OrganizationsResponse,
  Place,
  PlacesResponse,
  UploadImageMutationInput,
} from '../../../generated/graphql';
import { normalizeKey } from '../../../utils/apolloUtils';
import getNocacheTime from '../../../utils/getNocacheTime';
import { apiTokenSelector } from '../../auth/selectors';
import i18n from '../i18n/i18nInit';
import { store } from '../store/store';
import {
  addTypenameEvent,
  addTypenameImage,
  addTypenameKeyword,
  addTypenameKeywordSet,
  addTypenameLanguage,
  addTypenameMeta,
  addTypenameOrganization,
  addTypenamePlace,
} from './utils';

// This serializer is needed to send image upload data to API as multipart/form-data content.
// Apollo sets Content-type to application/json by default and we need to delete Content-type
// from the header so fetch can automatically identify content type to be multipart/form-data
// and sets boundary correctly
const uploadImageSerializer = (
  data: UploadImageMutationInput,
  headers: Headers
) => {
  const formData = new FormData();
  const { image, url, ...restFields } = data;

  data.image
    ? formData.append('image', image)
    : formData.append('url', url || '');

  for (const key in restFields) {
    if (restFields.hasOwnProperty(key)) {
      formData.append(
        snakeCase(key),
        restFields[key as keyof typeof restFields] || ''
      );
    }
  }

  // Delete Content-Type header so browsers will detect Content-Type automatically
  // and set correct boundary
  headers.delete('content-type');

  return {
    body: formData,
    headers,
  };
};

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        event(_, { args, toReference }) {
          return toReference({
            __typename: 'Event',
            id: args?.id,
          });
        },
        image(_, { args, toReference }) {
          return toReference({
            __typename: 'Image',
            id: args?.id,
          });
        },
        keyword(_, { args, toReference }) {
          return toReference({
            __typename: 'Keyword',
            id: args?.id,
          });
        },
        keywordSet(_, { args, toReference }) {
          return toReference({
            __typename: 'KeywordSet',
            id: args?.id,
          });
        },
        organization(_, { args, toReference }) {
          return toReference({
            __typename: 'Organization',
            id: args?.id,
          });
        },
        place(_, { args, toReference }) {
          return toReference({
            __typename: 'Place',
            id: args?.id,
          });
        },
      },
    },
  },
});

const authLink = setContext((_, { headers }) => {
  const token = apiTokenSelector(store.getState());

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : null,
      'Accept-language': i18n.language,
    },
  };
});

const addNocacheToUrl = (urlStr: string): string => {
  const url = new URL(urlStr);
  const searchParams = new URLSearchParams(url.search);

  if (!searchParams.get('nocache')) {
    searchParams.append('nocache', getNocacheTime().toString());
  }

  url.search = searchParams.toString();

  return url.toString();
};

const linkedEventsLink = new RestLink({
  bodySerializers: {
    uploadImageSerializer,
  },
  customFetch: (request: Request | string, config) => {
    if (typeof request === 'string' && config.method === 'GET') {
      return fetch(addNocacheToUrl(request), config);
    }
    return fetch(request, config);
  },
  fieldNameDenormalizer: (key) => {
    if (key === 'atId') {
      return '@id';
    }

    return snakeCase(key);
  },
  fieldNameNormalizer: normalizeKey,
  headers: {
    'Content-Type': 'application/json',
  },
  typePatcher: {
    Event: (event: Event): Event | null => {
      return addTypenameEvent(event);
    },
    EventsResponse: (data: EventsResponse): EventsResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((event) => addTypenameEvent(event));

      return data;
    },
    Image: (image: Image): Image | null => {
      return addTypenameImage(image);
    },
    ImagesResponse: (data: ImagesResponse): ImagesResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((image) => addTypenameImage(image));

      return data;
    },
    Keyword: (keyword: Keyword): Keyword | null => {
      return addTypenameKeyword(keyword);
    },
    KeywordsResponse: (data: KeywordsResponse): KeywordsResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((keyword) => addTypenameKeyword(keyword));

      return data;
    },
    KeywordSet: (keywordSet: KeywordSet): KeywordSet | null => {
      return addTypenameKeywordSet(keywordSet);
    },
    KeywordSetsResponse: (data: KeywordSetsResponse): KeywordSetsResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((keywordSet) =>
        addTypenameKeywordSet(keywordSet)
      );

      return data;
    },
    LanguagesResponse: (data: LanguagesResponse): LanguagesResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((language) => addTypenameLanguage(language));

      return data;
    },
    Organization: (organization: Organization): Organization | null => {
      return addTypenameOrganization(organization);
    },
    OrganizationsResponse: (
      data: OrganizationsResponse
    ): OrganizationsResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((organization) =>
        addTypenameOrganization(organization)
      );

      return data;
    },
    Place: (place: Place): Place | null => {
      return addTypenamePlace(place);
    },
    PlacesResponse: (data: PlacesResponse): PlacesResponse => {
      data.meta = addTypenameMeta(data.meta);
      data.data = data.data.map((place) => addTypenamePlace(place));

      return data;
    },
  },
  uri: process.env.REACT_APP_LINKED_EVENTS_URL,
});

const QUERIES_TO_SHOW_ERROR = ['User'];

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const isMutation = Boolean(
    operation.query.definitions.find(
      (definition) =>
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'mutation'
    )
  );

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      const errorMessage = `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`;
      Sentry.captureMessage(errorMessage);
    });
  }

  if (
    (isMutation || QUERIES_TO_SHOW_ERROR.includes(operation.operationName)) &&
    networkError
  ) {
    switch ((networkError as ServerError).statusCode) {
      case 400:
        toast.error(i18n.t('errors.validationError'));
        break;
      case 401:
        toast.error(i18n.t('errors.authorizationRequired'));
        break;
      case 403:
        toast.error(i18n.t('errors.forbidden'));
        break;
      case 404:
        toast.error(i18n.t('errors.notFound'));
        break;
      case 410:
        toast.error(i18n.t('errors.delete'));
        break;
      default:
        toast.error(i18n.t('errors.serverError'));
    }
  }
});

const apolloClient = new ApolloClient({
  cache,
  link: ApolloLink.from([errorLink, authLink, linkedEventsLink]),
});

export default apolloClient;
