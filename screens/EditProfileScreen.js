import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Pressable, Alert, ScrollView, ActivityIndicator,SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase';
import { reauthenticateWithCredential, updatePassword, EmailAuthProvider, checkActionCode } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { EvilIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { deleteProfileImage, uploadProfileImage } from '../utils/storageUtil';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import colors from '../assets/colors';


const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [profileImageURL, setProfileImageURL] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [usersStatus, setUserStatus] = useState('');
  const [initialStatus, setInitialStatus] = useState('');



  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setUserLoading(true);
        if (auth && auth.currentUser && auth.currentUser.uid) {
          const userRef = doc(db, 'Users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setProfileImageURL(userDoc.data().profileImageURL);
            setInitialStatus(userDoc.data().status);
            setUserStatus(userDoc.data().status);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setUserLoading(false);
      }
    };
  
    fetchUserData();
  }, [auth]);

  const handleUpdateProfile = async () => {
    setEditLoading(true);
    setErrorMessage('');
    if (checkChanges()) {
      if (checkValidForm()) {
        try {
          const userRef = doc(db, 'Users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if(currentPassword.trim() === '') {
            setCurrentPasswordError('Enter current password to apply changes');
            return false;
          }
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          try {
            await reauthenticateWithCredential(auth.currentUser, credential);
          } catch (error) {
            setCurrentPasswordError('Current password is incorrect');
            return false
          }

          if (newPassword) {
            if (newPassword !== currentPassword) {
              await updatePassword(auth.currentUser, newPassword);
            } else {
              setCurrentPasswordError('New password cannot be same as current password');
            }
          }

          if (profileImageURL !== userData.profileImageURL) {
            if (profileImageURL) {
              await uploadProfileImage(auth.currentUser.uid, profileImageURL);
            } else {
              await deleteProfileImage(auth.currentUser.uid);
            }
          }
          const trim = usersStatus.trim();
          if (trim === '') {
            if (initialStatus !== null) {
              await updateDoc(userRef, { status: null });
            }
          } else {
            if(usersStatus !== initialStatus) {
              await updateDoc(userRef, { status: usersStatus });
            }
          }
          navigation.pop();
        } catch (error) {
          setErrorMessage(error.message);
          return false
        } finally {
          setEditLoading(false);
        }
      }
      setEditLoading(false);
      return false;
    }
    setErrorMessage('No changes detected')
    setEditLoading(false);
    return false;
  };

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
      setProfileImageURL(uri);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMessage('');
    setConfirmNewPasswordError('');
    setNewPasswordError('');
    setCurrentPasswordError('');
    if (userData) {
      setProfileImageURL(userData.profileImageURL);
      setUserStatus(initialStatus);
    }
  }
  const uploadImage = async (uri) => {
    try {
      const user = auth.currentUser;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, blob);

      const userRef = doc(db, 'Users', user.uid);
      await updateDoc(userRef, { profileImageURL: `profileImages/${user.uid}` });

      console.log('Image uploaded and user document updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const deleteImage = async () => {
    try {
      const user = auth.currentUser;
  
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await deleteObject(storageRef);
  
      const userRef = doc(db, 'Users', user.uid);
      await updateDoc(userRef, { profileImageURL: '' });
  
      setImage(null);
      setProfileImageURL('');
      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // const confirmDeleteImage = () => {
  //   Alert.alert(
  //     'Delete Image',
  //     'Are you sure you want to delete your profile image?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       { text: 'Delete', onPress: deleteImage, style: 'destructive' },
  //     ],
  //     { cancelable: true }
  //   );
  // };

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerShown: !userLoading,
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{fontSize:30, fontStyle:'italic'}}>My Profile</Text>
        </View>
    ),

    });
  }, [navigation, userLoading, editLoading, currentPassword, newPassword, confirmNewPassword, profileImageURL, userData]);
  
  const handleNewPassword = (text) => {
    setNewPassword(text);
    if (text.length > 0 && text.length < 8) {
      setNewPasswordError('Password must be at least 8 characters long');
    } else {
      setNewPasswordError(null);
    }
    if (text !== confirmNewPassword) {
      setConfirmNewPasswordError('Passwords do not match');
    } else {
      setConfirmNewPasswordError(null);
    }
  }

  const handleConfirmNewPassword = (text) => {
    setConfirmNewPassword(text);
    if (newPassword !== text) {
      setConfirmNewPasswordError('Passwords do not match');
    } else {
      setConfirmNewPasswordError(null);
    }
  }

  const checkChanges = () => {
    if (userData) {
      if (newPassword.length !== 0 || confirmNewPassword.length !== 0) {
        return true;
      }
      if(profileImageURL !== userData.profileImageURL) {
        return true;
      }
      console.log('init:', initialStatus);
      console.log('new:', usersStatus);
      if (usersStatus !== initialStatus) {
        return true;
      }
      return false
    }
    return false;
  }

  const handleStatusChange = (text) => {
    setUserStatus(text);

  }
  const handleRemoveStatus = () => {
    setUserStatus('');
  };

  const checkValidForm = () => {
    if (newPassword !== confirmNewPassword) {
      return false;
    }
    if (newPassword.length > 0 && newPassword.length < 8) {
      return false;
    }
    return true;
  }

  const handleRemoveProfileImage = () => {
    setProfileImageURL(null);
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
        
        {userLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryColor} />
            <Text style={styles.loadingText}>Please Wait</Text>
            <Text style={styles.loadingText}>Loading Profile...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.imageContainer}>
              {profileImageURL ? (
                <>
                  <Image source={{uri: profileImageURL}} style={styles.profileImage} />
                  <TouchableOpacity onPress={handleRemoveProfileImage} style={styles.removeImageButton} disabled={editLoading}>
                    <Feather name='x-circle' size={35} color={'red'}/>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={pickImage} disabled={editLoading} style={styles.imagePlaceholder}>
                  <EvilIcons name='camera' size={50} color="black" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Status</Text>
            <TextInput
              style={styles.input}
              value={usersStatus}
              onChangeText={setUserStatus}
              maxLength={50}
              editable={!editLoading}
              placeholder='*No Status*'
            />

            <Text style={styles.sectionTitle}>Profile Details</Text>
            <Text style={styles.label}>Email Address:</Text>
            <Text style={styles.value}>{auth.currentUser.email}</Text>

            <Text style={styles.sectionTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={(text) => setCurrentPassword(text)}
              placeholder="Current Password"
              maxLength={20}
              editable={!editLoading}
              secureTextEntry
            />
            {currentPasswordError ? <Text style={styles.errorText}>{currentPasswordError}</Text> : null}

            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={(text) => handleNewPassword(text)}
              placeholder="New Password"
              maxLength={20}
              editable={!editLoading}
              secureTextEntry
            />
            {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}

            <TextInput
              style={styles.input}
              value={confirmNewPassword}
              onChangeText={(text) => handleConfirmNewPassword(text)}
              placeholder="Confirm New Password"
              maxLength={20}
              editable={!editLoading}
              secureTextEntry
            />
            {confirmNewPasswordError ? <Text style={styles.errorText}>{confirmNewPasswordError}</Text> : null}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdateProfile}
            disabled={editLoading}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  resetButton: {
    padding: 10,
  },
  resetButtonText: {
    color: colors.primaryColor,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'gray',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  bottomSpacer: {
    height: 20,
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
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default EditProfileScreen;