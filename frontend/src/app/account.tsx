import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import SoundTouchableOpacity from '../components/SoundTouchable';

export default function AccountScreen() {
  const router = useRouter();
  const { user, updateUser, setGlobalLoading } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const handleUpdate = async () => {
    setGlobalLoading(true);
    try {
      const formData = new FormData();
      if (username) formData.append('username', username);
      if (email) formData.append('email', email);
      if (password) formData.append('password', password);

      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.data) {
        updateUser(res.data.data);
        setPassword('');
        showAlert({ title: 'Sukses', message: 'Informasi akun berhasil diperbarui!', type: 'success' });
      }
    } catch (e: any) {
      console.log(e);
      showAlert({ title: 'Error', message: e.response?.data?.message || 'Gagal mengupdate akun', type: 'error' });
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{width: 60}} />
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informasi Kredensial</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="account" size={20} color="#8a7da1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#8a7da1"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email" size={20} color="#8a7da1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#8a7da1"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ganti Password (Opsional)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock" size={20} color="#8a7da1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Masukkan password baru"
              placeholderTextColor="#8a7da1"
              secureTextEntry
            />
          </View>
        </View>

        <SoundTouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
          <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
        </SoundTouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2b1b46', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#443a67', borderRadius: 15, padding: 20, marginBottom: 20 },
  cardTitle: { color: '#cf77f3', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b1b46', borderRadius: 10, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 15 },
  saveBtn: { backgroundColor: '#cf77f3', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
