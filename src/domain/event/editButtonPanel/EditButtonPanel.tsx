import classNames from 'classnames';
import { ButtonVariant, IconArrowLeft } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';

import Button from '../../../common/components/button/Button';
import MenuDropdown from '../../../common/components/menuDropdown/MenuDropdown';
import { MenuItemOptionProps } from '../../../common/components/menuDropdown/MenuItem';
import { ROUTES } from '../../../constants';
import {
  EventFieldsFragment,
  PublicationStatus,
} from '../../../generated/graphql';
import useLocale from '../../../hooks/useLocale';
import Container from '../../app/layout/Container';
import FormContainer from '../../app/layout/FormContainer';
import { authenticatedSelector } from '../../auth/selectors';
import useUser from '../../user/hooks/useUser';
import { EVENT_EDIT_ACTIONS } from '../constants';
import useEventOrganizationAncestors from '../hooks/useEventOrganizationAncestors';
import { copyEventToSessionStorage, getEditButtonProps } from '../utils';
import styles from './editButtonPanel.module.scss';

type ActionButtonProps = { variant: ButtonVariant } & MenuItemOptionProps;

export interface EditButtonPanelProps {
  event: EventFieldsFragment;
  onCancel: () => void;
  onDelete: () => void;
  onPostpone: () => void;
  onUpdate: (publicationStatus: PublicationStatus) => void;
}

const EditButtonPanel: React.FC<EditButtonPanelProps> = ({
  event,
  onCancel,
  onDelete,
  onPostpone,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const authenticated = useSelector(authenticatedSelector);
  const locale = useLocale();
  const history = useHistory();

  const { organizationAncestors } = useEventOrganizationAncestors(event);
  const { user } = useUser();

  const goToEventsPage = () => {
    history.push(`/${locale}${ROUTES.EVENTS}`);
  };

  const copyEvent = async () => {
    await copyEventToSessionStorage(event);
    history.push(`/${locale}${ROUTES.CREATE_EVENT}`);
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

  const getActionButtonProps = ({
    action,
    onClick,
    variant,
  }: {
    action: EVENT_EDIT_ACTIONS;
    onClick: () => void;
    variant: ButtonVariant;
  }): ActionButtonProps | null => {
    const buttonProps = getEditButtonProps({
      action,
      authenticated,
      event,
      onClick,
      organizationAncestors,
      t,
      user,
    });
    return buttonProps ? { ...buttonProps, variant } : null;
  };

  const actionItems: MenuItemOptionProps[] = [
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.COPY,
      onClick: copyEvent,
    }),
    /* Actions for all event */
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.POSTPONE,
      onClick: onPostpone,
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.CANCEL,
      onClick: onCancel,
    }),
    getActionItemProps({
      action: EVENT_EDIT_ACTIONS.DELETE,
      onClick: onDelete,
    }),
  ].filter((i) => i) as MenuItemOptionProps[];

  const actionButtons: ActionButtonProps[] = [
    /* Actions for draft event */
    getActionButtonProps({
      action: EVENT_EDIT_ACTIONS.UPDATE_DRAFT,
      onClick: () => onUpdate(PublicationStatus.Draft),
      variant: 'secondary',
    }),
    getActionButtonProps({
      action: EVENT_EDIT_ACTIONS.PUBLISH,
      onClick: () => onUpdate(PublicationStatus.Public),
      variant: 'primary',
    }),
    /* Actions for public event */
    getActionButtonProps({
      action: EVENT_EDIT_ACTIONS.UPDATE_PUBLIC,
      onClick: () => onUpdate(PublicationStatus.Public),
      variant: 'primary',
    }),
  ].filter((i) => i) as ActionButtonProps[];

  return (
    <div className={styles.editButtonPanel}>
      <Container>
        <FormContainer>
          <div className={styles.buttonsRow}>
            <div className={styles.buttonWrapper}>
              <Button
                className={classNames(styles.backButton, styles.smallButton)}
                iconLeft={<IconArrowLeft />}
                fullWidth={true}
                onClick={goToEventsPage}
                type="button"
                variant="secondary"
              >
                {t('event.form.buttonBack')}
              </Button>
              <div className={styles.mediumButton}>
                <MenuDropdown
                  buttonLabel={t('event.form.buttonActions')}
                  closeOnItemClick={true}
                  items={actionItems}
                  menuPosition="top"
                />
              </div>
            </div>
            <div className={styles.buttonWrapper}>
              {actionButtons.map(({ icon, label, variant, ...rest }, index) => (
                <Button
                  key={index}
                  {...rest}
                  iconLeft={variant === 'primary' && icon}
                  className={styles.mediumButton}
                  variant={variant as any}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </FormContainer>
      </Container>
    </div>
  );
};

export default EditButtonPanel;
