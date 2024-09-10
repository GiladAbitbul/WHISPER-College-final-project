const Message5BitsStatus = {
  TEXT_MESSAGE: [0,0,0,0,1],
  IMAGE_MESSAGE: [0,0,0,1,0],
  AUDIO_MESSAGE: [0,0,0,1,1],
  DELETED_MESSAGE: [0,0,1,0,0],
}

export const MessageStatusCode = {
  TEXT_MESSAGE_CODE: 1,
  IMAGE_MESSAGE_CODE: 2,
  AUDIO_MESSAGE_CODE: 3,
  DELETED_MESSAGE_CODE: 4,
}

/**
 * Converts a bit array to an integer.
 * @param {number[]} bitArray - An array of bits (0s and 1s).
 * @returns {number} The integer representation of the bit array.
 */
export const bitArrayToInt = (bitArray) => {
  if (!Array.isArray(bitArray)) {
    throw new TypeError('Input must be an array');
  }
  return bitArray.reduce((acc, bit, index) => {
    if (bit !== 0 && bit !== 1) {
      throw new TypeError('Array must only contain 0s and 1s');
    }
    return acc + bit * (1 << (bitArray.length - index - 1));
  }, 0);
}

// Example usage:
// const bitArray = [1, 0, 1, 1]; // Represents the binary number 1011
// const integer = bitArrayToInt(bitArray); // Should return 11
// console.log(integer);



/**
 * Converts an integer to a 5-bit array.
 * @param {number} integer - The integer to be converted.
 * @returns {number[]} The 5-bit array representation of the integer.
 * @throws {TypeError} If the input is not an integer.
 * @throws {RangeError} If the input is a negative integer or exceeds 5 bits.
 */
export const intToBitArray = (integer) => {
  if (!Number.isInteger(integer)) {
    throw new TypeError('Input must be an integer');
  }
  if (integer < 0) {
    throw new RangeError('Input must be a non-negative integer');
  }
  if (integer > 31) {
    throw new RangeError('Input must not exceed 5 bits');
  }

  const binaryString = integer.toString(2).padStart(5, '0');
  return binaryString.split('').map(bit => parseInt(bit, 10));
}

// Example usage:
// const integer = 11; // Represents the decimal number 11
// const bitArray = intToBitArray(integer); // Should return [0, 1, 0, 1, 1]
// console.log(bitArray);



/**
 * Checks if a 5-bit array represents an image.
 * The conditions are:
 * - The bit at index 3 should be 1.
 * - The bit at index 4 should be 0.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the conditions are met, false otherwise.
 */
export const isAnImage = (bitArray) => {
  return bitArray[3] === 1 && bitArray[4] === 0;
}

// Example usage:
// const bitArray = [0, 1, 1, 1, 0]; // Should return true
// const result = isAnImage(bitArray);
// console.log(result); // true


/**
 * Checks if a 5-bit array represents a text.
 * The conditions are:
 * - The bit at index 3 should be 0.
 * - The bit at index 4 should be 1.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the conditions are met, false otherwise.
 */
export const isAText = (bitArray) => {
  return bitArray[3] === 0 && bitArray[4] === 1;
}

// Example usage:
// const bitArray = [1, 0, 1, 0, 1]; // Should return true
// const result = isAText(bitArray);
// console.log(result); // true


/**
 * Checks if a 5-bit array represents an audio.
 * The conditions are:
 * - The bit at index 3 should be 1.
 * - The bit at index 4 should be 1.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the conditions are met, false otherwise.
 */
export const isAnAudio = (bitArray) => {
  return bitArray[3] === 1 && bitArray[4] === 1;
}

// Example usage:
// const bitArray = [0, 1, 1, 1, 1]; // Should return true
// const result = isAnAudio(bitArray);
// console.log(result); // true


