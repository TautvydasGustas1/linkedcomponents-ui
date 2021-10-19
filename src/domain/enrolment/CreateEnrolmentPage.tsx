import { Form, Formik } from 'formik';
import React from 'react';
import { useParams } from 'react-router';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ValidationError } from 'yup';

import LoadingSpinner from '../../common/components/loadingSpinner/LoadingSpinner';
import {
  EventFieldsFragment,
  Registration,
  useEventQuery,
} from '../../generated/graphql';
import getPathBuilder from '../../utils/getPathBuilder';
import Container from '../app/layout/Container';
import MainContent from '../app/layout/MainContent';
import PageWrapper from '../app/layout/PageWrapper';
import { EVENT_INCLUDES } from '../event/constants';
import { eventPathBuilder } from '../event/utils';
import NotFound from '../notFound/NotFound';
import AuthRequiredNotification from '../registration/authRequiredNotification/AuthRequiredNotification';
import { registrationsResponse } from '../registrations/__mocks__/registrationsPage';
import useDebouncedLoadingUser from '../user/hooks/useDebouncedLoadingUser';
import { ENROLMENT_INITIAL_VALUES } from './constants';
import CreateButtonPanel from './createButtonPanel/CreateButtonPanel';
import EnrolmentFormFields from './enrolmentFormFields/EnrolmentFormFields';
import styles from './enrolmentPage.module.scss';
import EventInfo from './eventInfo/EventInfo';
import FormContainer from './formContainer/FormContainer';
import { enrolmentSchema, scrollToFirstError, showErrors } from './validation';

type Props = {
  event: EventFieldsFragment;
  registration: Registration;
};

const CreateEnrolmentPage: React.FC<Props> = ({ event, registration }) => {
  return (
    <PageWrapper
      className={styles.registrationPage}
      title={`createEnrolmentPage.pageTitle`}
    >
      <MainContent>
        <Formik
          initialValues={ENROLMENT_INITIAL_VALUES}
          onSubmit={/* istanbul ignore next */ () => undefined}
          validationSchema={enrolmentSchema}
        >
          {({ setErrors, setTouched, values }) => {
            const clearErrors = () => setErrors({});

            const handleSubmit = async () => {
              try {
                clearErrors();

                await enrolmentSchema.validate(values, { abortEarly: false });

                toast.error('TODO: Save enrolment');
              } catch (error) {
                showErrors({
                  error: error as ValidationError,
                  setErrors,
                  setTouched,
                });

                scrollToFirstError({ error: error as ValidationError });
              }
            };

            return (
              <Form noValidate>
                <Container withOffset>
                  <FormContainer>
                    <AuthRequiredNotification />
                    <EventInfo event={event} />
                    <div className={styles.divider} />
                    <EnrolmentFormFields />
                  </FormContainer>
                </Container>
                <CreateButtonPanel
                  onSave={handleSubmit}
                  registration={registration}
                />
              </Form>
            );
          }}
        </Formik>
      </MainContent>
    </PageWrapper>
  );
};

const CreateEnrolmentPageWrapper: React.FC = () => {
  const location = useLocation();
  const loadingUser = useDebouncedLoadingUser();
  const { registrationId } = useParams<{ registrationId: string }>();
  // TODO: Use real registration data when API is available
  const registration = registrationsResponse.registrations.data.find(
    (item) => item.id === registrationId
  );

  const { data: eventData, loading: loadingEvent } = useEventQuery({
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
    skip: loadingUser || !registration?.eventId,
    variables: {
      createPath: getPathBuilder(eventPathBuilder),
      id: registration?.eventId as string,
      include: EVENT_INCLUDES,
    },
  });
  const loading = loadingUser || loadingEvent;

  return (
    <LoadingSpinner isLoading={loading}>
      {eventData?.event && registration ? (
        <CreateEnrolmentPage
          event={eventData?.event}
          registration={registration}
        />
      ) : (
        <NotFound pathAfterSignIn={`${location.pathname}${location.search}`} />
      )}
    </LoadingSpinner>
  );
};

export default CreateEnrolmentPageWrapper;
