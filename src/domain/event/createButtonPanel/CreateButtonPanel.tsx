import { useField } from 'formik';
import { ButtonVariant } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import ButtonPanel from '../../../common/components/buttonPanel/ButtonPanel';
import LoadingButton from '../../../common/components/loadingButton/LoadingButton';
import { ActionButtonProps, ButtonType } from '../../../types';
import skipFalsyType from '../../../utils/skipFalsyType';
import { useAuth } from '../../auth/hooks/useAuth';
import useUser from '../../user/hooks/useUser';
import { EVENT_CREATE_ACTIONS, EVENT_FIELDS, EVENT_TYPE } from '../constants';
import { getCreateButtonProps } from '../utils';

interface Props {
  onPublish: () => void;
  onSaveDraft: () => void;
  publisher: string;
  saving: EVENT_CREATE_ACTIONS | null;
}

const CreateButtonPanel: React.FC<Props> = ({
  onPublish,
  onSaveDraft,
  publisher,
  saving,
}) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [{ value: eventType }] = useField<EVENT_TYPE>({
    name: EVENT_FIELDS.TYPE,
  });
  const { isAuthenticated: authenticated } = useAuth();

  const getActionButtonProps = ({
    action,
    onClick,
    type,
    variant,
  }: {
    action: EVENT_CREATE_ACTIONS;
    onClick: () => void;
    type: ButtonType;
    variant: Exclude<ButtonVariant, 'supplementary'>;
  }): ActionButtonProps | null => {
    const buttonProps = getCreateButtonProps({
      action,
      authenticated,
      eventType,
      onClick,
      publisher,
      t,
      user,
    });
    return buttonProps
      ? { ...buttonProps, isSaving: saving === action, type, variant }
      : null;
  };

  const actionButtons: ActionButtonProps[] = [
    getActionButtonProps({
      action: EVENT_CREATE_ACTIONS.CREATE_DRAFT,
      onClick: onSaveDraft,
      type: 'button',
      variant: 'secondary',
    }),
    getActionButtonProps({
      action: EVENT_CREATE_ACTIONS.PUBLISH,
      onClick: onPublish,
      type: 'button',
      variant: 'primary',
    }),
  ].filter(skipFalsyType);

  return (
    <ButtonPanel
      submitButtons={actionButtons.map(
        ({ disabled, label, isSaving, ...rest }, index) => (
          <LoadingButton
            key={index}
            {...rest}
            disabled={disabled || Boolean(saving)}
            loading={isSaving}
          >
            {label}
          </LoadingButton>
        )
      )}
    />
  );
};

export default CreateButtonPanel;
