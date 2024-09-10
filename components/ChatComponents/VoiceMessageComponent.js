import React from 'react';
import { Platform } from 'react-native';
import AndroidVoiceMessageComponent from '../../components/ChatComponents/AndroidVoiceMessageComponent';
import IOSVoiceMessageComponent from '../../components/ChatComponents/IOSVoiceMessageComponent';

const VoiceMessageComponent = (props) => {
  if (Platform.OS === 'android') {
    return <AndroidVoiceMessageComponent {...props} />;
  } else {
    return <IOSVoiceMessageComponent {...props} />;
  }
};

export default VoiceMessageComponent;