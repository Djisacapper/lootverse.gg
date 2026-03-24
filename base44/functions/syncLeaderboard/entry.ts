import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// PERF FIX: Instead of fetching all transactions for every user (500 parallel queries),
// we fetch the top users by balance/xp as a proxy for activity, keeping it lightweight.
// Full wager calculation is too expensive for real-time; use stored user stats instead.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch top 50 users sorted by xp descending (stored on the user record, no extra queries)
    const allUsers = await base44.asServiceRole.entities.User.list('-xp', 50);

    const entries = allUsers
      .filter(u => u.email && !u.is_banned)
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        username: u.username || u.full_name || 'Player',
        avatar_url: u.avatar_url || null,
        level: u.level || 1,
        xp: u.xp || 0,
        total_wagered: u.total_deposited || 0,
        user_email: u.email,
      }));

    return Response.json({ success: true, entries });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});