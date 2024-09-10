import { StyleSheet, Text, View, TouchableOpacity, ScrollView ,Alert} from 'react-native'
import React, { useLayoutEffect, useState,useRef, useEffect } from 'react'
import { Button, Input } from 'react-native-elements';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs, query, where, serverTimestamp, and } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native-elements';
import CreateGroupComponent from '../components/GroupComponents/CreateGroupComponent';
import PopupMenu from '../components/PopUpMenu';
import { generateKeys } from '../utils/encryptionRSA_ESA';
const AddChatScreen = ({navigation}) => {
    const [inputGroupName, setInputGroupName] = useState(""); // Initialize with an empty string
    const [inputMembersEmail, setInputMembersEmail] = useState([]); // Initialize with an empty string
    const [displayNewChatForm, setDisplayNewChatForm] = useState(false);
    const [displayNewGroupForm, setDisplayNewGroupForm] = useState(false);
    const [groupImage, setGroupImage] = useState(null);
    const [input, setInput] = useState("");
    const [regularChatError, setRegularChatError] = useState('');

    
    const handleNewChatPress = () => {
        setDisplayNewGroupForm(false);
        setDisplayNewChatForm(!displayNewChatForm);
    }

    const handleNewGroupPress = () => {
        setDisplayNewChatForm(false);
        setDisplayNewGroupForm(!displayNewGroupForm);
    }


    const getUserIDByEmail = async (email) => {
        const usersRef = collection(db, 'Users');
        const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));
        if (querySnapshot.empty) {
            return null;
        }
        return querySnapshot.docs[0].id;
    }

    const isValidEmail = (email) => {
        if (email.trim() === "") {
            setRegularChatError("member email can't be empty")
            return false;
        }

        // Regular expression pattern for validating email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setRegularChatError("member email is invalid")
            return false;
        }
        return true;
    }

    const createRegularChat = async () => {
        try {
            if (!isValidEmail(input)) {
                return;
            }

            const user = await getUserIDByEmail(input);
        
            const chatRef = collection(db, 'Chats');
            const chatQuery = query(chatRef,
                where('isGroup', '==', false), // Ensure it's not a group chat
                where('members', 'array-contains', auth.currentUser.uid) // Current user is in members array
            );

            const chatSnapshot = await getDocs(chatQuery);

            let existingChatId = null;
            chatSnapshot.forEach(doc => {
                const members = doc.data().members;
                // Check if the chat room has exactly two members
                if (members.length === 2 && members.includes(user)) {
                    existingChatId = doc.id;
                }
            });
        
            if (existingChatId) {
                navigation.replace('Chat', { id: existingChatId });
            } else {

                const newChatDoc = await addDoc(chatRef, {
                    isGroup: false,
                    members: [auth.currentUser.uid, user],
                    lastMessageTimestamp: serverTimestamp(),
                    lastMessage: null
                });
        
                const { publicKey, privateKey } = await generateKeys(); 
                const keysRef = doc(db, 'Keys', newChatDoc.id);
                await setDoc(keysRef, {
                    publicKey,
                    privateKey,
                  });
                navigation.goBack();
            }
        } catch (error) {
            console.log(error.message)
            Alert.alert(error.message);
        }
    }


    const fetchUserIds = async (emails) => {
        const userIds = [];
        for (const email of emails) {
            const usersRef = collection(db, 'Users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    userIds.push(doc.id);
                });
            }
        }
        return userIds;
    };

    const handleCreateGroup = async () => {
        try {
            console.log('Creating group with name:', inputGroupName);
            console.log('Group members:', inputMembersEmail);
            
            // Validate group name and members
            if (inputGroupName.trim() === "" || inputMembersEmail.length === 0) {
            Alert.alert("Group name or member list can't be empty");
            return;
            }

            // Get authenticated user ID

            const auth = getAuth();
            const { uid } = auth.currentUser;

             // Fetch UIDs for the email addresses
             const memberUids = await fetchUserIds(inputMembersEmail);
             console.log('Member UIDs:', memberUids);
    
            let groupImageUrl = null;
            if (groupImage) {
                const storage = getStorage();
                const imageRef = ref(storage, `GroupProfileImages/${inputGroupName}_${Date.now()}`);
                const response = await fetch(groupImage);
                const blob = await response.blob();
                await uploadBytes(imageRef, blob);
                groupImageUrl = await getDownloadURL(imageRef);
            }
    
            const chatRef = collection(db, 'Chats');
            await addDoc(chatRef, { 
                isGroup: true,
                groupName: inputGroupName,
                members: [uid, ...memberUids],
                groupImage: groupImageUrl,
                lastMessageTimestamp: serverTimestamp()
            });


            console.log('Group created successfully');
            console.log('Final members (UIDs):', [uid, ...memberUids]);
            // navigation.navigate('Home'); // Or whatever your main screen is called
            navigation.replace('Chat', {
                id: newChatDoc.id,
                chatType: 'isGroup',
                groupName: inputGroupName, // Pass group name to ChatScreen
                groupImage: groupImageUrl, // Pass group image URL to ChatScreen
            });
            } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Failed to create group. Please try again later.');
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            //headerBackTitle:"Login",
            headerTitleAlign: 'center',
            title: "Add a new chat",
        });
    },[]);




    return (
        <>
                    <View style={styles.container}>
                        <View style={{flexDirection:'column', height:400, backgroundColor:'red', width:'100%',justifyContent:'center'}}>
                            <View style={{flexDirection:'row',justifyContent:'center'}}>
                                <View style={styles.shapeTopLeft}>
                                    <Text style={styles.typeText}>
                                        New Chat
                                    </Text>
                                </View>
                                <View style={styles.shapeTopRight}>
                                    <Text style={styles.typeText}>
                                        New Group
                                    </Text>
                                </View>
                            </View>
                            <View style={{flexDirection:'row',justifyContent:'center'}}>
                                <View style={styles.shapeBottomLeft}>
                                    <Text style={styles.typeText}>
                                        Real-Time Chat
                                    </Text>
                                </View>
                                <View style={styles.shapeBottomRight}>

                                </View>
                            </View>
                        </View>
                        <View style={styles.roomTypesTitle}>
                            <Text style={styles.roomTypesText}>Select Chat Room Type:</Text>
                        </View>
                        <TouchableOpacity  testID="new-chat-button" onPress={() => {navigation.navigate('CreateChat')}} activeOpacity={0.6} style={{backgroundColor:'rgb(98, 116, 255)'}}>
                            <View style={styles.chatTypeContainer}>
                                <View style={styles.chatTypeImageContainer}>
                                    <Image style={styles.chatTypeImage} source={require('../static/ChatIcon.png')} />
                                </View>
                                <View style={styles.chatTypeTextContainer}>
                                    <Text style={styles.chatTypeText}>New Chat</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {displayNewChatForm && (
                            <View style={styles.newChatFormContainer}>
                                <Input
                                    placeholder='Member email'
                                    value={input}
                                    onChangeText={(text) => setInput(text)} />
                                {
                                    regularChatError && (
                                        <Text>{regularChatError}</Text>
                                    )
                                }
                                <Button buttonStyle={styles.button} onPress={createRegularChat} title="Create new Chat" />
                            </View>
                        )}

                        {/* <TouchableOpacity onPress={handleNewGroupPress}> */}
                        <TouchableOpacity testID="new-group-button" onPress={()=>{navigation.navigate('CreateGroup')}} activeOpacity={0.6} style={{backgroundColor:'rgb(98, 116, 255)'}}>
                            <View style={styles.chatTypeContainer}>
                                <View style={styles.chatTypeImageContainer}>
                                    <Image style={styles.chatTypeImage} source={require('../static/GroupIcon.png')} />
                                </View>
                                <View style={styles.chatTypeTextContainer}>
                                    <Text style={styles.chatTypeText}>New Group</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {displayNewGroupForm && (
                            <View style={styles.newChatFormContainer}>
                                {/* <CreateGroupComponent 
                                    setInputGroupName={setInputGroupName} 
                                    setInputMembersEmail={setInputMembersEmail} 
                                    onGroupImageChange={setGroupImage}
                                    handleCreateGroup={handleCreateGroup}/> */}
                                {/* <Button buttonStyle={styles.button} onPress={createChat} title="Create Group" /> */}
                            </View>
                        )}
                        <TouchableOpacity testID="real-time-chat-button" activeOpacity={0.6} onPress={() => {navigation.navigate('CreateRealTime')}} style={{backgroundColor:'rgb(98, 116, 255)'}}>
                            <View style={styles.chatTypeContainer}>
                                <View style={styles.chatTypeImageContainer}>
                                    <Image style={styles.chatTypeImage} source={require('../static/RealTimeIcon.png')} />
                                </View>
                                <View style={styles.chatTypeTextContainer}>
                                    <Text style={styles.chatTypeText}>Real-Time Chat</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
        </>
    );
}

