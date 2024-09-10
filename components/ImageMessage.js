import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const ImageMessage = ({ message, height}) => {
    const [imageURL, setImageURL] = useState(null);

    const fetchImage = async (uri) => {
        try {
            const storage = getStorage()
              const imageStorageRef = ref(storage, uri);
              const imageURL = await getDownloadURL(imageStorageRef);
              return imageURL
            }
        catch (error) {
            return 'TODO: set error image'
          }
    }

    useEffect(() => {
        const loadImage = async () => {
            try {
                const url = await fetchImage(message);
                setImageURL(url);
            } catch (error) {
                console.error('Error loading image:', error);
            }
        };
    
        loadImage();
    }, [message]);

    return (
        <Image source={{ uri: imageURL }} style={[styles.image, height={height}]} />
    );
};
const styles = {
    senderContainer: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    receiverContainer: {
        alignItems: 'flex-start',
        marginLeft: 10,
    },
    image: {
        width: 200,
        borderRadius: 10,
    },
    senderTime: {
        color: 'white',
        alignSelf: 'flex-end',
        fontSize: 11,
    },
    receiverTime: {
        color: 'black',
        alignSelf: 'flex-start',
        fontSize: 11,
    },
};

export default ImageMessage;
