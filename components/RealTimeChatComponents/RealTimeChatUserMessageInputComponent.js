import {StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Text } from 'react-native'
import React, { useState, useEffect } from 'react'
import { serverTimestamp, doc, collection, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { uploadMessage, getChatRoomPublicKey } from '../../utils/storageUtil';
import { encryptMessage } from '../../utils/encryptionRSA_ESA';

const RealTimeChatUserMessageInputComponent = ({currentChatID}) => {
  const [input, setInput] = useState('');
  const [isEmptyInput, setIsEmptyInput] = useState(true);
  const [publicKey, setPublicKey] = useState(null);

  useEffect(()=> {
    const getPublicKey = async () => {
      const publicKey = await getChatRoomPublicKey(currentChatID);
      setPublicKey(publicKey);
    }
    getPublicKey();
  },[])
  //const navigation = useNavigation();
  useEffect(() => {
    // //console.log(navigation);
    // const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    //   // Prevent the default action
    //   e.preventDefault();

    //   // Update the Firestore database with an empty string
    //   updateRealTimeInput('');

    //   // Navigate back to the home page
    //   //navigation.dispatch(e.data.action);
    //   //navigation.navigate('Home');
    // });

    // Cleanup function
    return () => {
      updateRealTimeInput('');
    };
  }, []);

  const sendMessage = async () => {
    try {
        updateRealTimeInput('');
        setIsEmptyInput(true)
        await uploadMessage(currentChatID, input, auth.currentUser.uid);
        setInput('')
    } catch (error) {
        console.error('Error sending message:', error.message);
    }
  }

  const handleInputChange = (newInput) => {
    setInput(newInput);
    const  isEmpty = newInput.trim() === '';
    setIsEmptyInput(isEmpty);
    updateRealTimeInput(newInput);
  }

  const updateRealTimeInput = async (newInput) => {
    try {
        if(publicKey) {
          const chatReference = doc(db, "Chats", currentChatID);
          const userReference = doc(chatReference, "real-time", getAuth().currentUser.uid);

          const encryptedMessage = await encryptMessage(newInput, publicKey);
          await setDoc(userReference, {
            input: encryptedMessage,
          });
        }
    } catch (error) {
        console.error('Error updating real-time input:', error.message);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inputContainer}>
        <TextInput 
        style={styles.textInput} 
        placeholder='Message'
        value={input}
        onChangeText={handleInputChange}
        multiline={true}
        maxLength={40}
        />
        <Text style={{color:'gray',alignSelf:'flex-end', fontSize:14}}>{input.length}/40</Text>
      </View>
      { 
      !isEmptyInput  && (
        <Pressable style={styles.buttonContainer} onPress={sendMessage}>
          <Feather name="arrow-up" size={26} color="white" />
        </Pressable>
      )
      }
    </KeyboardAvoidingView>
  )
}

export default RealTimeChatUserMessageInputComponent

const styles = StyleSheet.create({
  buttonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#0076FF',
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
      alignItems: 'center',
      flexDirection: 'row',
      padding: 5,
  }, root: {
      flexDirection: 'row',
      paddingBottom: 10,
      paddingRight: 10,
      paddingLeft: 10,
      paddingTop: 1,
      alignItems: 'center'
  }, textInput: {
      flex: 1,
      marginHorizontal: 5,
      fontWeight: "400",
      fontSize: 16,
      color: 'black'
  }
})