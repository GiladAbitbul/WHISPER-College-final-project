import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-elements';
import PopupMenu from '../components/PopUpMenu';
const YourScreen = ({userData}) => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [input3, setInput3] = useState('');

  return (
    <View style={styles.container}>
      <View style={{height: 20}} />
      <StatusBar style="dark" />
      {/* <Image 
      style={styles.profileImage}
      source={userData.profileImageURL ? { uri: userData.profileImageURL } : require('../static/DefaultProfileImage.png')}
      /> */}
        
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          value={input1}
          onChangeText={setInput1}
          keyboardType="default"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={input2}
          onChangeText={setInput2}
          keyboardType="default"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          value={input3}
          onChangeText={setInput3}
          keyboardType="default"
          autoCapitalize="none"
        />
        <Button
          buttonStyle={styles.button}
          title="Submit"
          onPress={() => {
            // Handle submit logic here
          }}
        />
        <View style={{backgroundColor:'red', height: 150, position:'absolute',bottom:0,width:800}}>

        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    marginTop: 20,
  },
});

export default YourScreen;
