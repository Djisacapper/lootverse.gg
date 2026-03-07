import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to bypass owner-only restriction — same pattern as syncLeaderboard
    const allUsers = await base44.asServiceRole.entities.User.list('', 500);

    // Map to safe fields
    const users = allUsers.map((u: any) => ({
      id:              u.id,
      email:           u.email,
      full_name:       u.full_name,
      username:        u.username,
      avatar_url:      u.avatar_url,
      role:            u.role,
      balance:         u.balance,
      is_banned:       u.is_banned,
      level:           u.level,
      xp:              u.xp,
      total_deposited: u.total_deposited,
      affiliate_code:  u.affiliate_code,
      referred_by:     u.referred_by,
      created_date:    u.created_date,
    }));

    return Response.json({ success: true, users });

  } catch (error: any) {
    // Return full error details so we can diagnose
    console.error('syncAdminUsers error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack,
      name: error.name,
    }, { status: 500 });
  }
});