/* eslint-disable max-len */
import {
  ApolloClient,
  NormalizedCacheObject,
  ServerError,
  useApolloClient,
} from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { ValidationError } from 'yup';

import CheckboxField from '../../../common/components/formFields/checkboxField/CheckboxField';
import PublisherSelectorField from '../../../common/components/formFields/publisherSelectorField/PublisherSelectorField';
import SingleKeywordSelectorField from '../../../common/components/formFields/singleKeywordSelectorField/SingleKeywordSelectorField';
import TextInputField from '../../../common/components/formFields/textInputField/TextInputField';
import ServerErrorSummary from '../../../common/components/serverErrorSummary/ServerErrorSummary';
import {
  LE_DATA_LANGUAGES,
  ORDERED_LE_DATA_LANGUAGES,
  ROUTES,
} from '../../../constants';
import {
  CreateKeywordMutationInput,
  KeywordFieldsFragment,
  useCreateKeywordMutation,
} from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import lowerCaseFirstLetter from '../../../utils/lowerCaseFirstLetter';
import {
  scrollToFirstError,
  showFormErrors,
} from '../../../utils/validationUtils';
import styles from '../../admin/layout/form.module.scss';
import FormRow from '../../admin/layout/formRow/FormRow';
import { reportError } from '../../app/sentry/utils';
import { clearKeywordsQueries } from '../../keywords/utils';
import useOrganizationAncestors from '../../organization/hooks/useOrganizationAncestors';
import useUser from '../../user/hooks/useUser';
import {
  KEYWORD_ACTIONS,
  KEYWORD_FIELDS,
  KEYWORD_INITIAL_VALUES,
} from '../constants';
import CreateButtonPanel from '../createButtonPanel/CreateButtonPanel';
import EditButtonPanel from '../editButtonPanel/EditButtonPanel';
import useKeywordServerErrors from '../hooks/useKeywordServerErrors';
import useKeywordUpdateActions from '../hooks/useKeywordUpdateActions';
import KeywordAuthenticationNotification from '../keywordAuthenticationNotification/KeywordAuthenticationNotification';
import { KeywordFormFields } from '../types';
import {
  checkCanUserDoAction,
  getKeywordInitialValues,
  getKeywordPayload,
} from '../utils';
import { keywordSchema } from '../validation';

type KeywordFormProps = {
  keyword?: KeywordFieldsFragment;
};

