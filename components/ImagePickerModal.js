import React, { useRef, useEffect } from 'react';
import { View, Modal, Animated, Dimensions, Pressable, Text } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar } from 'react-native-elements';

const ImagePickerModal = ({ onClose, handleLogout, profileImageURL, handleProfile, userData }) => {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

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
        toValue: Dimensions.get('window').width,
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
      //animationType="slide"
    >
      <Pressable onPressOut={closeModal} style={{ flex: 1 }}>
        <View style={{ width: 70, height: '100%', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end'}}>
          <Animated.View style={{ transform: [{ translateX: slideAnim }], width: 70, height: '50%', padding: 20, backgroundColor: 'white', borderTopLeftRadius: 25, borderBottomLeftRadius: 25, borderColor: 'gray', borderWidth: 1, flexDirection:'column', justifyContent:'space-between' }}>
          <View style={{borderWidth:2, borderColor:'gray', width: 49, borderRadius:50, alignSelf:'center'}}>
          <Avatar
              rounded
              source={profileImageURL ? { uri: userData.profileImageURL } : require('../static/DefaultProfileImage.png')}
              size={45}
              onPress={()=>{handleProfile()}}
            />
          </View>
            <Pressable onPress={handleLogout}>
              <TouchableOpacity>
              <Entypo name="log-out" size={30} color="black" />
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ImagePickerModal;
