import { Field } from 'formik';
import React from 'react';
import { useTranslation } from 'react-i18next';

import DeleteButton from '../../../../../common/components/deleteButton/DeleteButton';
import SingleSelectField from '../../../../../common/components/formFields/singleSelectField/SingleSelectField';
import TextInputField from '../../../../../common/components/formFields/textInputField/TextInputField';
import { EVENT_FIELDS, EXTERNAL_LINK_FIELDS } from '../../../constants';
import useExtlinkOptions from '../../../hooks/useExtlinkOptions';
import FieldWithButton from '../../../layout/FieldWithButton';
import { ExternalLink as ExternalLinkType } from '../../../types';
import styles from './externalLinks.module.scss';

type ExternalLinkProps = {
  isEditingAllowed: boolean;
  onDelete: () => void;
  externalLink: ExternalLinkType;
  index: number;
  type: string;
};

const getExternalLinkPath = (index: number, path: string) =>
  `${EVENT_FIELDS.EXTERNAL_LINKS}[${index}].${path}`;

const ExternalLink: React.FC<ExternalLinkProps> = ({
  isEditingAllowed,
  onDelete,
  externalLink,
  index,
  type,
}) => {
  const { t } = useTranslation();

  const options = useExtlinkOptions();

  const getExternalLinkName = (name: string) => {
    return options.find((option) => option.value === name)?.label;
  };

  return (
    <FieldWithButton
      button={
        <DeleteButton
          ariaLabel={t('event.form.buttonDeleteExternalLink')}
          disabled={!isEditingAllowed}
          onClick={onDelete}
        />
      }
      hasLabel={false}
    >
      <div className={styles.externalLink}>
        <Field
          className={styles.nameSelector}
          component={SingleSelectField}
          disabled={!isEditingAllowed}
          label={t(`event.form.labelExternalLinkName`)}
          name={getExternalLinkPath(index, EXTERNAL_LINK_FIELDS.NAME)}
          options={options}
          placeholder={t(`common.select`)}
          required
        />
        <Field
          component={TextInputField}
          disabled={!isEditingAllowed}
          hideLabel={true}
          label={t(`event.form.labelExternalLinkLink.${type}`, {
            name: getExternalLinkName(externalLink.name),
          })}
          name={getExternalLinkPath(index, EXTERNAL_LINK_FIELDS.LINK)}
          placeholder={t(`event.form.placeholderExternalLinkLink.${type}`, {
            name: getExternalLinkName(externalLink.name),
          })}
          required
        />
      </div>
    </FieldWithButton>
  );
};

export default ExternalLink;
