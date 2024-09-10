import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
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
const CreateChat = ({navigation}) => {
  const [groupName, setGroupName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [emailInputError, setEmailInputError] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [creationLoading, setCreationLoading] = useState(false);
  const [haveMember, setHaveMember] = useState('');
  const [member, setMember] = useState('');

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
      headerTitle: 'Create a chat room',
      headerTitle: () => (
        <Text style={{fontSize: 23}}>
          Create a chat room
        </Text>
      ),
    });
  }, [creationLoading, groupName, groupMembers, groupImage]);

  const handleRemoveMember = () => {
    setMember('');
  }

  const isValidEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
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


  const handleCreateRealTime = async () => {
      try {
        setCreationLoading(true);

        const chatRef = collection(db, 'Chats');
        const newChatDoc = await addDoc(chatRef, {
          isGroup: false,
          isRealTime: false,
          members: [auth.currentUser.uid, member.id],
          lastMessageTimestamp: serverTimestamp(),
          lastMessageID: null,
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
  }

  const handlePlusPress = async () => {

    setIsLoadingUser(true);
    const normalizedEmail = emailInput.trim().toLowerCase();
    setEmailInputError('');

    if (normalizedEmail === auth.currentUser.email.trim().toLowerCase()) {
      setEmailInputError('You cannot add your own email.');
      setIsLoadingUser(false);
      return;
    }

    const user = await getUserByEmail(emailInput);
    
    if (user) {
      setMember(user);
      console.log(member)
    }
    setEmailInput('');
    setIsLoadingUser(false);
    setSuggestions([]); 

  }
  return (
    <>
    <View style={styles.spacer}/>
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.underlineLable}>Find User</Text>
        <View style={styles.spacer} />
      {emailInputError ? <Text style={styles.errorText}>{emailInputError}</Text> : null}

      {member ? (
        <View style={styles.memberItem}>
        <Image
          style={styles.memberImage}
          source={member.profileImageURL ? { uri: member.profileImageURL } :  require('../static/DefaultProfileImage.png')}
        />
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.memberName}>{getNickname(member.email)}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
        </View>
        <TouchableOpacity onPress={() => {handleRemoveMember()}} style={{borderRadius: 50, borderWidth:1, padding:2}}>
          <AntDesign name="minus" size={20} color="grey" />
        </TouchableOpacity>
      </View>
      ): (
        <View style={styles.inputElementsContainer}>
          <View style={styles.inputContainer}>
            <TextInput 
                style={styles.input} 
                value={emailInput} 
                onChangeText={handleChange} 
                keyboardType="email-address"
                placeholder="Member email" 
                maxLength={20}/>
          </View>
          {isLoadingUser ? 
          (
            <ActivityIndicator size={30} color={'grey'}/>
          ):(
            emailInput &&
            (
              <TouchableOpacity testID="add-user-button" onPress={() => {handlePlusPress()}} style={{borderRadius: 50, borderWidth:1, padding:2}}>
                <AntDesign name="plus" size={20} color="grey" />
              </TouchableOpacity>
            )
          )}
      </View>
      )}
      {suggestions.length > 0 && (
            <ScrollView horizontal style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity key={index} onPress={() => handleSuggestionClick(suggestion)} style={styles.suggestionItem}>
                  <Text>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

    <View style={styles.spacer} />


      {member && (
      <TouchableOpacity 
      style={{backgroundColor:'#6171fe', alignItems:'center', height:50, borderRadius: 10, justifyContent:'center'}} 
      activeOpacity={0.7} 
      disabled={creationLoading}
      onPress={() => {handleCreateRealTime()}}>
      {creationLoading ? (
        <ActivityIndicator color={'white'} size={30}/>
      ) : (
        <Text style={{color:'white', fontSize:20, fontStyle:'italic', fontWeight:'bold'}}>
          Start Chat
        </Text>
      )}
    </TouchableOpacity>
      )}

      </View>
    </View>
    </>
  );
}

export default CreateChat

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 1,
    backgroundColor: 'white',
  },
  inputElementsContainer: {
    
    width: '100%',
    flexDirection: 'row',
    //alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf:'center',
    borderBottomWidth: 1,
    borderColor: 'grey',
    paddingBottom: 10,
  },
  input: {
    width:'90%',
    paddingLeft: 10,
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: "rgb(98, 116, 255)",
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  membersContainer: {
    width: '110%',
    //maxHeight: 100,
    borderColor: 'grey',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomColor:'grey',
    borderBottomWidth: 1,
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  memberName: {
    fontWeight: 'bold',
  },
  memberEmail: {
    marginTop: 4,
    color: 'gray',
  },
  imagePicker: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  imagePickerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: 65,
    height: 65,
    borderRadius: 50,
  },inputLengthStatus: {
    alignSelf:'flex-end',
    textAlign:'right',
    color: 'grey',
    fontSize: 15,
  }, 
  formContainer: {
    borderWidth:1,
    borderColor:'grey',
    width:'90%',
    padding: 15,
    alignSelf:'center',
    borderRadius: 10
  },
  groupImageContainer: {
    alignItems:'center',
  }, 
  groupImageElementsContainer: {
    width: 135,
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'grey',
  },
  imageDisplay:{
    width: 133,
    height: 133,
    borderRadius: 100,
  },
    spacer: {
    height: 15,
    backgroundColor: 'white',
  }, 
  underlineLable: {
    fontSize: 18,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    //alignSelf:'flex-start',
    color: 'gray',
    width: '100%',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 18,
    fontStyle:'italic',
    paddingLeft: 10,
    paddingTop: 2,
    alignSelf: 'flex-start',
  },
  suggestionsContainer: {
    width: '100%',
    maxHeight: 50,
    marginTop: 10,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginHorizontal: 5,
  },
})