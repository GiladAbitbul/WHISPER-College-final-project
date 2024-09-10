import { auth } from "../../firebase";
import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, KeyboardAvoidingView, Text, ActivityIndicator, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Input } from "react-native-elements";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Platform } from "react-native";
import RegisterScreen from '../RegisterScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from "./Login.style";

const LoginScreen = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "co.il"];
    const [suggestions, setSuggestions] = useState([]);
    useEffect (() => {
        const logAsyncStorage = async () => {
            try {
              // Retrieve all keys
              const keys = await AsyncStorage.getAllKeys();
          
              // If there are no keys, log that AsyncStorage is empty
              if (keys.length === 0) {
                console.log('AsyncStorage is empty');
                return;
              }
          
              // Retrieve all key-value pairs
              const result = await AsyncStorage.multiGet(keys);
          
              // Log all key-value pairs
              result.forEach(([key, value]) => {
                console.log(`Key: ${key}, Value: ${value}\n`);
              });
            } catch (error) {
              console.error('Error logging AsyncStorage:', error);
            }
          };
          
          // Call this function wherever you need to log the AsyncStorage content
          logAsyncStorage();
    }, [])
    

    useEffect(() => {
        const trackPageVisits = async () => {
            try {

                const hasRated = await AsyncStorage.getItem('hasRated');
                if (hasRated) {
                    return;
                }
              // Retrieve the current counter value
              const visitCount = await AsyncStorage.getItem('pageVisitCount');
              let count = visitCount ? parseInt(visitCount) : 0;
      
              
              // Increment the counter
              count += 1;
              // Store the updated counter value
              await AsyncStorage.setItem('pageVisitCount', count.toString());

            } catch (error) {
              console.error('Error tracking page visits:', error);
            }
          };
      
          trackPageVisits();
    }, []);

    const handleChange = (text) => {
        setEmail(text);

        if (text.includes('@')) {
            const [, domain] = text.split('@');
            const filteredDomains = emailDomains.filter(d => d.startsWith(domain) && d !== domain);
            setSuggestions(filteredDomains);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        const [localPart] = email.split('@');
        setEmail(`${localPart}@${suggestion}`);
        setSuggestions([]);
    };


    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle:"Login",
            headerTitleAlign: 'center',
            headerShown: false,
            headerTitle: () => (
                <Text style={{fontWeight:'bold', color:'#4576fd', fontSize: 20}}>WELCOME TO WHISPER</Text>
            ),
            //title: 'Welcome To CIPHER',
            headerTitleAlign: 'center',
        });
    }, [navigation])

    useEffect(() => {
        const timer = setTimeout(() => {
          const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
              navigation.replace("Home");
            } else {
              setLoading(false);
            }
          });
    
          return () => unsubscribe();
        }, 1000); // 2000 milliseconds = 2 seconds
    
        // Clean up the timer if the component unmounts
        return () => clearTimeout(timer);
      }, [navigation]);

    const signIn = () => {
            // User is not signed in, proceed with sign-in process
            signInWithEmailAndPassword(auth, email, password)
                .catch(error => {
                    switch (error.code) {
                        case "auth/invalid-email":
                            setError("Invalid email address");
                            break;
                        case "auth/user-not-found":
                        case "auth/wrong-password":
                            setError("Invalid email or password");
                            break;
                        case "auth/network-request-failed":
                            setError("No internet connection");
                            break;
                        default:
                            setError("An error occurred");
                            break;
                    }
                });
    };

    
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size={100} color="#2C6BED" />
                    <Text style={styles.loadingText}>Welcome To Whisper</Text>
                    <Text style={styles.loadingSubText}>We will start in seconds...</Text>
                </View>
            );
        }
    
        return (
            <SafeAreaView style={styles.container} testID="login-screen">
            <StatusBar style="dark" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={styles.keyboardView}
            >
                <View style={styles.headerContainer}/>
                  

                <View style={styles.formContainer}>
                    <Text style={styles.headerText}>Sign In</Text>
                    <Text style={styles.subHeaderText}>Enter your credentials to Log In your account</Text>
                    
                    <View style={styles.inputContainer}>
                        <Input
                            placeholder="Email"
                            autoFocus
                            type="email"
                            value={email}
                            onChangeText={handleChange}
                            keyboardType="email-address"
                            inputContainerStyle={styles.inputField}
                            errorStyle={{ color: 'red' }}
                            errorMessage={error && email.length === 0 ? "Invalid Email" : ""}
                            testID="emailInput"
                        />
                        {suggestions.length > 0 && (
                            <ScrollView horizontal style={styles.suggestionsContainer}>
                                {suggestions.map((suggestion, index) => (
                                    <TouchableOpacity key={index} onPress={() => handleSuggestionClick(suggestion)} style={styles.suggestionItem}>
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <Input
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            type="password"
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                            onSubmitEditing={signIn}
                            inputContainerStyle={styles.inputField}
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#888" />
                                </TouchableOpacity>
                            }
                            errorStyle={{ color: 'red' }}
                            errorMessage={error && password.length === 0 ? "Invalid Password" : ""}
                            testID="passwordInput"
                        />
                            {/* <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity> */}
                        </View>
    
                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity 
                            style={styles.signInButton} 
                            onPress={signIn}
                            testID="signInButton"
                        >
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>

                        <Text style={styles.orText}>{/* OR continue with*/}</Text> 

    
                        {/* <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Image 
                                    source={require('../static/GoogleIcon.png')} 
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Image 
                                    source={require('../static/FacebookIcon.png')} 
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>
                        </View> */}
    
                        <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Don't have account? </Text>
                        <TouchableOpacity onPress={() => setShowRegister(true)}>
                            <Text style={styles.registerLink}>Create account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showRegister && (
                    <RegisterScreen onClose={() => setShowRegister(false)} />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;