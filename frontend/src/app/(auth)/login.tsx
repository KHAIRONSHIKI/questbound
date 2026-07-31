import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import api from '../../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert({ title: 'Peringatan', message: 'Harap isi username dan password', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/login', { username, password });
      await login(res.data.data, res.data.access_token);
    } catch (err: any) {
      showAlert({ title: 'Login Gagal', message: err.response?.data?.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Start Your Life Adventure !</Text>

        {/* Card Section */}
        <View style={styles.card}>

          {/* Username Input */}
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan username anda"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <MaterialCommunityIcons name="email" size={20} color="#333" style={styles.inputIcon} />
          </View>
          
          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password anda"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
              <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Main Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Begin Quest</Text>}
          </TouchableOpacity>

          <Text style={styles.separatorText}>OR CONNECT VIA MAGIC PORTAL</Text>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Account Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to the realm? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create a Hero Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#241842',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    backgroundColor: '#fff',
    alignSelf: 'center',
    width: 250,
    height: 140,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#372d5c',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  inputIcon: {
    marginLeft: 10,
  },
  forgotPassword: {
    color: '#fff',
    textAlign: 'right',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#6b3be3', // Purple button color
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: '#b99cf5',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  separatorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  socialButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  error: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerLink: {
    color: '#9d75f0',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
