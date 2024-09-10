import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-gesture-handler';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const clearAllData = async () => {
  try {
    await AsyncStorage.clear(); // ניקוי כל הנתונים
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

const RateUs = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const getRatingTitle = (rating) => {
    switch (rating) {
      case 1:
        return "Terrible";
      case 2:
        return "Poor";
      case 3:
        return "Average";
      case 4:
        return "Good";
      case 5:
        return "Excellent";
      default:
        return "";
    }
  };

  const submitRating = async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('hasRated', 'true');

      const ratingDocRef = doc(db, 'Rate', 'Rating');
      const ratingDocSnapshot = await getDoc(ratingDocRef);

      if (ratingDocSnapshot.exists()) {
        const currentData = ratingDocSnapshot.data();
        
        // Increment the rating field corresponding to the user's rating
        const newCount = (currentData[rating] || 0) + 1;
  
        // Update the document with the new count
        await updateDoc(ratingDocRef, {
          [rating]: newCount,
        });
        
        Alert.alert('Thank you for your feedback!');
      } else {
        console.error('Rating document does not exist');
      }
  
      onClose();
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = (star) => {
    setRating(star);
  };

  return (
    <View style={styles.page}>
    <View style={styles.container}>
    <Text style={styles.titleText}>Do you like using Whisper?</Text>
    <Text style={styles.titleText}>Please rate us</Text>
      {!loading ? (
        <>
        <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
            <Image
              source={
                rating >= star
                  ? require('../assets/star_filled.png') // Path to your filled star image
                  : require('../assets/star_empty.png')  // Path to your empty star image
              }
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.titleText}>{getRatingTitle(rating)}</Text>
      <TouchableOpacity style={styles.submitButton} onPress={submitRating} disabled={loading}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      </>
      ) : (
        <>
        <ActivityIndicator size={40} color={'white'}/>
        <Text style={styles.titleText}>loading your rating...</Text>
        </>
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(98, 116, 255, 1)',
    width: '80%',
    borderRadius: 15
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor:'white',
    borderRadius: 20,
    padding: 5,
  },
  star: {
    width: 40,
    height: 40,
    marginHorizontal: 5,
    // borderRadius: 50,
    // backgroundColor:'white'
  },
  submitButton: {
    marginTop: 20,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  submitText: {
    color: 'rgb(98, 116, 255)',
    fontWeight: 'bold',
    fontSize: 17,
  },
  page: {
    position:'absolute',
    width: '100%',
    height: '100%',
    justifyContent:'center',
    alignItems: 'center',
    zIndex: 100,
  }, 
  titleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  }
});

export default RateUs;
