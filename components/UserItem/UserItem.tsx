import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ListItem, Avatar } from 'react-native-elements'
import { query, orderBy, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Pressable } from 'react-native';

const UserItem = ({user}) => {
  const [chatMessages, setChatMessages] = useState([]);

  return (
    <Pressable onPress={onPress} style={styles.continer}>
        <Avatar rounded source={{}}></Avatar>
    </Pressable>
  )
}

export default UserItem

const styles = StyleSheet.create({})