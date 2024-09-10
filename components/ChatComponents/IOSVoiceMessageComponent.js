import { StyleSheet, Text, View, Pressable } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import colors from '../../assets/colors';

const IOSVoiceMessageComponent = ({item, isSender, emailsDictionary}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const soundRef = useRef(null);
  const isMounted = useRef(true);
  const isPlayingRef = useRef(false);
  const soundWaveData = [40, 60, 30, 70, 50, 60, 40, 60, 50, 40, 60, 30, 70, 50, 60, 40, 60, 50, 60, 30, 70, 50, 60, 40, 60, 50];

  const loadSound = useCallback(async () => {
    console.log('Loading sound...');
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.data.message },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      const status = await sound.getStatusAsync();
      if (status.isLoaded && isMounted.current) {
        console.log(`Sound loaded. Duration: ${status.durationMillis}ms`);
        setDuration(status.durationMillis);
        setDisplayTime(status.durationMillis);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading sound:', error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [item.data.message]);

  useEffect(() => {
    loadSound();
    return () => {
      isMounted.current = false;
      if (soundRef.current) {
        console.log('Unloading sound');
        soundRef.current.unloadAsync();
      }
    };
  }, [loadSound]);

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded && isMounted.current) {
      setPosition(status.positionMillis);
      if (status.isPlaying) {
        setDisplayTime(status.durationMillis - status.positionMillis);
      }
      if (status.didJustFinish) {
        console.log('Playback finished');
        isPlayingRef.current = false;
        setIsPlaying(false);
        setPosition(0);
        setDisplayTime(status.durationMillis);
      }
    }
  }, []);

  const playSound = useCallback(async () => {
    console.log('Play/Pause button pressed');
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        console.log(`Current status - isPlaying: ${status.isPlaying}, position: ${status.positionMillis}ms`);
        
        if (isPlayingRef.current) {
          await soundRef.current.pauseAsync();
          console.log('Paused playback');
          isPlayingRef.current = false;
        } else {
          if (status.positionMillis >= status.durationMillis - 50) {
            await soundRef.current.setPositionAsync(0);
            setPosition(0);
            setDisplayTime(status.durationMillis);
            console.log('Reset position to start');
          }
          await soundRef.current.playAsync();
          console.log('Started playback');
          isPlayingRef.current = true;
        }
        setIsPlaying(isPlayingRef.current);
      }
    } catch (error) {
      console.error('Failed to play/pause sound:', error);
    }
  }, []);

  const formatTime = useCallback((milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000); // Convert milliseconds to seconds
    const minutes = Math.floor(totalSeconds / 60); // Calculate minutes
    const seconds = totalSeconds % 60; // Calculate remaining seconds
    return `${minutes}:${seconds.toString().padStart(2, '0')}`; // Return formatted string (e.g., "1:05")
  }, []); 

  const renderMessageContent = () => (
    <>
      <View style={styles.voiceContainer}>
        <Pressable style={styles.voicePlayButton} onPress={playSound}>
          <Ionicons
            name={isPlaying ? "pause-circle" : "play"}
            size={40}
            color={isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor}
          />
        </Pressable>
        <View style={styles.soundWaveContainer}>
          {soundWaveData.map((height, index) => (
            <View
              key={index}
              style={[
                styles.soundWaveBar,
                {
                  height: `${height}%`,
                  backgroundColor: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor
                }
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={{
        alignSelf: 'flex-end',
        color: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor,
        fontSize: 13
      }}>
        {formatTime(displayTime)}
      </Text>
      <Text style={{
        alignSelf: 'flex-end',
        color: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor,
        fontSize: 13
      }}>
        {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
      </Text>
    </>
  );

  return (
    <View style={isSender ? styles.senderContainer : styles.reciverContainer}>
      {!isSender && (
        <Text style={styles.messageEmailDisplay}>{emailsDictionary[item.data.uid]}</Text>
      )}
      {isLoading ? (
        <ActivityIndicator size="large" color={isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor} />
      ) : (
        renderMessageContent()
      )}
    </View>
  );
}

export default IOSVoiceMessageComponent;


const styles = StyleSheet.create({
  senderContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: colors.SenderMessageBoxBackgroundColor,
    alignSelf: "flex-end",
    borderRadius: 20,
    marginLeft: 15,
    marginBottom: 5,
    marginTop: 5,
    maxWidth: "80%",
    minWidth: "25%",
    position: "relative",
    marginRight: 5,
  }, 
  reciverContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.ReceiverMessageBoxBackgroundColor,
    alignSelf: "flex-start",
    borderRadius: 20,
    marginRight: 15,
    marginBottom: 5,
    marginTop: 5,
    maxWidth: "80%",
    minWidth: "25%",
    position: "relative",
    marginLeft: 5,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voicePlayButton: {
    padding: 5,
  },
  soundWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginBottom: 5,
  },
  soundWaveBar: {
      width: 2,
      height: '100%',
      marginLeft: 3,
  },
  messageEmailDisplay: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.ReceiverMessageBoxTextColor
  }
})