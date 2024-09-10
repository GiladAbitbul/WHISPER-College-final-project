import React from 'react';
import { TouchableOpacity } from 'react-native';

const ConditionalTouchable = ({ condition, onPress, onLongPress,children }) => {
    return condition ? (
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.9}>
            {children}
        </TouchableOpacity>
    ) : (
        <>
            {children}
        </>
    );
};

export default ConditionalTouchable;