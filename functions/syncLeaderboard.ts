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

          const totalWagered = transactions.reduce((sum: number, t: any) => {
            if (['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type)) {
              return sum + Math.abs(t.amount);
            }
            return sum;
          }, 0);

          return {
            username: u.username || u.full_name || 'Player',
            avatar_url: u.avatar_url || null,
            level: u.level || 1,
            total_wagered: totalWagered,
            user_email: u.email,
          };
        } catch {
          return null;
        }
      })
    );

    // Sort by total wagered, take top 10, filter out nulls
    const entries = wagerResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<any>).value)
      .sort((a, b) => b.total_wagered - a.total_wagered)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Return entries directly — no entity needed
    return Response.json({ success: true, entries });

  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});