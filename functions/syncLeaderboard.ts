import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for admin-level access
    const allUsers = await base44.asServiceRole.entities.User.list('', 500);

    // Fetch wager totals for all users in parallel
    const wagerResults = await Promise.allSettled(
      allUsers.map(async (u) => {
        try {
          const transactions = await base44.asServiceRole.entities.Transaction.filter(
            { user_email: u.email },
            '',
            1000
          );

          const totalWagered = transactions.reduce((sum, t) => {
            if (['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type)) {
              return sum + Math.abs(t.amount);
            }
            return sum;
          }, 0);

          return { user: u, totalWagered };
        } catch {
          return { user: u, totalWagered: 0 };
        }
      })
    );

    // Sort by total wagered, take top 10
    const top10 = wagerResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{ user: any; totalWagered: number }>).value)
      .sort((a, b) => b.totalWagered - a.totalWagered)
      .slice(0, 10);

    // Clear existing leaderboard entries
    const existing = await base44.asServiceRole.entities.LeaderboardEntry.list('', 50);
    await Promise.allSettled(
      existing.map(e => base44.asServiceRole.entities.LeaderboardEntry.delete(e.id))
    );

    // Write new leaderboard entries
    await Promise.all(
      top10.map((entry, index) =>
        base44.asServiceRole.entities.LeaderboardEntry.create({
          username: entry.user.username || entry.user.full_name || 'Player',
          avatar_url: entry.user.avatar_url || null,
          level: entry.user.level || 1,
          total_wagered: entry.totalWagered,
          rank: index + 1,
          user_email: entry.user.email,
        })
      )
    );

    console.log(`Leaderboard synced: ${top10.length} entries written`);
    return Response.json({ success: true, synced: top10.length });

  } catch (error) {
    console.error('Leaderboard sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
