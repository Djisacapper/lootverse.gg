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

    if (!recipientEmail || !amount || typeof amount !== 'number' || amount <= 0) {
      return Response.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    // Filter directly by email — avoids pagination issues with .list()
    const matches = await base44.asServiceRole.entities.User.filter({ email: recipientEmail });
    const recipient = matches?.[0];

    if (!recipient) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Prevent tipping yourself (double-check server side)
    if (recipient.email === user.email) {
      return Response.json({ error: 'Cannot tip yourself' }, { status: 400 });
    }

    const newBalance = (recipient.balance || 0) + amount;

    // Credit recipient
    await base44.asServiceRole.entities.User.update(recipient.id, {
      balance: newBalance,
    });

    // Log transaction for recipient
    await base44.asServiceRole.entities.Transaction.create({
      user_email: recipientEmail,
      type: 'tip_received',
      amount,
      description: `Tip from ${senderName || 'Anonymous'}`,
      balance_after: newBalance,
    });

    // Log transaction for sender
    await base44.asServiceRole.entities.Transaction.create({
      user_email: user.email,
      type: 'tip_sent',
      amount: -amount,
      description: `Tip sent to ${recipient.full_name || recipientEmail}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});