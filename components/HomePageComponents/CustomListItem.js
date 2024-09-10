import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ListItem, Avatar } from 'react-native-elements';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getMessageType } from '../../utils/messagesStatusUtil';
import { decryptMessage } from '../../utils/encryptionRSA_ESA';
import { fetchDocumentWithRetry } from '../../utils/storageUtil';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';




const CustomListItem = ({navigation, id, data, uid, userStatus ,otherUserId }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [messageType, setMessagesType] = useState(null);

  const [chatTitle, setChatTitle] = useState('');
  const [chatImage, setChatImage] = useState(null);
  const [lastMessageSenderUID, setLastMessageSenderUID] = useState(null);
  const [renderedMessage, setRenderedMessage] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const getNickname = (email) => {
    if (email) {
        //const atIndex = email.indexOf('@');
        //return atIndex !== -1 ? email.substring(0, atIndex) : email;
        return email;
    }
    return '';
};

useEffect(() => {
  const renderLastMessage = async () => {
    if (!lastMessage || !auth.currentUser || !auth.currentUser.uid) {
      setRenderedMessage(null);
      return '';
    }
    if (messageType && lastMessage) {
      const { uid, message } = lastMessage;
      
      const type = messageType;

      if (uid === getAuth().currentUser.uid) {
        if (type === 'image') {
          setRenderedMessage('You: photo \u{1F4F7}');
        } else if (type === 'audio') {
          setRenderedMessage('You: voice \u{1F3A4}'); //TODO: add new icon of mic-arrow
        } else if (type === 'deleted') {
          setRenderedMessage('You: Deleted Message');
        } else {
          setRenderedMessage(`You: ${message}`);
        }
      } else {
        let senderNickname = '';
        if (data.isGroup && lastMessageSenderUID) {
          const senderData = await getUserDataByID(lastMessageSenderUID);
          const senderEmail = senderData.email;
          senderNickname = getNickname(senderEmail);
          senderNickname = senderNickname + ': ';
        }
        if (type === 'image') {
          setRenderedMessage(senderNickname + 'photo \u{1F4F7}');
        } else if (type === 'audio') {
          setRenderedMessage(senderNickname + 'voice \u{1F3A4}');
        } else if (type === 'deleted') {
          setRenderedMessage(senderNickname + 'Deleted Message');
        } else {
          setRenderedMessage(senderNickname + message);
        }
      }
    }
  };
  renderLastMessage();
}, [lastMessage, messageType]);


useEffect(() => {
  let isCancelled = false;
  let unsubscribe;

  const fetchChatRoomData = async () => {
    try {
      setLoading(true);
      const chatRoomRef = doc(db, 'Chats', id);
      const keysRef = doc(db, 'Keys', id);
      const keysDoc = await fetchDocumentWithRetry(keysRef);

      if (!keysDoc.exists()) {
        throw new Error('Encryption keys not found');
      }

      const { privateKey } = keysDoc.data();

      unsubscribe = onSnapshot(chatRoomRef, async (chatRoomDoc) => {
        if (!chatRoomDoc.exists()) {
          console.error('Chat room not found');
          return;
        }

        const chatRoomData = chatRoomDoc.data();
        const lastMessageID = chatRoomData.lastMessageID;
        setIsRealTime(chatRoomData.isRealTime);
        if (!lastMessageID) {
          if (!isCancelled) {
            setLastMessage(null);
          }
        } else {

          if (chatRoomData && !chatRoomData.isRealTime) {
            const messageRef = doc(collection(chatRoomRef, 'messages'), lastMessageID);
            const messageDoc = await getDoc(messageRef);
            if (!messageDoc.exists()) {
              console.log('this is chat', id);
              throw new Error('Message not found');
            }
            const fetchedLastMessage = messageDoc.data();
            const messageType = getMessageType(fetchedLastMessage.status);
            if (messageType === 'text') {
              if (fetchedLastMessage.message) {
                try {
                  fetchedLastMessage.message = await decryptMessage(fetchedLastMessage.message, privateKey);
                } catch (error) {
                    console.error('Decryption error:', error);
                    // Optionally handle the decryption error, e.g., set a fallback message
                    fetchedLastMessage.message = 'Decryption failed';
                }
             } else {
                console.warn(`Message data is missing 'message' field:`, fetchedLastMessage);
                fetchedLastMessage.message = 'Invalid message data';
              }
            }
            if (!isCancelled) {
              setMessagesType(messageType);
              setLastMessage(fetchedLastMessage);
              setLastMessageSenderUID(fetchedLastMessage.uid);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching chat room data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchChatRoomData();

  return () => {
    isCancelled = true;
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}, [id, db]);

const getUserDataByID = async (id) => {
  try {
    const userRef = doc(db, 'Users', id);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
 
    const userData = userDoc.data();

    // Check if userData is not null or undefined
    if (!userData) {
      throw new Error('User data is null or undefined');
    }
    return userData;

  } catch (error) {
    console.error("Failed to get user data:", error);
    throw error;  // Re-throw the error to be handled by the caller
  }
};

  useEffect(() => {
    const getTitleData = async () => {
      if (data) {
        if (!data.isGroup) {
          const secondMember = data.members.find(uid => uid !== auth.currentUser.uid);
          const secondMemberData = await getUserDataByID(secondMember);
          setChatTitle(secondMemberData.email);
          setChatImage(secondMemberData.profileImageURL? secondMemberData.profileImageURL : null);
        } else {
          setChatTitle(data.groupName)
          setChatImage(data.groupImageURL? data.groupImageURL : null);
        }
    }
  }
    getTitleData()
  }, [data]);

  const renderLastMessage = async () => {
    if (!lastMessage || !auth || !auth.currentUser || !auth.currentUser.uid) {
      return null;
    }

    const { uid, message } = lastMessage;
    const type = messageType;
    if (uid === auth.currentUser.uid) {
      if (type === 'image') {
        return 'You: photo \u{1F4F7}';
      } else if (type === 'audio') {
        return 'You: voice \u{1F3A4}'; //TODO: add new icon of mic-arrow
      } else if (type === 'deleted') {
        return 'You: Deleted Message'
      }
      return `You: ${message}`;
    } else {

      let senderNickname = '';
      if (data.isGroup) {
        const senderData = await getUserDataByID(lastMessageSenderUID);
        const senderEmail = senderData.email
        senderNickname = getNickname(senderEmail);
        senderNickname = senderNickname + ': '
      }
      if (type === 'image') {
        return senderNickname + 'photo \u{1F4F7}'
      } else if(type === 'audio') {
        return senderNickname + 'voice \u{1F3A4}'
      }
      return senderNickname +`${message}`;
    } 
  };

  const renderLastMessageTime = () => {
    if (!lastMessage) {
      return null;
    }

    const { timestamp } = lastMessage;
    if (!timestamp || !timestamp.seconds) {
      return null;
    }

    const date = new Date(timestamp.seconds * 1000); // Convert timestamp to Date object
    const currentDate = new Date(); // Current date

    if (date.toDateString() === currentDate.toDateString()) {
      return new Date(timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    currentDate.setDate(currentDate.getDate() - 1); // Subtract one day from current date
    if (date.toDateString() === currentDate.toDateString()) {
        return 'Yesterday';
    }

    const options = { year: '2-digit', month: '2-digit', day: 'numeric' };
    return date.toLocaleDateString(undefined, options).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3');
    
  }

  return (
    loading ? (
      <></>
    ): (
      <ListItem key={id} bottomDivider onPress={() => navigation.navigate('Chat', {id})}>
      <View style={styles.avatarContainer}>
          <Avatar 
              source={
                  chatImage ? { uri: chatImage } : data.isGroup ? require('../../static/GroupIcon.png') : require('../../static/DefaultProfileImage.png')
              }
              rounded 
              size={45} 
          />
        {!data.isGroup && (
                      <View style={[
                          styles.statusDot,
                          { backgroundColor: userStatus === true ? 'green' : (userStatus === false ? 'red' : 'gray') }
                      ]} />
                  )}
      </View>
      
      <View style={styles.listContent}>
          <View style={{flexDirection:'row', width:'100%'}}>
            <View style={{flex:1}}>
              <View style={{flexDirection:'row'}}>
              <Text style={styles.listTitle}>{chatTitle}</Text>
              {isRealTime && (
                <>
                  <Text style={{color: "rgb(98, 116, 255)"}}> (real-time)</Text>
                  <Ionicons name="time-outline" size={24} color="rgb(98, 116, 255)"/>
                </>
              )}
              </View>
            </View>
            <View style={{justifyContent:'flex-end', width:'30%', alignItems:'flex-end'}}>
              <Text style={styles.lastMessageTime}>{renderLastMessageTime()}</Text>
            </View>
          </View>
          <View>
            {isRealTime ? (
              <Text style={{fontSize: 16, color: 'gray'}}>
                Click here to start Real-Time Chat
              </Text>
            ): (
              renderedMessage ? (
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.listSubtitle}>
                  {renderedMessage}
                </Text>
              ) : (
                <Text numberOfLines={1} ellipsizeMode="tail" style={{fontSize: 18, color: 'gray'}}>
                  Click here to start your conversation
                </Text>
              )
            )}
  
          </View>
          <View style={{width:'70%', paddingRight: 10, backgroundColor: ""}}>
          </View>
          {/* {!data.isGroup && (
                      <Text style={styles.statusText}>
                          Status: {userStatus === true ? 'Online' : (userStatus === false ? 'Offline' : 'Unknown')} (Other User ID: {otherUserId})
                      </Text>
                  )} */}
        </View>
      </ListItem>
    )
  );
};

export default CustomListItem;

const styles = StyleSheet.create({
  listContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }, listTitle: {
    fontWeight: '800',
    fontSize: 17,
  }, listSubtitle: {
    fontSize: 18
  }, lastMessageTime: {
    fontSize: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
},
statusText: {
  fontSize: 12,
  color: 'gray',
},
  
});
