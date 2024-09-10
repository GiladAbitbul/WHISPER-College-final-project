import React, { useEffect, useLayoutEffect, useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import CustomListItem from "../components/HomePageComponents/CustomListItem";
import { Avatar } from "react-native-elements";
import {auth, db} from "../firebase";
import { TouchableOpacity } from "react-native-web";
import { AntDesign, SimpleLineIcons, Feather } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
const UsersScreen = ({navigation}) => {

    const [chats, setChat] = useState([]);

    useEffect(() => {
        const chatRef = collection(db, 'Chats');
        const unsubscribe = onSnapshot(chatRef, (snapshot) => {
            setChat(snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        });
        
        return unsubscribe;
    }, []);

    const enterChat = (id, chatName) => {
        navigation.navigate('Chat', {id, chatName});
    }

    const signOutUser = () => {
        auth.signOut().then(() => {navigation.replace("Login");});
    };

    useEffect (() => {
        navigation.setOptions({
          headerTitleAlign: 'center',
            headerStyle: {backgroundColor: "#fff"}, 
            headerTitleStyle: {color: "black", fontWeight: 'bold'},
          headerLeft: () => (
                <View style={{marginLeft: 20}}>
                    <Pressable onPress={signOutUser}>
                    <Avatar 
                    rounded
                    source={{ uri: auth?.currentUser?.photoURL  }} />
                    </Pressable>
                </View>
          ),
          // headerRight: () => (
          //   <View style={{flexDirection:'row'}}>
          //     <Feather name="camera" size={30} color="black" style={{marginRight:15}}/>
          //     <Feather name="edit-2" size={30} color="black" style={{marginRight:15}}/> 
          //   </View>
          // ),
          title: 'CIPHER',
        })
      }, [navigation])

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         title: "Sighnal",
    //         headerStyle: {backgroundColor: "#fff"}, 
    //         headerTitleStyle: {color: "black", fontWeight: 'bold'},
    //         headerTintColor: "black",
    //         headerLeft: () => (
    //             <View style={{marginLeft: 20}}>
    //                 <Pressable onPress={signOutUser}>
    //                 <Avatar 
    //                 rounded
    //                 source={{ uri: auth?.currentUser?.photoURL  }} />
    //                 </Pressable>
    //             </View>
    //         ),
    //         headerRight: () => (
    //             <View style={{
    //                 flexDirection: 'row',
    //                 justifyContent: 'space-between',
    //                 width: 80,
    //                 marginRight: 20,
    //             }}>
    //                 <Pressable>
    //                     <AntDesign name="camerao" size={24} color='black'/>
    //                 </Pressable>
    //                 <Pressable onPress={() => navigation.navigate("AddChat")}>
    //                     <SimpleLineIcons name="pencil" size={24} color='black'/>
    //                 </Pressable>
    //             </View>
    //         )
    //     });
    // },[navigation])

    return(
        <SafeAreaView>
            <ScrollView>
                {chats.map(({id, data: {chatName}}) => (
                   <CustomListItem key={id} id={id} chatName={chatName} enterChat={enterChat}/>
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}

export default UsersScreen;