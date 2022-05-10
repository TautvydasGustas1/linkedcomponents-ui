import { MockedResponse } from '@apollo/client/testing';
import React from 'react';

import { TEST_USER_ID } from '../../../../constants';
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
import { TEST_PUBLISHER_ID } from '../../../organization/constants';
import { PLACE_ACTIONS } from '../../constants';
import PlaceAuthenticationNotification, {
  PlaceAuthenticationNotificationProps,
} from '../PlaceAuthenticationNotification';

configure({ defaultHidden: true });

const userVariables = { createPath: undefined, id: TEST_USER_ID };

const props: PlaceAuthenticationNotificationProps = {
  action: PLACE_ACTIONS.UPDATE,
  publisher: TEST_PUBLISHER_ID,
};

const renderComponent = (renderOptions?: CustomRenderOptions) =>
  render(<PlaceAuthenticationNotification {...props} />, renderOptions);

const storeState = fakeAuthenticatedStoreState();
const store = getMockReduxStore(storeState);

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
  const mocks = [mockedUserResponse];

  renderComponent({ mocks, store });

  screen.getByRole('heading', { name: 'Ei oikeuksia muokata paikkoja.' });
});

test('should not show notification if user is signed in and has an admin organization', async () => {
  const user = fakeUser({
    adminOrganizations: [TEST_PUBLISHER_ID],
    organizationMemberships: [],
  });
  const userResponse = { data: { user } };
  const mockedUserResponse: MockedResponse = {
    request: { query: UserDocument, variables: userVariables },
    result: userResponse,
  };
  const mocks = [mockedUserResponse];

  renderComponent({ mocks, store });

  await waitFor(() =>
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  );
});

test('should show notification if user has an admin organization but it is different than publisher', async () => {
  const user = fakeUser({
    adminOrganizations: ['not-publisher'],
    organizationMemberships: [],
  });
  const userResponse = { data: { user } };
  const mockedUserResponse: MockedResponse = {
    request: { query: UserDocument, variables: userVariables },
    result: userResponse,
  };
  const mocks = [mockedUserResponse];

  renderComponent({ mocks, store });

  await screen.findByRole('heading', { name: 'Paikkaa ei voi muokata' });
  screen.getByText('Sinulla ei ole oikeuksia muokata tätä paikkaa.');
});

test('should start sign in process', async () => {
  const user = userEvent.setup();
  const signinRedirect = jest.spyOn(userManager, 'signinRedirect');

  renderComponent();

  const signInButton = screen.getByRole('button', { name: 'kirjautua sisään' });
  await act(async () => await user.click(signInButton));
  expect(signinRedirect).toBeCalled();
});
