import React from 'react';
import { TouchableOpacity } from 'react-native';

const ConditionalMessageDisplay = ({ type, children }) => {
    return condition ? (
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
            {children}
        </TouchableOpacity>
    ) : (
        <>
            {children}
        </>
    );
};

export default ConditionalMessageDisplay;