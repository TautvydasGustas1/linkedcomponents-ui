import { MockedResponse } from '@apollo/client/testing';

import {
  DeleteKeywordSetDocument,
  KeywordSetDocument,
  KeywordSetFieldsFragment,
  UpdateKeywordSetDocument,
} from '../../../generated/graphql';
import { fakeKeywordSet } from '../../../utils/mockDataUtils';
import {
  TEST_DATA_SOURCE,
  TEST_PUBLISHER_ID,
} from '../../organization/constants';
import { TEST_KEYWORD_SET_ID } from '../constants';
import { keywords } from './createKeywordSetPage';

const keywordSetValues: Partial<KeywordSetFieldsFragment> = {
  dataSource: TEST_DATA_SOURCE,
  id: TEST_KEYWORD_SET_ID,
  keywords: [{ atId: keywords.data[0].atId }],
  name: {
    ar: 'Keyword (ar)',
    en: 'Keyword (en)',
    fi: 'Keyword (fi)',
    ru: 'Keyword (ru)',
    sv: 'Keyword (sv)',
    zhHans: 'Keyword (zhHans)',
  },
  organization: TEST_PUBLISHER_ID,
  usage: 'any',
};

const keywordSet = fakeKeywordSet(keywordSetValues);

const keywordSetVariables = { id: keywordSet.id, createPath: undefined };
const keywordSetResponse = { data: { keywordSet } };
const mockedKeywordSetResponse = {
  request: { query: KeywordSetDocument, variables: keywordSetVariables },
  result: keywordSetResponse,
};

const updateKeywordSetVariables = { input: keywordSetValues };

const updateKeywordSetResponse = { data: { updateKeywordSet: keywordSet } };

const mockedUpdateKeywordSetResponse: MockedResponse = {
  request: {
    query: UpdateKeywordSetDocument,
    variables: updateKeywordSetVariables,
  },
  result: updateKeywordSetResponse,
};

const mockedInvalidUpdateKeywordSetResponse: MockedResponse = {
  request: {
    query: UpdateKeywordSetDocument,
    variables: updateKeywordSetVariables,
  },
  error: {
    ...new Error(),
    result: { name: ['The name must be specified.'] },
  } as Error,
};

const deleteKeywordSetVariables = { id: keywordSet.id };
const deleteKeywordSetResponse = { data: { deleteKeywordSet: null } };
const mockedDeleteKeywordSetResponse: MockedResponse = {
  request: {
    query: DeleteKeywordSetDocument,
    variables: deleteKeywordSetVariables,
  },
  result: deleteKeywordSetResponse,
};

export {
  keywordSet,
  mockedDeleteKeywordSetResponse,
  mockedInvalidUpdateKeywordSetResponse,
  mockedKeywordSetResponse,
  mockedUpdateKeywordSetResponse,
};