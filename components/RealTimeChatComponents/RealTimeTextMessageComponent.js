import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot  } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getChatRoomPrivateKey } from '../../utils/storageUtil';
import { decryptMessage } from '../../utils/encryptionRSA_ESA';
const RealTimeTextMessageComponent = ({uid, chatId}) => {

  const [realTimeInput, setRealTimeInput] = useState('');
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(()=> {
    const getPrivateKey = async () => {
      const privateKey = await getChatRoomPrivateKey(chatId);
      setPrivateKey(privateKey);
    }
    getPrivateKey();
  },[])

  useEffect(() => {
    if (privateKey) {
    const chatRef = doc(db, "Chats", chatId);
    const userRef = doc(chatRef, "real-time", uid);

    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data?.input) {
          console.log('data', data.input);
          
          if (privateKey && data.input !== '') {
          const plainText = await decryptMessage(data.input, privateKey);
          setRealTimeInput(plainText);
          } else {
            setRealTimeInput('');
          }
        } else {
          setRealTimeInput('');
        }
      } else {
        setRealTimeInput('');
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }
  }, [privateKey]);

  return (
    realTimeInput && (
      <View style={styles.reciverContainer}>
        <Text>Real Time</Text>
        <Text style={styles.reciverMessageText}>
          TYPING: {realTimeInput}
        </Text>
      </View>
    )
  )
}

export default RealTimeTextMessageComponent

const styles = StyleSheet.create({
  reciverContainer: {
    padding: 15,
    backgroundColor: "#33cc33",
    alignSelf: "flex-start",
    borderRadius: 20,
    marginRight: 15,
    marginBottom: 20,
    maxWidth: "80%",
    position: "relative",
    marginLeft: 5,

    // backgroundColor: 'white',
    // borderWidth: 2,
    // borderColor: 'black',
  },
  reciverMessageText: {
    color: "black",
    marginLeft: 10,
    fontSize: 16,
  },
})