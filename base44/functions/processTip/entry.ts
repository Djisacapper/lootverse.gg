import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DAILY_TIP_LIMIT = 15000;
const MIN_LEVEL_TO_TIP = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { recipientEmail, senderName, senderEmail } = body;
    const amount = Number(body.amount);

    if (!recipientEmail || !amount || isNaN(amount) || amount <= 0) {
      return Response.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    if (senderEmail && senderEmail === recipientEmail) {
      return Response.json({ error: 'Cannot tip yourself' }, { status: 400 });
    }

    // ── Fetch sender ──
    const senderMatches = await base44.asServiceRole.entities.User.filter({ email: senderEmail });
    const sender = senderMatches?.[0];
    if (!sender) {
      return Response.json({ error: 'Sender not found' }, { status: 404 });
    }

    // ── Level check: sender must be level 5+ ──
    if ((sender.level || 1) < MIN_LEVEL_TO_TIP) {
      return Response.json({ error: `You must be level ${MIN_LEVEL_TO_TIP} to tip` }, { status: 403 });
    }

    // ── Balance check ──
    if ((sender.balance || 0) < amount) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // ── Daily tip limit check ──
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const todayTips = await base44.asServiceRole.entities.Transaction.filter(
      { user_email: senderEmail, type: 'tip_sent' },
      '-created_date',
      100
    );

    const tippedToday = todayTips
      .filter(t => t.created_date >= startOfDay)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    if (tippedToday + amount > DAILY_TIP_LIMIT) {
      const remaining = Math.max(0, DAILY_TIP_LIMIT - tippedToday);
      return Response.json({
        error: `Daily tip limit reached. You can tip ${remaining.toLocaleString()} more coins today.`
      }, { status: 400 });
    }

    // ── Fetch recipient ──
    const recipients = await base44.asServiceRole.entities.User.filter({ email: recipientEmail });
    const recipient = recipients?.[0];
    if (!recipient) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // ── Level check: recipient must be level 5+ ──
    if ((recipient.level || 1) < MIN_LEVEL_TO_TIP) {
      return Response.json({ error: `Recipient must be level ${MIN_LEVEL_TO_TIP} to receive tips` }, { status: 403 });
    }

    // ── Execute tip: deduct sender, credit recipient ──
    const newSenderBalance = (sender.balance || 0) - amount;
    const newRecipientBalance = (recipient.balance || 0) + amount;

    await Promise.all([
      base44.asServiceRole.entities.User.update(sender.id, { balance: newSenderBalance }),
      base44.asServiceRole.entities.User.update(recipient.id, { balance: newRecipientBalance }),
    ]);

    // ── Log transactions ──
    await Promise.all([
      base44.asServiceRole.entities.Transaction.create({
        user_email: senderEmail,
        type: 'tip_sent',
        amount: -amount,
        balance_after: newSenderBalance,
        description: `Tip sent to ${recipient.username || recipient.full_name || recipientEmail}`,
      }),
      base44.asServiceRole.entities.Transaction.create({
        user_email: recipientEmail,
        type: 'tip_received',
        amount,
        balance_after: newRecipientBalance,
        description: `Tip from ${senderName || sender.username || sender.full_name || 'Someone'}`,
      }),
    ]);

    return Response.json({
      success: true,
      newBalance: newSenderBalance,
      dailyTipped: tippedToday + amount,
      dailyRemaining: DAILY_TIP_LIMIT - tippedToday - amount,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});