import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { Image } from 'react-native-elements';

const GoodBye = () => {
  const navigation = useNavigation();
  useEffect(() => {
  navigation.setOptions({
    headerShown: false,
  });
  }, []);
  useEffect(() => {
    const signOutAndNavigate = async () => {
      await auth.signOut();
      navigation.replace('Login');
    };

    const timer = setTimeout(() => {
      signOutAndNavigate();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../static/headlogo.jpg')} style={styles.logo}/>
      <Text style={styles.text}>Goodbye!</Text>
      <Text style={styles.subtitle}>Thanks for using Whisper</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 20,
    fontStyle:'italic',
  }, 
  logo: {
    width: 250,
    height: 200,
  }
});

export default GoodBye;
