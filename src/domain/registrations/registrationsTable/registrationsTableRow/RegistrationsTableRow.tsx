import React from 'react';
import { useTranslation } from 'react-i18next';

import { RegistrationFieldsFragment } from '../../../../generated/graphql';
import useLocale from '../../../../hooks/useLocale';
import useTimeFormat from '../../../../hooks/useTimeFormat';
import formatDate from '../../../../utils/formatDate';
import OrganizationName from '../../../organization/organizationName/OrganizationName';
import useRegistrationName from '../../../registration/hooks/useRegistrationName';
import useRegistrationPublisher from '../../../registration/hooks/useRegistrationPublisher';
import {
  getRegistrationFields,
  getRegistrationItemId,
} from '../../../registration/utils';
import RegistrationActionsDropdown from '../../registrationActionsDropdown/RegistrationActionsDropdown';
import styles from '../registrationsTable.module.scss';

interface Props {
  registration: RegistrationFieldsFragment;
  onRowClick: (registration: RegistrationFieldsFragment) => void;
}

const RegistrationsTableRow: React.FC<Props> = ({
  registration,
  onRowClick,
}) => {
  const { t } = useTranslation();
  const locale = useLocale();
  const actionsDropdownRef = React.useRef<HTMLDivElement>(null);
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const timeFormat = useTimeFormat();

  const {
    currentAttendeeCount,
    currentWaitingListCount,
    enrolmentStartTime,
    enrolmentEndTime,
    id,
    maximumAttendeeCapacity,
    waitingListCapacity,
  } = getRegistrationFields(registration, locale);

  const name = useRegistrationName({ registration });
  const publisher = useRegistrationPublisher({ registration });

  const handleRowClick = (ev: React.MouseEvent) => {
    /* istanbul ignore else */
    if (
      ev.target instanceof Node &&
      !actionsDropdownRef.current?.contains(ev.target)
    ) {
      onRowClick(registration);
    }
  };

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    /* istanbul ignore else */
    if (ev.key === 'Enter' && ev.target === rowRef.current) {
      onRowClick(registration);
    }
  };

  return (
    <>
      <tr
        ref={rowRef}
        role="button"
        aria-label={name}
        id={getRegistrationItemId(id)}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <td className={styles.nameColumn}>
          <div className={styles.nameWrapper}>
            <span className={styles.registrationName} title={name}>
              {name}
            </span>
          </div>
        </td>
        <td className={styles.publisherColumn}>
          <OrganizationName id={publisher} />
        </td>
        <td className={styles.enrolmentsColumn}>
          {currentAttendeeCount} / {maximumAttendeeCapacity}
        </td>
        <td className={styles.waitingListColumn}>
          {currentWaitingListCount} / {waitingListCapacity}
        </td>
        <td className={styles.enrolmentStartTimeColumn}>
          {enrolmentStartTime
            ? t('eventsPage.datetime', {
                date: formatDate(enrolmentStartTime),
                time: formatDate(enrolmentStartTime, timeFormat, locale),
              })
            : /* istanbul ignore next */ '-'}
        </td>
        <td className={styles.enrolmentEndTimeColumn}>
          {enrolmentEndTime
            ? t('eventsPage.datetime', {
                date: formatDate(enrolmentEndTime),
                time: formatDate(enrolmentEndTime, timeFormat, locale),
              })
            : /* istanbul ignore next */ '-'}
        </td>
        <td className={styles.actionButtonsColumn}>
          <RegistrationActionsDropdown
            ref={actionsDropdownRef}
            registration={registration}
          />
        </td>
      </tr>
    </>
  );
};

export default RegistrationsTableRow;
