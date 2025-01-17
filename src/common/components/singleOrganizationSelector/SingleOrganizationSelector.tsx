import { SingleSelectProps } from 'hds-react';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';

import useAllOrganizations from '../../../domain/organization/hooks/useAllOrganizations';
import { getOrganizationFields } from '../../../domain/organization/utils';
import { OrganizationFieldsFragment } from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import { Language, OptionType } from '../../../types';
import Combobox from '../combobox/Combobox';

type ValueType = string | null;

const getOption = ({
  locale,
  organization,
  t,
}: {
  locale: Language;
  organization: OrganizationFieldsFragment;
  t: TFunction;
}): OptionType => {
  const { atId: value, fullName: label } = getOrganizationFields(
    organization,
    locale,
    t
  );

  return { label, value };
};

export type SingleOrganizationSelectorProps = {
  name: string;
  value: ValueType;
} & Omit<SingleSelectProps<OptionType>, 'options' | 'value'>;

const SingleOrganizationSelector: React.FC<SingleOrganizationSelectorProps> = ({
  label,
  name,
  value,
  ...rest
}) => {
  const { t } = useTranslation();
  const locale = useLocale();

  const { organizations } = useAllOrganizations();

  const options: OptionType[] = React.useMemo(
    () =>
      organizations.map((organization) =>
        getOption({ locale, organization, t })
      ) ?? /* istanbul ignore next */ [],
    [locale, organizations, t]
  );

  const selectedOrganization = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  return (
    <Combobox
      {...rest}
      multiselect={false}
      id={name}
      label={label}
      options={options}
      toggleButtonAriaLabel={t('common.combobox.toggleButtonAriaLabel')}
      // Combobox doesn't accept null as value so cast null to undefined. Null is needed to avoid
      // "A component has changed the uncontrolled prop "selectedItem" to be controlled" warning
      value={selectedOrganization as OptionType | undefined}
    />
  );
};

export default SingleOrganizationSelector;
