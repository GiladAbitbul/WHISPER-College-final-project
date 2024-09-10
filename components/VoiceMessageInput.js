import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Audio } from 'expo-av';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const VoiceMessageInput = ({ chatId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);

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

      const uri = recording.getURI();
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new TypeError('Network request failed'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, `voiceMessages/${auth.currentUser.uid}/${Date.now()}.wav`);
      const snapshot = await uploadBytes(storageRef, blob);
      const voiceMessageUrl = await getDownloadURL(snapshot.ref);

      const messagesRef = collection(db, 'Chats', chatId, 'messages');
      await addDoc(messagesRef, {
        message: voiceMessageUrl,
        timestamp: serverTimestamp(),
        type: 'voice',
        uid: auth.currentUser.uid,
      });

      setRecording(null);
    }
  };

  return (
    <View>
      <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
        <Text>{isRecording ? 'Release to Stop' : 'Hold to Record'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VoiceMessageInput;
