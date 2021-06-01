import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router';

import { SUPPORTED_LANGUAGES } from '../constants';
import { OptionType } from '../types';
import updateLocaleParam from '../utils/updateLocaleParam';
import useLocale from './useLocale';

type UseSelectLanguageState = {
  languageOptions: OptionType[];
  changeLanguage: (
    language: OptionType
  ) => (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
};

const useSelectLanguage = (): UseSelectLanguageState => {
  const { t } = useTranslation();
  const locale = useLocale();
  const history = useHistory();
  const location = useLocation();

  const languageOptions: OptionType[] = React.useMemo(() => {
    return Object.values(SUPPORTED_LANGUAGES).map((language) => ({
      label: t(`navigation.languages.${language}`),
      value: language,
    }));
  }, [t]);

  const changeLanguage =
    (newLanguage: OptionType) =>
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      history.push({
        pathname: updateLocaleParam(
          location.pathname,
          locale,
          newLanguage.value
        ),
        search: location.search,
      });
    };
  return { changeLanguage, languageOptions };
};

export default useSelectLanguage;