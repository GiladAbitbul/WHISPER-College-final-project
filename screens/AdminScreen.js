import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { AntDesign, Entypo } from '@expo/vector-icons';
import FullScreenRatingChart from '../components/CustomRatingChartComponent';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AdminScreen = () => {
  const [userCount, setUserCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [ratings, setRatings] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [chatTypes, setChatTypes] = useState({ regular: 0, realTime: 0, group: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const users = await getUserCount();
      const chats = await getChatCount();
      await fetchRatings();
      await fetchChatTypes();
      setUserCount(users);
      setChatCount(chats);
    };

    fetchData();
  }, []);

  const getUserCount = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      return usersSnapshot.size;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  };

  const getChatCount = async () => {
    try {
      const chatsSnapshot = await getDocs(collection(db, 'Chats'));
      return chatsSnapshot.size;
    } catch (error) {
      console.error('Error getting chat count:', error);
      return 0;
    }
  };

  const fetchRatings = async () => {
    try {
      const ratingDocRef = doc(db, 'Rate', 'Rating');
      const ratingDocSnap = await getDoc(ratingDocRef);

      if (ratingDocSnap.exists()) {
        const data = ratingDocSnap.data();
        setRatings({
          1: data['1'],
          2: data['2'],
          3: data['3'],
          4: data['4'],
          5: data['5'],
        });
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchChatTypes = async () => {
    try {
      const chatsSnapshot = await getDocs(collection(db, 'Chats'));
      let regular = 0, realTime = 0, group = 0;

      chatsSnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.isGroup) {
          group++;
        } else if (chatData.isRealTime) {
          realTime++;
        } else {
          regular++;
        }
      });

      setChatTypes({ regular, realTime, group });
    } catch (error) {
      console.error('Error fetching chat types:', error);
    }
  };

  const toggleChart = () => {
    setIsChartVisible(!isChartVisible);
  };

  const chatTypeData = [
    { name: 'Regular', population: chatTypes.regular, color: '#79db7f', legendFontColor: '#7F7F7F', legendFontSize: 15 },
    { name: 'Real Time', population: chatTypes.realTime, color: '#736ff9', legendFontColor: '#7F7F7F', legendFontSize: 15 },
    { name: 'Group', population: chatTypes.group, color: '#060270', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{/*Admin Dashboard*/}Whisper Information</Text> 
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <AntDesign name="user" size={40} color="rgb(98, 116, 255)" />
          <Text style={styles.statValue}>{userCount}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statItem}>
          <Entypo name="chat" size={40} color="rgb(98, 116, 255)" />
          <Text style={styles.statValue}>{chatCount}</Text>
          <Text style={styles.statLabel}>Chats</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Chat Types Distribution</Text>
        <PieChart
          data={chatTypeData}
          width={width - 60}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="1"
        />
      </View>

      {ratings && (
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>App Ratings</Text>
          <TouchableOpacity style={styles.chartButton} onPress={toggleChart}>
            <Text style={styles.chartButtonText}>View Chart</Text>
          </TouchableOpacity>
          <FullScreenRatingChart 
            ratings={ratings}
            visible={isChartVisible}
            onClose={toggleChart}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(98, 116, 255)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'rgb(98, 116, 255)',
  },
  statLabel: {
    fontSize: 16,
    color: '#7F7F7F',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'rgb(98, 116, 255)',
  },
  ratingSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'rgb(98, 116, 255)',
  },
  chartButton: {
    backgroundColor: 'rgb(98, 116, 255)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  chartButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AdminScreen;