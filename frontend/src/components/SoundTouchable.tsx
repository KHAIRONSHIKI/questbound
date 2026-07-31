import React, { useContext } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { AudioContext } from '../context/AudioContext';

/**
 * Drop-in replacement for TouchableOpacity that automatically plays
 * a click SFX on every press. Use this everywhere instead of TouchableOpacity.
 */
export default function SoundTouchableOpacity(props: TouchableOpacityProps & { children?: React.ReactNode }) {
  const { playSfx } = useContext(AudioContext);

  const handlePress = (e: any) => {
    playSfx('click');
    if (props.onPress) {
      props.onPress(e);
    }
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {props.children}
    </TouchableOpacity>
  );
}
