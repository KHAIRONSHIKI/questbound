import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import { AudioContext } from '../context/AudioContext';
import api from '../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import SoundTouchableOpacity from '../components/SoundTouchable';

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const { playSfx } = useContext(AudioContext);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Normal');
  const [loading, setLoading] = useState(false);

  // Date and Time State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('30');
  const [second, setSecond] = useState('00');

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!title) {
      showAlert({ title: 'Peringatan', message: 'Judul misi tidak boleh kosong!', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      
      let xp = 50;
      if (difficulty === 'Normal') xp = 150;
      if (difficulty === 'Sulit') xp = 250;
      
      // Calculate duration in seconds
      const h = parseInt(hour) || 0;
      const m = parseInt(minute) || 0;
      const s = parseInt(second) || 0;
      const durationSeconds = (h * 3600) + (m * 60) + s;

      // Jika description kosong, kirim null agar tidak kena validasi error string di backend
      const payload = { 
        title, 
        description: description ? description : null, 
        type: 'main', 
        xp_reward: xp,
        duration: durationSeconds > 0 ? durationSeconds : 60 // fallback to 60s
      };
      
      playSfx('start'); // Suara sukses membuat misi (panggil sebelum await)
      
      await api.post('/tasks', payload);

      // Tunda navigasi 600ms agar sound sempat berbunyi
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 600);
    } catch (e: any) {
      console.log(e);
      const errMsg = e.response?.data?.message || e.message || 'Gagal membuat To Do';
      showAlert({ title: 'Error', message: errMsg, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.headerTitle}>QuestBound</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.playerName}>{user?.name || 'Player'}</Text>
            <SoundTouchableOpacity onPress={() => router.push('/profile')}>
              <View style={styles.avatarPlaceholder} />
            </SoundTouchableOpacity>
          </View>
        </View>

        {/* Sub Header */}
        <View style={styles.subHeader}>
          <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            <Text style={styles.backButtonText}>Kembali</Text>
          </SoundTouchableOpacity>
          <MaterialCommunityIcons name="plus-thick" size={28} color="#fff" />
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardLeftBorder} />
          
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5 }}>Judul Misi</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ketik judul di sini..."
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
            
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5 }}>Deskripsi</Text>
            <TextInput
              style={styles.descInput}
              placeholder="Ketik deskripsi di sini..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            
            {/* Kesulitan */}
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Tingkat Kesulitan</Text>
            </View>
            
            <View style={styles.difficultyContainer}>
              {['Mudah', 'Normal', 'Sulit'].map((level) => {
                let xpValue = 50;
                if (level === 'Normal') xpValue = 150;
                if (level === 'Sulit') xpValue = 250;
                
                const isSelected = difficulty === level;
                
                return (
                  <SoundTouchableOpacity 
                    key={level} 
                    style={[styles.difficultyOption, isSelected && styles.difficultyOptionActive]} 
                    onPress={() => setDifficulty(level)}
                  >
                    <View style={styles.difficultyLeft}>
                      <MaterialCommunityIcons 
                        name={isSelected ? "radiobox-marked" : "radiobox-blank"} 
                        size={20} 
                        color={isSelected ? "#F59E0B" : "#888"} 
                      />
                      <Text style={[styles.difficultyText, isSelected && styles.difficultyTextActive]}>{level}</Text>
                    </View>
                    
                    <View style={styles.xpBadge}>
                      <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.xpText, { color: '#F59E0B' }]}>{xpValue} EXP</Text>
                    </View>
                  </SoundTouchableOpacity>
                );
              })}
            </View>
            
            {/* Deadline */}
            <View style={[styles.sectionBadge, { backgroundColor: '#06B6D4' }]}>
              <Text style={styles.sectionBadgeText}>Deadline</Text>
            </View>
            
            <SoundTouchableOpacity style={styles.deadlineRow} onPress={() => setShowDatePicker(true)}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{date.getDate().toString().padStart(2, '0')}</Text>
              </View>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{(date.getMonth() + 1).toString().padStart(2, '0')}</Text>
              </View>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{date.getFullYear()}</Text>
              </View>
              <MaterialCommunityIcons name="calendar-edit" size={20} color="#06B6D4" style={{marginLeft: 5}} />
            </SoundTouchableOpacity>

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}

            {showDatePicker && Platform.OS === 'web' && (
              <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
                <Text style={{color: '#888', marginBottom: 5}}>Pilih Tanggal (Web):</Text>
                {React.createElement('input', {
                  type: 'date',
                  value: date.toISOString().split('T')[0],
                  onChange: (e: any) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setDate(newDate);
                    }
                    setShowDatePicker(false);
                  },
                  style: { padding: '8px', borderRadius: '8px', border: '1px solid #06B6D4' }
                })}
              </View>
            )}
            
            <Text style={styles.timeLabel}>Durasi Misi (Waktu)</Text>
            <View style={styles.timeRow}>
              <View style={[styles.timePill, { width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }]}>
                <TextInput 
                  style={[styles.timePillInput, { width: 30 }]}
                  value={hour}
                  onChangeText={(val) => setHour(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#bbb"
                />
                <Text style={{color: '#888', fontSize: 12, fontWeight: 'bold'}}>Jam</Text>
              </View>
              <View style={[styles.timePill, { width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }]}>
                <TextInput 
                  style={[styles.timePillInput, { width: 30 }]}
                  value={minute}
                  onChangeText={(val) => setMinute(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#bbb"
                />
                <Text style={{color: '#888', fontSize: 12, fontWeight: 'bold'}}>Menit</Text>
              </View>
              <View style={[styles.timePill, { width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 10 }]}>
                <TextInput 
                  style={[styles.timePillInput, { width: 30 }]}
                  value={second}
                  onChangeText={(val) => setSecond(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#bbb"
                />
                <Text style={{color: '#888', fontSize: 12, fontWeight: 'bold'}}>Detik</Text>
              </View>
            </View>
            
            <View style={styles.footerRow}>
              <SoundTouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create To Do</Text>}
              </SoundTouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#241842', padding: 20, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#160d2b',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0', // light grey
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 500,
  },
  cardLeftBorder: {
    width: 10,
    backgroundColor: '#14b8a6', // Teal
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  descInput: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    minHeight: 40,
  },
  sectionBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  sectionBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  difficultyContainer: {
    marginBottom: 30,
    marginLeft: 5,
  },
  difficultyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  difficultyOptionActive: {
    backgroundColor: '#cbd5e1',
  },
  difficultyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 10,
  },
  difficultyTextActive: {
    color: '#000',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  xpText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  deadlineRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  datePill: {
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  datePillText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timePill: {
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 15,
    paddingVertical: 0,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillInput: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    height: 30,
  },
  footerRow: {
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  createBtn: {
    backgroundColor: '#d186f2', // Light purple / pinkish
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
