import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getRankBadge, determineRank } from '../../utils/ranks';
import AvatarWithRank from '../../components/AvatarWithRank';
import { getCountryFlag } from '../../constants/countries';
import SoundTouchableOpacity from '../../components/SoundTouchable';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={{ marginBottom: 15 }}>
          <AvatarWithRank level={user?.level || 1} size={130} />
        </View>
        <Text style={styles.profileRole}>
          {(determineRank(user?.level || 1)).toUpperCase()} {user?.country ? `${getCountryFlag(user.country)}` : ''}
        </Text>
      </View>
      
      {/* Menu Card */}
      <View style={styles.card}>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>USERNAME: {user?.username || ''}</Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>LEVEL: {user?.level || 1}</Text>
        </View>

        <SoundTouchableOpacity style={styles.menuItem} onPress={() => router.push('/statistik')}>
          <Text style={styles.menuText}>STATISTIK</Text>
        </SoundTouchableOpacity>

        <SoundTouchableOpacity style={styles.menuItem} onPress={() => router.push('/account')}>
          <Text style={styles.menuText}>ACCOUNT</Text>
        </SoundTouchableOpacity>

        <SoundTouchableOpacity style={styles.menuItem} onPress={() => router.push('/setting')}>
          <Text style={styles.menuText}>SETTING</Text>
        </SoundTouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#2b1b46', // dark violet from image
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  largeBadgeContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#cda86f', // bronze/gold border from image
    overflow: 'hidden',
  },
  largeBadge: {
    width: '100%',
    height: '100%',
  },
  profileRole: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  card: { 
    backgroundColor: '#443a67', // Lighter purple for card area
    borderRadius: 15, 
    padding: 20,
    flex: 1,
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#cf77f3', // Bright pinkish purple for buttons
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
