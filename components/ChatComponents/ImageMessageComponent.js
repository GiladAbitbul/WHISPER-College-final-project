import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import colors from '../../assets/colors';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageMessageComponent = ({item, isSender, isGroup, emailsDictionary}) => {
  const [imageSource, setImageSource] = useState(null);
  const [imageHeight, setImageHeight] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (item.data.message) {
      setImageSource(item.data.message)
      Image.getSize(
        item.data.message,
        (width, height) => {
          const calculatedHeight = (height * 250) / width;
          setImageHeight(calculatedHeight);
        },
        (error) => {
          console.error('Error fetching image dimensions:', error);
        }
      );
    }
  }, [item]);

  const openFullScreenImage = () => {
    setIsModalVisible(true);
  };

  const closeFullScreenImage = () => {
    setIsModalVisible(false);
  };

  const renderImage = () => (
    <TouchableOpacity onPress={openFullScreenImage}>
      <Image source={{uri: imageSource}} style={[styles.image, {height: imageHeight}]}/>
    </TouchableOpacity>
  );

  const renderFullScreenModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeFullScreenImage}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={closeFullScreenImage}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Image 
          source={{uri: imageSource}} 
          style={styles.fullScreenImage} 
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  return (
    <>
      {isSender ? (
        <View style={styles.senderContainer}>
          {renderImage()}
          {
            item.data.timestamp ? (
              <Text style={{alignSelf:'flex-end', color: "white", fontSize:13}}>
                {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
            ):(
              <Text style={{alignSelf:'flex-end', color: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor, fontSize:13}}>
                Sending...
              </Text>
            )
          }
        </View>
      ) : (
        <View style={styles.reciverContainer}>
          <View style={{ paddingBottom:5}}>
            <Text style={styles.messageEmailDisplay}>{emailsDictionary[item.data.uid]}</Text>
          </View>
          {renderImage()}
          <Text style={{alignSelf:'flex-end', color: colors.ReceiverMessageBoxTextColor, fontSize:13, marginTop: 5, paddingRight: 3}}>
            {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </View>
      )}
      {renderFullScreenModal()}
    </>
  )
}

export default ImageMessageComponent

const styles = StyleSheet.create({
  senderContainer: {
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 5,
    paddingBottom: 10,
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
  image: {
    width: 250,
    borderRadius: 15,
  },
  messageEmailDisplay: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.ReceiverMessageBoxTextColor
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});