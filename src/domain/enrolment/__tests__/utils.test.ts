import { Notification } from '../../../generated/graphql';
import { fakeEnrolment } from '../../../utils/mockDataUtils';
import { getEnrolmentInitialValues } from '../utils';

describe('getEnrolmentInitialValues function', () => {
  it('should return default values if value is not set', () => {
    const {
      city,
      email,
      extraInfo,
      membershipNumber,
      name,
      nativeLanguage,
      notifications,
      notificationLanguage,
      phoneNumber,
      serviceLanguage,
      streetAddress,
      yearOfBirth,
      zip,
    } = getEnrolmentInitialValues(
      fakeEnrolment({
        city: null,
        email: null,
        extraInfo: null,
        membershipNumber: null,
        name: null,
        nativeLanguage: null,
        notifications: null,
        notificationLanguage: null,
        phoneNumber: null,
        serviceLanguage: null,
        streetAddress: null,
        yearOfBirth: null,
        zip: null,
      })
    );

    expect(city).toBe('');
    expect(email).toBe('');
    expect(extraInfo).toBe('');
    expect(membershipNumber).toBe('');
    expect(name).toBe('');
    expect(nativeLanguage).toBe('');
    expect(notifications).toEqual([]);
    expect(notificationLanguage).toBe('');
    expect(phoneNumber).toBe('');
    expect(serviceLanguage).toBe('');
    expect(streetAddress).toBe('');
    expect(yearOfBirth).toBe('');
    expect(zip).toBe('');
  });

  it('should return enrolment initial values', () => {
    const expectedCity = 'City';
    const expectedEmail = 'user@email.com';
    const expectedExtraInfo = 'Extra info';
    const expectedMembershipNumber = 'XXX-XXX-XXX';
    const expectedName = 'Name';
    const expectedNativeLanguage = 'fi';
    const expectedNotifications = [Notification.Email];
    const expectedNotificationLanguage = 'sv';
    const expectedPhoneNumber = '+358 44 123 4567';
    const expectedServiceLanguage = 'en';
    const expectedStreetAddress = 'Street address';
    const expectedYearOfBirth = '2021';
    const expectedZip = '00100';

    const {
      city,
      email,
      extraInfo,
      membershipNumber,
      name,
      nativeLanguage,
      notifications,
      notificationLanguage,
      phoneNumber,
      serviceLanguage,
      streetAddress,
      yearOfBirth,
      zip,
    } = getEnrolmentInitialValues(
      fakeEnrolment({
        city: expectedCity,
        email: expectedEmail,
        extraInfo: expectedExtraInfo,
        membershipNumber: expectedMembershipNumber,
        name: expectedName,
        nativeLanguage: expectedNativeLanguage,
        notifications: [
          ...expectedNotifications,
          'not-exist',
        ] as Notification[],
        notificationLanguage: expectedNotificationLanguage,
        phoneNumber: expectedPhoneNumber,
        serviceLanguage: expectedServiceLanguage,
        streetAddress: expectedStreetAddress,
        yearOfBirth: expectedYearOfBirth,
        zip: expectedZip,
      })
    );

    expect(city).toBe(expectedCity);
    expect(email).toBe(expectedEmail);
    expect(extraInfo).toBe(expectedExtraInfo);
    expect(membershipNumber).toBe(expectedMembershipNumber);
    expect(name).toBe(expectedName);
    expect(nativeLanguage).toBe(expectedNativeLanguage);
    expect(notifications).toEqual(expectedNotifications);
    expect(notificationLanguage).toBe(expectedNotificationLanguage);
    expect(phoneNumber).toBe(expectedPhoneNumber);
    expect(serviceLanguage).toBe(expectedServiceLanguage);
    expect(streetAddress).toBe(expectedStreetAddress);
    expect(yearOfBirth).toBe(expectedYearOfBirth);
    expect(zip).toBe(expectedZip);
  });
});