export default AddChatScreen

const styles = StyleSheet.create({
    typeText: {
        textAlign:'center'
    },
    shape: {
        height: 150, width: 150, backgroundColor:'green', margin: 10, borderRadius: 20, justifyContent:'center'
    },
    shapeTopLeft: {
        height: 150, width: 150, backgroundColor:'green', margin: 5, justifyContent:'center',
        borderTopRightRadius: 80,
        borderBottomLeftRadius: 80,
        borderTopLeftRadius:800,
        borderBottomRightRadius:80,
    },
    shapeTopRight: {
        height: 150, width: 150, backgroundColor:'green', margin: 5, justifyContent:'center',
        borderTopRightRadius: 800,
        borderBottomLeftRadius: 80,
        borderTopLeftRadius:80,
        borderBottomRightRadius:80,
    },
    shapeBottomRight: {
        height: 150, width: 150, backgroundColor:'green', margin: 5, justifyContent:'center',
        borderTopRightRadius: 80,
        borderBottomLeftRadius: 80,
        borderTopLeftRadius:0,
        borderBottomRightRadius:800,
    },
    shapeBottomLeft: {
        height: 150, width: 150, backgroundColor:'green', margin: 5, justifyContent:'center',
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 800,
        borderTopLeftRadius:80,
        borderBottomRightRadius:80,
    },
    container: {
        flex: 1,
    },
    chatTypeContainer: {
        display:'flex',
        flexDirection:'row',
        backgroundColor: 'white',
        padding: 10,
        height: 70,
        alignItems: 'center',
        marginBottom: 0,
        borderTopWidth: 1,
        borderTopColor: 'black'
    },
    chatTypeImage: {
        height: '95%',
        width: '95%'
    },
    chatTypeText: {
        fontSize: 18,
    },
    chatTypeImageContainer: {
        marginLeft: 10,
        borderRadius: 30,
        borderWidth: 1, 
        borderColor: 'black',
        width: 60,
        height: 60,
        padding: 10,
    },
    chatTypeTextContainer: {
        marginLeft: 20,
    },
    roomTypesTitle: {
        padding: 5,
        backgroundColor:'white',
        borderWidth: 1,
        borderBottomColor: '#a9b2b7',
        borderTopColor: '#a9b2b7',
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    roomTypesText: {
        fontSize: 18,
        fontWeight: '700'
    }, 
    newChatFormContainer: {
        backgroundColor: '#f6f5f3',
        padding: 10,
    },
    groupImageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    }, 
    line: {
        height: 1,
        backgroundColor: 'black',
        marginVertical: 10,
    },
    button: {
        backgroundColor:"rgb(98, 116, 255)"
    },
})