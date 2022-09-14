/* eslint @typescript-eslint/explicit-function-return-type: 0 */
import { useContext } from 'react';

import { AuthContext } from '../AuthContext';
import { AuthContextProps } from '../types';

export const useAuth = (): AuthContextProps => {
  const context = useContext<AuthContextProps | undefined>(AuthContext);

  if (!context) {
    throw new Error(
      // eslint-disable-next-line max-len
      'AuthProvider context is undefined, please verify you are calling useAuth() as child of a <AuthProvider> component.'
    );
  }

  return context;
};