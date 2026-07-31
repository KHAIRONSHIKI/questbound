<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'user_id', 'title', 'description', 'status', 'type', 'xp_reward', 'duration'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
