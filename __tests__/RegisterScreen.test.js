import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn().mockImplementation((auth, email, password) => 
    Promise.resolve({ user: { uid: 'fake-uid' } })
  ),
}));

jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'fake-uid' }
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'fake-image-uri' }]
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

describe('RegisterScreen', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<RegisterScreen onClose={mockOnClose} />);
    
    expect(getByText('Hello!')).toBeTruthy();
    expect(getByText('Create your account to save your data on cloud.')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByText('Create my account')).toBeTruthy();
  });
  
  it('handles email input', () => {
    const { getByTestId } = render(<RegisterScreen onClose={mockOnClose} />);
    const emailInput = getByTestId('email-input');
  
    fireEvent.changeText(emailInput, 'test@example.com');
  
    expect(emailInput.props.value).toBe('test@example.com');
  });
  
  it('handles password input', () => {
    const { getByTestId } = render(<RegisterScreen onClose={mockOnClose} />);
    const passwordInput = getByTestId('password-input');
  
    fireEvent.changeText(passwordInput, 'password123');
  
    expect(passwordInput.props.value).toBe('password123');
  });

  it('handles successful registration', async () => {
    const { getByText, getByTestId } = render(<RegisterScreen onClose={mockOnClose} />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const registerButton = getByText('Create my account');
  
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
  
    await act(async () => {
      fireEvent.press(registerButton);
    });
  
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    }, { timeout: 5000 });

    expect(setDoc).toHaveBeenCalled();
  });

  it('handles registration error', async () => {
    const { getByText, getByTestId } = render(<RegisterScreen onClose={mockOnClose} />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const registerButton = getByText('Create my account');
  
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
  
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
  
    fireEvent.press(registerButton);
  
    await waitFor(() => {
      expect(getByText('Email already in use')).toBeTruthy();
    });
  });
});
