import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreateChat from '../screens/CreateChatScreen'; // Adjust this path as needed
import { addDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Adjust this path as needed
import { generateKeys } from '../utils/encryptionRSA_ESA'; // Adjust this path as needed

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

const mockNavigation = {
  setOptions: jest.fn(),
  pop: jest.fn(),
};

describe('CreateChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<CreateChat navigation={mockNavigation} />);
    
    expect(getByText('Find User')).toBeTruthy();
    expect(getByPlaceholderText('Member email')).toBeTruthy();
  });

  it('handles email input', () => {
    const { getByPlaceholderText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');

    fireEvent.changeText(emailInput, 'user@example.com');

    expect(emailInput.props.value).toBe('user@example.com');
  });

  it('shows email suggestions', () => {
    const { getByPlaceholderText, getByText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');

    fireEvent.changeText(emailInput, 'user@g');

    expect(getByText('gmail.com')).toBeTruthy();
  });

  it('handles suggestion click', () => {
    const { getByPlaceholderText, getByText } = render(<CreateChat navigation={mockNavigation} />);
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

    const { getByPlaceholderText, getByTestId, queryAllByText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'user@example.com');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      const memberEmails = queryAllByText('user@example.com');
      expect(memberEmails.length).toBeGreaterThan(0);
    });
  });

  it('handles chat creation', async () => {
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

    addDoc.mockResolvedValueOnce({ id: 'newChatId' });

    const { getByPlaceholderText, getByTestId, findByText, queryAllByText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'user@example.com');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      const memberEmails = queryAllByText('user@example.com');
      expect(memberEmails.length).toBeGreaterThan(0);
    });

    const startChatButton = await findByText('Start Chat');
    fireEvent.press(startChatButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(mockNavigation.pop).toHaveBeenCalled();
    });
  });

  it('displays error for invalid email', async () => {
    const { getByPlaceholderText, getByTestId, findByText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'invalid-email');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    const errorMessage = await findByText('Please enter a valid email address');
    expect(errorMessage).toBeTruthy();
  });

  it('displays error for non-existent user', async () => {
    getDocs.mockResolvedValueOnce({ empty: true });

    const { getByPlaceholderText, getByTestId, findByText } = render(<CreateChat navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Member email');
    
    fireEvent.changeText(emailInput, 'nonexistent@example.com');
    
    const addButton = getByTestId('add-user-button');
    fireEvent.press(addButton);

    const errorMessage = await findByText('No user found with this email address');
    expect(errorMessage).toBeTruthy();
  });
});