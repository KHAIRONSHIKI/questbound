<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Task;

class AIController extends Controller
{
    public function generateQuests(Request $request)
    {
        $user = $request->user();
        $user->load('role');
        
        // Ambil 5 tugas terakhir yang selesai
        $recentTasks = $user->tasks()
            ->where('status', 'done')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();
            
        $taskTitles = $recentTasks->pluck('title')->implode(', ');
        
        $roleName = $user->role ? $user->role->name : 'Player';
        
        $prompt = "Kamu adalah Game Master di sebuah RPG. Pemain ini memiliki class: {$roleName}. Level mereka: {$user->level}. "
                . "Tugas-tugas yang baru saja mereka selesaikan di dunia nyata adalah: " . ($taskTitles ?: "Belum ada tugas.") . ". "
                . "Buatkan 3 quest harian baru yang terinspirasi dari gaya RPG, tetapi dapat dilakukan di dunia nyata untuk meningkatkan produktivitas atau kebiasaan sehat mereka (sesuaikan dengan class mereka jika bisa, misal Warrior olahraga, Mage belajar, dll). "
                . "Berikan jawabanmu murni dalam format JSON array yang hanya berisi object dengan property 'title', 'description', dan 'xp_reward' (angka 10-50). "
                . "Jangan tambahkan teks markdown seperti ```json atau teks lain sama sekali, berikan JSON array murni.";
                
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
            // Membersihkan backticks jika model masih ngeyel memberikan markdown
            $text = str_replace(['```json', '```'], '', $text);
            $quests = json_decode(trim($text), true);
            
            return response()->json([
                'message' => 'AI Generated Quests',
                'data' => $quests
            ]);
        }
        
        return response()->json(['message' => 'Gagal menghubungi Gemini API'], 500);
    }
}
