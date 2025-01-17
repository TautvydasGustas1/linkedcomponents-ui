import {
  ApolloClient,
  NormalizedCacheObject,
  useApolloClient,
} from '@apollo/client';
import { useLocation } from 'react-router';

import {
  RegistrationFieldsFragment,
  UpdateRegistrationMutationInput,
  useDeleteRegistrationMutation,
  useUpdateRegistrationMutation,
} from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import useMountedState from '../../../hooks/useMountedState';
import { UpdateActionsCallbacks } from '../../../types';
import isTestEnv from '../../../utils/isTestEnv';
import { reportError } from '../../app/sentry/utils';
import { REGISTRATION_ACTIONS } from '../../registrations/constants';
import { clearRegistrationsQueries } from '../../registrations/utils';
import useUser from '../../user/hooks/useUser';
import { RegistrationFormFields } from '../types';
import { getRegistrationFields, getRegistrationPayload } from '../utils';

export enum MODALS {
  DELETE = 'delete',
}

interface Props {
  registration: RegistrationFieldsFragment;
}

type UseRegistrationUpdateActionsState = {
  closeModal: () => void;
  deleteRegistration: (callbacks?: UpdateActionsCallbacks) => Promise<void>;
  openModal: MODALS | null;
  saving: REGISTRATION_ACTIONS | false;
  setOpenModal: (modal: MODALS | null) => void;
  updateRegistration: (
    values: RegistrationFormFields,
    callbacks?: UpdateActionsCallbacks
  ) => Promise<void>;
};
const useRegistrationUpdateActions = ({
  registration,
}: Props): UseRegistrationUpdateActionsState => {
  const locale = useLocale();
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const { user } = useUser();
  const location = useLocation();
  const [saving, setSaving] = useMountedState<REGISTRATION_ACTIONS | false>(
    false
  );
  const [openModal, setOpenModal] = useMountedState<MODALS | null>(null);
  const { id } = getRegistrationFields(registration, locale);
  const [updateRegistrationMutation] = useUpdateRegistrationMutation();
  const [deleteRegistrationMutation] = useDeleteRegistrationMutation();

  const savingFinished = () => {
    setSaving(false);
  };

  const closeModal = () => {
    setOpenModal(null);
  };

  const cleanAfterUpdate = async (callbacks?: UpdateActionsCallbacks) => {
    /* istanbul ignore next */
    !isTestEnv && clearRegistrationsQueries(apolloClient);

    savingFinished();
    closeModal();
    // Call callback function if defined
    await (callbacks?.onSuccess && callbacks.onSuccess());
  };

  const handleError = ({
    callbacks,
    error,
    message,
    payload,
  }: {
    callbacks?: UpdateActionsCallbacks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
    message: string;
    payload?: UpdateRegistrationMutationInput;
  }) => {
    savingFinished();

    // Report error to Sentry
    reportError({
      data: {
        error,
        payloadAsString: payload && JSON.stringify(payload),
        registration,
      },
      location,
      message,
      user,
    });

    // Call callback function if defined
    callbacks?.onError?.(error);
  };

  const deleteRegistration = async (callbacks?: UpdateActionsCallbacks) => {
    try {
      setSaving(REGISTRATION_ACTIONS.DELETE);
      await deleteRegistrationMutation({ variables: { id } });

      await cleanAfterUpdate(callbacks);
    } catch (error) /* istanbul ignore next */ {
      handleError({
        callbacks,
        error,
        message: 'Failed to delete event',
      });
    }
  };

  const updateRegistration = async (
    values: RegistrationFormFields,
    callbacks?: UpdateActionsCallbacks
  ) => {
    let payload: UpdateRegistrationMutationInput = {
      event: values.event,
      id: registration.id as string,
    };

    try {
      setSaving(REGISTRATION_ACTIONS.UPDATE);

      payload = {
        ...getRegistrationPayload(values),
        id: registration.id as string,
      };

      await updateRegistrationMutation({ variables: { input: payload } });

      await cleanAfterUpdate(callbacks);
    } catch (error) /* istanbul ignore next */ {
      handleError({
        callbacks,
        error,
        message: 'Failed to update registration',
        payload,
      });
    }
  };

  return {
    closeModal,
    deleteRegistration,
    openModal,
    saving,
    setOpenModal,
    updateRegistration,
  };
};

export default useRegistrationUpdateActions;
