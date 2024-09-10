import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView, Image, Alert, Platform  } from 'react-native';
import { AntDesign } from '@expo/vector-icons'; // Importing AntDesign icons
import { collection, query, where, getDocs } from 'firebase/firestore'; // Import necessary Firestore functions
import { db } from '../../firebase';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateGroupComponent = ({ setInputGroupName, setInputMembersEmail,onGroupImageChange ,handleCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [groupImage, setGroupImage] = useState(null); // State to hold the selected image



  
  const checkAndRequestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
  
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera and media library permissions to make this work!');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) {
      return;
    }
  
    try {
      console.log('Launching image library...');
      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      console.log('Picker result:', pickerResult);
  
      if (!pickerResult.canceled) {
        setGroupImage(pickerResult.assets[0].uri);
        onGroupImageChange(pickerResult.assets[0].uri);
        // setGroupImage(pickerResult.uri);
        // onGroupImageChange(pickerResult.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };
  

  const handleCreateGroupButtonPress = () => {
       // Validate group name and members
       if (groupName.trim() === '' || members.length === 0) {
        Alert.alert("Group name or member list can't be empty");
        return;
      }
  
      // Call setInputGroupName and setInputMembersEmail to pass data to parent component
      setInputGroupName(groupName);
      setInputMembersEmail(members);
  
      // Call handleCreateGroup function from parent component
      handleCreateGroup();
  };

  const isValidEmail = (email) => {
    // Basic email format validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkEmailExists = async (email) => {
    try {
      const usersRef = collection(db, 'Users');
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));

      return !querySnapshot.empty; // Return true if email exists, false otherwise
    } catch (error) {
      console.error('Error checking email:', error);
      return false; // Return false in case of any error
    }
  };

  const addMember = async () => {
    const email = memberEmail.trim();

    if (members.includes(email)) {
        Alert.alert('This member is already added');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        Alert.alert('Please enter a valid email address');
        return;
    }

    // Check if email exists in the database
    const emailExists = await checkEmailExists(email);

    if (!emailExists) {
        Alert.alert('No user found with the provided email');
        return;
    }

    const updatedMembers = [...members, email];
    setMembers(updatedMembers);
    setInputMembersEmail(updatedMembers); // Update parent component with email addresses
    setMemberEmail('');
};

  const removeMember = (email) => {
    const updatedMembers = members.filter(member => member !== email);
    setMembers(updatedMembers);
    setInputMembersEmail(updatedMembers); // Update parent component
  };

  const getNickname = (email) => {
    if (email) {
      //const atIndex = email.indexOf('@');
      //return atIndex !== -1 ? email.substring(0, atIndex) : email;
      return email;
    }
    return '';
  };

  return (
    <SafeAreaView>
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.imagePicker}>
          {groupImage ? (
            <Image source={{ uri: groupImage }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePickerIconContainer}>
              <AntDesign name="camerao" size={24} color="black" />
            </View>
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={groupName}
          onChangeText={(text) => {
            setGroupName(text);
            setInputGroupName(text); // Update parent component
          }}          
          placeholder="Group name (Necessarily)"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { marginBottom: 8 }]}
          value={memberEmail}
          onChangeText={setMemberEmail}
          placeholder="Member email"
        />
        <TouchableOpacity onPress={addMember}>
          <AntDesign name="checkcircle" size={30} color="rgb(98, 116, 255)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.membersTitle}>Group Members:</Text>
      <ScrollView style={styles.membersContainer}>
        {members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <Image
              style={styles.memberImage}
              source={require('../../static/DefaultProfileImage.png')} // Replace with actual image source if available
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.memberName}>{getNickname(member)}</Text>
              <Text style={styles.memberEmail}>{member}</Text>
            </View>
            <TouchableOpacity onPress={() => removeMember(member)}>
              <AntDesign name="minuscircle" size={30} color="rgb(98, 116, 255)" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={handleCreateGroupButtonPress}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Create Group</Text>
        </View>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  },
});

export default CreateGroupComponent;
