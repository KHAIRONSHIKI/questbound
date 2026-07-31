import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { AudioContext } from '../../context/AudioContext';
import { AlertContext } from '../../context/AlertContext';
import api from '../../utils/api';
import { getRankBadge, determineRank } from '../../utils/ranks';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AvatarWithRank from '../../components/AvatarWithRank';
import SoundTouchableOpacity from '../../components/SoundTouchable';

export default function HomeScreen() {
  const { user, updateUser } = useContext(AuthContext);
  const { playSfx, startWarningSfx, stopWarningSfx, stopBgm, playBgm } = useContext(AudioContext);
  const { showAlert } = useContext(AlertContext);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Timer States
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [warningTriggered, setWarningTriggered] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnims = useRef(Array.from({ length: 12 }, () => ({
    y: new Animated.Value(-50),
    x: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (warningTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
      pulseAnim.stopAnimation();
    }
  }, [warningTriggered, pulseAnim]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDurationText = (seconds: number) => {
    if (!seconds) return '60 Detik';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    if (m > 0 && s > 0) return `${m} menit ${s} detik`;
    if (m > 0) return `${m} menit`;
    return `${s} detik`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (activeTaskId !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          const threshold = totalTime <= 60 ? Math.ceil(totalTime * 0.1) : 60;
          
          if (newTime === threshold && !warningTriggered) {
            setWarningTriggered(true);
            startWarningSfx();
            showAlert({
              title: 'Waktu Hampir Habis!',
              message: totalTime <= 60 ? 'Sisa waktu Anda kurang dari 10%! Segera selesaikan!' : 'Sisa waktu tinggal 1 menit! Segera selesaikan!',
              type: 'info' // Using info since error requires ok action only
            });
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && activeTaskId !== null) {
      // Waktu Habis!
      const failedTaskId = activeTaskId;
      const failedTask = tasks.find((t: any) => t.id === failedTaskId);
      const lostXp = failedTask?.xp_reward || 0;
      const previousRank = determineRank(user?.level || 1);
      
      stopWarningSfx();
      playBgm(); // Resume BGM
      playSfx('lose');
      
      setActiveTaskId(null);
      setWarningTriggered(false);
      
      // Tandai gagal di backend & update user XP
      api.patch(`/tasks/${failedTaskId}/fail`).then((res) => {
        if (res.data.user) {
          updateUser(res.data.user); // Update XP & level di context
        }
        fetchTasks();
      }).catch(err => console.log('Fail task error:', err));
      
      showAlert({
        title: 'Misi Gagal!',
        message: `Waktu telah habis! Anda kehilangan ${lostXp} XP. Coba perbaiki strategi Anda!`,
        type: 'error'
      });
      
      // Navigate ke leaderboard dengan params gagal
      setTimeout(() => {
        router.push({ pathname: '/leaderboard', params: { lostXp: lostXp.toString(), source: 'failure', previousRank } });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeTaskId, timeLeft, warningTriggered, totalTime]);

  const startMission = (task: any) => {
    stopBgm(); // Pause BGM during active mission
    playSfx('start'); // Mainkan efek suara mulai
    setActiveTaskId(task.id);
    const taskDuration = task.duration || 60; // Use task.duration or fallback
    setTotalTime(taskDuration); 
    setTimeLeft(taskDuration);
    setWarningTriggered(false);
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data.filter((t: any) => t.status === 'pending'));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const completeTask = async (task: any) => {
    try {
      const previousRank = determineRank(user?.level || 1);
      
      // Mainkan sound DULU sebelum await agar tidak dipotong
      playBgm(); // Resume BGM
      playSfx('complete');

      const res = await api.patch(`/tasks/${task.id}/complete`);
      updateUser(res.data.user);
      stopWarningSfx();

      if (activeTaskId === task.id) {
        setActiveTaskId(null);
        setWarningTriggered(false);
      }
      fetchTasks();

      // Trigger confetti 🎊
      setShowConfetti(true);
      confettiAnims.forEach((a) => {
        a.y.setValue(-50);
        a.x.setValue(0);
        a.opacity.setValue(1);
        a.rotate.setValue(0);
      });
      const anims = confettiAnims.map((a, i) =>
        Animated.parallel([
          Animated.timing(a.y, { toValue: 700 + Math.random() * 200, duration: 1800 + i * 80, useNativeDriver: true }),
          Animated.timing(a.x, { toValue: (Math.random() - 0.5) * 350, duration: 1800 + i * 80, useNativeDriver: true }),
          Animated.timing(a.opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          Animated.timing(a.rotate, { toValue: 720, duration: 2000, useNativeDriver: true }),
        ])
      );
      Animated.stagger(80, anims).start(() => setShowConfetti(false));

      // Tunda navigasi 1.2 detik agar sound & confetti sempat terlihat
      setTimeout(() => {
        router.push({ pathname: '/leaderboard', params: { gainedXp: task.xp_reward, source: 'success', previousRank } });
      }, 1200);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Confetti Overlay */}
      {showConfetti && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 10000 }]}>
          {confettiAnims.map((a, i) => {
            const colors = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
            const shapes = ['★', '●', '▲', '♦', '✦', '✿'];
            return (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${10 + (i * 7.5) % 80}%` as any,
                  fontSize: 20 + (i % 3) * 8,
                  color: colors[i % colors.length],
                  opacity: a.opacity,
                  transform: [
                    { translateY: a.y },
                    { translateX: a.x },
                    { rotate: a.rotate.interpolate({ inputRange: [0, 720], outputRange: ['0deg', '720deg'] }) },
                  ],
                }}
              >
                {shapes[i % shapes.length]}
              </Animated.Text>
            );
          })}
        </View>
      )}

      {/* Red Pulse Overlay */}
      <Animated.View 
        pointerEvents="none" 
        style={[styles.redOverlay, { opacity: pulseAnim }]} 
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Image source={require('../../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>QuestBound</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.playerName}>{user?.name || 'Player'}</Text>
          <SoundTouchableOpacity onPress={() => router.push('/profile')}>
            <AvatarWithRank level={user?.level || 1} size={44} />
          </SoundTouchableOpacity>
        </View>
      </View>

      {/* Red Pulse Overlay */}
      <Animated.View 
        pointerEvents="none" 
        style={[styles.redOverlay, { opacity: pulseAnim }]} 
      />

      {/* Sub Header */}
      <View style={styles.subHeader}>
        <Text style={styles.welcomeText}>
          "Welcome back, {user?.role?.name || 'Warrior'} - Rank {determineRank(user?.level || 1)}. Let's continue your fight and reach your best rank!"
        </Text>
        <SoundTouchableOpacity onPress={() => router.push('/create')}>
          <MaterialCommunityIcons name="plus-thick" size={32} color="#fff" />
        </SoundTouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#cf77f3" size="large" style={{ marginTop: 50 }} />
      ) : tasks.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada misi aktif. Tambahkan misi baru!</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.cardLeftBorder} />
              <View style={styles.cardContent}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                
                <View style={styles.taskBottomRow}>
                  <View style={styles.taskStats}>
                    <View style={styles.statBadge}>
                      <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.statText, { color: '#F59E0B' }]}>{item.xp_reward} EXP</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <View style={[styles.dot, { backgroundColor: '#06B6D4' }]} />
                      <Text style={[styles.statText, { color: '#06B6D4' }]}>{formatDurationText(item.duration)}</Text>
                    </View>
                  </View>
                  
                  {activeTaskId === item.id ? (
                    <SoundTouchableOpacity 
                      style={[styles.completeBtn, { backgroundColor: '#e94560' }]} 
                      onPress={() => completeTask(item)}
                    >
                      <Text style={styles.completeBtnText}>Selesai ({formatTime(timeLeft)})</Text>
                    </SoundTouchableOpacity>
                  ) : (
                    <SoundTouchableOpacity 
                      style={styles.completeBtn} 
                      onPress={() => startMission(item)}
                    >
                      <Text style={styles.completeBtnText}>Mulai Misi</Text>
                    </SoundTouchableOpacity>
                  )}
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
  container: { 
    flex: 1, 
    backgroundColor: '#241842', 
    padding: 20, 
    paddingTop: 50 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
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
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 20,
    lineHeight: 20,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    minHeight: 110,
  },
  cardLeftBorder: {
    width: 10,
    backgroundColor: '#14b8a6', // Teal
  },
  cardContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  taskBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  taskStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  redOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff0000',
    zIndex: 9999,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 5,
  },
  statText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  completeBtn: {
    backgroundColor: '#d186f2', // Light purple / pinkish
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  completeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: { 
    color: '#a2a2d0', 
    textAlign: 'center', 
    marginTop: 20 
  },
});
