import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, amount, senderName } = body;

    if (!recipientEmail || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch recipient user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipient = allUsers.find(u => u.email === recipientEmail);

    if (!recipient) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Update recipient balance
    await base44.asServiceRole.entities.User.update(recipient.id, {
      balance: (recipient.balance || 0) + amount
    });

    // Create transaction record
    await base44.asServiceRole.entities.Transaction.create({
      user_email: recipientEmail,
      type: 'tip_received',
      amount,
      description: `Tip from ${senderName}`,
      balance_after: (recipient.balance || 0) + amount
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});