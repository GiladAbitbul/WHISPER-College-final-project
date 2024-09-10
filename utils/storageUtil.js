import { MessageStatusCode } from "./messagesStatusUtil";
import { db, storage } from "../firebase";
import { updateDoc, collection, doc,serverTimestamp, runTransaction, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { deleteField } from "firebase/firestore";
/**
 * Uploads a message to a specific chat room and updates the last message timestamp.
 *
 * @param {string} chatRoomID - The ID of the chat room where the message will be uploaded.
 * @param {string} message - The message content to be uploaded.
 * @param {string} currentUserID - The ID of the user sending the message.
 * @returns {Promise<void>} - A promise that resolves when the message is successfully uploaded and the last message timestamp is updated.
 * @throws {Error} - Throws an error if there is an issue with uploading the message.
 */

export const uploadMessage = async (chatRoomID, message, currentUserID) => {
  try {
    const chatReference = doc(db, "Chats", chatRoomID);
    const messagesCollectionReference = collection(chatReference, "messages");

    const keysRef = doc(db, 'Keys', chatRoomID);
    const keysDoc = await fetchDocumentWithRetry(keysRef);

    if (!keysDoc.exists) {
      throw new Error('Encryption keys not found');
    }
    const { publicKey } = keysDoc.data();

    const encryptedMessage = await encryptMessage(message, publicKey);

    await runTransaction(db, async (transaction) => {
      const serverTime = serverTimestamp();

      const newMessageDocRef = doc(messagesCollectionReference);
      // Add a new message
      transaction.set(newMessageDocRef, {
        timestamp: serverTime,
        // message: encryptedMessage.message,
        // key: encryptedMessage.key,
        // iv: encryptedMessage.iv,
        message: encryptedMessage,
        uid: currentUserID,
        status: MessageStatusCode.TEXT_MESSAGE_CODE,
      });

      // Update the last message timestamp in the chat room document
      transaction.update(chatReference, {
        lastMessageTimestamp: serverTime,
        lastMessageID: newMessageDocRef.id
      });
    });

  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Error sending message: ' + error.message);
  }
}

/**
 * Generates a unique filename based on the server timestamp and user ID.
 *
 * @param {string} userID - The ID of the user.
 * @returns {Promise<string>} - A promise that resolves to a unique filename.
 * @throws {Error} - Throws an error if there is an issue with generating the timestamp.
 */
export const generateUniqueFilename = async (currentUserID) => {
  try {
    const serverTime = serverTimestamp();

    if (!serverTime) {
      throw new Error('Failed to retrieve server timestamp');
    }

    const timestamp = serverTime.toMillis ? serverTime.toMillis() : Date.now();

    // Combine userID and timestamp to generate a unique filename
    const uniqueFilename = `${currentUserID}_${timestamp}`;

    return uniqueFilename;
  } catch (error) {
    console.error('Error generating unique filename:', error);
    throw new Error('Error generating unique filename: ' + error.message);
  }
}

/**
 * Uploads an image to a specific chat room and updates the last message timestamp.
 *
 * @param {string} chatRoomID - The ID of the chat room where the image will be uploaded.
 * @param {string} imageURI - The URI of the image to be uploaded.
 * @param {string} currentUserID - The ID of the user uploading the image.
 * @returns {Promise<void>} - A promise that resolves when the image is successfully uploaded and the message is added.
 * @throws {Error} - Throws an error if there is an issue with uploading the image or updating the document.
 */
export const uploadImage = async (chatRoomID, imageURI, currentUserID) => {
  try {
    const response = await fetch(imageURI);
    const blob = await response.blob();
    const filename = await generateUniqueFilename(currentUserID);
    const imageUri = `chatRoomsMetaData/${chatRoomID}/${filename}`;
    const storageRef = ref(storage, imageUri);

    const snapshot = await uploadBytes(storageRef, blob);
    const imageUrl = await getDownloadURL(snapshot.ref);

    await runTransaction(db, async (transaction) => {
      const chatReference = doc(db, "Chats", chatRoomID);
      const messageReference = collection(chatReference, "messages");

      const newMessageDocRef = doc(messageReference);  // Generate a new document reference for the message
      const serverTime = serverTimestamp();

      transaction.set(newMessageDocRef, {
        timestamp: serverTime,
        message: imageUrl,
        uid: currentUserID,
        status: MessageStatusCode.IMAGE_MESSAGE_CODE
      });

      transaction.update(chatReference, {
        lastMessageTimestamp: serverTime,
        lastMessageID: newMessageDocRef.id  // Update with the new message ID
      });
    });

    console.log('Image uploaded and chat room document updated successfully');
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error uploading image: ' + error.message);
  }
}

/**
 * Uploads an audio recording to a specific chat room and updates the last message timestamp.
 *
 * @param {string} chatRoomID - The ID of the chat room where the audio will be uploaded.
 * @param {object} recording - The recording object with a getURI method.
 * @param {string} currentUserID - The ID of the user uploading the audio.
 * @returns {Promise<void>} - A promise that resolves when the audio is successfully uploaded and the message is added.
 * @throws {Error} - Throws an error if there is an issue with uploading the audio or updating the document.
 */
export const uploadAudio = async (chatRoomID, recording, currentUserID) => {
  try {
    const uri = recording.getURI();
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const formattedDate = await generateUniqueFilename(currentUserID);
    console.log('file name', formattedDate);
    const voiceUri = `chatRoomsMetaData/${chatRoomID}/${formattedDate}.wav`;

    const storageRef = ref(storage, voiceUri);
    const snapshot = await uploadBytes(storageRef, blob);
    const voiceMessageUrl = await getDownloadURL(snapshot.ref);
    await runTransaction(db, async (transaction) => {
      const chatRef = doc(db, "Chats", chatRoomID);
      const messagesRef = collection(chatRef, 'messages');
      const serverTime = serverTimestamp();

      const newMessageDocRef = doc(messagesRef);  // Generate a new document reference for the message

      // Add the new audio message
      transaction.set(newMessageDocRef, {
        message: voiceMessageUrl,
        timestamp: serverTime,
        uid: currentUserID,
        status: MessageStatusCode.AUDIO_MESSAGE_CODE
      });

      // Update the last message timestamp and ID in the chat room document
      transaction.update(chatRef, {
        lastMessageTimestamp: serverTime,
        lastMessageID: newMessageDocRef.id  // Update with the new message ID
      });
    });

    console.log('Audio uploaded and chat room document updated successfully');
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw new Error('Error uploading audio: ' + error.message);
  }
};

import { getMessageType } from "./messagesStatusUtil";
import { encryptMessage } from "./encryptionRSA_ESA";

/**
 * Deletes selected messages from a Firestore collection and updates their status.
 * Optionally deletes associated files (images or audio) stored in Firebase Storage.
 *
 * @param {CollectionReference} messageCollectionReference - Reference to the collection where messages are stored.
 * @param {string[]} messagesID - Array of message IDs to delete.
 * @returns {Promise<void>} - Promise that resolves once all messages are deleted and updated.
 * @throws {Error} Throws an error if there is an issue deleting messages or associated files.
 */
export const deleteSelectedMessages = async (messageCollectionReference, messagesID) => {
  try {
    for (const messageID of messagesID) {
      const messageRef = doc(messageCollectionReference, messageID);
      const messageDoc = await getDoc(messageRef);

      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const messageType = getMessageType(messageData.status);

        // Delete associated file if message type is image or audio
        if (messageType === 'image' || messageType === 'audio') {
          const fileRef = ref(storage, messageData.message);
          await deleteObject(fileRef);
          console.log(`${messageType} file deleted successfully.`);
        }

        // Update message document to mark it as deleted
        await updateDoc(messageRef, {
          message: deleteField(),
          key: deleteField(),
          iv: deleteField(),
          status: MessageStatusCode.DELETED_MESSAGE_CODE
        });

        console.log(`Message fields deleted successfully for message ID: ${messageID}`);
      }
    }
  } catch (error) {
    console.error('Error deleting message fields:', error);
    throw error; // Propagate the error for handling upstream
  }
};

