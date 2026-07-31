<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Task;
use Carbon\Carbon;

class QuizController extends Controller
{
    public function generateQuiz(Request $request)
    {
        $user = $request->user();
        $type = $request->query('type', 'daily'); // 'daily' or 'weekly'
        
        // Cek batasan kuis
        $now = Carbon::now();
        if ($type === 'daily' && $user->last_daily_quiz_at && $user->last_daily_quiz_at->isSameDay($now)) {
            return response()->json(['message' => 'Anda sudah menyelesaikan Kuis Harian untuk hari ini. Kembali lagi besok!'], 400);
        }
        
        if ($type === 'weekly' && $user->last_weekly_quiz_at && $user->last_weekly_quiz_at->isSameWeek($now)) {
            return response()->json(['message' => 'Anda sudah menyelesaikan Kuis Mingguan untuk minggu ini. Kembali lagi minggu depan!'], 400);
        }

        // Ambil tugas-tugas selesai berdasarkan tipe
        $tasksQuery = $user->tasks()->where('status', 'done');
        
        if ($type === 'daily') {
            $tasksQuery->whereDate('updated_at', Carbon::today());
        } else {
            // weekly
            $tasksQuery->whereBetween('updated_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
        }
        
        $completedTasks = $tasksQuery->get();
        
        if ($completedTasks->isEmpty()) {
            return response()->json(['message' => "Belum ada tugas yang diselesaikan " . ($type == 'daily' ? "hari ini" : "minggu ini") . ". Selesaikan beberapa tugas dulu untuk diubah menjadi kuis!"], 400);
        }

        $taskDetails = $completedTasks->map(function($t) {
            return "- " . $t->title . ($t->description ? " (" . $t->description . ")" : "");
        })->implode("\n");
        
        $jumlahSoal = $type === 'daily' ? 3 : 5;

        $prompt = "Kamu adalah Game Master di sebuah RPG. Pemain ini baru saja menyelesaikan tugas-tugas nyata berikut:\n"
                . "{$taskDetails}\n\n"
                . "Buatkan {$jumlahSoal} soal pilihan ganda (kuis) berdasarkan tugas-tugas tersebut. Pertanyaannya bisa menguji memori mereka tentang apa yang mereka kerjakan atau menanyakan manfaat dari tugas tersebut dengan gaya bahasa RPG.\n"
                . "Berikan jawabanmu MURNI dalam format JSON array (tanpa markdown). Tiap soal harus berupa objek dengan key: 'question' (string), 'options' (array berisi 4 string), dan 'correct_answer_index' (integer 0-3 yang merujuk pada index jawaban benar).";
                
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['message' => 'API Key Gemini belum dikonfigurasi di file .env backend'], 500);
        }
        
        $response = Http::withoutVerifying()->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ]);
        
        if ($response->successful()) {
            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            $text = str_replace(['```json', '```'], '', $text);
            $quiz = json_decode(trim($text), true);
            
            return response()->json([
                'message' => 'Quiz Generated Successfully',
                'data' => $quiz
            ]);
        }
        
        return response()->json(['message' => 'Gagal menghubungi Gemini API'], 500);
    }

    public function completeQuiz(Request $request)
    {
        $request->validate([
            'type' => 'required|in:daily,weekly',
            'score' => 'required|integer|min:0', // Jumlah soal benar
            'total_questions' => 'required|integer|min:1'
        ]);

        $user = $request->user();
        $type = $request->type;
        $score = $request->score;
        
        // XP per correct answer
        $xpPerQuestion = 15;
        $earnedXp = $score * $xpPerQuestion;
        
        // Bonus XP for perfect score
        if ($score == $request->total_questions) {
            $earnedXp += ($type == 'daily' ? 20 : 50);
        }
        
        $user->xp += $earnedXp;
        
        // Level up logic (simplified: 100 XP per level)
        while ($user->xp >= ($user->level * 100)) {
            $user->xp -= ($user->level * 100);
            $user->level += 1;
        }

        if ($type === 'daily') {
            $user->last_daily_quiz_at = Carbon::now();
        } else {
            $user->last_weekly_quiz_at = Carbon::now();
        }

        $user->save();

        return response()->json([
            'message' => 'Quiz completed successfully!',
            'earned_xp' => $earnedXp,
            'user' => $user->load('role')
        ]);
    }
}
