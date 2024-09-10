import { Keyboard, StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Entypo, Feather, SimpleLineIcons, FontAwesome } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { Audio } from 'expo-av';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMessageStatusCode } from '../../utils/messagesStatusUtil';
import { uploadMessage, uploadImage, uploadAudio } from '../../utils/storageUtil';
import ImagePickerModal from '../ImagePickerModal';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { color } from 'react-native-elements/dist/helpers';



const MessageInput = ({chatId}) => {
    const [input, setInput] = useState('');
    const [isInputEmpty, setIsInputEmpty] = useState(true); 
    const [image, setImage] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);

    const toggleModal = () => {
      setModalVisible(!isModalVisible);
    };

    const startRecording = async () => {
      if (!isRecording) {
        try {
          console.log('Requesting permissions...');
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
  
          console.log('Starting recording...');
          const { recording } = await Audio.Recording.createAsync(
            Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
          );
          setRecording(recording);
          setIsRecording(true);
        } catch (err) {
          console.error('Failed to start recording', err);
        }
      }
    };
  
    const stopRecording = async () => {
      if (isRecording) {
        console.log('Stopping recording...');
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
    
        await uploadAudio(chatId,recording,getAuth().currentUser.uid);
        
        setRecording(null);
      }
    };
    
    const selectImage = async () => {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Take Photo',
            onPress: takePhoto,
          },
          {
            text: 'Choose from Gallery',
            onPress: chooseFromGallery,
          },
        ],
        { cancelable: true }
      );
    };

    const takePhoto = async () => {
      try {
        let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 1,
        });
    
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          await uploadImage(chatId, uri, getAuth().currentUser.uid);
          try {
            const { sound } = await Audio.Sound.createAsync(messageSound);
            await sound.playAsync();
          } catch (error) {
            console.log('Error playing sound:', error);
          }
        }
      } catch (error) {
        console.log('Error taking photo:', error);
      }
    };

    const chooseFromGallery = async () => {
        try {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
          });
    
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            await uploadImage(chatId, uri, getAuth().currentUser.uid);
            try {
              const { sound } = await Audio.Sound.createAsync(messageSound);
              await sound.playAsync();
            } catch (error) {
              console.log('Error playing sound:', error);
            }
          }
          
        } catch (error) {
          console.log('Error selecting image:', error);
        }
    };
    
    const messageSound = require('../../static/Send_Message.mp3');

    const sendMessage = async () => {
        try {
          const message = input;
          setInput('')
          setIsInputEmpty(true)

          await uploadMessage(chatId, message, getAuth().currentUser.uid)
        } catch (error) {
            console.error('Error sending message:', error.message);
        }

        try {
          const {sound} = await Audio.Sound.createAsync(messageSound);
          await sound.playAsync();
        } catch (error) {
          
        }
    }

    const handleInputChange = (newInput) => {
        setInput(newInput);
        setIsInputEmpty(newInput.trim() === '');
    }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inputContainer}>
        <TextInput 
        style={styles.textInput} 
        placeholder='Type a message' 
        value={input} 
        onChangeText={handleInputChange}
        maxLength={60}
        multiline={true}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        textAlignVertical="top"
        />
        <Text style={{color:'gray',alignSelf:'flex-end', fontSize:14}}>{input.length}/60</Text>
        <TouchableOpacity onPress={chooseFromGallery}>
          <Feather name="paperclip" size={25} color="#595959" style={styles.entypo}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto}>
          <Feather name="camera" size={25} color="#595959" style={styles.entypo}/>
        </TouchableOpacity>
      </View>
      { 
      isInputEmpty ? 
      (
        isRecording ? (
          <Pressable style={styles.buttonContainer} onPress={stopRecording}>
            <Entypo name="controller-stop" size={26} color="white" />
          </Pressable>
        ): (
          <Pressable style={styles.buttonContainer} onPress={startRecording}>
            <Feather name="mic" size={26} color="white" />
          </Pressable>
        )
      ) : (
        <Pressable style={styles.buttonContainer} onPress={sendMessage}>
          <Feather name="arrow-up" size={26} color="white" />
        </Pressable>
      )}
    </KeyboardAvoidingView>
  )
}


export default MessageInput

const styles = StyleSheet.create({
    buttonContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'rgb(98, 116, 255)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },inputContainer: {
        backgroundColor: '#f2f2f2',
        flex: 1,
        marginRight: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'lightgray',
        alignItems: 'flex-end',
        flexDirection: 'row',
        padding: 5,
    }, root: {
        flexDirection: 'row',
        paddingBottom: 10,
        paddingRight: 10,
        paddingLeft: 10,
        paddingTop: 1,
        alignItems: 'center'
    },buttonText: {
        color: 'white',
        fontSize: 35,
    }, textInput: {
      maxHeight: 100,
        flex: 1,
        marginHorizontal: 5,
        fontWeight: "400",
        fontSize: 16,
        color: 'black',
        paddingLeft: 10,
        paddingTop: 5
    }, entypo: {
        marginHorizontal: 5,
    }
})