import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const targetUserName = body.userName;

    if (!targetUserName) {
      return Response.json({ error: 'userName required' }, { status: 400 });
    }

    // Use filter with full_name — same pattern as getPlayerStats uses for email
    const matches = await base44.asServiceRole.entities.User.filter({ full_name: targetUserName }, '', 1);
    const targetUser = matches?.[0];

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch their transactions
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ user_email: targetUser.email }, '', 1000);
    const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const wagered = transactions.filter(t => ['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type)).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    return Response.json({
      id: targetUser.id,
      full_name: targetUser.full_name,
      email: targetUser.email,
      level: targetUser.level || 1,
      balance: targetUser.balance || 0,
      xp: targetUser.xp || 0,
      avatar_url: targetUser.avatar_url || null,
      deposits,
      wagered,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});