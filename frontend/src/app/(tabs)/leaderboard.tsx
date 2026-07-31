import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Animated, Platform } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { AudioContext } from '../../context/AudioContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRankBadge, determineRank } from '../../utils/ranks';
import AvatarWithRank from '../../components/AvatarWithRank';
import { getCountryFlag } from '../../constants/countries';
import SoundTouchableOpacity from '../../components/SoundTouchable';

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { gainedXp, lostXp, source, previousRank } = useLocalSearchParams();
  const { playTallySfx, stopTallySfx, playSfx } = useContext(AudioContext);
  const [displayedXp, setDisplayedXp] = useState(user?.xp || 0);
  const animating = useRef(false);
  
  // Animation refs
  const rankScale = useRef(new Animated.Value(1)).current;
  const rankGlow = useRef(new Animated.Value(0)).current;
  const xpColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user && !animating.current) {
      if ((gainedXp || lostXp) && source) {
        animating.current = true;
        
        const isSuccess = source === 'success';
        const xpDelta = parseInt((gainedXp || lostXp) as string, 10);
        let startXp = isSuccess ? (user.xp - xpDelta) : (user.xp + xpDelta);
        setDisplayedXp(startXp);
        
        // Setup color interpolation (0 = normal, 1 = success(gold), 2 = fail(red))
        Animated.timing(xpColorAnim, {
          toValue: isSuccess ? 1 : 2,
          duration: 300,
          useNativeDriver: false
        }).start();

        playTallySfx();

        const step = Math.max(1, Math.ceil(xpDelta / 30)); 

        const interval = setInterval(() => {
          if (isSuccess) {
            startXp += step;
            if (startXp >= user.xp) {
              startXp = user.xp;
              clearInterval(interval);
              finishXpAnimation(isSuccess);
            }
          } else {
            startXp -= step;
            if (startXp <= user.xp) {
              startXp = user.xp;
              clearInterval(interval);
              finishXpAnimation(isSuccess);
            }
          }
          setDisplayedXp(startXp);
        }, 50);
        
        return () => {
          clearInterval(interval);
          stopTallySfx();
        };
      } else {
        setDisplayedXp(user.xp);
      }
    }
  }, [user, gainedXp, lostXp, source]);

  const finishXpAnimation = (isSuccess: boolean) => {
    stopTallySfx();
    
    // Check for rank change
    const currentRank = determineRank(user?.level || 1);
    if (previousRank && previousRank !== currentRank) {
      // Rank changed!
      const isRankUp = isSuccess; // simplify assuming success=rankup, fail=rankdown
      
      playSfx(isRankUp ? 'rankUp' : 'rankDown');
      
      Animated.sequence([
        Animated.timing(rankScale, { toValue: 1.5, duration: 500, useNativeDriver: true }),
        Animated.timing(rankGlow, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(rankScale, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(rankGlow, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      ]).start();
    }

    Animated.timing(xpColorAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false
    }).start();

    // Auto navigate to statistik
    setTimeout(() => {
      router.push({ pathname: '/statistik', params: { source } });
    }, 2500);
  };

  const xpColor = xpColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#F59E0B', '#10B981', '#EF4444'] // Gold -> Green -> Red
  });

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [])
  );

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboard');
      setUsers(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getMyRank = () => {
    if (!user || users.length === 0) return '-';
    const index = users.findIndex((u: any) => u.id === user.id);
    return index !== -1 ? index + 1 : '-';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
      </View>

      {/* Top Profile Section */}
      <View style={styles.profileSection}>
        <Animated.View style={{ 
          marginBottom: 15,
          transform: [{ scale: rankScale }],
          shadowColor: rankGlow.interpolate({ inputRange:[0,1], outputRange:['transparent', '#fff']}),
          shadowOpacity: rankGlow,
          shadowRadius: 20,
          elevation: rankGlow.interpolate({ inputRange:[0,1], outputRange:[0, 20]})
        }}>
          <AvatarWithRank level={user?.level || 1} size={120} />
        </Animated.View>
        <Text style={styles.profileName}>{user?.name || 'Player'} {user?.country ? `${getCountryFlag(user.country)}` : ''}</Text>
        <Text style={styles.profileRole}>{(determineRank(user?.level || 1)).toUpperCase()}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Rank Global</Text>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{getMyRank()}</Text>
            </View>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Points</Text>
            <View style={styles.statPill}>
              <Animated.Text style={[styles.statValue, { color: xpColor }]}>{displayedXp} EXP</Animated.Text>
            </View>
          </View>
        </View>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <ActivityIndicator color="#d186f2" size="large" style={{marginTop: 30}} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardLeftBorder} />
              
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.rankTitle}>{index + 1}. {item.name} {item.country ? `${getCountryFlag(item.country)}` : ''}</Text>
                  <AvatarWithRank level={item.level || 1} size={46} />
                </View>
                
                <View style={styles.cardBottomRow}>
                  <View style={styles.badgeRow}>
                    <View style={styles.statBadge}>
                      <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{item.xp} EXP</Text>
                    </View>
                    <View style={[styles.statBadge, { marginLeft: 15 }]}>
                      <View style={[styles.dot, { backgroundColor: '#06B6D4' }]} />
                      <Text style={[styles.badgeText, { color: '#06B6D4' }]}>Rank Global {index + 1}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{determineRank(item.level || 1)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#241842', padding: 20, paddingTop: 50 },
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
    marginLeft: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  largeBadgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#cda86f', // gold-ish border like the bronze badge
    overflow: 'hidden',
  },
  largeBadge: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 24,
    fontWeight: '900', // extra bold
    color: '#F59E0B',
    marginBottom: 20,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace', // To give it that fantasy bold look
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statPill: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  statValue: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#5a4b81', // light purple background for card
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  cardLeftBorder: {
    width: 10,
    backgroundColor: '#14b8a6', // Teal
  },
  cardContent: {
    flex: 1,
    padding: 15,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  smallBadgeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  smallBadge: {
    width: '100%',
    height: '100%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rolePill: {
    backgroundColor: '#d186f2',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  rolePillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