/**
 * Checks if a 5-bit array represents a deleted status.
 * The condition is:
 * - The bit at index 2 should be 1.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isDeleted = (bitArray) => {
  return bitArray[2] === 1;
}

// Example usage:
// const bitArray = [0, 0, 1, 0, 0]; // Should return true
// const result = isDeleted(bitArray);
// console.log(result); // true


/**
 * Checks if a 5-bit array represents a 'seen' status.
 * The condition is:
 * - The bit at index 0 should be 1.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isSeen = (bitArray) => {
  if (!Array.isArray(bitArray) || bitArray.length !== 5) {
    throw new TypeError('Input must be an array of 5 bits');
  }

  if (!bitArray.every(bit => bit === 0 || bit === 1)) {
    throw new TypeError('Array must only contain 0s and 1s');
  }

  return bitArray[0] === 1;
}

// Example usage:
// const bitArraySeen = [1, 0, 0, 0, 0]; // Should return true
// const resultSeen = isSeen(bitArraySeen);
// console.log(resultSeen); // true

/**
 * Checks if a 5-bit array represents a 'modified' status.
 * The condition is:
 * - The bit at index 1 should be 1.
 * @param {number[]} bitArray - An array of 5 bits.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isModified = (bitArray) => {
  if (!Array.isArray(bitArray) || bitArray.length !== 5) {
    throw new TypeError('Input must be an array of 5 bits');
  }

  if (!bitArray.every(bit => bit === 0 || bit === 1)) {
    throw new TypeError('Array must only contain 0s and 1s');
  }

  return bitArray[1] === 1;
}

// Example usage:
// const bitArrayModified = [0, 1, 0, 0, 0]; // Should return true
// const resultModified = isModified(bitArrayModified);
// console.log(resultModified); // true


/**
 * Determines the status of a message based on the given integer representation.
 * The integer is converted to a 5-bit array, and the status is determined
 * based on the pattern of bits.
 * - If the bit at index 2 is 1, it represents a deleted message.
 * - If the bit at index 3 is 1 and the bit at index 4 is 0, it represents an image.
 * - If the bit at index 3 is 0 and the bit at index 4 is 1, it represents a text.
 * - If the bit at index 3 is 1 and the bit at index 4 is 1, it represents an audio.
 * Otherwise, it returns 'Unknown'.
 *
 * @param {number} integer - The integer representation of the message status.
 * @returns {string} The status of the message ('deleted', 'text', 'image', 'audio', or 'Unknown').
 * @throws {TypeError} If the input is not an integer or if the converted bit array is invalid.
 */
export const getMessageType = (integer) => {
  const bitArray = intToBitArray(integer);

  if (!Array.isArray(bitArray) || bitArray.length > 5) {
    throw new TypeError('Input must be an array of 5 bits');
  }

  if (!bitArray.every(bit => bit === 0 || bit === 1)) {
    throw new TypeError('Array must only contain 0s and 1s');
  }

  if (isDeleted(bitArray)) {
    return 'deleted';
  } else if (isAText(bitArray)) {
    return 'text';
  } else if (isAnAudio(bitArray)) {
    return 'audio';
  } else if (isAnImage(bitArray)) {
    return 'image';
  } else {
    return 'Unknown';
  }
}

// Example Usage:
// const integer1 = 20; // Represents a deleted message
// const integer2 = 25; // Represents an image
// const integer3 = 18; // Represents a text
// const integer4 = 30; // Represents an audio
// const integer5 = 15; // Represents an unknown status
// console.log(getMessageType(integer1)); // 'deleted'
// console.log(getMessageType(integer2)); // 'image'
// console.log(getMessageType(integer3)); // 'text'
// console.log(getMessageType(integer4)); // 'audio'
// console.log(getMessageType(integer5)); // 'Unknown'


/**
 * Retrieves the status code corresponding to the given message type.
 * The function maps message types to their respective status codes as follows:
 * - 'text' corresponds to status code 1.
 * - 'image' corresponds to status code 2.
 * - 'audio' corresponds to status code 3.
 * - 'delete' corresponds to status code 4.
 * 
 * If the provided message type is not recognized, it throws a TypeError.
 *
 * @param {string} type - The type of the message ('text', 'image', or 'audio').
 * @returns {number} The status code corresponding to the message type.
 * @throws {TypeError} If the provided message type is not recognized.
 */
export const getMessageStatusCode = (type) => { 
  switch (type) {
    case 'text':
      return 1;
    case 'image':
      return 2;
    case 'audio':
      return 3;
    case 'delete':
      return 4;
    default:
      throw new TypeError('Undefined message type');
  }
}

// Example Usage:
// console.log(getMessageStatusCode('text')); // 1
// console.log(getMessageStatusCode('image')); // 2
// console.log(getMessageStatusCode('audio')); // 3
// console.log(getMessageStatusCode('delete')); // 4
// console.log(getMessageStatusCode('video')); // Throws TypeError: Undefined message type
