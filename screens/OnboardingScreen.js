import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../assets/colors';
import { setOnboardingComplete } from '../utils/OnboardingUtils';


const OnboardingScreen = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigation = useNavigation();

  const screens = [
    {
    image: require('../static/WelcomeChat.jpg'),
      title: 'Welcome',
      description: 'Whisper is the best Messaging App on the planet',
    },
    {
        image: require('../static/EasyChat.jpg'),
        title: 'Simple & Easy to Use',
      description: 'As simple as it could be! Equipped with smart features.',
    },
    {
       image: require('../static/FeaturesChat.jpg'),
      title: 'Smart Features',
      description: 'Smart features like Real-Time Chat are the main focus.',
    },
    {
        image: require('../static/SecureChat.jpg'),
        title: 'Safe & Secure',
      description: 'Yes! you heard right. We are safe and secure. Your chats are end-to-end encrypted.',
    },
  ];

  const handleNext = async () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      await setOnboardingComplete();
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={screens[currentScreen].image} style={styles.image} />
      <Text style={styles.title}>{screens[currentScreen].title}</Text>
      <Text style={styles.description}>{screens[currentScreen].description}</Text>
      <View style={styles.dotsContainer}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentScreen === index && styles.activeDot]}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cccccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: colors.editGroupSaveButtonBackgroundColor,
  },
  button: {
    backgroundColor: colors.editGroupSaveButtonBackgroundColor,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;