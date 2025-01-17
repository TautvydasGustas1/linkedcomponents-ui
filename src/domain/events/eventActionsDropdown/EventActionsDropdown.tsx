import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import ActionsDropdown from '../../../common/components/actionsDropdown/ActionsDropdown';
import { MenuItemOptionProps } from '../../../common/components/menuDropdown/types';
import { ROUTES } from '../../../constants';
import { EventFieldsFragment } from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import useQueryStringWithReturnPath from '../../../hooks/useQueryStringWithReturnPath';
import skipFalsyType from '../../../utils/skipFalsyType';
import { useAuth } from '../../auth/hooks/useAuth';
import { EVENT_EDIT_ACTIONS } from '../../event/constants';
import useEventUpdateActions, {
  MODALS,
} from '../../event/hooks/useEventUpdateActions';
import ConfirmCancelModal from '../../event/modals/confirmCancelModal/ConfirmCancelModal';
import ConfirmDeleteModal from '../../event/modals/confirmDeleteModal/ConfirmDeleteModal';
import ConfirmPostponeModal from '../../event/modals/confirmPostponeModal/ConfirmPostponeModal';
import {
  copyEventToSessionStorage,
  getEditButtonProps,
  getEventFields,
} from '../../event/utils';
import useOrganizationAncestors from '../../organization/hooks/useOrganizationAncestors';
import useUser from '../../user/hooks/useUser';

export interface EventActionsDropdownProps {
  className?: string;
  event: EventFieldsFragment;
}

const EventActionsDropdown = React.forwardRef<
  HTMLDivElement,
  EventActionsDropdownProps
>(({ className, event }, ref) => {
  const { t } = useTranslation();
  const { isAuthenticated: authenticated } = useAuth();
  const locale = useLocale();
  const navigate = useNavigate();
  const { eventUrl } = getEventFields(event, locale);
  const queryStringWithReturnPath = useQueryStringWithReturnPath();

  const {
    cancelEvent,
    closeModal,
    deleteEvent,
    saving,
    openModal,
    postponeEvent,
    setOpenModal,
  } = useEventUpdateActions({ event });
  const { organizationAncestors } = useOrganizationAncestors(
    event.publisher as string
  );
  const { user } = useUser();

  const onCancel = () => {
    cancelEvent();
  };

  const onDelete = () => {
    deleteEvent();
  };

  const onPostpone = () => {
    postponeEvent();
  };

  const goToEditEventPage = () => {
    const eventUrlWithReturnPath = `${eventUrl}${queryStringWithReturnPath}`;
    navigate(eventUrlWithReturnPath);
  };

  const copyEvent = async () => {
    await copyEventToSessionStorage(event, user);
    navigate(`/${locale}${ROUTES.CREATE_EVENT}`);
  };

  const getActionItemProps = ({
    action,
    onClick,
  }: {
    action: EVENT_EDIT_ACTIONS;
    onClick: () => void;
  }): MenuItemOptionProps | null => {
    return getEditButtonProps({
      action,
      authenticated,
      event,
      onClick,
      organizationAncestors,
      t,
      user,
    });
  };

  const actionItems: MenuItemOptionProps[] = [
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.EDIT,
      onClick: goToEditEventPage,
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.COPY,
      onClick: copyEvent,
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.POSTPONE,
      onClick: () => setOpenModal(MODALS.POSTPONE),
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.CANCEL,
      onClick: () => setOpenModal(MODALS.CANCEL),
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.DELETE,
      onClick: () => setOpenModal(MODALS.DELETE),
    }),
  ].filter(skipFalsyType);

  return (
    <div className={className} ref={ref}>
      {openModal === MODALS.CANCEL && (
        <ConfirmCancelModal
          event={event}
          isOpen={openModal === MODALS.CANCEL}
          isSaving={saving === EVENT_EDIT_ACTIONS.CANCEL}
          onCancel={onCancel}
          onClose={closeModal}
        />
      )}
      {openModal === MODALS.DELETE && (
        <ConfirmDeleteModal
          event={event}
          isOpen={openModal === MODALS.DELETE}
          isSaving={saving === EVENT_EDIT_ACTIONS.DELETE}
          onClose={closeModal}
          onDelete={onDelete}
        />
      )}
      {openModal === MODALS.POSTPONE && (
        <ConfirmPostponeModal
          event={event}
          isOpen={openModal === MODALS.POSTPONE}
          isSaving={saving === EVENT_EDIT_ACTIONS.POSTPONE}
          onClose={closeModal}
          onPostpone={onPostpone}
        />
      )}

      <ActionsDropdown items={actionItems} />
    </div>
  );
});

export default EventActionsDropdown;
