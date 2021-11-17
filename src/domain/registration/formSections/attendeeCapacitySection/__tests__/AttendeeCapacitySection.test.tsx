import { Formik } from 'formik';
import React from 'react';

import {
  configure,
  render,
  screen,
  userEvent,
} from '../../../../../utils/testUtils';
import translations from '../../../../app/i18n/fi.json';
import { REGISTRATION_FIELDS } from '../../../constants';
import { registrationSchema } from '../../../validation';
import AttendeeCapacitySection from '../AttendeeCapacitySection';

configure({ defaultHidden: true });

type InitialValues = {
  [REGISTRATION_FIELDS.MAXIMUM_ATTENDEE_CAPACITY]: number | '';
  [REGISTRATION_FIELDS.MINIMUM_ATTENDEE_CAPACITY]: number | '';
};

const defaultInitialValues: InitialValues = {
  [REGISTRATION_FIELDS.MAXIMUM_ATTENDEE_CAPACITY]: '',
  [REGISTRATION_FIELDS.MINIMUM_ATTENDEE_CAPACITY]: '',
};

const renderComponent = (initialValues?: Partial<InitialValues>) =>
  render(
    <Formik
      initialValues={{ ...defaultInitialValues, ...initialValues }}
      onSubmit={jest.fn()}
      enableReinitialize={true}
      validationSchema={registrationSchema}
    >
      <AttendeeCapacitySection />
    </Formik>
  );

const getElement = (key: 'maxCapacity' | 'minCapacity') => {
  switch (key) {
    case 'maxCapacity':
      return screen.getByRole('spinbutton', {
        name: translations.registration.form.labelMinimumAttendeeCapacity,
      });

    case 'minCapacity':
      return screen.getByRole('spinbutton', {
        name: translations.registration.form.labelMaximumAttendeeCapacity,
      });
  }
};

test('should show validation error if min capacity is less than 0', async () => {
  renderComponent({
    [REGISTRATION_FIELDS.MINIMUM_ATTENDEE_CAPACITY]: -1,
  });

  const minCapacityInput = getElement('minCapacity');
  const maxCapacityInput = getElement('maxCapacity');

  userEvent.click(minCapacityInput);
  userEvent.click(maxCapacityInput);
  userEvent.tab();

  await screen.findByText('Arvon tulee olla vähintään 0');
});

test('should show validation error if max capacity is less than min capacity', async () => {
  renderComponent({
    [REGISTRATION_FIELDS.MAXIMUM_ATTENDEE_CAPACITY]: 5,
    [REGISTRATION_FIELDS.MINIMUM_ATTENDEE_CAPACITY]: 10,
  });

  const minCapacityInput = getElement('minCapacity');
  const maxCapacityInput = getElement('maxCapacity');

  userEvent.click(maxCapacityInput);
  userEvent.click(minCapacityInput);
  userEvent.tab();

  await screen.findByText('Arvon tulee olla vähintään 10');
});