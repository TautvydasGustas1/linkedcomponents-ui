// eslint-disable-next-line import/no-named-as-default
import gql from 'graphql-tag';

export const QUERY_REGISTRATION = gql`
  fragment registrationFields on Registration {
    id
    atId
    audienceMaxAge
    audienceMinAge
    confirmationMessage
    createdBy
    currentAttendeeCount
    currentWaitingListCount
    enrolmentEndTime
    enrolmentStartTime
    event
    instructions
    lastModifiedAt
    maximumAttendeeCapacity
    minimumAttendeeCapacity
    signups {
      ...enrolmentFields
    }
    waitingListCapacity
  }

  query Registration($id: ID!, $include: [String], $createPath: Any) {
    registration(id: $id, include: $include)
      @rest(type: "Registration", pathBuilder: $createPath) {
      ...registrationFields
    }
  }
`;
