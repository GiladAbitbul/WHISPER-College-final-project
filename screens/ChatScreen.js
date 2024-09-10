import { ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, VirtualizedList, TouchableOpacity, Alert,Dimensions} from 'react-native'
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Avatar, Image } from 'react-native-elements';
import { FontAwesome} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { collection,deleteDoc,doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { onSnapshot } from 'firebase/firestore';
import { query, orderBy } from 'firebase/firestore';
import UserMessageInput from '../components/UserMessageInput';
import { getAuth } from 'firebase/auth';
import { Audio } from 'expo-av';
import { ActivityIndicator } from 'react-native'; // Import ActivityIndicator from react-native
import { FlatList } from 'react-native';
import { getMessageType, intToBitArray } from '../utils/messagesStatusUtil';
import ConditionalTouchable from '../components/ConditionalTouchable';
import TextMessageComponent from '../components/ChatComponents/TextMessageComponent';
import VoiceMessageComponent from '../components/ChatComponents/VoiceMessageComponent';
import ImageMessageComponent from '../components/ChatComponents/ImageMessageComponent';
import DeletedMessageComponent from '../components/ChatComponents/DeletedMessageComponent';
import RealTimeTextMessageComponent from '../components/RealTimeChatComponents/RealTimeTextMessageComponent';
import RealTimeChatUserMessageInputComponent from '../components/RealTimeChatComponents/RealTimeChatUserMessageInputComponent';
import { deleteSelectedMessages, fetchDocumentWithRetry } from '../utils/storageUtil';
import ConditionalMarker from '../components/markerComponent';
import { decryptMessage } from '../utils/encryptionRSA_ESA';
import Icon from 'react-native-vector-icons/Ionicons';
import UserInfoSideWindow from '../components/ChatComponents/UserInfoSideWindowComponent'; 

const { width } = Dimensions.get('window');


const ChatScreen = ({ navigation, route }) => {
    
    const [messages, setMessages] = useState([]);
    const [soundObjects, setSoundObjects] = useState({});
    const [markedMessages, setMarkedMessages] = useState([]);
    const [chatMemberID, setChatMemberID]= useState('');

    const [chatTitle, setChatTitle] = useState('');
    const [chatImage, setChatImage] = useState('');
    const [isGroup, setIsGroup] = useState(null);
    const [isRealTime, setIsRealTime] = useState(false);
    const [loading, setLoading] = useState(true);
    const [emailsDictionary, setEmailsDictionary] = useState({});
    const [chatRoomKeys, setChatRoomKeys] = useState({});

    const [isUserInfoVisible, setIsUserInfoVisible] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState(null);

    useEffect(() => {
        const deleteMessages = async () => {
          if (isRealTime) {
            const chatReference = doc(db, "Chats", route.params.id);
            const userReference = doc(chatReference, "real-time", getAuth().currentUser.uid);
            await setDoc(userReference, {
              input: '',
            });
      
            // Deleting the messages collection
            const messageRef = collection(chatReference, 'messages');
            const messageDocs = await getDocs(messageRef);
      
            // Iterate through each document in the messages collection and delete it
            const deletePromises = messageDocs.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises); // Wait for all deletions to complete
          }
        };
        
        return () => {
            if (isRealTime) {
                deleteMessages().catch(error => console.error("Failed to delete messages:", error));
            }
        }
      }, [isRealTime]);

    const scrollViewRef = useRef();
    const handlePress = (item) => {
        if (markedMessages.length !== 0) {
            if (markedMessages.includes(item.id)) {
                setMarkedMessages(prevMarkedMessages => prevMarkedMessages.filter(id => id !== item.id));
            } else {
                setMarkedMessages(prevMarkedMessages => [...prevMarkedMessages, item.id]);
            }
        }
    }
    
    const handleLongPress = (item) => {
        if (markedMessages.includes(item.id)) {
            setMarkedMessages(prevMarkedMessages => prevMarkedMessages.filter(id => id !== item.id));
        } else {
            setMarkedMessages(prevMarkedMessages => [...prevMarkedMessages, item.id]);
        }
    }

    useEffect(() => {
        const fetchChatMessages = async () => {
            try {
                const chatRef = doc(db, 'Chats', route.params.id);
                const messageRef = collection(chatRef, 'messages');
                const keysRef = doc(db, 'Keys', route.params.id);
    
                const keysDoc = await fetchDocumentWithRetry(keysRef);
    
                if (!keysDoc.exists) {
                    throw new Error('Encryption keys not found');
                }
    
                const { privateKey } = keysDoc.data();
    
                if (messageRef) {
                    //setChatMemberID(route.params.memberUID);
                    const q = query(messageRef, orderBy('timestamp', 'desc'));
    
                    const unsubscribe = onSnapshot(q, async (snapshot) => {
                        const newMessagesPromises = snapshot.docs.map(async (doc) => {
                            const messageData = doc.data();
                            const messageType = getMessageType(messageData.status);
    
                            if (messageType === 'text') {
                                if (messageData.message) {
                                    try {
                                        messageData.message = await decryptMessage(messageData.message, privateKey);
                                    } catch (error) {
                                        console.error('Decryption error:', error);
                                        // Optionally handle the decryption error, e.g., set a fallback message
                                        messageData.message = 'Decryption failed';
                                    }
                                } else {
                                    console.warn(`Message data is missing 'message' field:`, messageData);
                                    messageData.message = 'Invalid message data';
                                }
                            }
                            const bits = intToBitArray(messageData.status);
                            return {
                                id: doc.id,
                                data: {
                                    ...messageData,
                                    status: messageType,
                                    bitArray: bits,
                                },
                            };
                        });
    
                        const newMessages = await Promise.all(newMessagesPromises);
                        setMessages(newMessages);
                    });
    
                    return unsubscribe;
                }
            } catch (error) {
                console.error('Error fetching chat messages:', error);
            }
        };
    
        const init = async () => {
            const unsubscribe = await fetchChatMessages();
            return unsubscribe;
        }
    
        let unsubscribe;
    
        init().then((unsub) => {
            unsubscribe = unsub;
        });
    
        return () => {
            if (unsubscribe) {
                console.log('Chat screen init end');
                unsubscribe();
            }
        };
    }, [route]);
    

    const getUserDataByID = async  (id) => {
        const userRef = doc(db, 'Users', id);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        const userData = userDoc.data();
        return userData;
    }

    useEffect(() => {
        const fetchChatRoomData = async () => {
        try {
            setLoading(true);
            if (route.params.id) {
                const chatRef = doc(db, 'Chats', route.params.id);
                const chatDoc = await getDoc(chatRef);
                if (chatDoc.exists()) {
                    const chatData = chatDoc.data();

                    if (!chatData.isGroup) {
                        const secondMember = chatData.members.find(uid => uid !== auth.currentUser.uid);
                        setChatMemberID(secondMember);
                        const secondMemberData = await getUserDataByID(secondMember);
                        if (chatData.isRealTime) {
                            setIsRealTime(true);
                            console.log('secondMemberData', secondMember);
                            setChatMemberID(secondMember)
                        }
                        setChatTitle(secondMemberData.email);
                        setChatImage(secondMemberData.profileImageURL? secondMemberData.profileImageURL : null);
                        setIsGroup(false);
                    } else {
                        setChatImage(chatData.groupImageURL);
                        setChatTitle(chatData.groupName);
                        setIsGroup(true);
                    }
                } else {
                    console.error('No such chat room!');
                    return null;
                }
            }
        } catch (error) {
          console.error('Error fetching chat room data:', error);
        } finally {
            setLoading(false);
        }
      }
      
      fetchChatRoomData();
      }, [route]);

    useEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'center',
            headerStyle: {backgroundColor:"white",borderBottomColor: '#a9b2b7', borderBottomWidth: 1},
            headerTitle: () => (
                <TouchableOpacity onPress={handleAvatarPress}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar
                    source={
                        chatImage ? {uri:chatImage} : isGroup ?  require('../static/GroupIcon.png') : require('../static/DefaultProfileImage.png')
                    }
                    rounded 
                    size={40}
                    />
                    <Text style={{marginLeft: 15, fontSize:15}}> 
                    {chatTitle ? chatTitle : 'Loading...'}
                    </Text>
                </View>
            </TouchableOpacity>
            ),
            headerBackTitleVisible: false,
            headerRight: () => (
                <>
                {isGroup && (
                <TouchableOpacity 
                    style={{
                        position: 'absolute',
                        top: 15,
                        right: 10,
                        zIndex: 1,
                    }}
                    onPress={() => navigation.navigate('EditGroup', { groupId: route.params.id})}
                >
                    <Icon name="ellipsis-vertical" size={24} color="black" />
                </TouchableOpacity>
                )}
                {markedMessages.length !== 0 && (
                    <>
                    <TouchableOpacity activeOpacity={0.5} onPress={handleTrashPress}>
                    <View style={styles.trashContainer}>
                        <Text style={styles.trashText}>{markedMessages.length}</Text>
                        <FontAwesome name="trash-o" size={28} color="black" />
                    </View>
                    </TouchableOpacity>
                    </>
                )}
                </>
              ),
        });
    }, [navigation, route, markedMessages, chatImage, chatTitle, isGroup,chatMemberID]);


    
    const handleAvatarPress = async () => {
        console.log('Avatar pressed. chatMemberID:', chatMemberID);
        if (!isGroup && chatMemberID) {
            try {
                const memberData = await getUserDataByID(chatMemberID);
                if (memberData) {
                    console.log('Fetched user data:', memberData);
                    setSelectedUserData(memberData);
                    setIsUserInfoVisible(true);
                } else {
                    Alert.alert('Error', 'Unable to fetch user data');
                }
            } catch (error) {
                console.error('Error in handleAvatarPress:', error);
                Alert.alert('Error', 'An error occurred while fetching user data');
            }
        } else if (isGroup) {
            console.log('This is a group chat. No user info to display.');
        } else {
            console.error('Invalid chatMemberID:', chatMemberID);
        }
    };

    const handleTrashPress = () => {

        Alert.alert(
            'Delete Messages',
            `Do you want to delete selected ${markedMessages.length} message/s?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete',
                onPress: async () => {
                    const chatRef = doc(db, 'Chats', route.params.id);
                    const messageRef = collection(chatRef, 'messages');
                    await deleteSelectedMessages(messageRef, markedMessages);
                    setMarkedMessages([]);
                    //await deleteMessageFields(); // Replace 'chatId' with your actual chat ID
                    // Additional logic after deleting all messages
                },
              },
            ],
            { cancelable: true }
          );
    }

    useEffect(() => {
      const loadSounds = async () => {
          const newSoundObjects = {};
          for (const message of messages) {
              if (message.data.status === 'audio') {
                console.log("data", message.data);
                  const { sound } = await Audio.Sound.createAsync({ uri: message.data.message });
                  newSoundObjects[message.id] = sound;
              }
          }
          setSoundObjects(newSoundObjects);
      };
      loadSounds();
    }, [messages]);

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.seconds) {
            return '';
        }
    
        const date = new Date(timestamp.seconds * 1000); // Convert timestamp to Date object
        const currentDate = new Date(); // Current date
    
        // Check if the date is today
        if (date.toDateString() === currentDate.toDateString()) {
            return 'Today';
        }
        
        // Check if the date is yesterday
        currentDate.setDate(currentDate.getDate() - 1); // Subtract one day from current date
        if (date.toDateString() === currentDate.toDateString()) {
            return 'Yesterday';
        }
        
        // Format the date in "month(name) / day(number) / year" format
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options).replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3');
    };

    /*Display top date code*/
    const flatListRef = useRef(null);
    const [displayedDate, setDisplayedDate] = useState(null);

    const getNickname = (email) => {
        if (email) {
            //const atIndex = email.indexOf('@');
            //return atIndex !== -1 ? email.substring(0, atIndex) : email;
            return email;
        }
        return '';
    };

    const handleItemRendered = async (item) => {
        if (item && item.data.uid != auth.currentUser.uid) {
            if (!(item.data.uid in emailsDictionary)) {
                const memberData = await getUserDataByID(item.data.uid);
                const memberEmail = memberData.email;
                const nickname = getNickname(memberEmail);
                setEmailsDictionary(prevDictionary => ({
                    ...prevDictionary,
                    [item.data.uid]: nickname,
                }));
            }
        }
    };
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const lastItem = viewableItems[viewableItems.length - 1];
            if (lastItem && lastItem.item && lastItem.item.data && lastItem.item.data.timestamp && lastItem.item.data.timestamp.seconds) {
                const timestamp = lastItem.item.data.timestamp;
                const formattedDate = formatDate(timestamp);
                setDisplayedDate(formattedDate);
            }
        }
    });

    useEffect(() => {
        if (flatListRef.current && flatListRef.current.props.data.length > 0) {
          const lastItemIndex = flatListRef.current.props.data.length - 1;
          flatListRef.current.scrollToIndex({ index: lastItemIndex, animated: true });
        }
      }, []);


    //   return(
    //     <View style={styles.container}>
    //         <SafeAreaView style={styles.safeArea}>
    //             <View style={styles.header}>
    //             <StatusBar style='dark' />
    //             </View>
                
    //             {messages === null ? (
    //                 <View style={{flex:1}}>
    //                     <Text>Welcome to Whisper</Text>
    //                 </View>
    //             ) : (
    //                 <>
    //                     {displayedDate && (
    //                         <View style={styles.dateDisplayContainer}>
    //                             <Text style={styles.dateDisplayText}>{displayedDate}</Text>
    //                         </View>
    //                     )}
    //                        <FlatList
    //             ref={scrollViewRef}
    //             data={messages.slice(0)} // Reverse the array to display newest messages at the top
    //             keyExtractor={(item) => item.id}
    //             renderItem={({ item, index }) => {
    //                 // Call the custom function for each item
    //                 handleItemRendered(item);
                    
    //                 return (
    //                     <>
    //                         { 
    //                             item.data &&
    //                             item.data.timestamp &&
    //                             item.data.timestamp.seconds &&
    //                             index > 0 &&
    //                             messages[index - 1].data &&
    //                             messages[index - 1].data.timestamp &&
    //                             messages[index - 1].data.timestamp.seconds &&
    //                             new Date(item.data.timestamp.seconds * 1000).toDateString() !== 
    //                             new Date(messages[index - 1].data.timestamp.seconds * 1000).toDateString() && (
    //                                 <View style={styles.dateSeparatorContainer}>
    //                                     <View style={styles.dateSeparatorLine} />
    //                                     <View style={styles.dateSeparator}>
    //                                         <Text style={styles.dateSeparatorText}>{formatDate(messages[index - 1].data.timestamp)}</Text>
    //                                     </View>
    //                                     <View style={styles.dateSeparatorLine} />
    //                                 </View>
    //                             )
    //                         }

    //                         {
    //                         <ConditionalTouchable
    //                             condition={item.data.uid === auth.currentUser.uid}
    //                             onPress={() => handlePress(item)}
    //                             onLongPress={() => handleLongPress(item)}
    //                         >
    //                             <ConditionalMarker
    //                                 condition={markedMessages.includes(item.id)}
    //                             >
    //                                 {
    //                                 item.data.status === 'text' && (<TextMessageComponent item={item} isGroup={isGroup} isSender={item.data.uid === auth.currentUser.uid} emailsDictionary={emailsDictionary}/>)
    //                                 }
    //                                 {
    //                                 item.data.status === 'audio' && (<VoiceMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid} sound={soundObjects[item.id]} isGroup={isGroup} emailsDictionary={emailsDictionary}/>) 
    //                                 }
    //                                 {
    //                                 item.data.status === 'image' && (<ImageMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid} isGroup={isGroup} emailsDictionary={emailsDictionary}/>)
    //                                 }
    //                             </ConditionalMarker>
    //                         </ConditionalTouchable>
    //                         }
    //                         {
    //                         item.data.status === 'deleted' && (
    //                         <DeletedMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid}/>
    //                         )
    //                         }
    //                     </>
    //                 );
    //             }}
    //             inverted={true} // Display newest messages at the top
    //             onLayout={() => {
    //                 if (flatListRef.current && flatListRef.current.props.data.length > 0) {
    //                   const lastItemIndex = flatListRef.current.props.data.length - 1;
    //                   flatListRef.current.scrollToIndex({ index: lastItemIndex, animated: true });
    //                 }
    //               }}
    //               onViewableItemsChanged={onViewableItemsChanged.current}    
    //               initialNumToRender={15}            
    //             />
    //              </>
    //             )}
    //             {(!loading) && chatMemberID && isRealTime && (
    //                 <RealTimeTextMessageComponent uid={chatMemberID} chatId={route.params.id}/>
    //             )}
    //             {!loading && (
    //                 isRealTime ? (
    //                     <RealTimeChatUserMessageInputComponent currentChatID={route.params.id}/>
    //                 ) : (
    //                     <UserMessageInput db={db} chatId={route.params.id} auth={auth} />
    //                 )
    //             )}
    //         </SafeAreaView>
    //         {isUserInfoVisible && (
    //             <TouchableOpacity 
    //                 style={styles.overlay}
    //                 activeOpacity={1}
    //                 onPress={() => setIsUserInfoVisible(false)}
    //             >
    //                 <View style={styles.overlayBackground} />
    //             </TouchableOpacity>
    //         )}
    //         <UserInfoSideWindow 
    //             isVisible={isUserInfoVisible}
    //             userData={selectedUserData}
    //         />
    //     </View>
    //   );
  return (
    <View style={styles.container}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', marginTop: -29, paddingTop: 0}}>
      <StatusBar style='dark' />
      {messages === null ? (
          <View style={{flex:1}}>
              <Text>Welcome to Whisper</Text>
          </View>
      ) : (
          <>
          {displayedDate && (
              <View style={styles.dateDisplayContainer}>
                <Text style={styles.dateDisplayText}>{displayedDate}</Text>
              </View>
          )}
          <FlatList
            ref={scrollViewRef}
            data={messages.slice(0)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              handleItemRendered(item);
              return (
                  <>
                      { 
                          item.data &&
                          item.data.timestamp &&
                          item.data.timestamp.seconds &&
                          index > 0 &&
                          messages[index - 1].data &&
                          messages[index - 1].data.timestamp &&
                          messages[index - 1].data.timestamp.seconds &&
                          new Date(item.data.timestamp.seconds * 1000).toDateString() !== 
                          new Date(messages[index - 1].data.timestamp.seconds * 1000).toDateString() && (
                              <View style={styles.dateSeparatorContainer}>
                                  <View style={styles.dateSeparatorLine} />
                                  <View style={styles.dateSeparator}>
                                      <Text style={styles.dateSeparatorText}>{formatDate(messages[index - 1].data.timestamp)}</Text>
                                  </View>
                                  <View style={styles.dateSeparatorLine} />
                              </View>
                          )
                      }

                      {
                      <ConditionalTouchable
                          condition={item.data.uid === auth.currentUser.uid}
                          onPress={() => handlePress(item)}
                          onLongPress={() => handleLongPress(item)}
                      >
                          <ConditionalMarker
                              condition={markedMessages.includes(item.id)}
                          >
                              {
                              item.data.status === 'text' && (<TextMessageComponent item={item} isGroup={isGroup} isSender={item.data.uid === auth.currentUser.uid} emailsDictionary={emailsDictionary}/>)
                              }
                              {
                              item.data.status === 'audio' && (<VoiceMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid} sound={soundObjects[item.id]} isGroup={isGroup} emailsDictionary={emailsDictionary}/>) 
                              }
                              {
                              item.data.status === 'image' && (<ImageMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid} isGroup={isGroup} emailsDictionary={emailsDictionary}/>)
                              }
                          </ConditionalMarker>
                      </ConditionalTouchable>
                      }
                      {
                      item.data.status === 'deleted' && (
                      <DeletedMessageComponent item={item} isSender={item.data.uid === auth.currentUser.uid}/>
                      )
                      }
                  </>
              );
            }}
            inverted={true}
            onLayout={() => {
              if (flatListRef.current && flatListRef.current.props.data.length > 0) {
                const lastItemIndex = flatListRef.current.props.data.length - 1;
                flatListRef.current.scrollToIndex({ index: lastItemIndex, animated: true });
              }
            }}
            onViewableItemsChanged={onViewableItemsChanged.current}    
            initialNumToRender={15}            
          /> 
          </>
      )}
      {(!loading) && chatMemberID && isRealTime && (
          <RealTimeTextMessageComponent uid={chatMemberID} chatId={route.params.id}/>
      )}
      {!loading && (
        isRealTime ? (
          <RealTimeChatUserMessageInputComponent currentChatID={route.params.id}/>
        ) : (
          <UserMessageInput db={db} chatId={route.params.id} auth={auth} />
        )
      )}
    </SafeAreaView>
    {isUserInfoVisible && (
      <View style={styles.sideWindowContainer}>
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsUserInfoVisible(false)}
        >
          <View style={styles.overlayBackground} />
        </TouchableOpacity>
        <UserInfoSideWindow 
          isVisible={isUserInfoVisible}
          onClose={() => setIsUserInfoVisible(false)}
          userData={selectedUserData}
        />
      </View>
    )}
  </View>
    );
};


export default ChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
      sideWindowContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
      },
      overlay: {
        flex: 1,
      },
      overlayBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    spacer: {
        height:1,
    }, 
    trashContainer: {
        marginRight: 25,
        display:'flex',
        flexDirection:'row',
    },
    trashText: {
        alignSelf:'flex-end',
        fontSize: 18
    },
    dateSeparatorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
        display: 'flex',
        flexDirection:'row',
    },
    dateSeparator: {
        backgroundColor: '#f6f5f3',
        paddingLeft: 35,
        paddingRight: 35,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a9b2b7'
    },
    dateSeparatorText: {
        color: '#a9b2b7',
        fontSize: 16,
    },
    dateSeparatorLine: {
        height: 1,
        backgroundColor: '#a9b2b7',
        flex:1
    },  



    dateDisplayContainer: {
        backgroundColor: '#f6f5f3',
        borderColor: '#a9b2b7',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position:'absolute',
        alignSelf:'center',
        zIndex: 1,
        paddingBottom: 2,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius:10,
        paddingLeft: 35,
        paddingRight: 35,
      },
      dateDisplayText: {
        color: '#a9b2b7',
        fontSize: 16,
      },
      spacer: {
        height: 10,
      },
})