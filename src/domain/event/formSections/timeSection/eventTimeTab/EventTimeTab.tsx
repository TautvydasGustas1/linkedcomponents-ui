import React from 'react';
import { useTranslation } from 'react-i18next';

import FieldColumn from '../../../../app/layout/fieldColumn/FieldColumn';
import FieldRow from '../../../../app/layout/fieldRow/FieldRow';
import { EventTime } from '../../../types';
import AddEventTimeForm from '../addEventTimeForm/AddEventTimeForm';
import EventTimesSummary from '../eventTimesSummary/EventTimesSummary';
import TimeSectionContext from '../TimeSectionContext';
import TimeSectionNotification from '../timeSectionNotification/TimeSectionNotification';
import { sortEventTimes } from '../utils';
import ValidationError from '../validationError/ValidationError';

const EventTimeTab: React.FC = () => {
  const { t } = useTranslation();
  const { eventTimes, eventType, setEventTimes } =
    React.useContext(TimeSectionContext);

  const addEventTime = (eventTime: EventTime) => {
    const sortedEventTimes = [...eventTimes];
    sortedEventTimes.push(eventTime);
    sortedEventTimes.sort(sortEventTimes);
    setEventTimes(sortedEventTimes);
  };

  return (
    <>
      <h3>{t(`event.form.titleEnterEventTime.${eventType}`)}</h3>
      <FieldRow notification={<TimeSectionNotification />}>
        <FieldColumn>
          <AddEventTimeForm addEventTime={addEventTime} />
          <ValidationError />
        </FieldColumn>
        <EventTimesSummary />
      </FieldRow>
    </>
  );
};

export default EventTimeTab;
