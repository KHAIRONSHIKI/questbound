import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Modal, FlatList, Animated } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import api from '../utils/api';
import SoundTouchableOpacity from '../components/SoundTouchable';
import { AudioContext } from '../context/AudioContext';

export default function StatistikScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    winRate: 0,
    avgPerDay: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const { source } = useLocalSearchParams();
  const { playSfx, playTallySfx, stopTallySfx } = useContext(AudioContext);
  
  // History Modal States
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  const [failedHistory, setFailedHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  
  // Animation states
  const [displayedWinRate, setDisplayedWinRate] = useState(0);
  const animating = useRef(false);
  
  const successCardGlow = useRef(new Animated.Value(0)).current;
  const failCardGlow = useRef(new Animated.Value(0)).current;
  const winrateGlow = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      const tasks = res.data.data;
      
      const completed = tasks.filter((t: any) => t.status === 'done').sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const failed = tasks.filter((t: any) => t.status === 'failed').sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      setCompletedHistory(completed);
      setFailedHistory(failed);
      
      const totalAttempted = completed.length + failed.length;
      const winRate = totalAttempted > 0 ? Math.round((completed.length / totalAttempted) * 100) : 0;
      
      // Calculate last 7 days data
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dateStr: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('id-ID', { weekday: 'short' })
        };
      });

      const counts = last7Days.map(day => {
        return completed.filter((t: any) => t.updated_at && t.updated_at.startsWith(day.dateStr)).length;
      });

      const totalLast7Days = counts.reduce((a, b) => a + b, 0);
      const avg = (totalLast7Days / 7).toFixed(1);

      setStats({
        totalTasks: totalAttempted,
        completedTasks: completed.length,
        failedTasks: failed.length,
        winRate,
        avgPerDay: parseFloat(avg),
      });
      
      // Handle winrate animation if navigated from success/failure flow
      if (source && !animating.current) {
        animating.current = true;
        const isSuccess = source === 'success';
        
        // Start glow animations
        Animated.parallel([
          Animated.timing(isSuccess ? successCardGlow : failCardGlow, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(winrateGlow, { toValue: 1, duration: 500, useNativeDriver: false })
        ]).start();

        // Calculate old win rate (approximation based on removing 1 recent task)
        const oldTotal = Math.max(1, totalAttempted - 1);
        const oldCompleted = isSuccess ? completed.length - 1 : completed.length;
        const oldWinRate = Math.round((oldCompleted / oldTotal) * 100);
        
        let currentWr = oldWinRate;
        setDisplayedWinRate(currentWr);
        
        playTallySfx();
        
        const step = Math.ceil(Math.abs(winRate - oldWinRate) / 20) || 1;
        
        const interval = setInterval(() => {
          if (currentWr < winRate) {
            currentWr = Math.min(currentWr + step, winRate);
          } else if (currentWr > winRate) {
            currentWr = Math.max(currentWr - step, winRate);
          } else {
            clearInterval(interval);
            finishWinrateAnimation(isSuccess);
          }
          setDisplayedWinRate(currentWr);
        }, 50);
      } else {
        setDisplayedWinRate(winRate);
      }

      setChartData({
        labels: last7Days.map(d => d.label),
        datasets: [{ data: counts }]
      });

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const finishWinrateAnimation = (isSuccess: boolean) => {
    stopTallySfx();
    playSfx(isSuccess ? 'winrateUp' : 'winrateDown');
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(isSuccess ? successCardGlow : failCardGlow, { toValue: 0, duration: 1000, useNativeDriver: false }),
        Animated.timing(winrateGlow, { toValue: 0, duration: 1000, useNativeDriver: false })
      ]).start(() => {
        animating.current = false;
      });
    }, 1500);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
        <Text style={styles.headerTitle}>Statistik</Text>
        <View style={{width: 60}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#cf77f3" style={{marginTop: 50}} />
      ) : (
        <>
          <View style={[styles.summaryContainer, { flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            <View style={[styles.summaryCard, { width: '48%', marginBottom: 15 }]}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="#cf77f3" />
              <Text style={styles.summaryValue}>{stats.totalTasks}</Text>
              <Text style={styles.summaryLabel}>Total Misi</Text>
            </View>
            <SoundTouchableOpacity 
              style={[styles.summaryCard, { width: '48%', marginBottom: 15 }]} 
              onPress={() => setShowHistoryModal(true)}
              activeOpacity={0.7}
            >
              <Animated.View style={[StyleSheet.absoluteFill, { 
                backgroundColor: successCardGlow.interpolate({ inputRange: [0, 1], outputRange: ['transparent', 'rgba(20, 184, 166, 0.3)'] }),
                borderRadius: 15 
              }]} />
              <MaterialCommunityIcons name="check-decagram" size={30} color="#14b8a6" />
              <Text style={styles.summaryValue}>{stats.completedTasks}</Text>
              <Text style={styles.summaryLabel}>Berhasil</Text>
              <Text style={styles.clickHint}>(Riwayat)</Text>
            </SoundTouchableOpacity>
            <SoundTouchableOpacity 
              style={[styles.summaryCard, { width: '48%' }]}
              onPress={() => setShowFailedModal(true)}
              activeOpacity={0.7}
            >
              <Animated.View style={[StyleSheet.absoluteFill, { 
                backgroundColor: failCardGlow.interpolate({ inputRange: [0, 1], outputRange: ['transparent', 'rgba(239, 68, 68, 0.3)'] }),
                borderRadius: 15 
              }]} />
              <MaterialCommunityIcons name="close-octagon-outline" size={30} color="#ef4444" />
              <Text style={styles.summaryValue}>{stats.failedTasks}</Text>
              <Text style={styles.summaryLabel}>Gagal</Text>
              <Text style={[styles.clickHint, { color: '#ef4444' }]}>(Riwayat)</Text>
            </SoundTouchableOpacity>
            <Animated.View style={[styles.summaryCard, { 
              width: '48%',
              backgroundColor: winrateGlow.interpolate({ inputRange: [0, 1], outputRange: ['#443a67', '#5a4b81'] })
            }]}>
              <MaterialCommunityIcons name="sword-cross" size={30} color="#F59E0B" />
              <Animated.Text style={[styles.summaryValue, {
                color: winrateGlow.interpolate({ inputRange: [0, 1], outputRange: ['#fff', '#F59E0B'] })
              }]}>{displayedWinRate}%</Animated.Text>
              <Text style={styles.summaryLabel}>Win Rate</Text>
            </Animated.View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>7 Hari Terakhir</Text>
            <Text style={styles.chartSubtitle}>Rata-rata: {stats.avgPerDay} misi / hari</Text>
            
            {chartData && (
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundColor: '#443a67',
                  backgroundGradientFrom: '#443a67',
                  backgroundGradientTo: '#443a67',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(207, 119, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForBackgroundLines: { strokeWidth: 1, stroke: '#5a4b81' }
                }}
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            )}
          </View>

          {/* Completed History Modal */}
          <Modal visible={showHistoryModal} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Riwayat Misi Selesai</Text>
                  <SoundTouchableOpacity onPress={() => setShowHistoryModal(false)}>
                    <MaterialCommunityIcons name="close" size={28} color="#fff" />
                  </SoundTouchableOpacity>
                </View>

                {completedHistory.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="clipboard-text-off-outline" size={50} color="#8a7da1" />
                    <Text style={styles.emptyText}>Belum ada misi yang diselesaikan.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={completedHistory}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <MaterialCommunityIcons name="check-circle" size={24} color="#14b8a6" />
                          <View style={styles.historyItemText}>
                            <Text style={styles.historyTitle}>{item.title}</Text>
                            <Text style={styles.historyDate}>{formatDate(item.updated_at)}</Text>
                          </View>
                        </View>
                        <View style={styles.xpBadge}>
                          <Text style={styles.xpBadgeText}>+{item.xp_reward || 10} XP</Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>

          {/* Failed History Modal */}
          <Modal visible={showFailedModal} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: '#ef4444' }]}>Riwayat Misi Gagal</Text>
                  <SoundTouchableOpacity onPress={() => setShowFailedModal(false)}>
                    <MaterialCommunityIcons name="close" size={28} color="#fff" />
                  </SoundTouchableOpacity>
                </View>

                {failedHistory.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="emoticon-happy-outline" size={50} color="#14b8a6" />
                    <Text style={styles.emptyText}>Tidak ada misi yang gagal. Kerja bagus!</Text>
                  </View>
                ) : (
                  <FlatList
                    data={failedHistory}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={[styles.historyItem, styles.failedHistoryItem]}>
                        <View style={styles.historyItemLeft}>
                          <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                          <View style={styles.historyItemText}>
                            <Text style={styles.historyTitle}>{item.title}</Text>
                            <Text style={styles.historyDate}>{formatDate(item.updated_at)}</Text>
                          </View>
                        </View>
                        <View style={styles.xpLostBadge}>
                          <Text style={styles.xpLostBadgeText}>-{item.xp_reward || 10} XP</Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2b1b46', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#443a67', borderRadius: 15, padding: 20, alignItems: 'center', marginHorizontal: 5 },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  summaryLabel: { color: '#a2a2d0', fontSize: 14, marginTop: 5 },
  chartContainer: { backgroundColor: '#443a67', borderRadius: 15, padding: 20, alignItems: 'center' },
  chartTitle: { color: '#cf77f3', fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start' },
  chartSubtitle: { color: '#a2a2d0', fontSize: 14, alignSelf: 'flex-start', marginBottom: 15 },
  clickHint: { color: '#14b8a6', fontSize: 10, marginTop: 5, fontStyle: 'italic' },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#372d5c',
    height: '80%',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#8a7da1',
    marginTop: 15,
    fontSize: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2b1b46',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#443a67',
  },
  failedHistoryItem: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemText: {
    marginLeft: 15,
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    color: '#a2a2d0',
    fontSize: 12,
    marginTop: 4,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'gold',
  },
  xpBadgeText: {
    color: 'gold',
    fontWeight: 'bold',
    fontSize: 12,
  },
  xpLostBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  xpLostBadgeText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
