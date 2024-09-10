import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    SafeAreaView, 
    TouchableOpacity, 
    ImageBackground, 
    Alert, 
    Animated, 
    Dimensions, 
    TextInput,
    ActivityIndicator, 
    StatusBar
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import CustomListItem from "../components/HomePageComponents/CustomListItem";
import { Avatar, Image } from "react-native-elements";
import { db, auth, rtdb } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, doc } from "firebase/firestore";
import { ref, onValue, off, set, remove, serverTimestamp, onDisconnect } from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Ionicons, Entypo, Octicons } from '@expo/vector-icons';
import colors from "../assets/colors";
import ImagePickerModal from "../components/ImagePickerModal";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import RateUs from "../components/RateUsComponent";
import AsyncStorage from '@react-native-async-storage/async-storage';
const HomeScreen = ({navigation}) => {
    const [chats, setChats] = useState([]);
    const [userData, setUserData] = useState(null);
    const [userStatuses, setUserStatuses] = useState({});
    const [isModalVisible, setModalVisible] = useState(false);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const popupAnimation = useRef(new Animated.Value(0)).current;
    const settingsAnimation = useRef(new Animated.Value(Dimensions.get('window').width)).current;
    const unsubscribersRef = useRef([]);

    const currentUserRef = useRef(null);

    const [showRateUs, setShowRateUs] = useState(false);

    const handleRateUsClose = () => {
        setShowRateUs(false);
      };

      useEffect(() => {
        const trackPageVisits = async () => {
          try {
            // Retrieve the current counter value


            const visitCount = await AsyncStorage.getItem('pageVisitCount');
            let count = visitCount ? parseInt(visitCount) : 0;

            // Check if the user has rated the app
            const hasRated = await AsyncStorage.getItem('hasRated');
    
            // If the user has visited more than 2 times and hasn't rated, show the RateUs component
            if (count > 2 && !hasRated) {
              setShowRateUs(true);
            }
          } catch (error) {
            console.error('Error tracking page visits:', error);
          }
        };
    
        trackPageVisits();
      }, []);
    
    const filteredChats = searchQuery.trim() === '' 
        ? chats 
        : chats.filter(chat => 
            chat.data.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) 
            || chat.data.chatName?.toLowerCase().includes(searchQuery.toLowerCase())
          );

        //   const updateOnlineStatus = useCallback((user, isOnline) => {
        //     if (user?.uid) {
        //         console.log(`Attempting to update online status for ${user.uid} to ${isOnline}`);
        //         const userStatusRef = ref(rtdb, `status/${user.uid}`);
        //         const status = {
        //             state: isOnline ? 'online' : 'offline',
        //             last_changed: serverTimestamp(),
        //         };
                
        //         set(userStatusRef, status)
        //             .then(() => console.log('Status updated successfully'))
        //             .catch(error => {
        //                 console.error('Error updating status:', error);
        //                 // If there's a permission error when setting offline status, it's likely because the user is already signed out
        //                 // In this case, we can ignore the error as the backend should handle this scenario
        //                 if (!isOnline) {
        //                     console.log('Ignoring offline status update error as user might be already signed out');
        //                 }
        //             });
    
        //         if (isOnline) {
        //             // Set up presence system
        //             onDisconnect(userStatusRef)
        //                 .set({
        //                     state: 'offline',
        //                     last_changed: serverTimestamp(),
        //                 })
        //                 .then(() => console.log('onDisconnect handler set up successfully'))
        //                 .catch(error => console.error('Error setting up onDisconnect handler:', error));
        //         }
        //     } else {
        //         console.log('No user provided, cannot update status');
        //     }
        // }, []);

        

        const updateOnlineStatus = useCallback((user, isOnline) => {
          if (user?.uid) {
              const userStatusRef = ref(rtdb, `status/${user.uid}`);
              const status = {
                  state: isOnline ? 'online' : 'offline',
                  last_changed: serverTimestamp(),
              };
              
              set(userStatusRef, status)
                  .then(() => {})
                  .catch(error => {
                      console.error('Error updating status:', error);
                      if (!isOnline) {
                          
                      }
                  });
      
              if (isOnline) {
                  onDisconnect(userStatusRef)
                      .set({
                          state: 'offline',
                          last_changed: serverTimestamp(),
                      })
                      .then(() => {})
                      .catch(error => console.error('Error setting up onDisconnect handler:', error));
              }
          } else {
              console.log('No user provided, cannot update status');
          }
      }, []);
    
      useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                currentUserRef.current = user;
                updateOnlineStatus(user, true);
            } else {
                setIsAuthenticated(false);
                currentUserRef.current = null;
                setChats([]);
                setUserData(null);
                setUserStatuses({});
                // Clean up all listeners when user logs out
                unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
                unsubscribersRef.current = [];
            }
            setIsLoading(false);
        });

        return () => {
            console.log('Auth state change effect cleanup');
            unsubscribeAuth();
        };
    }, [updateOnlineStatus]);

    useEffect(() => {
      if (isAuthenticated) {
          const statusRef = ref(rtdb, 'status');
          const unsubscribe = onValue(statusRef, (snapshot) => {
              if (snapshot.exists()) {
                  const statuses = snapshot.val();
                  const formattedStatuses = Object.keys(statuses).reduce((acc, uid) => {
                      acc[uid] = statuses[uid].state === 'online';
                      return acc;
                  }, {});
                  setUserStatuses(formattedStatuses);
              } else {

                  setUserStatuses({});
              }
          }, (error) => {
              console.error('Error in status listener:', error);
          });
          unsubscribersRef.current.push(() => {

              off(statusRef);
          });
          return () => {

              off(statusRef);
          };
      } else {

      }
  }, [isAuthenticated]);
  

      useEffect(() => {
        if (isAuthenticated && auth.currentUser?.uid) {
            const userRef = doc(db, 'Users', auth.currentUser.uid);

            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    Alert.alert("Can't find current user!");
                }
            }, (error) => {
                console.error('Error fetching user data:', error);
                Alert.alert("Error fetching user data!");
            });
            unsubscribersRef.current.push(unsubscribe);
            return () => {
                unsubscribe();
            };
        } else {

        }
    }, [isAuthenticated]);





    useEffect(() => {
      if (isAuthenticated && auth.currentUser?.uid) {
          const chatsQuery = query(
              collection(db, 'Chats'),
              where('members', 'array-contains', auth.currentUser.uid),
              orderBy('lastMessageTimestamp', 'desc')
          );
  
          const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
              const userChats = snapshot.docs.map(doc => {
                  const chatData = doc.data();
                  const otherUserId = chatData.members.find(memberId => memberId !== auth.currentUser.uid);
                  return {
                      id: doc.id, 
                      data: chatData,
                      otherUserId
                  };
              });
              setChats(userChats);
          }, (error) => {
              console.error('Error fetching chats:', error);
          });
          unsubscribersRef.current.push(unsubscribe);
          return () => {
              unsubscribe();
          };
      } else {

      }
  }, [isAuthenticated]);

  const chatsWithStatus = chats.map(chat => {
    const status = chat.data.isGroup ? null : userStatuses[chat.otherUserId];
    return {
        ...chat,
        userStatus: status
    };
});



  const handleLogout = useCallback(async () => {
    try {
        unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribersRef.current = [];
        
        // Update status to offline before signing out
        if (auth.currentUser) {
            await updateOnlineStatus(auth.currentUser, false);
        }
        
        await signOut(auth);
        navigation.replace('GoodBye');
    } catch (error) {
        console.error('Error during logout process:', error);
        Alert.alert('Error signing out');
    }
}, [updateOnlineStatus, navigation]);





    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const togglePopup = () => {
        if (isPopupVisible) {
            Animated.timing(popupAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => setIsPopupVisible(false));
        } else {
            setIsPopupVisible(true);
            Animated.timing(popupAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    };

    const toggleSettings = () => {
        if (isSettingsVisible) {
            Animated.timing(settingsAnimation, {
                toValue: Dimensions.get('window').width,
                duration: 300,
                useNativeDriver: true
            }).start(() => setIsSettingsVisible(false));
        } else {
            setIsSettingsVisible(true);
            Animated.timing(settingsAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    };

    const popupTranslateY = popupAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0]
  });


    const handleNewChat = () => {
        togglePopup();
        navigation.navigate('CreateChat');
    };

    const handleNewGroup = () => {
        togglePopup();
        navigation.navigate('CreateGroup');
    };

    const handleRealTimeChat = () => {
        togglePopup();
        navigation.navigate('CreateRealTime');
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleProfile = async () => {
        try {
            setModalVisible(false);
            await delay(500);
            navigation.navigate('EditProfile');
        } catch (error) {
            console.error('Error get profile', error);
            Alert.alert('Error get profile');
        }
    };

    const handleAdminPanel = async () => {
        try {
            setModalVisible(false);
            await delay(500);
            navigation.navigate('Admin');
        } catch (error) {
            console.error('Error get admin panel', error);
            Alert.alert('Error get Admin Panel');
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: colors.HomeScreenHeaderBackgroundColor },
            headerLeft: () => (
                userData && (
                    <View style={{ marginLeft: 20 }}>
                        <Avatar
                            rounded
                            source={userData.profileImageURL ? { uri: userData.profileImageURL } : require('../static/DefaultProfileImage.png')}
                            size={40}
                        />
                    </View>
                )),
            headerRight: () => (
                <View style={{ flexDirection: 'row'}}>
                    {userData && (
                        <TouchableOpacity onPress={toggleSettings} disabled={showRateUs}>
                            <Octicons name="gear" size={24} color="black" style={{marginRight: 20}}/>
                        </TouchableOpacity>
                    )}
                </View>
            ),
            headerTitle: () => (
                <Image
                    source={require('../static/WhisperHeaderLogo.jpg')}
                    style={{ width: 200, height: 50 }}
                    resizeMode="contain"
                />
            ),
        });
    }, [navigation, userData, showRateUs]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryColor} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.unauthenticatedContainer}>
                <Text>Please log in to access this screen.</Text>
            </View>
        );
    }

    return(
        <>
        <StatusBar style="light" />
        <ImageBackground 
            style={{ flex: 1 }}
            resizeMode="cover"
            backgroundColor='white'
        >  
            {isModalVisible && 
            <ImagePickerModal onClose={toggleModal} handleLogout={handleLogout} profileImageURL={userData?.profileImageURL} handleProfile={handleProfile} userData={userData}/>
            }
            <SafeAreaView style={{flex: 1}}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chats</Text>
                </View>
                {/* <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="gray" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search messages"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View> */}
                <ScrollView>
                {chatsWithStatus.map(({ id, data, otherUserId, userStatus }) => {
                    return (
                        <CustomListItem
                            key={id}
                            id={id}
                            data={data}
                            navigation={navigation}
                            uid={auth.currentUser?.uid}
                            userStatus={userStatus}
                            otherUserId={otherUserId}
                        />
                    );
                })}
            </ScrollView>
                {!isPopupVisible && !isSettingsVisible && (
                    <TouchableOpacity style={styles.addChatButton} onPress={togglePopup}>
                        <Ionicons name="chatbox-outline" size={45} color="rgb(98, 116, 255)" />
                        <Entypo name="plus" size={24} color="rgb(98, 116, 255)" style={{position:'absolute', top:10}}/>
                    </TouchableOpacity>
                )}
                {isPopupVisible && (
                    <TouchableOpacity 
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={togglePopup}
                    >
                        <Animated.View style={[
                            styles.popup,
                            {transform: [{translateY: popupAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [300, 0]
                            })}]}
                        ]}>
                            <TouchableOpacity style={styles.popupOption} onPress={handleNewChat}>
                                <Ionicons name="chatbubble-outline" size={24} color="black" />
                                <View>
                                    <Text style={styles.optionTitle}>New Chat</Text>
                                    <Text style={styles.optionSubtitle}>Send a message to your contact</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.popupOption} onPress={handleNewGroup}>
                                <Ionicons name="people-outline" size={24} color="black" />
                                <View>
                                    <Text style={styles.optionTitle}>New Group</Text>
                                    <Text style={styles.optionSubtitle}>Create a group chat</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.popupOption} onPress={handleRealTimeChat}>
                                <Ionicons name="time-outline" size={24} color="black" />
                                <View>
                                    <Text style={styles.optionTitle}>Real-Time Chat</Text>
                                    <Text style={styles.optionSubtitle}>Start a real-time conversation</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableOpacity>
                )}
                {isSettingsVisible && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={toggleSettings}
                    >
                        <Animated.View style={[
                            styles.settingsMenu,
                            { transform: [{ translateX: settingsAnimation }] }
                        ]}>
                            <TouchableOpacity style={styles.settingsOption} onPress={handleProfile}>
                                <Avatar
                                    rounded
                                    source={userData?.profileImageURL ? { uri: userData.profileImageURL } : require('../static/DefaultProfileImage.png')}
                                    size={30}
                                />
                                <Text style={styles.optionTitle}>Edit Profile</Text>
                            </TouchableOpacity>
                            {userData && userData?.isAdmin && (
                                <TouchableOpacity style={styles.settingsOption} onPress={handleAdminPanel}>
                                <MaterialIcons name="manage-accounts" size={30} color="black" />
                                <Text style={styles.optionTitle}>Admin Panel</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.settingsOption} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={30} color="black" />
                                <Text style={styles.optionTitle}>Logout</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableOpacity>
                )}
                {showRateUs && <RateUs onClose={handleRateUsClose}/>}
            </SafeAreaView>
        </ImageBackground>
        </>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  settingsMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    //bottom: 0,
    width: Dimensions.get('window').width * 0.5,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 20
    
},
settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
},
  addChatButton: {
    zIndex: 2,
    width: 60, height: 60,
    position:'absolute',
    right: 25,
    bottom: 100,
    zIndex: 1,
    alignItems:'center',
    justifyContent:'center',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "rgb(98, 116, 255)"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
},
modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    minWidth: 200,
},
popup: {
  backgroundColor: 'white',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  maxHeight: Dimensions.get('window').height * 0.7,
},
popupOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 15,
},
optionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 15,
},
optionSubtitle: {
  fontSize: 14,
  color: 'gray',
  marginLeft: 15,
},

})