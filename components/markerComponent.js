import React from 'react';
import { View, StyleSheet } from 'react-native';

const ConditionalMarker = ({ condition, children }) => {
    return condition ? (
        <View style={styles.marker}>
            {children}
        </View>
    ) : (
        <>
            {children}
        </>
    );
};

export default ConditionalMarker;

const styles = StyleSheet.create({
  marker: {
    backgroundColor: 'rgba(98, 116, 255, 0.2)',
  },
})