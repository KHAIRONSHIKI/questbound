<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = $request->user()->tasks()->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $tasks]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|in:daily,main',
            'xp_reward' => 'nullable|integer',
            'duration' => 'nullable|integer'
        ]);

        $task = $request->user()->tasks()->create([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type ?? 'daily',
            'xp_reward' => $request->xp_reward ?? 10,
            'duration' => $request->duration ?? 60,
            'status' => 'pending'
        ]);

        return response()->json(['data' => $task], 201);
    }

    public function update(Request $request, Task $task)
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $task->update($request->only(['title', 'description']));

        return response()->json(['data' => $task]);
    }

    public function complete(Request $request, Task $task)
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($task->status === 'done') {
            return response()->json(['message' => 'Task already completed'], 400);
        }

        $task->update(['status' => 'done']);

        // Give XP to user
        $user = $request->user();
        $user->xp += $task->xp_reward;
        
        // Simple level up logic (every 100 XP is 1 level)
        $newLevel = floor($user->xp / 100) + 1;
        if ($newLevel > $user->level) {
            $user->level = $newLevel;
        }
        $user->save();

        return response()->json([
            'message' => 'Task completed!',
            'data' => $task,
            'user' => $user->load('role')
        ]);
    }

    public function fail(Request $request, Task $task)
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($task->status === 'done' || $task->status === 'failed') {
            return response()->json(['message' => 'Task already completed or failed'], 400);
        }

        $task->update(['status' => 'failed']);

        // Deduct XP from user (never below 0)
        $user = $request->user();
        $user->xp = max(0, $user->xp - $task->xp_reward);

        // Recalculate level (every 100 XP is 1 level, minimum level 1)
        $user->level = max(1, floor($user->xp / 100) + 1);
        $user->save();

        return response()->json([
            'message' => 'Task failed!',
            'data' => $task,
            'user' => $user->load('role')
        ]);
    }

    public function destroy(Request $request, Task $task)
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
