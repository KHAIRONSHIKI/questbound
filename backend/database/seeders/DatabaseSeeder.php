<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Warrior Elite'],
            ['name' => 'Epic'],
            ['name' => 'Legend'],
            ['name' => 'Infinity'],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate($role);
        }
    }
}
