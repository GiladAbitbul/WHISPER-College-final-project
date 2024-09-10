import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../screens/EditProfileScreen';
import { auth } from '../firebase';

const mockSetOptions = jest.fn();
const mockNavigation = {
  setOptions: mockSetOptions,
  pop: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'testuid',
      email: 'test@example.com',
    },
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      profileImageURL: 'https://example.com/image.jpg',
      status: 'Test status',
    }),
  }),
  updateDoc: jest.fn(),
}));
const mockRoute = { params: { groupId: 'testGroupId' } };

describe('EditProfileScreen', () => {
  it('renders correctly', async () => {
    render(<EditProfileScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(mockSetOptions).toHaveBeenCalled();
      const headerTitle = mockSetOptions.mock.calls[0][0].headerTitle;
      const headerTitleElement = headerTitle();
      expect(headerTitleElement.props.children.props.children).toBe('My Profile');
    });
  });

  it('handles status input', async () => {
    const { getByPlaceholderText } = render(<EditProfileScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      const statusInput = getByPlaceholderText('*No Status*');
      fireEvent.changeText(statusInput, 'New status');
      expect(statusInput.props.value).toBe('New status');
    });
  });

  it('handles password input', async () => {
    const { getByPlaceholderText } = render(<EditProfileScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      const currentPasswordInput = getByPlaceholderText('Current Password');
      const newPasswordInput = getByPlaceholderText('New Password');
      const confirmNewPasswordInput = getByPlaceholderText('Confirm New Password');

      fireEvent.changeText(currentPasswordInput, 'currentpass');
      fireEvent.changeText(newPasswordInput, 'newpass123');
      fireEvent.changeText(confirmNewPasswordInput, 'newpass123');

      expect(currentPasswordInput.props.value).toBe('currentpass');
      expect(newPasswordInput.props.value).toBe('newpass123');
      expect(confirmNewPasswordInput.props.value).toBe('newpass123');
    });
  });

  it('shows error for mismatched passwords', async () => {
    const { getByPlaceholderText, getByText } = render(<EditProfileScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      const newPasswordInput = getByPlaceholderText('New Password');
      const confirmNewPasswordInput = getByPlaceholderText('Confirm New Password');

      fireEvent.changeText(newPasswordInput, 'newpass123');
      fireEvent.changeText(confirmNewPasswordInput, 'newpass456');

      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('handles save changes', async () => {
    const { getByText, getByTestId } = render(<EditProfileScreen  route={mockRoute} navigation={mockNavigation} />);
    await waitFor(() => expect(getByText('Save Changes')).toBeTruthy());
 
  });
});
