import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AddChatScreen from './screens/AddChatScreen';
import ChatScreen from './screens/ChatScreen';
import UsersScreen from './screens/UsersScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GoodBye from './screens/GoodBye';
import CreateRealTimeChat from './screens/CreateRealTimeChatScreen';
import EditGroupScreen from './screens/EditGroupScreen';
import CreateChat from './screens/CreateChatScreen';
import AdminScreen from './screens/AdminScreen';

import { isOnboardingComplete } from './utils/OnboardingUtils';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingComplete = await isOnboardingComplete();
      setHasCompletedOnboarding(onboardingComplete);
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={hasCompletedOnboarding ? "Login" : "Onboarding"}>
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddChat" component={AddChatScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="UsersScreen" component={UsersScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="CreateChat" component={CreateChat} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="CreateRealTime" component={CreateRealTimeChat} />
        <Stack.Screen name="GoodBye" component={GoodBye} />
        <Stack.Screen name="EditGroup" component={EditGroupScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
