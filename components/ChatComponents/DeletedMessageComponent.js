import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../assets/colors';
const DeletedMessageComponent = ({item, isSender}) => {
  return (
    <View style={isSender ? styles.senderContainer : styles.reciverContainer}>
      <View>
        {isSender ? (
          <>
          <View style={styles.deletedContainer}>
          <MaterialCommunityIcons name="database-remove-outline" size={24} color={colors.SenderMessageBoxTextColor} />
            <Text style={{alignSelf:'flex-end', color: colors.SenderMessageBoxTextColor , fontSize:15}}>
              You deleted this message
            </Text>
          </View>
        </>
        ) : (
          <View style={styles.deletedContainer}>
          <MaterialCommunityIcons name="database-remove-outline" size={24} color={colors.ReceiverMessageBoxTextColor} />
          <Text style={{alignSelf:'flex-end', color: colors.ReceiverMessageBoxTextColor, fontSize:15}}>
            This message was deleted
          </Text>
        </View>
        )}
        <Text style={{alignSelf:'flex-end', color: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor, fontSize:13}}>
          {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </Text>
      </View>
    </View>
  )
}

export default DeletedMessageComponent

const styles = StyleSheet.create({
  senderContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.SenderMessageBoxBackgroundColor,
    alignSelf: "flex-end",
    borderRadius: 20,
    marginLeft: 15,
    marginBottom: 5,
    marginTop: 5,
    maxWidth: "80%",
    minWidth: "25%",
    position: "relative",
    marginRight: 5,

    // backgroundColor: 'white',
    // borderWidth: 2,
    // borderColor: 'black',
  }, 
  reciverContainer: {
    padding: 15,
    backgroundColor: colors.ReceiverMessageBoxBackgroundColor,
    alignSelf: "flex-start",
    borderRadius: 20,
    marginRight: 15,
    marginBottom: 20,
    maxWidth: "80%",
    position: "relative",
    marginLeft: 5,

    // backgroundColor: 'white',
    // borderWidth: 2,
    // borderColor: 'black',
  },
  deletedContainer: {
    display:'flex',
    flexDirection:'row'
  }
})