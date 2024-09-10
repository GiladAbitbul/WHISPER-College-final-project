import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import colors from '../../assets/colors';

const AndroidVoiceMessageComponent  = ({ item, isSender, emailsDictionary }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const soundWaveData = [40, 60, 30, 70, 50, 60, 40, 60, 50, 40, 60, 30, 70, 50, 60, 40, 60, 50, 60, 30, 70, 50, 60, 40, 60, 50];
  const intervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSound = async () => {
      try {
        if (item.data.message) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: item.data.message },
            { shouldPlay: false, positionMillis: 0 }
          );
          if (isMounted) {
            setSound(newSound);
            const status = await newSound.getStatusAsync();
            if (status.isLoaded) {
              setDuration(status.durationMillis);
              setPosition(0);
            }
          }
        }
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    loadSound();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
      clearInterval(intervalRef.current);
    };
  }, [item.data.message]);

  useEffect(() => {
    if (!sound) return;

    const onPlaybackStatusUpdate = async (status) => {
      if (status.isLoaded) {
        setPosition(status.positionMillis);

        if (status.didJustFinish) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
          try {
            await sound.setPositionAsync(0);
            setPosition(0);
          } catch (error) {
            console.error('Error resetting position:', error);
          }
        }
      }
    };

    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    return () => {
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
      }
    };
  }, [sound]);

  const playSound = useCallback(async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();

        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          if (status.positionMillis === status.durationMillis) {
            try {
              await sound.setPositionAsync(0);
            } catch (error) {
              console.error('Error seeking to start:', error);
            }
          }
          await sound.playAsync();
          setIsPlaying(true);

          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(async () => {
            const newStatus = await sound.getStatusAsync();
            setPosition(newStatus.positionMillis);

            if (newStatus.positionMillis >= newStatus.durationMillis - 50) {
              clearInterval(intervalRef.current);
              setIsPlaying(false);
              try {
                await sound.pauseAsync();
                await sound.setPositionAsync(0);
                setPosition(0);
              } catch (error) {
                console.error('Error resetting after play:', error);
              }
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  }, [sound]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


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
        {formatTime(duration - position)}
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
    <View style={isSender ? styles.senderContainer : styles.receiverContainer}>
      {!isSender && (
        <Text style={styles.messageEmailDisplay}>
          {emailsDictionary[item.data.uid]}
        </Text>
      )}
      {sound ? renderMessageContent() : <ActivityIndicator size="large" color={isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor} />}
    </View>
  );
}

export default AndroidVoiceMessageComponent ;

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
  receiverContainer: {
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
});
