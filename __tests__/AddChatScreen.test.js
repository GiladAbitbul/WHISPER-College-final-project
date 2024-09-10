import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AddChatScreen from '../screens/AddChatScreen';

// Mock dependencies
jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user123' } },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'user123' },
  })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };
  
  describe('AddChatScreen', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should render correctly', () => {
      const { getByTestId, getByText } = render(
        <AddChatScreen navigation={mockNavigation} />
      );
  
      expect(getByText('Select Chat Room Type:')).toBeTruthy();
      expect(getByTestId('new-chat-button')).toBeTruthy();
      expect(getByTestId('new-group-button')).toBeTruthy();
      expect(getByTestId('real-time-chat-button')).toBeTruthy();
    });
  
    it('should handle button presses correctly', () => {
      const { getByTestId } = render(
        <AddChatScreen navigation={mockNavigation} />
      );
  
      fireEvent.press(getByTestId('new-chat-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateChat');
  
      fireEvent.press(getByTestId('new-group-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateGroup');
  
      fireEvent.press(getByTestId('real-time-chat-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateRealTime');
    });
  
    it('should set up navigation options correctly', () => {
      render(<AddChatScreen navigation={mockNavigation} />);
  
      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        headerTitleAlign: 'center',
        title: "Add a new chat",
      });
    });
  
    it('should have accessible buttons', () => {
      const { getByTestId } = render(
        <AddChatScreen navigation={mockNavigation} />
      );
  
      const newChatButton = getByTestId('new-chat-button');
      const newGroupButton = getByTestId('new-group-button');
      const realTimeChatButton = getByTestId('real-time-chat-button');
  
      expect(newChatButton).toBeTruthy();
      expect(newGroupButton).toBeTruthy();
      expect(realTimeChatButton).toBeTruthy();
    });
  
    it('should display correct text for each button', () => {
      const { getByTestId } = render(
        <AddChatScreen navigation={mockNavigation} />
      );
  
      expect(getByTestId('new-chat-button')).toHaveTextContent('New Chat');
      expect(getByTestId('new-group-button')).toHaveTextContent('New Group');
      expect(getByTestId('real-time-chat-button')).toHaveTextContent('Real-Time Chat');
    });
  
    it('should have correct styles applied', () => {
      const { getByTestId } = render(
        <AddChatScreen navigation={mockNavigation} />
      );
  
      const newChatButton = getByTestId('new-chat-button');
      expect(newChatButton).toHaveStyle({ backgroundColor: 'rgb(98, 116, 255)' });
    });
  });