import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditGroupScreen from '../screens/EditGroupScreen';
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { auth } from '../firebase';

jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'testuid', email: 'test@example.com' }
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn().mockResolvedValue({}),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      groupName: 'Test Group',
      groupImageURL: 'http://example.com/image.jpg',
      groupAdmin: 'testuid',
      members: ['testuid']
    })
  }),
  getDocs: jest.fn().mockResolvedValue({
    empty: false,
    docs: [{ id: 'newMemberId', data: () => ({ email: 'new@example.com' }) }]
  }),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'fake-image-uri' }]
  }),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

global.setImmediate = jest.fn().mockImplementation((callback) => callback());

const mockRoute = { params: { groupId: 'testGroupId' } };
const mockNavigation = { setOptions: jest.fn(), goBack: jest.fn() };

describe('EditGroupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for admin', async () => {
    const { getByText, getByTestId } = render(
      <EditGroupScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Group Name:')).toBeTruthy();
      expect(getByText('Group Members:')).toBeTruthy();
      expect(getByTestId('group-name-input')).toBeTruthy();
      expect(getByText('Save Changes')).toBeTruthy();
    });
  });

  it('renders correctly for non-admin', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        groupName: 'Test Group',
        groupImageURL: 'http://example.com/image.jpg',
        groupAdmin: 'otheruid',
        members: ['testuid']
      })
    });

    const { getByText, queryByTestId } = render(
      <EditGroupScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Group Name:')).toBeTruthy();
      expect(getByText('Group Members:')).toBeTruthy();
      expect(queryByTestId('group-name-input')).toBeNull();
    });
  });

  it('handles group name change', async () => {
    const { getByTestId } = render(
      <EditGroupScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      const input = getByTestId('group-name-input');
      fireEvent.changeText(input, 'New Group Name');
      expect(input.props.value).toBe('New Group Name');
    });
  });

  it('handles add member', async () => {
    const { getByTestId } = render(
      <EditGroupScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => {
      const input = getByTestId('new-member-input');
      fireEvent.changeText(input, 'new@example.com');
    });

    await act(async () => {
      const addButton = await waitFor(() => getByTestId('add-member-button'));
      fireEvent.press(addButton);
    });

    expect(getDocs).toHaveBeenCalled();
  });

   it('handles save changes', async () => {
    const { getByText, getByTestId } = render(
      <EditGroupScreen route={mockRoute} navigation={mockNavigation} />
    );

    await waitFor(() => expect(getByText('Save Changes')).toBeTruthy());

    // Simulate a change to enable the Save Changes button
    const groupNameInput = getByTestId('group-name-input');
    fireEvent.changeText(groupNameInput, 'New Group Name');

    await act(async () => {
      fireEvent.press(getByText('Save Changes'));
    });

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(mockNavigation.goBack).toHaveBeenCalled();
    }, { timeout: 5000 });  // Increase timeout if needed
  });
});
