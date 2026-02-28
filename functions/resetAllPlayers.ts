import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete all transactions
    const allTransactions = await base44.asServiceRole.entities.Transaction.list();
    for (const tx of allTransactions) {
      await base44.asServiceRole.entities.Transaction.delete(tx.id);
    }

    // Reset all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    for (const u of allUsers) {
      await base44.asServiceRole.entities.User.update(u.id, {
        level: 1,
        xp: 0,
        balance: 10000
      });
    }

    return Response.json({ 
      success: true, 
      message: `Reset ${allUsers.length} players and deleted ${allTransactions.length} transactions` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});