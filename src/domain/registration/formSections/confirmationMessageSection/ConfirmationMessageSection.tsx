import { Field } from 'formik';
import React from 'react';
import { useTranslation } from 'react-i18next';

import TextAreaField from '../../../../common/components/formFields/TextAreaField';
import FieldColumn from '../../../app/layout/FieldColumn';
import FieldRow from '../../../app/layout/FieldRow';
import { REGISTRATION_FIELDS } from '../../constants';

const ConfirmationMessageSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <FieldRow>
      <FieldColumn>
        <Field
          name={REGISTRATION_FIELDS.CONFIRMATION_MESSAGE}
          component={TextAreaField}
          label={t(`registration.form.labelConfirmationMessage`)}
          placeholder={t(`registration.form.placeholderConfirmationMessage`)}
        />
      </FieldColumn>
    </FieldRow>
  );
};

export default ConfirmationMessageSection;
