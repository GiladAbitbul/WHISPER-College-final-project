import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  TouchableOpacity, 
  Image, 
  Platform,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TextInput } from 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "co.il"];

const RegisterScreen = React.memo(({ onClose }) => {
    const [image, setImage] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [slideAnim] = useState(new Animated.Value(300));
    const [keyboardOffset] = useState(new Animated.Value(0));
    const scrollViewRef = useRef();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleEmailChange = (text) => {
      setEmail(text);
      const atIndex = text.indexOf('@');
      if (atIndex > -1) {
          const enteredDomain = text.slice(atIndex + 1);
          const filteredDomains = emailDomains.filter(domain => domain.startsWith(enteredDomain));
          setSuggestions(filteredDomains.map(domain => text.slice(0, atIndex + 1) + domain));
      } else {
          setSuggestions([]);
      }
  };

  const handleSuggestionPress = (suggestion) => {
      setEmail(suggestion);
      setSuggestions([]);
  };




    useEffect(() => {
      if (process.env.NODE_ENV !== 'test') {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      const keyboardWillShowSub = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      const keyboardWillHideSub = Keyboard.addListener('keyboardWillHide', keyboardWillHide);

      return () => {
          keyboardWillShowSub.remove();
          keyboardWillHideSub.remove();
      };
  }, []);

  function keyboardWillShow(event) {
    if (process.env.NODE_ENV !== 'test') {
      Animated.parallel([
        Animated.timing(keyboardOffset, {
          duration: event.duration,
          toValue: event.endCoordinates.height,
          useNativeDriver: true,
        }),
      ]).start();
    }
}

function keyboardWillHide(event) {
  if (process.env.NODE_ENV !== 'test') {
    Animated.parallel([
      Animated.timing(keyboardOffset, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }
}



    const pickImage = async () => {
     // Ask the user for the permission to access the camera
     const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
     if (permissionResult.granted === false) {
       alert("Permission to access camera is required!");
       return;
     }
 
     const result = await ImagePicker.launchCameraAsync({
       allowsEditing: true,
       aspect: [4, 3],
       quality: 1,
     });
 
     if (!result.canceled) {
       setImage(result.assets[0].uri);
     }
    };


    const selectImage = async () => {
      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 3],
          quality: 1,
        });
  
        if (!result.canceled) {
          setImage(result.uri);
  
          //uploadImage(result.uri);
        }
      } catch (error) {
        console.log('Error selecting image:', error);
      }
    };

    const chooseFromGallery = async () => {
      try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
          aspect: [3, 3],
        });
  
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          setImage(uri);
        }
        
      } catch (error) {
        console.log('Error selecting image:', error);
      }
  };
    const uploadImage = async (uri) => {
      try {
        const uid = getAuth().currentUser.uid;
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload image to Firebase Storage
        const storageRef = ref(storage, `profileImages/${uid}`);
        const snapshot = await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(snapshot.ref);
  
        // Update user document with image reference
        const userRef = doc(db, 'Users', uid);
        await setDoc(userRef, { profileImageURL: imageUrl }, { merge: true });
  
        console.log('Image uploaded and user document updated successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    };

    const cancleImage = () => {
      setImage(null)
    }
    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         headerBackTitle:"Login",
    //         headerTitleAlign: 'center',
    //         title: 'Create an Account',
    //         headerTitleAlign: 'center',
    //     });
    // }, [navigation])

    const register = () => {
      try {
        setLoading(true);
        createUserWithEmailAndPassword(auth, email, password)
        .then(async (authUser) => {
          // updateProfile(authUser.user, {
          //   profileImageURL: profileImage || 'static/DefaultProfileImage.png',
          // });
          setDoc(doc(db, 'Users', authUser.user.uid), {           
            email: email,
            profileImageURL: image,
            status:'',
        })
        if (image) {
          await uploadImage(image)
        }
        navigation.replace("Home");
      })
      .catch(error => {
        switch (error.code) {
            case "auth/invalid-email":
                setError("Invalid email address");
                break;
            case "auth/missing-password":
                setError("Password field can't be empty");
                break;
            case "auth/email-already-in-use":
                setError("Email already in use");
                break;
            case "auth/network-request-failed":
                setError("No internet connection");
                break;
            default:
                setError(error.message);
                break;
        }
    });
    } catch(e) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
        <Animated.View 
            style={[
                styles.modalView, 
                { 
                    transform: [
                        { translateY: slideAnim },
                        { translateY: keyboardOffset.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -1]
                        })}
                    ] 
                }
            ]}
        >
          <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}  // Added for keyboard handling
                style={{ flex: 1 }}  // Added for layout consistency
            ></KeyboardAvoidingView>
            
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.waveEmoji}>👋</Text>
                <Text style={styles.title}>Hello!</Text>
                <Text style={styles.subtitle}>Create your account to save your data on cloud.</Text>

                
                    {image ? (
                      <>
                      <View>
                      <TouchableOpacity testID="image-picker" style={styles.imagePicker} onPress={chooseFromGallery} disabled={loading}>
                        <Image testID="profile-image" source={{ uri: image }} style={styles.profileImage} />
                        </TouchableOpacity>
                        <FontAwesome name="remove" size={24} color="gray" style={{position:'absolute', bottom: 15, right: -15}} onPress={() => {setImage(null);}}  disabled={loading}/>
                      </View>
                      </>
                    ) : (
                      <TouchableOpacity testID="image-picker" style={styles.imagePicker} onPress={chooseFromGallery} disabled={loading}>
                        <Feather name="camera" size={40} color="gray" />
                      </TouchableOpacity>
                    )}


                {suggestions.length > 0 && (
                    <ScrollView horizontal style={styles.suggestionsContainer}>
                        {suggestions.map((suggestion, index) => (
                            <TouchableOpacity key={index} onPress={() => handleSuggestionPress(suggestion)} style={styles.suggestionItem}>
                                <Text>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
                <View style={styles.spacerDomains} />
                <TextInput
                    testID="email-input"
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    editable={!loading}
                />
                 
                 

                <TextInput
                    testID="password-input"
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity style={styles.registerButton} onPress={register} disabled={loading}>
                    {!loading ? (
                      <Text style={styles.registerButtonText}>Create my account</Text>
                    ) : (
                      <ActivityIndicator color={'white'} size={25}/>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    </View>
);
});
export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
},
overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
spacerDomains: {
  height: 15,
  backgroundColor: 'white',
},
modalView: {
  backgroundColor: 'white',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 10,
  alignItems: 'center',
  justifyContent:'center',
  shadowColor: '#000',
  shadowOffset: {
      width: 0,
      height: 2
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  height: '90%', // Limit the height of the modal
},
scrollViewContent: {
  flexGrow: 1,
  justifyContent: 'center',
  alignItems: 'center',
 },
spacerDomains: {
  height: 15,
  backgroundColor: 'white',
},
waveEmoji: {
    fontSize: 50,
    marginBottom: 10,
},
title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
},
subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
},
imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
},
profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'gray'
},
input: {
    width: '100%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
},
errorText: {
    color: 'red',
    marginBottom: 10,
},
registerButton: {
    backgroundColor: 'rgb(98, 116, 255)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
},
registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});