import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';


const { width } = Dimensions.get('window');

const UserInfoSideWindowComponent = ({ isVisible, userData }) => {
    const slideAnim = useRef(new Animated.Value(width)).current;

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: isVisible ? 0 : width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [isVisible]);
  
    return (
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <Image 
          source={userData?.profileImageURL ? { uri: userData.profileImageURL } : require('../../static/DefaultProfileImage.png')} 
          style={styles.avatar}
        />
        {/* <Text style={styles.email}>{userData?.email}</Text> */}
        <Text style={styles.status}>{userData?.status || 'No Status'}</Text>
      </Animated.View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 300,
      height: '100%',
      backgroundColor: 'white',
      padding: 20,
      alignItems: 'center',
    },
    avatar: {
      width: 150,
      height: 150,
      borderRadius: 75,
      marginBottom: 20,
      marginTop: 40,
    },
    email: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    status: {
      fontSize: 16,
      color: 'gray',
    },
  });
export default UserInfoSideWindowComponent;