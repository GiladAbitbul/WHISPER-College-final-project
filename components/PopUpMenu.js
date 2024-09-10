import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, StatusBar } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { auth } from '../firebase';

const PopupMenu = ({navigation}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const signOutUser = () => {
    setIsMenuVisible(false);
    auth.signOut().then(() => {navigation.replace("Login");});
  };
  const handleEditProfilePress = () => {
    setIsMenuVisible(false);
    //navigation.navigate("EditProfile");
    navigation.navigate("test");
  }
  const toggleMenu = () => {
    setIsMenuVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      
      <TouchableOpacity style={styles.button} onPress={toggleMenu}>
        <Feather name="more-vertical" size={30} color="black" style={{marginLeft:40}}/>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={() => {
          setIsMenuVisible(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfilePress}>
              <Text>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={signOutUser}>
              <Text>Log Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    //backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    //justifyContent: 'center',
    //alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    width: 200,
    position:'absolute',
    top: 60,
    right: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
});

export default PopupMenu;
