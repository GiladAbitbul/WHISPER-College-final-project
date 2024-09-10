import React, { useRef, useEffect } from 'react';
import { View, Modal, Animated, Dimensions, Pressable, Text } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar } from 'react-native-elements';

const AddChatModal = ({ onClose, handleLogout, profileImageURL, handleProfile, userData }) => {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.timing(
      slideAnim,
      {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }
    ).start();
  }, [slideAnim]);

  const closeModal = () => {
    Animated.timing(
      slideAnim,
      {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }
    ).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent={true}
      visible={true}
      onRequestClose={closeModal}
      presentationStyle="overFullScreen"
    >
      <Pressable onPressOut={closeModal} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View style={{ transform: [{ translateY: slideAnim }], width: '100%', height: '60%', padding: 20, backgroundColor: 'rgba(255, 255, 255,0.7)', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderColor: 'white', borderWidth: 3, borderBottomWidth:0 }}>
              
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AddChatModal;
