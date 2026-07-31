import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export default function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Infinite pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../assets/images/icon.png')} 
        style={[
          styles.logo,
          { 
            opacity: opacityAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]} 
        resizeMode="contain" 
      />
      <Animated.Text style={[styles.text, { opacity: opacityAnim }]}>
        Memasuki Dunia...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#241842', // Match the main app background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 30,
  },
  text: {
    color: '#cf77f3',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
