import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SoundTouchableOpacity from '../../components/SoundTouchable';

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer_index: number;
};

export default function QuestScreen() {
  const [loading, setLoading] = useState(false);
  const [quizState, setQuizState] = useState<'hub' | 'active' | 'result'>('hub');
  const [currentQuizType, setCurrentQuizType] = useState<'daily' | 'weekly'>('daily');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  
  const router = useRouter();
  const { updateUser } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const startQuiz = async (type: 'daily' | 'weekly') => {
    try {
      setLoading(true);
      const res = await api.get(`/quiz/generate?type=${type}`);
      const generatedQuestions = res.data.data;
      
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
          showAlert({ title: 'Error', message: 'Gagal mendapatkan soal dari AI. Silakan coba lagi.', type: 'error' });
          return;
      }

      setQuestions(generatedQuestions);
      setCurrentQuizType(type);
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizState('active');
    } catch (e: any) {
      console.log(e);
      showAlert({ title: 'Error', message: e.response?.data?.message || 'Gagal menyiapkan Kuis.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === questions[currentQuestionIndex].correct_answer_index;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz(score + (isCorrect ? 1 : 0));
    }
  };

  const finishQuiz = async (finalScore: number) => {
    try {
      setLoading(true);
      const res = await api.post('/quiz/complete', {
        type: currentQuizType,
        score: finalScore,
        total_questions: questions.length
      });
      
      setEarnedXp(res.data.earned_xp);
      updateUser(res.data.user);
      setQuizState('result');
    } catch (e: any) {
      console.log(e);
      showAlert({ title: 'Error', message: e.response?.data?.message || 'Gagal menyimpan hasil kuis.', type: 'error' });
      setQuizState('hub');
    } finally {
      setLoading(false);
    }
  };

  const renderHub = () => (
    <View style={styles.content}>
      <MaterialCommunityIcons name="sword-cross" size={64} color="#cf77f3" style={styles.iconCenter} />
      <Text style={styles.title}>Quest & Kuis</Text>
      <Text style={styles.subtitle}>Uji ingatanmu tentang tugas-tugas yang telah kamu selesaikan untuk mendapatkan XP tambahan!</Text>

      <SoundTouchableOpacity 
        style={styles.quizBtn} 
        onPress={() => startQuiz('daily')}
        disabled={loading}
      >
        <View style={styles.btnIcon}>
          <MaterialCommunityIcons name="calendar-today" size={24} color="#fff" />
        </View>
        <View style={styles.btnTextContainer}>
          <Text style={styles.btnTitle}>Kuis Harian</Text>
          <Text style={styles.btnDesc}>3 Soal - Berdasarkan tugas hari ini</Text>
        </View>
      </SoundTouchableOpacity>

      <SoundTouchableOpacity 
        style={[styles.quizBtn, { backgroundColor: '#4a3f75' }]} 
        onPress={() => startQuiz('weekly')}
        disabled={loading}
      >
        <View style={styles.btnIcon}>
          <MaterialCommunityIcons name="calendar-week" size={24} color="#fff" />
        </View>
        <View style={styles.btnTextContainer}>
          <Text style={styles.btnTitle}>Kuis Mingguan</Text>
          <Text style={styles.btnDesc}>5 Soal - Berdasarkan tugas minggu ini</Text>
        </View>
      </SoundTouchableOpacity>
    </View>
  );

  const renderActiveQuiz = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <View style={styles.content}>
        <Text style={styles.progressText}>
          Soal {currentQuestionIndex + 1} dari {questions.length}
        </Text>
        
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        <ScrollView style={styles.optionsContainer}>
          {currentQ.options.map((opt, idx) => (
            <SoundTouchableOpacity 
              key={idx} 
              style={styles.optionBtn}
              onPress={() => handleAnswer(idx)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </SoundTouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderResult = () => (
    <View style={styles.content}>
      <MaterialCommunityIcons name="treasure-chest" size={80} color="#F59E0B" style={styles.iconCenter} />
      <Text style={styles.title}>Kuis Selesai!</Text>
      <Text style={styles.scoreText}>Kamu menjawab benar {score} dari {questions.length} soal.</Text>
      
      <View style={styles.rewardBox}>
        <Text style={styles.rewardLabel}>XP Didapat:</Text>
        <Text style={styles.rewardValue}>+{earnedXp} XP</Text>
      </View>

      <SoundTouchableOpacity 
        style={styles.backBtn}
        onPress={() => setQuizState('hub')}
      >
        <Text style={styles.backBtnText}>Kembali ke Menu Utama</Text>
      </SoundTouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SoundTouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </SoundTouchableOpacity>
      </View>

      {loading && quizState === 'hub' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#cf77f3" size="large" />
          <Text style={styles.loadingText}>Menyusun Kuis dari tugas-tugasmu...</Text>
        </View>
      ) : (
        <>
          {quizState === 'hub' && renderHub()}
          {quizState === 'active' && renderActiveQuiz()}
          {quizState === 'result' && renderResult()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#241842', paddingTop: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconCenter: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#a2a2d0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  quizBtn: {
    flexDirection: 'row',
    backgroundColor: '#6b3be3',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
  },
  btnIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  btnTextContainer: {
    flex: 1,
  },
  btnTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  btnDesc: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  progressText: {
    color: '#cf77f3',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#372d5c',
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
    minHeight: 120,
    justifyContent: 'center',
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
  },
  optionBtn: {
    backgroundColor: '#e2e8f0',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
  optionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  rewardBox: {
    backgroundColor: '#372d5c',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  rewardLabel: {
    color: '#a2a2d0',
    fontSize: 16,
    marginBottom: 10,
  },
  rewardValue: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: '#6b3be3',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
