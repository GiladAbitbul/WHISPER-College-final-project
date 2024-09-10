import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreateRealTimeChat from '../screens/CreateRealTimeChatScreen'; // Adjust this path as needed
import { addDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Adjust this path as needed
import { generateKeys } from '../utils/encryptionRSA_ESA'; // Adjust this path as needed

// Mock the firebase modules
jest.mock('../firebase', () => ({
    auth: {
      currentUser: {
        uid: 'testuid',
        email: 'test@example.com',
      },
    },
    db: {},
  }));
  
  jest.mock('firebase/firestore', () => ({
    addDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(),
    serverTimestamp: jest.fn(),
  }));
  
  jest.mock('../utils/encryptionRSA_ESA', () => ({
    generateKeys: jest.fn().mockResolvedValue({ publicKey: 'testPublicKey', privateKey: 'testPrivateKey' }),
  }));
  
  // Mock the navigation object
  const mockNavigation = {
    setOptions: jest.fn(),
    pop: jest.fn(),
  };
  


describe('CreateRealTimeChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<CreateRealTimeChat navigation={mockNavigation} />);
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    expect(getByText('Find User')).toBeTruthy();
    expect(getByPlaceholderText('Member email')).toBeTruthy();
  });

  it('handles email input', () => {
    const { getByPlaceholderText } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'user@example.com');
    expect(emailInput.props.value).toBe('user@example.com');
  });

  it('shows email suggestions', () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'user@g');
    expect(getByText('gmail.com')).toBeTruthy();
  });

  it('handles suggestion click', () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'user@g');
    fireEvent.press(getByText('gmail.com'));
    expect(emailInput.props.value).toBe('user@gmail.com');
  });

  it('handles adding a user', async () => {
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

    const { getByPlaceholderText, getByTestId, queryAllByText, queryByTestId } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'user@example.com');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      const userElements = queryAllByText('user@example.com');
      expect(userElements.length).toBeGreaterThan(0);
      expect(queryByTestId('remove-user-button')).toBeTruthy();
    });
  });

  it('displays error for invalid email', async () => {
    const { getByPlaceholderText, getByTestId, findByText } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'invalid-email');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    const errorMessage = await findByText('Please enter a valid email address');
    expect(errorMessage).toBeTruthy();
  });

  it('prevents adding own email', async () => {
    const { getByPlaceholderText, getByTestId, findByText } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'test@example.com'); // This is the current user's email
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    const errorMessage = await findByText('You cannot add your own email.');
    expect(errorMessage).toBeTruthy();
  });
  it('handles removing added member', async () => {
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

    const { getByPlaceholderText, getByTestId, queryAllByText, queryByTestId } = renderComponent();
    const emailInput = getByPlaceholderText('Member email');
    fireEvent.changeText(emailInput, 'user@example.com');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(queryAllByText('user@example.com').length).toBeGreaterThan(0);
    });

    const removeButton = getByTestId('remove-user-button');
    fireEvent.press(removeButton);

    await waitFor(() => {
      expect(queryAllByText('user@example.com').length).toBe(0); // All instances of the email should be removed
      expect(queryByTestId('remove-user-button')).toBeFalsy();
    });

    // Check if the input field is cleared and available for new input
    const emailInputAfterRemoval = getByPlaceholderText('Member email');
    expect(emailInputAfterRemoval.props.value).toBe('');
  });
});