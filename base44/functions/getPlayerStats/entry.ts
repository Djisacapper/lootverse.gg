import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userEmail } = body;

    if (!userEmail) {
      return Response.json({ error: 'userEmail required' }, { status: 400 });
    }

    // Fetch all transactions for this user
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ user_email: userEmail }, '', 1000);

    // Fetch battles where user participated
    const battles = await base44.asServiceRole.entities.CaseBattle.filter({}, '', 1000);
    const userBattles = battles.filter(b => b.players?.some(p => p.email === userEmail));

    // Fetch coinflip games
    const coinflips = await base44.asServiceRole.entities.CoinflipGame.filter({}, '', 1000);
    const userCoinflips = coinflips.filter(c => c.creator_email === userEmail || c.opponent_email === userEmail);

    // Fetch the actual user record to get their real ID and avatar
     const users = await base44.asServiceRole.entities.User.filter({ email: userEmail }, '', 1);
     const userRecord = users[0];

     // Calculate stats
     let stats = {
       id: userRecord?.id || null,
       email: userEmail,
       avatar_url: userRecord?.avatar_url || null,
       level: userRecord?.level || 1,
       balance: userRecord?.balance || 0,
      cases: 0,
      battles: 0,
      coinflip: 0,
      crash: 0,
      biggestWin: 0,
      luckiestWin: 0,
      favoriteGame: 'Cases',
      wagered: 0
    };

    // Game mode play counts and wins
    const gameModes = {
      cases: { count: 0, wins: 0, totalWagered: 0, maxWin: 0 },
      battles: { count: 0, wins: 0, totalWagered: 0, maxWin: 0 },
      coinflip: { count: 0, wins: 0, totalWagered: 0, maxWin: 0 },
      crash: { count: 0, wins: 0, totalWagered: 0, maxWin: 0 }
    };

    // Process transactions
    transactions.forEach(t => {
      if (['case_purchase', 'case_win'].includes(t.type)) {
        gameModes.cases.totalWagered += Math.abs(t.amount);
        if (t.type === 'case_purchase') {
          gameModes.cases.count += 1;
        }
        if (t.amount > 0) {
          gameModes.cases.wins += 1;
          gameModes.cases.maxWin = Math.max(gameModes.cases.maxWin, t.amount);
        }
      } else if (['battle_entry', 'battle_win'].includes(t.type)) {
        if (t.type === 'battle_entry') {
          gameModes.battles.count += 1;
          gameModes.battles.totalWagered += Math.abs(t.amount);
        }
        if (t.amount > 0) {
          gameModes.battles.wins += 1;
          gameModes.battles.maxWin = Math.max(gameModes.battles.maxWin, t.amount);
        }
      } else if (['coinflip_bet', 'coinflip_win'].includes(t.type)) {
        if (t.type === 'coinflip_bet') {
          gameModes.coinflip.count += 1;
          gameModes.coinflip.totalWagered += Math.abs(t.amount);
        }
        if (t.amount > 0) {
          gameModes.coinflip.wins += 1;
          gameModes.coinflip.maxWin = Math.max(gameModes.coinflip.maxWin, t.amount);
        }
      } else if (['crash_bet', 'crash_win'].includes(t.type)) {
        if (t.type === 'crash_bet') {
          gameModes.crash.count += 1;
          gameModes.crash.totalWagered += Math.abs(t.amount);
        }
        if (t.amount > 0) {
          gameModes.crash.wins += 1;
          gameModes.crash.maxWin = Math.max(gameModes.crash.maxWin, t.amount);
        }
      }
    });

    // Find favorite game mode (most plays)
    let maxPlays = 0;
    let favoriteMode = 'Cases';
    Object.entries(gameModes).forEach(([mode, data]) => {
      if (data.count > maxPlays) {
        maxPlays = data.count;
        favoriteMode = mode.charAt(0).toUpperCase() + mode.slice(1);
      }
    });

    // Calculate luckiest win (highest multiplier)
    let luckiestWin = 1;
    Object.values(gameModes).forEach(mode => {
      if (mode.maxWin > 0 && mode.totalWagered > 0) {
        const multiplier = mode.maxWin / (mode.totalWagered / mode.count);
        if (multiplier > luckiestWin) {
          luckiestWin = multiplier;
        }
      }
    });

    // Set stats
    stats.cases = gameModes.cases.totalWagered;
    stats.battles = gameModes.battles.totalWagered;
    stats.coinflip = gameModes.coinflip.totalWagered;
    stats.crash = gameModes.crash.totalWagered;
    stats.biggestWin = Math.max(
      gameModes.cases.maxWin,
      gameModes.battles.maxWin,
      gameModes.coinflip.maxWin,
      gameModes.crash.maxWin
    );
    stats.luckiestWin = luckiestWin.toFixed(2);
    stats.favoriteGame = favoriteMode;
    stats.wagered = Object.values(gameModes).reduce((sum, m) => sum + m.totalWagered, 0);

    return Response.json(stats);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});