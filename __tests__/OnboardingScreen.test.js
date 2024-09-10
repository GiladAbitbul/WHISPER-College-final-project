import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../screens/OnboardingScreen';
import { setOnboardingComplete } from '../utils/OnboardingUtils';

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../utils/OnboardingUtils', () => ({
  setOnboardingComplete: jest.fn(),
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    expect(getByText('Welcome')).toBeTruthy();
    expect(getByText('Whisper is the best Messaging App on the planet')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
  });

  it('navigates through screens', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    fireEvent.press(getByText('Next'));
    expect(getByText('Simple & Easy to Use')).toBeTruthy();

    fireEvent.press(getByText('Next'));
    expect(getByText('Smart Features')).toBeTruthy();

    fireEvent.press(getByText('Next'));
    expect(getByText('Safe & Secure')).toBeTruthy();
  });

  it('shows "Get Started" on the last screen', () => {
    const { getByText } = render(<OnboardingScreen />);
    
    // Navigate to the last screen
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));

    expect(getByText('Get Started')).toBeTruthy();
  });

  it('completes onboarding and navigates to Login screen', async () => {
    const { getByText } = render(<OnboardingScreen />);
    
    // Navigate to the last screen
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));
    fireEvent.press(getByText('Next'));

    fireEvent.press(getByText('Get Started'));

    await waitFor(() => {
      expect(setOnboardingComplete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('Login');
    });
  });
});