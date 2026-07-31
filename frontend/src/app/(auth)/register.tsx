import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import api from '../../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const roles = ['Warrior Elite', 'Epic', 'Legend', 'Infinity'];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !role) {
      showAlert({ title: 'Peringatan', message: 'Mohon lengkapi semua data', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/register', { 
        name, username, email, password, role_name: role 
      });
      await login(res.data.data, res.data.access_token);
    } catch (err: any) {
      if (err.response?.data && typeof err.response.data === 'object') {
         const msgs = Object.values(err.response.data).flat().join('\n');
         showAlert({ title: 'Registrasi Gagal', message: msgs || 'Registration failed', type: 'error' });
      } else {
        showAlert({ title: 'Registrasi Gagal', message: err.message || 'Registration failed', type: 'error' });
      }
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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Start Your Life Adventure !</Text>

        {/* Card Section */}
        <View style={styles.card}>

          {/* Nama Input */}
          <Text style={styles.label}>Nama</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama anda"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
            <MaterialCommunityIcons name="account" size={20} color="#333" style={styles.inputIcon} />
          </View>

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
            <MaterialCommunityIcons name="account" size={20} color="#333" style={styles.inputIcon} />
          </View>
          
          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email anda"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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

          {/* Profesi Selection */}
          <Text style={styles.label}>Profesi</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan profesi anda"
              placeholderTextColor="#888"
              value={role}
              onChangeText={setRole}
            />
            <MaterialCommunityIcons name="briefcase-account" size={20} color="#333" style={styles.inputIcon} />
          </View>

          {/* Main Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Start Your Story</Text>}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Returning Hero? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
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
  rolePickerContainer: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    marginTop: -10,
  },
  roleOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  roleOptionActive: {
    backgroundColor: '#d8b4fe',
  },
  roleOptionText: {
    color: '#333',
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#6b3be3',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#6b3be3', // Purple button color
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#b99cf5',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
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
    marginTop: 10,
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
