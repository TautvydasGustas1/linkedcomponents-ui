/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as Sentry from '@sentry/react';
import { User } from 'oidc-client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { CallbackComponent } from 'redux-oidc';

import userManager from '../userManager';

interface Error {
  stack?: string;
}

const OidcCallback: React.FC = (props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const onSuccess = (user: User) => {
    if (user.state.path) navigate(user.state.path);
    else navigate('/', { replace: true });
  };

  const onError = (error: Error) => {
    // In case used denies the access
    if (new URLSearchParams(location.hash.replace('#', '?')).get('error')) {
      // TODO: Store url where user clicked login to session storage and navigate to that url
      navigate('/', { replace: true });
    } else {
      toast(t('authentication.errorMessage'), {
        type: toast.TYPE.ERROR,
      });
      // Make sure that we only send errors to Sentry that are actual
      // programming/system errors, not end users's network errors.
      Sentry.captureException(error);
    }
  };

  return (
    // @ts-ignore
    <CallbackComponent
      successCallback={onSuccess}
      errorCallback={onError}
      userManager={userManager}
    >
      <div />
    </CallbackComponent>
  );
};

export default OidcCallback;
