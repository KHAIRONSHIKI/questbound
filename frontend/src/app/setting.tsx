import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Modal, FlatList, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import { AudioContext } from '../context/AudioContext';
import { COUNTRIES } from '../constants/countries';
import SoundTouchableOpacity from '../components/SoundTouchable';

export default function SettingScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const { bgmEnabled, sfxEnabled, setBgmEnabled, setSfxEnabled, playSfx } = useContext(AudioContext);
  
  const [country, setCountry] = useState(user?.country || '');
  const [loading, setLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  
  // Modal states
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.country) setCountry(user.country);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (country) {
        formData.append('country', country);
      }

      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.data) {
        updateUser(res.data.data);
        showAlert({ title: 'Sukses', message: 'Profil berhasil diperbarui!', type: 'success' });
      }
    } catch (e: any) {
      console.log(e);
      showAlert({ title: 'Error', message: e.response?.data?.message || 'Terjadi kesalahan saat mengupdate profil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getCountryDisplay = () => {
    if (!country) return 'Pilih Negara...';
    const found = COUNTRIES.find(c => c.name === country || c.code === country);
    return found ? `${found.flag} ${found.name}` : country;
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
        <Text style={styles.headerTitle}>Setting</Text>
        <View style={{width: 60}} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Profil</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Asal Negara</Text>
          <View style={styles.row}>
            <SoundTouchableOpacity 
              style={styles.countrySelector} 
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={[styles.countrySelectorText, !country && { color: '#8a7da1' }]}>
                {getCountryDisplay()}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#cf77f3" />
            </SoundTouchableOpacity>
            
            <SoundTouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>Simpan</Text>
            </SoundTouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferensi Sistem (Game)</Text>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="music" size={24} color="#a2a2d0" />
            <Text style={styles.preferenceText}>Background Music (BGM)</Text>
          </View>
          <Switch 
            value={bgmEnabled} 
            onValueChange={(val) => {
              setBgmEnabled(val);
              if (val) playSfx('click');
            }}
            trackColor={{ false: '#2b1b46', true: '#cf77f3' }}
            thumbColor={bgmEnabled ? '#fff' : '#8a7da1'}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="volume-high" size={24} color="#a2a2d0" />
            <Text style={styles.preferenceText}>Sound Effects (SFX)</Text>
          </View>
          <Switch 
            value={sfxEnabled} 
            onValueChange={(val) => {
              setSfxEnabled(val);
              if (val) playSfx('click');
            }}
            trackColor={{ false: '#2b1b46', true: '#cf77f3' }}
            thumbColor={sfxEnabled ? '#fff' : '#8a7da1'}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="bell-ring" size={24} color="#a2a2d0" />
            <Text style={styles.preferenceText}>Notifikasi Quest</Text>
          </View>
          <Switch 
            value={notifEnabled} 
            onValueChange={setNotifEnabled}
            trackColor={{ false: '#2b1b46', true: '#cf77f3' }}
            thumbColor={notifEnabled ? '#fff' : '#8a7da1'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        
        <SoundTouchableOpacity style={styles.menuBtn} onPress={() => showAlert({ title: 'Tingkat Kesulitan', message: 'Fitur Mode Hardcore (kehilangan XP jika misi gagal) sedang ditempa oleh pandai besi! Nantikan di update selanjutnya.', type: 'info' })}>
          <MaterialCommunityIcons name="sword-cross" size={24} color="#e94560" />
          <Text style={styles.menuBtnText}>Ubah Tingkat Kesulitan</Text>
        </SoundTouchableOpacity>

        <SoundTouchableOpacity style={styles.menuBtn} onPress={() => showAlert({ title: 'Kebijakan Privasi', message: 'QuestBound melindungi data Anda. Data ini hanya untuk keperluan demo RPG To-Do List.', type: 'info' })}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#cf77f3" />
          <Text style={styles.menuBtnText}>Kebijakan Privasi</Text>
        </SoundTouchableOpacity>
        
        <SoundTouchableOpacity style={styles.logoutBtn} onPress={() => {
          showAlert({
            title: 'Logout',
            message: 'Apakah Anda yakin ingin keluar dari QuestBound?',
            type: 'confirm',
            onConfirm: () => logout(),
            confirmText: 'Ya, Keluar'
          });
        }}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </SoundTouchableOpacity>
      </View>

      {/* Country Picker Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Negara</Text>
              <SoundTouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </SoundTouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Cari negara..."
              placeholderTextColor="#8a7da1"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <SoundTouchableOpacity 
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item.name);
                    setShowCountryModal(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                </SoundTouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2b1b46', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  section: { backgroundColor: '#443a67', borderRadius: 15, padding: 20, marginBottom: 20 },
  sectionTitle: { color: '#cf77f3', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { color: '#fff', marginBottom: 10, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  countrySelector: { 
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2b1b46', 
    padding: 15, 
    borderRadius: 10, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#cf77f3'
  },
  countrySelectorText: { color: '#fff', fontSize: 15 },
  saveBtn: { backgroundColor: '#cda86f', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#2b1b46', fontWeight: 'bold' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2b1b46' },
  menuBtnText: { color: '#fff', fontSize: 16, marginLeft: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e94560', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, justifyContent: 'center' },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2b1b46' },
  preferenceInfo: { flexDirection: 'row', alignItems: 'center' },
  preferenceText: { color: '#fff', fontSize: 16, marginLeft: 15 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#372d5c',
    height: '70%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#2b1b46',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2b1b46',
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 15,
  },
  countryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
