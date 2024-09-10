import { StyleSheet, Text, View } from 'react-native'
import React, { useId, useState,useEffect } from 'react'
import { TouchableOpacity  } from 'react-native'
import { db } from '../../firebase'; // Assuming you're importing db from your firebase.js
import { Firestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getAuth, getUser } from 'firebase/auth';
import colors from '../../assets/colors';
const TextMessageComponent = ({item, isSender, isGroup, emailsDictionary}) => {

  return (
    isSender ? (
          <View style={[styles.senderContainer]}>
            <Text style={styles.senderMessageText}>
              {item.data.message}
            </Text>
            {
              item.data.timestamp ? (
                <Text style={{alignSelf:'flex-end', color: colors.SenderMessageBoxTextColor, fontSize:13}}>
                  {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
                
              ):(
                <Text style={{alignSelf:'flex-end', color: isSender ? colors.SenderMessageBoxTextColor : colors.ReceiverMessageBoxTextColor, fontSize:13}}>
                  Sending...
                </Text>
              )
              
            }
            
          </View>
    ) : (
      <View style={styles.reciverContainer}>
        <View style={{borderBottomColor:colors.ReceiverMessageBoxTextColor, borderBottomWidth:2, paddingBottom:5}}>
          <Text style={styles.messageEmailDisplay}>{emailsDictionary[item.data.uid]}</Text>
        </View>

        <Text style={styles.reciverMessageText}>
          {item.data.message}
        </Text>
        {
        item.data.timestamp ? (
          <Text style={{alignSelf:'flex-end', color: colors.ReceiverMessageBoxTextColor, fontSize:13}}>
            {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        ):(
          <>
          </>
        )
        }
        
      </View>
      
    )
   

  )
}

export default TextMessageComponent

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
  }, 
  reciverContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: colors.ReceiverMessageBoxBackgroundColor,
    alignSelf: "flex-start",
    borderRadius: 20,
    marginRight: 15,
    maxWidth: "80%",
    position: "relative",
    marginLeft: 5,
    minWidth: '20%',
    // backgroundColor: 'white',
    // borderWidth: 2,
    // borderColor: 'black',
  },
  senderMessageText: {
    color:colors.SenderMessageBoxTextColor,
    fontSize: 16,
    marginRight: 10,
  },
  reciverMessageText: {
    color: colors.ReceiverMessageBoxTextColor,
    marginLeft: 10,
    fontSize: 16,
  }, 
  senderNameText: {
    fontSize: 11,
    color: 'white',
    alignSelf: 'flex-end',
    marginTop: 1,
    marginRight: '25%',
    fontWeight: 'bold',

  },
  senderNameContainer: {
    position: 'absolute',
    top: -10, // Adjust as needed to position outside the message container
    right: -20, // Adjust as needed to position outside the message container
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4259F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciverNameText: {
    fontSize: 11,
    color: 'black',
    alignSelf: 'flex-end',
    marginTop: 1,
    marginRight: '25%',
    fontWeight: 'bold',

  },
  reciverNameContainer: {
    position: 'absolute',
    top: -10, // Adjust as needed to position outside the message container
    left: -20, // Adjust as needed to position outside the message container
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CECECC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageEmailDisplay: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.ReceiverMessageBoxTextColor
  }
})