import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all transactions for this user
    await base44.asServiceRole.entities.Transaction.delete({ query: { user_email: user.email } });

    // Reset user stats
    await base44.auth.updateMe({ 
      balance: 0,
      xp: 0,
      level: 1,
      total_deposits: 0,
      total_wagered: 0,
      total_withdrawals: 0
    });

    return Response.json({ success: true, message: 'Stats reset successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});