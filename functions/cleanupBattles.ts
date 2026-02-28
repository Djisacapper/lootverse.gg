import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const completedBattles = await base44.asServiceRole.entities.CaseBattle.filter({ status: 'completed' });

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const toDelete = completedBattles.filter(b => b.updated_date < oneMinuteAgo);

    for (const battle of toDelete) {
      await base44.asServiceRole.entities.CaseBattle.delete(battle.id);
    }

    return Response.json({ deleted: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});