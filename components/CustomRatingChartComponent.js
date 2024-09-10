import React from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, SafeAreaView } from 'react-native';

const { width, height } = Dimensions.get('window');
const CHART_WIDTH = width * 0.8;

const FullScreenRatingChart = ({ ratings, visible, onClose }) => {
  const maxRating = Math.max(...Object.values(ratings));

  const RatingBar = ({ rating, value }) => {
    const barWidth = (value / maxRating) * CHART_WIDTH;

    return (
      <View style={styles.barContainer}>
        <Text style={styles.ratingText}>{'★'.repeat(rating)}</Text>
        <View style={styles.barWrapper}>
          <View style={[styles.bar, { width: barWidth }]} />
        </View>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>App Ratings Distribution</Text>
          <View style={styles.chartContainer}>
            {Object.entries(ratings)
              .sort(([a], [b]) => b - a)
              .map(([rating, value]) => (
                <RatingBar key={rating} rating={Number(rating)} value={value} />
              ))}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: CHART_WIDTH,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(98, 116, 255)',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'stretch',
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  barWrapper: {
    flex: 1,
    height: 30,
    backgroundColor: '#e0e4ff',
    marginHorizontal: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: 'rgb(98, 116, 255)',
  },
  valueText: {
    fontSize: 14,
    color: '#3a3a3a',
    width: 40,
    textAlign: 'right',
  },
  ratingText: {
    fontSize: 14,
    color: '#ffd700',
    width: 70,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgb(98, 116, 255)',
    borderRadius: 5,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default FullScreenRatingChart;