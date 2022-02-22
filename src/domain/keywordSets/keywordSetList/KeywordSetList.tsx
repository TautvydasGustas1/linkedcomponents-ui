import omit from 'lodash/omit';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router';
import { scroller } from 'react-scroll';

import LoadingSpinner from '../../../common/components/loadingSpinner/LoadingSpinner';
import Pagination from '../../../common/components/pagination/Pagination';
import SearchInput from '../../../common/components/searchInput/SearchInput';
import {
  KeywordSetsQuery,
  useKeywordSetsQuery,
} from '../../../generated/graphql';
import getPageCount from '../../../utils/getPageCount';
import { scrollToItem } from '../../../utils/scrollToItem';
import { getKeywordSetItemId } from '../../keywordSet/utils';
import {
  DEFAULT_KEYWORD_SET_SORT,
  KEYWORD_SET_SORT_OPTIONS,
  KEYWORD_SETS_PAGE_SIZE,
} from '../constants';
import useKeywordSetSortOptions from '../hooks/useKeywordSetSortOptions';
import KeywordSetsTable from '../keywordSetsTable/KeywordSetsTable';
import { KeywordSetsLocationState } from '../types';
import {
  getKeywordSetSearchInitialValues,
  getKeywordSetsQueryVariables,
  replaceParamsToKeywordSetQueryString,
} from '../utils';
import styles from './keywordSetList.module.scss';

export const testIds = {
  resultList: 'keyword-set-result-list',
};

type KeywordSetListProps = {
  keywordSets: KeywordSetsQuery['keywordSets']['data'];
  onSelectedPageChange: (page: number) => void;
  onSortChange: (sort: KEYWORD_SET_SORT_OPTIONS) => void;
  page: number;
  pageCount: number;
  sort: KEYWORD_SET_SORT_OPTIONS;
};

const KeywordSetList: React.FC<KeywordSetListProps> = ({
  keywordSets,
  onSelectedPageChange,
  onSortChange,
  page,
  pageCount,
  sort,
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation<KeywordSetsLocationState>();
  const sortOptions = useKeywordSetSortOptions();

  const getTableCaption = () => {
    return t(`keywordSetsPage.keywordSetsTableCaption`, {
      sort: sortOptions.find((option) => option.value === sort)?.label,
    });
  };

  React.useEffect(() => {
    if (location.state?.keywordSetId) {
      scrollToItem(getKeywordSetItemId(location.state.keywordSetId));
      // Clear keywordSetId value to keep scroll position correctly
      const state = omit(location.state, 'keywordSetId');
      // location.search seems to reset if not added here (...location)
      history.replace({ ...location, state });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className={styles.table}>
        <KeywordSetsTable
          caption={getTableCaption()}
          keywordSets={keywordSets}
          setSort={onSortChange}
          sort={sort as KEYWORD_SET_SORT_OPTIONS}
        />
      </div>
      {pageCount > 1 && (
        <Pagination
          pageCount={pageCount}
          selectedPage={page}
          setSelectedPage={onSelectedPageChange}
        />
      )}
    </div>
  );
};

const KeywordSetListContainer: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [keywordSetListId] = React.useState(() =>
    uniqueId('keyword-set-list-')
  );
  const { t } = useTranslation();
  const { page, sort, text } = getKeywordSetSearchInitialValues(
    location.search
  );
  const [search, setSearch] = React.useState(text);

  const handleSelectedPageChange = (page: number) => {
    history.push({
      pathname: location.pathname,
      search: replaceParamsToKeywordSetQueryString(location.search, {
        page: page > 1 ? page : null,
      }),
    });
    // Scroll to the beginning of keyword list
    scroller.scrollTo(keywordSetListId, { offset: -100 });
  };

  const handleSearchChange = (text: string) => {
    history.push({
      pathname: location.pathname,
      search: replaceParamsToKeywordSetQueryString(location.search, {
        page: null,
        text,
      }),
    });
  };

  const handleSortChange = (val: KEYWORD_SET_SORT_OPTIONS) => {
    history.push({
      pathname: location.pathname,
      search: replaceParamsToKeywordSetQueryString(location.search, {
        sort:
          val !== DEFAULT_KEYWORD_SET_SORT
            ? val
            : /* istanbul ignore next */ null,
      }),
    });
  };

  const { data: keywordSetsData, loading } = useKeywordSetsQuery({
    variables: getKeywordSetsQueryVariables(location.search),
  });

  /* istanbul ignore next */
  const keywordSets = keywordSetsData?.keywordSets?.data || [];
  /* istanbul ignore next */
  const keywordSetsCount = keywordSetsData?.keywordSets?.meta.count || 0;
  const pageCount = getPageCount(keywordSetsCount, KEYWORD_SETS_PAGE_SIZE);

  return (
    <div id={keywordSetListId} data-testid={testIds.resultList}>
      <div className={styles.searchRow}>
        <span className={styles.count}>
          {t('keywordSetsPage.count', { count: keywordSetsCount })}
        </span>
        <SearchInput
          className={styles.searchInput}
          label={t('keywordSetsPage.labelSearch')}
          hideLabel
          onSearch={handleSearchChange}
          setValue={setSearch}
          value={search}
        />
      </div>

      <LoadingSpinner isLoading={loading}>
        <KeywordSetList
          keywordSets={keywordSets}
          onSelectedPageChange={handleSelectedPageChange}
          onSortChange={handleSortChange}
          page={page}
          pageCount={pageCount}
          sort={sort}
        />
      </LoadingSpinner>
    </div>
  );
};

export default KeywordSetListContainer;