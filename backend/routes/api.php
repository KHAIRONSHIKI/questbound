<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\TaskController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/profile', [UserController::class, 'profile']);
    Route::post('/profile', [UserController::class, 'update']);
    Route::get('/leaderboard', [UserController::class, 'leaderboard']);
    
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::patch('/tasks/{task}/fail', [TaskController::class, 'fail']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    
    Route::get('/ai/generate-quests', [\App\Http\Controllers\API\AIController::class, 'generateQuests']);
    
    Route::get('/quiz/generate', [\App\Http\Controllers\API\QuizController::class, 'generateQuiz']);
    Route::post('/quiz/complete', [\App\Http\Controllers\API\QuizController::class, 'completeQuiz']);
});
