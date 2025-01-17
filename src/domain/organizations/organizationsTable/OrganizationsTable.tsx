import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import NoDataRow from '../../../common/components/table/noDataRow/NoDataRow';
import SortableColumn from '../../../common/components/table/sortableColumn/SortableColumn';
import Table from '../../../common/components/table/Table';
import { OrganizationFieldsFragment } from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import useQueryStringWithReturnPath from '../../../hooks/useQueryStringWithReturnPath';
import useSetFocused from '../../../hooks/useSetFocused';
import { getOrganizationFields } from '../../organization/utils';
import { ORGANIZATION_SORT_OPTIONS } from '../constants';
import styles from './organizationsTable.module.scss';
import OrganizationsTableContext from './OrganizationsTableContext';
import OrganizationsTableRow from './organizationsTableRow/OrganizationsTableRow';

export interface OrganizationsTableProps {
  caption: string;
  className?: string;
  organizations: OrganizationFieldsFragment[];
  setSort: (sort: ORGANIZATION_SORT_OPTIONS) => void;
  showSubOrganizations: boolean;
  sort: ORGANIZATION_SORT_OPTIONS;
  sortedOrganizations: OrganizationFieldsFragment[];
}

const OrganizationsTable: React.FC<OrganizationsTableProps> = ({
  caption,
  className,
  organizations,
  setSort,
  showSubOrganizations,
  sort,
  sortedOrganizations,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useLocale();
  const queryStringWithReturnPath = useQueryStringWithReturnPath();

  const table = React.useRef<HTMLTableElement>(null);
  const { focused } = useSetFocused(table);

  const onRowClick = (organization: OrganizationFieldsFragment) => {
    const { organizationUrl } = getOrganizationFields(organization, locale, t);

    navigate({
      pathname: organizationUrl,
      search: queryStringWithReturnPath,
    });
  };

  const handleSort = (key: string) => {
    setSort(key as ORGANIZATION_SORT_OPTIONS);
  };

  return (
    <OrganizationsTableContext.Provider
      value={{ onRowClick, showSubOrganizations, sortedOrganizations }}
    >
      <Table ref={table} className={className}>
        <caption aria-live={focused ? 'polite' : undefined}>{caption}</caption>
        <thead>
          <tr>
            <SortableColumn
              className={styles.nameColumn}
              label={t('organizationsPage.organizationsTableColumns.name')}
              onClick={handleSort}
              sort={sort}
              sortKey={ORGANIZATION_SORT_OPTIONS.NAME}
              type="text"
            />
            <SortableColumn
              className={styles.idColumn}
              label={t('organizationsPage.organizationsTableColumns.id')}
              onClick={handleSort}
              sort={sort}
              sortKey={ORGANIZATION_SORT_OPTIONS.ID}
              type="text"
            />

            <SortableColumn
              className={styles.dataSourceColumn}
              label={t(
                'organizationsPage.organizationsTableColumns.dataSource'
              )}
              onClick={handleSort}
              sort={sort}
              sortKey={ORGANIZATION_SORT_OPTIONS.DATA_SOURCE}
              type="default"
            />
            <SortableColumn
              className={styles.classificationColumn}
              label={t(
                'organizationsPage.organizationsTableColumns.classification'
              )}
              onClick={handleSort}
              sort={sort}
              sortKey={ORGANIZATION_SORT_OPTIONS.CLASSIFICATION}
              type="default"
            />
            <SortableColumn
              className={styles.parentColumn}
              label={t(
                'organizationsPage.organizationsTableColumns.parentOrganization'
              )}
              onClick={handleSort}
              sort={sort}
              sortKey={ORGANIZATION_SORT_OPTIONS.PARENT_ORGANIZATION}
              type="default"
            />

            <th className={styles.actionButtonsColumn}></th>
          </tr>
        </thead>
        <tbody>
          {organizations.map(
            (organization) =>
              organization && (
                <OrganizationsTableRow
                  key={organization?.id}
                  organization={organization}
                />
              )
          )}
          {!organizations.length && <NoDataRow colSpan={5} />}
        </tbody>
      </Table>
    </OrganizationsTableContext.Provider>
  );
};

export default OrganizationsTable;