/**
 * Uploads a profile image to Firebase Storage and updates the user's document in Firestore with the image URL.
 *
 * @param {string} uid - The user ID.
 * @param {string} uri - The URI of the image to be uploaded.
 * @returns {Promise<void>}
 * @throws Will log an error if the image upload or Firestore update fails.
 */
export const uploadProfileImage = async (uid, uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${uid}`);
    const snapshot = await uploadBytes(storageRef, blob);
    const imageUrl = await getDownloadURL(snapshot.ref);

    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, { profileImageURL: imageUrl });
    console.log('Image uploaded and user document updated successfully');
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}



/**
 * Deletes a profile image from Firebase Storage and updates the user's document in Firestore to remove the image URL.
 *
 * @param {string} uid - The user ID.
 * @returns {Promise<void>}
 * @throws Will log an error if the image deletion or Firestore update fails.
 */
export const deleteProfileImage = async (uid) => {
  try {
    const userRef = doc(db, 'Users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const user = userDoc.data();
      const storageRef = ref(storage, user.profileImageURL);
      deleteObject(storageRef).then(()=>{
        console.log(uid,'Profile image deleted successfully!');
      }).catch((error)=> {
        alert("Error deleting note");
        console.log("Error deleting note", error);
      })
      await updateDoc(userRef, { profileImageURL: null });
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
  }
}


/**
 * Fetches a Firestore document snapshot with retry logic.
 *
 * @param {DocumentReference} ref - Reference to the Firestore document.
 * @param {number} [retries=5] - Number of retries before failing.
 * @param {number} [delay=1000] - Delay in milliseconds between retries.
 * @returns {Promise<DocumentSnapshot>} - Promise that resolves with the document snapshot if found.
 * @throws {Error} - Throws an error if the document is not found after all retries.
 */
export const fetchDocumentWithRetry = async (ref, retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      return docSnap;
    }
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Document not found after retries', ref);
};

export const getChatRoomPublicKey = async (chatRoomID) => {
  const keysRef = doc(db, 'Keys', chatRoomID);
  const keysDoc = await fetchDocumentWithRetry(keysRef);
  if (!keysDoc.exists) {
    throw new Error('Encryption keys not found');
  }
  const { publicKey } = keysDoc.data();
  return publicKey;
}

export const getChatRoomPrivateKey = async (chatRoomID) => {
  const keysRef = doc(db, 'Keys', chatRoomID);
  const keysDoc = await fetchDocumentWithRetry(keysRef);
  if (!keysDoc.exists) {
    throw new Error('Encryption keys not found');
  }
  const { privateKey } = keysDoc.data();
  return privateKey;
}