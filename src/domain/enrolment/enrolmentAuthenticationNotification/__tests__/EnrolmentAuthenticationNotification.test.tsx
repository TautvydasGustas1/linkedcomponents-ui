import { MockedResponse } from '@apollo/client/testing';
import React from 'react';

import { UserDocument } from '../../../../generated/graphql';
import { fakeUser } from '../../../../utils/mockDataUtils';
import { fakeAuthenticatedStoreState } from '../../../../utils/mockStoreUtils';
import {
  act,
  configure,
  CustomRenderOptions,
  getMockReduxStore,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../../utils/testUtils';
import userManager from '../../../auth/userManager';
import { mockedEventResponse } from '../../../event/__mocks__/event';
import { registration } from '../../../registration/__mocks__/registration';
import {
  mockedUserResponse,
  userVariables,
} from '../../../user/__mocks__/user';
import { ENROLMENT_ACTIONS } from '../../constants';
import EnrolmentAuthenticationNotification from '../EnrolmentAuthenticationNotification';

configure({ defaultHidden: true });

const renderComponent = (renderOptions?: CustomRenderOptions) =>
  render(
    <EnrolmentAuthenticationNotification
      action={ENROLMENT_ACTIONS.UPDATE}
      registration={registration}
    />,
    renderOptions
  );

test("should show notification if user is signed in but doesn't have any organizations", () => {
  const user = fakeUser({
    adminOrganizations: [],
    organizationMemberships: [],
  });
  const userResponse = { data: { user } };
  const mockedUserResponse: MockedResponse = {
    request: { query: UserDocument, variables: userVariables },
    result: userResponse,
  };
  const mocks = [mockedEventResponse, mockedUserResponse];

  const storeState = fakeAuthenticatedStoreState();
  const store = getMockReduxStore(storeState);

  renderComponent({ mocks, store });

  screen.getByRole('region');
  screen.getByRole('heading', { name: 'Ei oikeuksia muokata osallistujia.' });
});

test('should not show notification if user is signed in and has an admin organization', async () => {
  const mocks = [mockedEventResponse, mockedUserResponse];

  const storeState = fakeAuthenticatedStoreState();
  const store = getMockReduxStore(storeState);

  renderComponent({ mocks, store });

  await waitFor(() =>
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  );
});

test('should start sign in process', async () => {
  const signinRedirect = jest.spyOn(userManager, 'signinRedirect');
  const user = userEvent.setup();
  renderComponent();

  const signInButton = screen.getByRole('button', { name: 'kirjautua sisään' });
  await act(async () => await user.click(signInButton));
  expect(signinRedirect).toBeCalled();
});
