import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, senderName } = body;

    // Coerce amount — base44 may serialize numbers as strings over the wire
    const amount = Number(body.amount);

    if (!recipientEmail || !amount || isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    if (user.email === recipientEmail) {
      return Response.json({ error: 'Cannot tip yourself' }, { status: 400 });
    }

    // Paginate through ALL users to find recipient by email
    let recipient = null;
    let page = 1;
    const pageSize = 100;

    while (!recipient) {
      const batch = await base44.asServiceRole.entities.User.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      if (!batch || batch.length === 0) break;
      recipient = batch.find(u => u.email === recipientEmail) ?? null;
      if (batch.length < pageSize) break;
      page++;
    }

    if (!recipient) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const newBalance = (recipient.balance || 0) + amount;

    // Credit recipient
    await base44.asServiceRole.entities.User.update(recipient.id, {
      balance: newBalance,
    });

    // Transaction for recipient
    await base44.asServiceRole.entities.Transaction.create({
      user_email: recipientEmail,
      type: 'tip_received',
      amount,
      description: `Tip from ${senderName || 'Someone'}`,
      balance_after: newBalance,
    });

    // Transaction for sender
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