const KeywordForm: React.FC<KeywordFormProps> = ({ keyword }) => {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const { organizationAncestors } = useOrganizationAncestors(
    keyword?.publisher ?? ''
  );

  const isEditingAllowed = checkCanUserDoAction({
    action: keyword ? KEYWORD_ACTIONS.UPDATE : KEYWORD_ACTIONS.CREATE,
    organizationAncestors,
    publisher: keyword?.publisher ?? '',
    user,
  });

  const { serverErrorItems, setServerErrorItems, showServerErrors } =
    useKeywordServerErrors();

  const { saving, setSaving, updateKeyword } = useKeywordUpdateActions({
    keyword: keyword as KeywordFieldsFragment,
  });

  const [createKeywordMutation] = useCreateKeywordMutation();

  const goToKeywordsPage = () => {
    navigate(`/${locale}${ROUTES.KEYWORDS}`);
  };

  const onUpdate = async (values: KeywordFormFields) => {
    await updateKeyword(values, {
      onError: (error: ServerError) => showServerErrors({ error }),
      onSuccess: async () => {
        goToKeywordsPage();
      },
    });
  };

  const createSingleKeyword = async (payload: CreateKeywordMutationInput) => {
    try {
      const data = await createKeywordMutation({
        variables: { input: payload },
      });

      return data.data?.createKeyword.id as string;
    } catch (error) /* istanbul ignore next */ {
      showServerErrors({ error });
      // // Report error to Sentry
      reportError({
        data: {
          error: error as Record<string, unknown>,
          payload,
          payloadAsString: JSON.stringify(payload),
        },
        location,
        message: 'Failed to create keyword',
        user,
      });
    }
  };

  const createKeyword = async (values: KeywordFormFields) => {
    setSaving(KEYWORD_ACTIONS.CREATE);
    const payload = getKeywordPayload(values);

    const createdKeywordId = await createSingleKeyword(payload);

    if (createdKeywordId) {
      // Clear all keywords queries from apollo cache to show added registrations
      // in registration list
      clearKeywordsQueries(apolloClient);
      goToKeywordsPage();
    }

    setSaving(null);
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={
        keyword ? getKeywordInitialValues(keyword) : KEYWORD_INITIAL_VALUES
      }
      // We have custom way to handle onSubmit so here is empty function
      // to silent TypeScript error. The reason for custom onSubmit is that
      // we want to scroll to first invalid field if error occurs

      onSubmit={/* istanbul ignore next */ () => undefined}
      validateOnMount
      validateOnBlur={true}
      validateOnChange={true}
      validationSchema={isEditingAllowed && keywordSchema}
    >
      {({ setErrors, setTouched, values }) => {
        const clearErrors = () => setErrors({});

        const handleSubmit = async (
          event?: React.FormEvent<HTMLFormElement>
        ) => {
          event?.preventDefault();

          try {
            setServerErrorItems([]);
            clearErrors();

            await keywordSchema.validate(values, { abortEarly: false });

            if (keyword) {
              await onUpdate(values);
            } else {
              await createKeyword(values);
            }
          } catch (error) {
            showFormErrors({
              error: error as ValidationError,
              setErrors,
              setTouched,
            });

            scrollToFirstError({ error: error as ValidationError });
          }
        };

        return (
          <Form className={styles.form} noValidate={true}>
            <KeywordAuthenticationNotification
              action={keyword ? KEYWORD_ACTIONS.UPDATE : KEYWORD_ACTIONS.CREATE}
              publisher={
                keyword ? (keyword.publisher as string) : values.publisher
              }
            />
            <ServerErrorSummary errors={serverErrorItems} />

            <FormRow className={styles.borderInMobile}>
              <Field
                className={styles.alignedInputWithFullBorder}
                component={TextInputField}
                label={t(`keyword.form.labelId`)}
                name={KEYWORD_FIELDS.ID}
                readOnly
              />
            </FormRow>

            <FormRow className={styles.borderInMobile}>
              <Field
                className={
                  !isEditingAllowed || keyword
                    ? styles.alignedInputWithFullBorder
                    : styles.alignedInput
                }
                component={TextInputField}
                label={t(`keyword.form.labelDataSource`)}
                name={KEYWORD_FIELDS.DATA_SOURCE}
                readOnly
              />
            </FormRow>

            <FormRow
              className={
                !isEditingAllowed || keyword ? styles.borderInMobile : ''
              }
            >
              <Field
                className={styles.alignedInput}
                component={TextInputField}
                label={t(`keyword.form.labelOriginId`)}
                name={KEYWORD_FIELDS.ORIGIN_ID}
                readOnly={!isEditingAllowed || !!keyword}
              />
            </FormRow>

            <FormRow>
              <Field
                className={styles.alignedSelect}
                clearable
                component={PublisherSelectorField}
                label={t(`keyword.form.labelPublisher`)}
                name={KEYWORD_FIELDS.PUBLISHER}
                disabled={!isEditingAllowed || !!keyword}
              />
            </FormRow>

            {ORDERED_LE_DATA_LANGUAGES.map((language, i) => {
              const langText = lowerCaseFirstLetter(
                t(`form.inLanguage.${language}`)
              );
              const isLastRow = ORDERED_LE_DATA_LANGUAGES.length - 1 === i;

              return (
                <FormRow
                  key={language}
                  className={
                    /* istanbul ignore next */
                    !isEditingAllowed ? styles.borderInMobile : ''
                  }
                >
                  <Field
                    className={
                      /* istanbul ignore next */
                      !isEditingAllowed && !isLastRow
                        ? styles.alignedInputWithFullBorder
                        : styles.alignedInput
                    }
                    component={TextInputField}
                    label={`${t('keyword.form.labelName')} (${langText})`}
                    name={`${KEYWORD_FIELDS.NAME}.${language}`}
                    readOnly={!isEditingAllowed}
                    required={language === LE_DATA_LANGUAGES.FI}
                  />
                </FormRow>
              );
            })}

            <FormRow>
              <Field
                className={styles.alignedSelect}
                clearable
                component={SingleKeywordSelectorField}
                disabled={!isEditingAllowed}
                label={t(`keyword.form.labelReplacedBy`)}
                name={KEYWORD_FIELDS.REPLACED_BY}
              />
            </FormRow>

            <FormRow>
              <Field
                component={CheckboxField}
                disabled={!isEditingAllowed}
                label={t(`keyword.form.labelDeprecated`)}
                name={KEYWORD_FIELDS.DEPRECATED}
              />
            </FormRow>
            {keyword ? (
              <EditButtonPanel
                id={values.id}
                onSave={handleSubmit}
                publisher={keyword.publisher as string}
                saving={saving}
              />
            ) : (
              <CreateButtonPanel
                onSave={handleSubmit}
                publisher={values.publisher}
                saving={saving}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
};

export default KeywordForm;
