import {
  ApolloClient,
  FetchResult,
  NormalizedCacheObject,
  useApolloClient,
} from '@apollo/client';
import { Form, Formik } from 'formik';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { ValidationError } from 'yup';

import Breadcrumb from '../../common/components/breadcrumb/Breadcrumb';
import FormikPersist from '../../common/components/formikPersist/FormikPersist';
import LoadingSpinner from '../../common/components/loadingSpinner/LoadingSpinner';
import ServerErrorSummary from '../../common/components/serverErrorSummary/ServerErrorSummary';
import { FORM_NAMES, LE_DATA_LANGUAGES, ROUTES } from '../../constants';
import {
  CreateEventMutationInput,
  CreateEventsMutation,
  PublicationStatus,
  useCreateEventMutation,
  useCreateEventsMutation,
} from '../../generated/graphql';
import useLocale from '../../hooks/useLocale';
import { showFormErrors } from '../../utils/validationUtils';
import Container from '../app/layout/container/Container';
import MainContent from '../app/layout/mainContent/MainContent';
import PageWrapper from '../app/layout/pageWrapper/PageWrapper';
import Section from '../app/layout/section/Section';
import { reportError } from '../app/sentry/utils';
import { useAuth } from '../auth/hooks/useAuth';
import { EVENT_CREATE_ACTIONS, EVENT_INITIAL_VALUES } from '../event/constants';
import { clearEventsQueries } from '../events/utils';
import useUser from '../user/hooks/useUser';
import CreateButtonPanel from './createButtonPanel/CreateButtonPanel';
import AuthenticationNotification from './eventAuthenticationNotification/EventAuthenticationNotification';
import styles from './eventPage.module.scss';
import AdditionalInfoSection from './formSections/additionalInfoSection/AdditionalInfoSection';
import AudienceSection from './formSections/audienceSection/AudienceSection';
import ChannelsSection from './formSections/channelsSection/ChannelsSection';
import ClassificationSection from './formSections/classificationSection/ClassificationSection';
import DescriptionSection from './formSections/descriptionSection/DescriptionSection';
import ImageSection from './formSections/imageSection/ImageSection';
import LanguagesSection from './formSections/languagesSection/LanguagesSection';
import PlaceSection from './formSections/placeSection/PlaceSection';
import PriceSection from './formSections/priceSection/PriceSection';
import ResponsibilitiesSection from './formSections/responsibilitiesSection/ResponsibilitiesSection';
import SummarySection from './formSections/summarySection/SummarySection';
import TimeSection from './formSections/timeSection/TimeSection';
import TypeSection from './formSections/typeSection/TypeSection';
import VideoSection from './formSections/videoSection/VideoSection';
import useEventFieldOptionsData from './hooks/useEventFieldOptionsData';
import useEventServerErrors from './hooks/useEventServerErrors';
import useUpdateImageIfNeeded from './hooks/useUpdateImageIfNeeded';
import { EventFormFields } from './types';
import {
  canUserCreateEvent,
  getEventPayload,
  getRecurringEventPayload,
  scrollToFirstError,
} from './utils';
import { draftEventSchema, publicEventSchema } from './validation';

