import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import { addDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { generateKeys } from '../utils/encryptionRSA_ESA';
import { act } from 'react-test-renderer';

import * as ImagePicker from 'expo-image-picker';

jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'testuid', email: 'test@example.com' } },
  db: {},
  storage: {},
}));

// Mock the entire CreateGroupScreen component
jest.mock('../screens/CreateGroupScreen', () => {
    const originalModule = jest.requireActual('../screens/CreateGroupScreen');
    return {
      __esModule: true,
      default: jest.fn(originalModule.default),
    };
  });
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn().mockResolvedValue({ id: 'newGroupId' }),
  getDocs: jest.fn(),
  setDoc: jest.fn().mockResolvedValue({}),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn().mockReturnValue('mocked-timestamp'),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../utils/encryptionRSA_ESA', () => ({
  generateKeys: jest.fn().mockResolvedValue({ publicKey: 'testPublicKey', privateKey: 'testPrivateKey' }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockNavigation = { setOptions: jest.fn(), goBack: jest.fn() };


describe('CreateGroupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    expect(getByText('Add Members')).toBeTruthy();
    expect(getByPlaceholderText('Group name (Required)')).toBeTruthy();
    expect(getByPlaceholderText('Member email')).toBeTruthy();
  });

  it('handles group name input', () => {
    const { getByPlaceholderText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    const groupNameInput = getByPlaceholderText('Group name (Required)');
    
    fireEvent.changeText(groupNameInput, 'Test Group');
    
  
  });

  it('shows email suggestions', () => {
    const { getByPlaceholderText, queryByText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'user@g');
    
    expect(queryByText('gmail.com')).toBeTruthy();
  });

 

 it('handles adding a member', async () => {
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 'userid',
        data: () => ({
          email: 'user@example.com',
          profileImageURL: 'https://example.com/profile.jpg'
        })
      }]
    });
  
    const { getByPlaceholderText, getByTestId, queryAllByText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'user@example.com');
    
    await waitFor(() => {
      const addButton = getByTestId('addMemberButton');
      expect(addButton).toBeTruthy();
      fireEvent.press(addButton);
    }, { timeout: 10000 });
  
    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      const memberTexts = queryAllByText('user@example.com');
      expect(memberTexts.length).toBeGreaterThan(0);
      if (memberTexts.length === 0) {
        throw new Error('Member text not found');
      }
    }, { timeout: 10000 });
  }, 30000);

  it('handles image picking', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }]
    });

    const { getByTestId } = render(<CreateGroupScreen navigation={mockNavigation} />);
    
    const pickImageButton = getByTestId('pick-image-button');
    fireEvent.press(pickImageButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });


// it('handles group creation', async () => {
//     const mockHandleCreateGroupPress = jest.fn();
//     CreateGroupScreen.mockImplementation((props) => {
//       const OriginalComponent = jest.requireActual('../screens/CreateGroupScreen').default;
//       return <OriginalComponent {...props} handleCreateGroupPress={mockHandleCreateGroupPress} />;
//     });
  
//     getDocs.mockResolvedValueOnce({
//       empty: false,
//       docs: [{
//         id: 'userid',
//         data: () => ({
//           email: 'user@example.com',
//           profileImageURL: 'https://example.com/profile.jpg'
//         })
//       }]
//     });
  
//     const { getByPlaceholderText, getByTestId, queryAllByText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    
//     const groupNameInput = getByPlaceholderText('Group name (Necessarily)');
//     fireEvent.changeText(groupNameInput, 'Test Group');
//     console.log('Group name input value:', groupNameInput.props.value);
  
//     const emailInput = getByPlaceholderText('Member email');
//     fireEvent.changeText(emailInput, 'user@example.com');
//     console.log('Email input value:', emailInput.props.value);
    
//     await waitFor(() => {
//       const addButton = getByTestId('addMemberButton');
//       expect(addButton).toBeTruthy();
//       fireEvent.press(addButton);
//       console.log('Add button pressed');
//     }, { timeout: 10000 });
  
//     // Check if the member was added
//     await waitFor(() => {
//       const addedMembers = queryAllByText('user@example.com');
//       expect(addedMembers.length).toBeGreaterThan(0);
//       console.log('Members added:', addedMembers.length);
//     }, { timeout: 10000 });
  
//     console.log('Navigation options:', JSON.stringify(mockNavigation.setOptions.mock.calls[0][0], null, 2));
  
//     await waitFor(() => {
//       const headerRight = mockNavigation.setOptions.mock.calls[0][0].headerRight;
//       expect(headerRight).toBeDefined();
//       console.log('headerRight function:', headerRight.toString());
//       const createGroupButton = headerRight();
//       console.log('Create Group button:', createGroupButton);
      
//       if (createGroupButton && createGroupButton.props && createGroupButton.props.onPress) {
//         console.log('onPress function found, calling it directly');
//         createGroupButton.props.onPress();
//       } else {
//         console.log('No onPress function found, trying to fire press event');
//         fireEvent.press(createGroupButton);
//       }
      
//       console.log('Create Group button pressed');
//     }, { timeout: 10000 });
  
//     await waitFor(() => {
//       console.log('handleCreateGroupPress called:', mockHandleCreateGroupPress.mock.calls.length > 0 ? 'Yes' : 'No');
//       expect(mockHandleCreateGroupPress).toHaveBeenCalled();
//     }, { timeout: 10000 });
  
//     // Only check these if handleCreateGroupPress was called
//     if (mockHandleCreateGroupPress.mock.calls.length > 0) {
//       await waitFor(() => {
//         console.log('addDoc called:', addDoc.mock.calls.length > 0 ? 'Yes' : 'No');
//         console.log('setDoc called:', setDoc.mock.calls.length > 0 ? 'Yes' : 'No');
//         console.log('navigation.goBack called:', mockNavigation.goBack.mock.calls.length > 0 ? 'Yes' : 'No');
//         expect(addDoc).toHaveBeenCalled();
//         expect(setDoc).toHaveBeenCalled();
//         expect(mockNavigation.goBack).toHaveBeenCalled();
//       }, { timeout: 10000 });
//     }
//   }, 30000);



  it('displays error for invalid group name', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    
    const groupNameInput = getByPlaceholderText('Group name (Required)');
    fireEvent.changeText(groupNameInput, 'Te');

    fireEvent.press(getByText('Create Group'));

    const errorMessage = await findByText('Group name must be at least 3 characters long');
    expect(errorMessage).toBeTruthy();
  });

  it('displays error for no members added', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<CreateGroupScreen navigation={mockNavigation} />);
    
    const groupNameInput = getByPlaceholderText('Group name (Required)');
    fireEvent.changeText(groupNameInput, 'Test Group');
    fireEvent.press(getByText('Create Group'));

    const errorMessage = await findByText('Please add at least one member to the group');
    expect(errorMessage).toBeTruthy();
  });
});
