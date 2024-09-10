import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { TouchableOpacity  } from 'react-native'

const GroupTextMessageComponent = ({item, isSender, email, setMarkedMessages}) => {
  const [isMarked, setIsMarked] = useState(false);
  
  const handleLongPress = () => {
    if (isMarked) {
      setMarkedMessages(prevMarkedMessages => prevMarkedMessages.filter(id => id !== item.id));
      setIsMarked(false);
    } else {
      setMarkedMessages(prevMarkedMessages => [...prevMarkedMessages, item.id]);
      setIsMarked(true);
    }
  };

  return (
    isSender ? (
      <View style={isMarked? styles.marked : {}}>
        <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.75}>
          <View style={styles.senderContainer}>
            <Text style={styles.senderMessageText}>
              {item.data.message}
            </Text>
            {
              item.data.timestamp ? (
                <Text style={{alignSelf:'flex-end', color: "white", fontSize:13}}>
                  {new Date(item.data.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              ):(
                <Text style={{alignSelf:'flex-end', color: isSender ? "white" : "black", fontSize:13}}>
                  Sending...
                </Text>
              )
            }
          </View>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.reciverContainer}>
        <Text>{email}</Text>
        <Text style={styles.reciverMessageText}>
          {item.data.message}
        </Text>
        {
        item.data.timestamp ? (
          <Text style={{alignSelf:'flex-end', color: "black", fontSize:13}}>
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

export default GroupTextMessageComponent

const styles = StyleSheet.create({
  senderContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#0076FF",
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
    backgroundColor: "#ececec",
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
  senderMessageText: {
    color:'white',
    fontSize: 16,
    marginRight: 10,
  },
  reciverMessageText: {
    color: "black",
    marginLeft: 10,
    fontSize: 16,
  }, 
  marked: {
    backgroundColor: 'rgba(0, 118, 255, 0.2)'
  },
})