const CreateEventPage: React.FC = () => {
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const { serverErrorItems, setServerErrorItems, showServerErrors } =
    useEventServerErrors();
  const navigate = useNavigate();
  const location = useLocation();
  const locale = useLocale();
  const { t } = useTranslation();

  const { isAuthenticated: authenticated } = useAuth();
  const { user } = useUser();

  const [createEventMutation] = useCreateEventMutation();
  const [createEventsMutation] = useCreateEventsMutation();
  const { updateImageIfNeeded } = useUpdateImageIfNeeded();
  const [descriptionLanguage, setDescriptionLanguage] = React.useState(
    EVENT_INITIAL_VALUES.eventInfoLanguages[0] as LE_DATA_LANGUAGES
  );
  const [saving, setSaving] = React.useState<EVENT_CREATE_ACTIONS | null>(null);

  const goToEventSavedPage = (id: string) => {
    navigate(`/${locale}${ROUTES.EVENT_SAVED.replace(':id', id)}`);
  };

  const createRecurringEvent = async (
    payload: CreateEventMutationInput[],
    values: EventFormFields
  ) => {
    let eventsData: FetchResult<CreateEventsMutation> | null = null;

    // Save sub-events
    try {
      eventsData = await createEventsMutation({
        variables: { input: payload },
      });
    } catch (error) /* istanbul ignore next */ {
      showServerErrors({ error, eventType: values.type });
      // Report error to Sentry
      reportError({
        data: {
          error: error as Record<string, unknown>,
          payload,
          payloadAsString: JSON.stringify(payload),
        },
        location,
        message: 'Failed to create sub-events in recurring event creation',
        user,
      });
      // Don't save recurring event if sub-event creation fails
      return;
    }

    /* istanbul ignore next */
    const subEventIds =
      eventsData?.data?.createEvents.map((item) => item.atId) || [];
    const recurringEventPayload = getRecurringEventPayload(
      payload,
      subEventIds,
      values
    );

    try {
      const recurringEventData = await createEventMutation({
        variables: { input: recurringEventPayload },
      });

      return recurringEventData.data?.createEvent.id as string;
    } catch (error) /* istanbul ignore next */ {
      showServerErrors({ error, eventType: values.type });
      // Report error to Sentry
      reportError({
        data: {
          error: error as Record<string, unknown>,
          payload: recurringEventPayload,
          payloadAsString: JSON.stringify(recurringEventPayload),
        },
        location,
        message: 'Failed to create recurring event',
        user,
      });
    }
  };

  const createSingleEvent = async (
    payload: CreateEventMutationInput,
    values: EventFormFields
  ) => {
    try {
      const data = await createEventMutation({
        variables: { input: payload },
      });

      return data.data?.createEvent.id as string;
    } catch (error) /* istanbul ignore next */ {
      showServerErrors({ error, eventType: values.type });
      // Report error to Sentry
      reportError({
        data: {
          error: error as Record<string, unknown>,
          payload,
          payloadAsString: JSON.stringify(payload),
        },
        location,
        message: 'Failed to create event',
        user,
      });
    }
  };

  const getAction = (
    publicationStatus: PublicationStatus
  ): EVENT_CREATE_ACTIONS => {
    switch (publicationStatus) {
      case PublicationStatus.Draft:
        return EVENT_CREATE_ACTIONS.CREATE_DRAFT;
      case PublicationStatus.Public:
        return EVENT_CREATE_ACTIONS.PUBLISH;
    }
  };

  const createEvent = async (
    values: EventFormFields,
    publicationStatus: PublicationStatus
  ) => {
    setSaving(getAction(publicationStatus));
    try {
      await updateImageIfNeeded(values);
    } catch (error) /* istanbul ignore next */ {
      // Report error to Sentry
      reportError({
        data: {
          error: error as Record<string, unknown>,
          images: values.images,
          imageDetails: values.imageDetails,
        },
        location,
        message: 'Failed to update image',
        user,
      });
    }

    const payload = getEventPayload(values, publicationStatus);
    let createdEventId: string | undefined;

    if (Array.isArray(payload)) {
      createdEventId = await createRecurringEvent(payload, values);
    } else {
      createdEventId = await createSingleEvent(payload, values);
    }

    if (createdEventId) {
      // Clear all events queries from apollo cache to show added events in event list
      clearEventsQueries(apolloClient);
      // This action will change LE response so clear event list page
      goToEventSavedPage(createdEventId);
    }

    setSaving(null);
  };

  /* istanbul ignore next */
  const initialValues = React.useMemo(
    () => ({
      ...EVENT_INITIAL_VALUES,
      publisher: user?.organization ?? '',
    }),
    [user]
  );

  return (
    <Formik
      initialValues={initialValues}
      // We have custom way to handle onSubmit so here is empty function
      // to silent TypeScript error. The reason for custom onSubmit is that
      // we want to scroll to first invalid field if error occurs
      onSubmit={/* istanbul ignore next */ () => undefined}
      validationSchema={publicEventSchema}
      validateOnMount
      validateOnBlur={false}
      validateOnChange={true}
    >
      {({
        values: { publisher, type, ...restValues },
        setErrors,
        setTouched,
      }) => {
        const isCreateEventAllowed = (action: EVENT_CREATE_ACTIONS) => {
          return canUserCreateEvent({
            action,
            authenticated,
            publisher,
            user,
          });
        };

        /* istanbul ignore next */
        const isEditingAllowed =
          isCreateEventAllowed(EVENT_CREATE_ACTIONS.CREATE_DRAFT) ||
          isCreateEventAllowed(EVENT_CREATE_ACTIONS.PUBLISH);

        const clearErrors = () => setErrors({});

        const handleSubmit = async (
          publicationStatus: PublicationStatus,
          event?: React.FormEvent<HTMLFormElement>
        ) => {
          event?.preventDefault();

          try {
            const values = { publisher, type, ...restValues };

            setServerErrorItems([]);
            clearErrors();

            if (publicationStatus === PublicationStatus.Draft) {
              await draftEventSchema.validate(values, { abortEarly: false });
            } else {
              await publicEventSchema.validate(values, { abortEarly: false });
            }
            await createEvent(values, publicationStatus);
          } catch (error) {
            showFormErrors({
              error: error as ValidationError,
              setErrors,
              setTouched,
            });

            await scrollToFirstError({
              descriptionLanguage,
              error: error as ValidationError,
              setDescriptionLanguage,
            });
          }
        };

        return (
          <Form noValidate={true}>
            <FormikPersist name={FORM_NAMES.EVENT_FORM} isSessionStorage={true}>
              <PageWrapper
                className={styles.eventPage}
                title={`createEventPage.pageTitle.${type}`}
              >
                <MainContent>
                  <Container
                    className={styles.createContainer}
                    withOffset={true}
                  >
                    <Breadcrumb className={styles.breadcrumb}>
                      <Breadcrumb.Item to={ROUTES.HOME}>
                        {t('common.home')}
                      </Breadcrumb.Item>
                      <Breadcrumb.Item to={ROUTES.EVENTS}>
                        {t('eventsPage.title')}
                      </Breadcrumb.Item>
                      <Breadcrumb.Item active={true}>
                        {t(`createEventPage.title.${type}`)}
                      </Breadcrumb.Item>
                    </Breadcrumb>

                    <AuthenticationNotification />
                    <ServerErrorSummary errors={serverErrorItems} />

                    <Section title={t('event.form.sections.type')}>
                      <TypeSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.languages')}>
                      <LanguagesSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.responsibilities')}>
                      <ResponsibilitiesSection
                        isEditingAllowed={isEditingAllowed}
                      />
                    </Section>
                    <Section title={t('event.form.sections.description')}>
                      <DescriptionSection
                        isEditingAllowed={isEditingAllowed}
                        selectedLanguage={descriptionLanguage}
                        setSelectedLanguage={setDescriptionLanguage}
                      />
                    </Section>
                    <Section title={t('event.form.sections.time')}>
                      <TimeSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.place')}>
                      <PlaceSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.price')}>
                      <PriceSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t(`event.form.sections.channels.${type}`)}>
                      <ChannelsSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.image')}>
                      <ImageSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.video')}>
                      <VideoSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.classification')}>
                      <ClassificationSection
                        isEditingAllowed={isEditingAllowed}
                      />
                    </Section>
                    <Section title={t('event.form.sections.audience')}>
                      <AudienceSection isEditingAllowed={isEditingAllowed} />
                    </Section>
                    <Section title={t('event.form.sections.additionalInfo')}>
                      <AdditionalInfoSection
                        isEditingAllowed={isEditingAllowed}
                      />
                    </Section>

                    <SummarySection isEditingAllowed={isEditingAllowed} />
                  </Container>
                  <CreateButtonPanel
                    onPublish={() => handleSubmit(PublicationStatus.Public)}
                    onSaveDraft={() => handleSubmit(PublicationStatus.Draft)}
                    publisher={publisher}
                    saving={saving}
                  />
                </MainContent>
              </PageWrapper>
            </FormikPersist>
          </Form>
        );
      }}
    </Formik>
  );
};

const CreateEventPageWrapper: React.FC = () => {
  const { loading: loadingUser } = useUser();

  // Load options for inLanguage, audience and keywords checkboxes
  const { loading: loadingEventFieldOptions } = useEventFieldOptionsData();

  const loading = loadingEventFieldOptions || loadingUser;

  return (
    <LoadingSpinner isLoading={loading}>
      <CreateEventPage />
    </LoadingSpinner>
  );
};

export default CreateEventPageWrapper;
