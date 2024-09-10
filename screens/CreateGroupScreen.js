import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform , Dimensions} from 'react-native';
import React, { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity, TextInput } from 'react-native-gesture-handler'
import { AntDesign, Feather } from '@expo/vector-icons';
import { EvilIcons } from '@expo/vector-icons';
import { Image } from 'react-native-elements';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { generateKeys } from '../utils/encryptionRSA_ESA';
import colors from '../assets/colors';

const { height } = Dimensions.get('window');


const CreateGroupScreen = ({navigation}) => {
  const [groupName, setGroupName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupNameError, setGroupNameError] = useState('');
  const [emailInputError, setEmailInputError] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [creationLoading, setCreationLoading] = useState(false);
  const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "co.il"];
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (text) => {
    setEmailInput(text);
  
    if (text.includes('@')) {
      const [, domain] = text.split('@');
      const filteredDomains = emailDomains.filter(d => d.startsWith(domain) && d !== domain);
      setSuggestions(filteredDomains);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    const [localPart] = emailInput.split('@');
    setEmailInput(`${localPart}@${suggestion}`);
    setSuggestions([]);
  };
  
  

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerStyle: {},
      headerTitleAlign: 'center',
      headerTitle: 'Create a group',
      
      headerTitle: () => (
        <Text style={{fontSize: 23}}>
          Create a group
        </Text>
      ),
    });
  }, [creationLoading, groupName, groupMembers, groupImage]);

  const checkValidForm = () => {
    console.log(groupName);
    if (groupName.length < 3) {
      setGroupNameError('Group name must be at least 3 characters long');
    } else {
      setGroupNameError('');
    }

    if (groupMembers.length < 1) {
      setEmailInputError('Please add at least one member to the group');
    } else {
      setEmailInputError('');
    }

    if(groupName.length >= 3 && groupMembers.length >= 1) {
      return true;
    }
    return false;
  }

  const handleCreateGroupPress = async () => {
    await createGroupChatRoom()
  }
  const handleRemoveGroupMember = (id) => {
    const newGroupMembers = groupMembers.filter((member) => member.id !== id)
    setGroupMembers(newGroupMembers)

  }
  const handleRemoveGroupImage = () => {
    setGroupImage(null);
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log('result', result);

    if (!result.canceled) {
      const uri = result.assets ? result.assets[0].uri : result.uri;
      console.log('uri', uri);
      setGroupImage(uri);
    }
  };
  

  const isValidEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  };

  const isEmailInGroup = (email) => {
    return groupMembers.some(member => member.email.trim().toLowerCase() === email);
  };

  const getUserByEmail = async (email) => {
    try {
      if (!isValidEmail(email)) {
        setEmailInputError('Please enter a valid email address');
        return null;
      }
      
      const usersRef = collection(db, 'Users');
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));
      if (querySnapshot.empty) {
        setEmailInputError('No user found with this email address');
        return null;
      }
      const id = querySnapshot.docs[0].id;
      const data = querySnapshot.docs[0].data();
      const user = { email: data.email, profileImageURL: data.profileImageURL, id: id };
      return user;
    } catch (error) {
      setEmailInputError(error.message);
    } finally {
    }
  };
    const getNickname = (email) => {
    if (email) {
      //const atIndex = email.indexOf('@');
      //return atIndex !== -1 ? email.substring(0, atIndex) : email;
      return email;
    }
    return '';
  };
  const handleGroupNameChange = (text) => {
    if (text.length <= 20) {
      setGroupName(text);
    }
  }


  const createGroupChatRoom = async () => {
    if(checkValidForm()) {
      try {
        setCreationLoading(true);
        let groupImageURI = null;

        if (groupImage) {
          const response = await fetch(groupImage)
          const blob = await response.blob();
          const serverTime = serverTimestamp();
          const timestamp = serverTime.toMillis ? serverTime.toMillis() : Date.now();
          const storageRef = ref(storage, `GroupImages/${groupName}_${timestamp}`);
          const uploadTask = await uploadBytes(storageRef, blob);
          groupImageURI = await getDownloadURL(uploadTask.ref);
        }
        const ids = groupMembers.map(member => member.id);
        ids.push(auth.currentUser.uid);

        const chatRef = collection(db, 'Chats');
        const newChatDoc = await addDoc(chatRef, {
          isGroup: true,
          members: ids,
          lastMessageTimestamp: serverTimestamp(),
          lastMessageID: null,
          groupImageURL: groupImageURI,
          groupName: groupName,
          groupAdmin: auth.currentUser.uid,// the admin of the group
      });

      const { publicKey, privateKey } = await generateKeys(); 
      const keysRef = doc(db, 'Keys', newChatDoc.id);
      await setDoc(keysRef, {
        publicKey,
        privateKey,
      });

      navigation.pop();

      } catch(error) {
        setCreationError(error.message);
      } finally {
        setCreationLoading(false);
      }
    } else {
      return;
    }
  }

  const handlePlusPress = async () => {
    setIsLoadingUser(true);
    const normalizedEmail = emailInput.trim().toLowerCase();
    setEmailInputError('');

    if (isEmailInGroup(normalizedEmail)) {
      setEmailInputError('This email is already in the group.');
      setIsLoadingUser(false);
      return;
    }
    
    if (normalizedEmail === auth.currentUser.email.trim().toLowerCase()) {
      setEmailInputError('You cannot add your own email.');
      setIsLoadingUser(false);
      return;
    }

    const user = await getUserByEmail(emailInput);
    setEmailInput('');
    if (user) {
      setGroupMembers((prevMembers) => [...prevMembers, user]);
      console.log(groupMembers)
    }
    setIsLoadingUser(false);
    setSuggestions([]); 
  }

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Group Name</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  value={groupName} 
                  onChangeText={(text) => handleGroupNameChange(text)} 
                  placeholder="Group name (Required)" 
                  maxLength={20}
                />
                <Text style={styles.inputLengthStatus}>{groupName.length}/20</Text>
              </View>
              {groupNameError ? <Text style={styles.errorText}>{groupNameError}</Text> : null}
  
              <Text style={styles.sectionTitle}>Group Image</Text>
              <View style={styles.imageContainer}>
                {groupImage ? (
                  <>
                    <Image source={{uri: groupImage}} style={styles.imageDisplay}/>
                    <TouchableOpacity onPress={handleRemoveGroupImage} style={styles.removeImageButton}>
                      <Feather name='x-circle' size={35} color="red"/>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity testID="pick-image-button" onPress={pickImage} style={styles.imagePlaceholder}>
                    <EvilIcons name='camera' size={50} color="black" />
                  </TouchableOpacity>
                )}
              </View>
  
              <Text style={styles.sectionTitle}>Add Members</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  value={emailInput} 
                  onChangeText={handleChange} 
                  placeholder="Member email" 
                  keyboardType="email-address"
                  maxLength={20}
                />
                {isLoadingUser ? (
                  <ActivityIndicator size={30} color={colors.primaryColor}/>
                ) : (
                  emailInput && (
                    <TouchableOpacity testID="addMemberButton" onPress={handlePlusPress}>
                      <AntDesign name="pluscircle" size={28} color="rgb(98, 116, 255)" />
                    </TouchableOpacity>
                  )
                )}
              </View>
              {emailInputError ? <Text style={styles.errorText}>{emailInputError}</Text> : null}
  
              {suggestions.length > 0 && (
                <ScrollView horizontal style={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity key={index} onPress={() => handleSuggestionClick(suggestion)} style={styles.suggestionItem}>
                      <Text>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
  
              {groupMembers.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Group Members</Text>
                  <View style={styles.membersContainer}>
                    {groupMembers.map((member, index) => (
                      <View key={index} style={styles.memberItem}>
                        <Image
                          style={styles.memberImage}
                          source={member.profileImageURL ? { uri: member.profileImageURL } : require('../static/DefaultProfileImage.png')}
                        />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{getNickname(member.email)}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveGroupMember(member.id)}>
                          <AntDesign name="minuscircle" size={28} color="rgb(98, 116, 255)" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
            <View style={styles.bottomSpacer} />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroupPress}>
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "white",
    },
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      minHeight: height * 1.1,
      padding: 15,
    },
    formContainer: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderColor: '#ddd',
      paddingBottom: 10,
      marginBottom: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 5,
    },
    inputLengthStatus: {
      color: 'grey',
      fontSize: 14,
      marginLeft: 10,
    },
    imageContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    imageDisplay: {
      width: 150,
      height: 150,
      borderRadius: 75,
    },
    imagePlaceholder: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageButton: {
      position: 'absolute',
      right: -95,
      bottom: 0,
    },
    suggestionsContainer: {
      maxHeight: 50,
      marginBottom: 10,
    },
    suggestionItem: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: 20,
      marginRight: 10,
    },
    membersContainer: {
      maxHeight: 200,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    memberImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    memberEmail: {
      color: 'gray',
      fontSize: 14,
    },
    errorText: {
      color: 'red',
      fontSize: 14,
      marginBottom: 10,
    },
    bottomSpacer: {
      padding: 15,
      backgroundColor: "white",
      borderTopWidth: 1,
      borderTopColor: '#e1e1e1',
    },
    createButton: {
      backgroundColor: 'rgb(98, 116, 255)',
      padding: 12,
      borderRadius: 5,
      alignItems: 'center',
    },
    createButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
  
  export default CreateGroupScreen;
