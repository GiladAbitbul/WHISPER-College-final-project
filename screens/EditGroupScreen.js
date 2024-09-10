import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform} from 'react-native';
import { AntDesign, Feather, EvilIcons, Ionicons } from '@expo/vector-icons';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import colors from '../assets/colors';
import { ListItem, Avatar } from 'react-native-elements';

const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "co.il"];



const EditGroupScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);


  const handleEmailChange = (text) => {
    setNewMemberEmail(text);
    const atIndex = text.indexOf('@');
    if (atIndex > -1) {
      const enteredDomain = text.slice(atIndex + 1);
      const filteredDomains = emailDomains.filter(domain => domain.startsWith(enteredDomain));
      setEmailSuggestions(filteredDomains.map(domain => text.slice(0, atIndex + 1) + domain));
    } else {
      setEmailSuggestions([]);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setNewMemberEmail(suggestion);
    setEmailSuggestions([]);
  };


  useEffect(() => {
    fetchGroupData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: colors.HomeScreenHeaderBackgroundColor },
      headerTitle: () => (
        isAdmin ? (
          <Text style={styles.title}>Edit Group</Text>
        ):(
          <Text style={styles.title}>Group Info</Text>
        )
      ),
    });
  }, [navigation,isAdmin]);


  const fetchGroupData = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'Chats', groupId));
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        setGroupName(data.groupName);
        setGroupImage(data.groupImageURL);
        setIsAdmin(data.groupAdmin === auth.currentUser.uid);
        
        const memberEmails = await Promise.all(
          data.members.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, 'Users', memberId));
            return { id: memberId, email: userDoc.data().email, profileImage: userDoc.data().profileImageURL, MemberStatus: userDoc.data().status || 'No Status' };
          })
        );
        setMembers(memberEmails);
      } else {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      Alert.alert('Error', 'Failed to load group data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "Only group admin can change the group image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setGroupImage(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  const handleAddMember = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "Only group admin can add members.");
      return;
    }

    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where("email", "==", newMemberEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert("Error", "User not found.");
      return;
    }

    const newMemberId = querySnapshot.docs[0].id;
    if (members.some(member => member.id === newMemberId)) {
      Alert.alert("Error", "User is already a member of this group.");
      return;
    }

    setMembers([...members, { id: newMemberId, email: newMemberEmail }]);
    setNewMemberEmail('');
    setEmailSuggestions([]);
    setHasChanges(true);
  };

  const handleRemoveMember = (memberId) => {
    if (!isAdmin) {
      Alert.alert("Error", "Only group admin can remove members.");
      return;
    }

    setMembers(members.filter(member => member.id !== memberId));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "Only group admin can edit the group.");
      return;
    }

    if (groupName.trim() === '' || members.length === 0) {
      Alert.alert("Error", "Group name or member list can't be empty");
      return;
    }

    setLoading(true);

    try {
      const groupRef = doc(db, 'Chats', groupId);
      let updatedData = { groupName };

      if (groupImage && !groupImage.startsWith('http')) {
        const response = await fetch(groupImage);
        const blob = await response.blob();
        const storageRef = ref(storage, `GroupImages/${groupId}_${Date.now()}`);
        const uploadTask = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        updatedData.groupImageURL = downloadURL;
      }

      updatedData.members = members.map(member => member.id);

      await updateDoc(groupRef, updatedData);
      Alert.alert("Success", "Group updated successfully!");
      setHasChanges(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert("Error", "Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.imageContainer}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <EvilIcons name="camera" size={50} color="black" />
              </View>
            )}
            {isAdmin && (
              <TouchableOpacity testID="edit-image-button" style={styles.editImageButton} onPress={handleUpdateImage}>
                <Feather name="edit-2" size={24} color="white"/>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>Group Name:</Text>
          <View style={styles.inputContainerAdmin}>
            {isAdmin ? (
              <TextInput
                testID="group-name-input"
                style={styles.input}
                value={groupName}
                onChangeText={(text) => {
                  setGroupName(text);
                  setHasChanges(true);
                }}
                placeholder="Group Name"
              />
            ) : (
              <Text style={[styles.readOnlyText, styles.inputContainer]}>{groupName}</Text>
            )}
          </View>

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Add Member</Text>
              <View style={styles.addMemberContainer}>
                <TextInput
                  testID="new-member-input"
                  style={styles.input}
                  value={newMemberEmail}
                  onChangeText={handleEmailChange}                  
                  placeholder="New Member Email"
                />
                <TouchableOpacity   testID="add-member-button" style={styles.addButton} onPress={handleAddMember}>
                  <AntDesign name="plus" size={24} color="white" />
                </TouchableOpacity>
              </View>
              {emailSuggestions.length > 0 && (
                <ScrollView horizontal style={styles.suggestionsContainer}>
                  {emailSuggestions.map((suggestion, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => handleSuggestionPress(suggestion)} 
                      style={styles.suggestionItem}
                    >
                      <Text>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Group Members:</Text>
          {members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfoContainer}>
                <Avatar 
                  source={
                    member.profileImage ? { uri: member.profileImage } : require('../static/DefaultProfileImage.png')
                  }
                  rounded 
                  size={40} 
                />
                <View style={styles.memberTextContainer}>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <Text style={styles.memberStatus}>{member.MemberStatus}</Text>
                </View>
              </View>
              {isAdmin && member.id !== auth.currentUser.uid && (
                <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                  <Ionicons name="remove-circle" size={30} color="rgb(98, 116, 255)" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {isAdmin && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
              onPress={handleSaveChanges}
              disabled={!hasChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    padding: 15,
    paddingBottom: 100,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  groupImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    right: 7,
    bottom: 0,
    backgroundColor: colors.editGroupImageIconBackgroundColor,
    borderRadius: 15,
    padding :7,
  },
  suggestionsContainer: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainerAdmin: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
  },
  addMemberContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: colors.editGroupAddButtonBackgroundColor,
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginBottom: 5,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberStatus: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  saveButton: {
    backgroundColor: colors.editGroupSaveButtonBackgroundColor,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default EditGroupScreen;