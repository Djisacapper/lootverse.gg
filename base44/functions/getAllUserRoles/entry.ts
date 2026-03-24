import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Returns a map of { username -> role } for all users.
// PERF FIX: limit to 200 users to avoid CPU timeout; roles rarely exceed that.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('', 200);
    const roles = {};
    for (const u of allUsers) {
      if (u.full_name) roles[u.full_name] = u.role;
      if (u.username)  roles[u.username]  = u.role;
    }

    return Response.json(roles);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});