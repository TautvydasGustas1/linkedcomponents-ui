import { IconCross } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../../common/components/button/Button';
import LoadingSpinner from '../../../common/components/loadingSpinner/LoadingSpinner';
import Modal from '../../../common/components/modal/Modal';
import styles from './modals.module.scss';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  isSaving,
  onClose,
  onDelete,
}) => {
  const { t } = useTranslation();

  const handleClose = (event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    onClose();
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onDelete();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      shouldCloseOnEsc={true}
      size="m"
      title={t('registration.deleteRegistrationModal.title')}
      type="alert"
    >
      <p className={styles.warning}>
        <strong>{t('common.warning')}</strong>
      </p>
      <p>{t('registration.deleteRegistrationModal.text')} </p>
      <div className={styles.modalButtonWrapper}>
        <Button
          disabled={isSaving}
          iconLeft={
            isSaving ? (
              <LoadingSpinner
                className={styles.loadingSpinner}
                isLoading={isSaving}
                small={true}
              />
            ) : (
              <IconCross />
            )
          }
          onClick={handleDelete}
          type="button"
          variant="danger"
        >
          {t('registration.deleteRegistrationModal.buttonDelete')}
        </Button>
        <Button
          disabled={isSaving}
          onClick={handleClose}
          theme="black"
          type="button"
          variant="secondary"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;