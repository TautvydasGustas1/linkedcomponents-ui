import {
  ApolloClient,
  NormalizedCacheObject,
  useApolloClient,
} from '@apollo/client';
import { useLocation } from 'react-router';

import {
  KeywordFieldsFragment,
  UpdateKeywordMutationInput,
  useDeleteKeywordMutation,
  useUpdateKeywordMutation,
} from '../../../generated/graphql';
import useMountedState from '../../../hooks/useMountedState';
import { UpdateActionsCallbacks } from '../../../types';
import isTestEnv from '../../../utils/isTestEnv';
import { reportError } from '../../app/sentry/utils';
import {
  clearKeywordQueries,
  clearKeywordsQueries,
} from '../../keywords/utils';
import useUser from '../../user/hooks/useUser';
import { KEYWORD_ACTIONS } from '../constants';
import { KeywordFormFields } from '../types';
import { getKeywordPayload } from '../utils';

export enum KEYWORD_MODALS {
  DELETE = 'delete',
}

interface Props {
  keyword: KeywordFieldsFragment;
}

type UseKeywordUpdateActionsState = {
  closeModal: () => void;
  deleteKeyword: (callbacks?: UpdateActionsCallbacks) => Promise<void>;
  openModal: KEYWORD_MODALS | null;
  saving: KEYWORD_ACTIONS | null;
  setOpenModal: (modal: KEYWORD_MODALS | null) => void;
  setSaving: (action: KEYWORD_ACTIONS | null) => void;
  updateKeyword: (
    values: KeywordFormFields,
    callbacks?: UpdateActionsCallbacks
  ) => Promise<void>;
};
const useKeywordUpdateActions = ({
  keyword,
}: Props): UseKeywordUpdateActionsState => {
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const { user } = useUser();
  const location = useLocation();
  const [openModal, setOpenModal] = useMountedState<KEYWORD_MODALS | null>(
    null
  );
  const [saving, setSaving] = useMountedState<KEYWORD_ACTIONS | null>(null);

  const [deleteKeywordMutation] = useDeleteKeywordMutation();
  const [updateKeywordMutation] = useUpdateKeywordMutation();

  const closeModal = () => {
    setOpenModal(null);
  };

  const savingFinished = () => {
    setSaving(null);
  };

  const cleanAfterUpdate = async (callbacks?: UpdateActionsCallbacks) => {
    /* istanbul ignore next */
    !isTestEnv && clearKeywordQueries(apolloClient);
    /* istanbul ignore next */
    !isTestEnv && clearKeywordsQueries(apolloClient);

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
    payload?: UpdateKeywordMutationInput;
  }) => {
    savingFinished();

    // Report error to Sentry
    reportError({
      data: {
        error,
        payloadAsString: payload && JSON.stringify(payload),
        keyword,
      },
      location,
      message,
      user,
    });

    // Call callback function if defined
    callbacks?.onError?.(error);
  };

  const deleteKeyword = async (callbacks?: UpdateActionsCallbacks) => {
    try {
      setSaving(KEYWORD_ACTIONS.DELETE);

      await deleteKeywordMutation({
        variables: { id: keyword.id as string },
      });

      await cleanAfterUpdate(callbacks);
    } catch (error) /* istanbul ignore next */ {
      handleError({
        callbacks,
        error,
        message: 'Failed to delete keyword',
      });
    }
  };

  const updateKeyword = async (
    values: KeywordFormFields,
    callbacks?: UpdateActionsCallbacks
  ) => {
    const payload: UpdateKeywordMutationInput = getKeywordPayload(values);

    try {
      setSaving(KEYWORD_ACTIONS.UPDATE);

      await updateKeywordMutation({ variables: { input: payload } });

      await cleanAfterUpdate(callbacks);
    } catch (error) /* istanbul ignore next */ {
      handleError({
        callbacks,
        error,
        message: 'Failed to update keyword',
        payload,
      });
    }
  };

  return {
    closeModal,
    deleteKeyword,
    openModal,
    saving,
    setOpenModal,
    setSaving,
    updateKeyword,
  };
};

export default useKeywordUpdateActions;
