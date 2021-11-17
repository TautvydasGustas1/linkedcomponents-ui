import { ROUTES } from '../../../constants';
import {
  EventTypeId,
  RegistrationsQueryVariables,
} from '../../../generated/graphql';
import { fakeRegistration } from '../../../utils/mockDataUtils';
import { EVENT_TYPE } from '../../event/constants';
import {
  REGISTRATION_SEARCH_PARAMS,
  REGISTRATION_SORT_OPTIONS,
} from '../constants';
import { RegistrationSearchParam, RegistrationSearchParams } from '../types';
import {
  addParamsToRegistrationQueryString,
  getRegistrationFields,
  getRegistrationParamValue,
  getRegistrationSearchQuery,
  getRegistrationsQueryVariables,
  registrationsPathBuilder,
  replaceParamsToRegistrationQueryString,
} from '../utils';

describe('addParamsToRegistrationQueryString function', () => {
  const cases: [Partial<RegistrationSearchParams>, string][] = [
    [{ eventType: [EVENT_TYPE.Volunteering] }, '?eventType=volunteering'],
    [{ eventType: [] }, ''],
    [{ page: 3 }, '?page=3'],
    [
      { returnPath: `/fi${ROUTES.REGISTRATIONS}` },
      '?returnPath=%2Fregistrations',
    ],
    [
      { sort: REGISTRATION_SORT_OPTIONS.LAST_MODIFIED_TIME },
      '?sort=last_modified_time',
    ],
    [{ text: 'search' }, '?text=search'],
  ];

  it.each(cases)(
    'should add %p params to search, returns %p',
    (params, expectedResult) => {
      expect(addParamsToRegistrationQueryString('', params)).toBe(
        expectedResult
      );
    }
  );
});

describe('getRegistrationParamValue function', () => {
  it('should get returnPath without locale', () => {
    expect(
      getRegistrationParamValue({
        param: REGISTRATION_SEARCH_PARAMS.RETURN_PATH,
        value: `/fi${ROUTES.REGISTRATIONS}`,
      })
    ).toBe(ROUTES.REGISTRATIONS);
  });

  it('should throw an error when trying to add unsupported param', () => {
    expect(() =>
      getRegistrationParamValue({
        param: 'unsupported' as RegistrationSearchParam,
        value: 'value',
      })
    ).toThrowError();
  });
});

describe('getRegistrationSearchQuery function', () => {
  const defaultParams = {
    [REGISTRATION_SEARCH_PARAMS.TEXT]: 'text',
  };
  const cases: [string, RegistrationSearchParams, string][] = [
    ['', defaultParams, 'text=text'],
    [
      '',
      { ...defaultParams, eventType: [EVENT_TYPE.Volunteering] },
      'text=text&eventType=volunteering',
    ],
    ['', { ...defaultParams, page: 2 }, 'text=text&page=2'],
    [
      '',
      { ...defaultParams, returnPath: `/fi${ROUTES.REGISTRATIONS}` },
      'text=text&returnPath=%2Ffi%2Fregistrations',
    ],
    [
      '?sort=last_modified_time',
      { ...defaultParams },
      'text=text&sort=last_modified_time',
    ],
    [undefined, { ...defaultParams, text: 'search' }, 'text=search'],
  ];

  it.each(cases)(
    'should get search query %p with params %p, returns %p',
    (search, params, expectedSearch) => {
      expect(getRegistrationSearchQuery(params, search)).toBe(expectedSearch);
    }
  );
});

describe('replaceParamsToRegistrationQueryString', () => {
  const cases: [Partial<RegistrationSearchParams>, string, string][] = [
    [
      { eventType: [EVENT_TYPE.Volunteering, EVENT_TYPE.Course] },
      '?eventType=volunteering',
      '?eventType=volunteering&eventType=course',
    ],
    [{ page: 2 }, '?page=3', '?page=2'],
    [
      { returnPath: `/fi${ROUTES.REGISTRATIONS}` },
      '?returnPath=%2Fsearch',
      '?returnPath=%2Fregistrations',
    ],
    [
      { sort: REGISTRATION_SORT_OPTIONS.LAST_MODIFIED_TIME },
      '?sort=-name',
      '?sort=last_modified_time',
    ],
    [{ text: 'search' }, '?text=text1', '?text=search'],
  ];

  it.each(cases)(
    'should replace %p params to search %p, returns %p',
    (params, search, expectedResult) => {
      expect(replaceParamsToRegistrationQueryString(search, params)).toBe(
        expectedResult
      );
    }
  );
});

describe('getRegistrationFields function', () => {
  it('should return default values if value is not set', () => {
    const {
      atId,
      createdBy,
      currentAttendeeCount,
      currentWaitingAttendeeCount,
      enrolmentEndTime,
      enrolmentStartTime,
      id,
      lastModifiedAt,
      maximumAttendeeCapacity,
      name,
      publisher,
      waitingListCapacity,
    } = getRegistrationFields(
      fakeRegistration({
        atId: null,
        createdBy: null,
        enrolmentEndTime: '',
        enrolmentStartTime: '',
        id: null,
        lastModifiedAt: '',
        maximumAttendeeCapacity: null,
        name: null,
        publisher: '',
        waitingListCapacity: null,
      }),
      'fi'
    );

    expect(atId).toBe('');
    expect(createdBy).toBe('');
    expect(currentAttendeeCount).toBe(0);
    expect(currentWaitingAttendeeCount).toBe(0);
    expect(enrolmentEndTime).toBe(null);
    expect(enrolmentStartTime).toBe(null);
    expect(id).toBe('');
    expect(lastModifiedAt).toBe(null);
    expect(maximumAttendeeCapacity).toBe(0);
    expect(name).toBe('');
    expect(publisher).toBe(null);
    expect(waitingListCapacity).toBe(0);
  });
});

describe('getRegistrationsQueryVariables', () => {
  const defaultVariables: RegistrationsQueryVariables = {
    createPath: undefined,
    eventType: [],
    page: 1,
    pageSize: 10,
    text: '',
  };
  const testCases: [string, RegistrationsQueryVariables][] = [
    ['', defaultVariables],
    [
      '?eventType=general&eventType=course',
      {
        ...defaultVariables,
        eventType: [EventTypeId.General, EventTypeId.Course],
      },
    ],
    ['?page=2', { ...defaultVariables, page: 2 }],
    ['?text=search', { ...defaultVariables, text: 'search' }],
  ];
  it.each(testCases)(
    'should get registrations query variables, search %p',
    (search, expectedVariables) =>
      expect(getRegistrationsQueryVariables(search)).toEqual(expectedVariables)
  );
});

describe('eventsPathBuilder function', () => {
  const cases: [RegistrationsQueryVariables, string][] = [
    [
      { eventType: [EventTypeId.Course, EventTypeId.General] },
      '/registration/?event_type=Course,General',
    ],
    [
      { page: 2 },
      '/registration/?event_type=General,Course,Volunteering&page=2',
    ],
    [
      { pageSize: 10 },
      '/registration/?event_type=General,Course,Volunteering&page_size=10',
    ],
    [
      { text: 'text' },
      '/registration/?event_type=General,Course,Volunteering&text=text',
    ],
  ];

  it.each(cases)(
    'should create registrations request path with args %p, result %p',
    (variables, expectedPath) =>
      expect(registrationsPathBuilder({ args: variables })).toBe(expectedPath)
  );
});