import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const roles = {};
    allUsers.forEach(u => {
      roles[u.full_name] = u.role;
    });

    return Response.json(roles);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});