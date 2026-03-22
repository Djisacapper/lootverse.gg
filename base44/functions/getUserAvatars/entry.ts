import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Returns a map of { email -> { avatar_url, username } } for a list of emails
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ users: {} });
    }

    // Fetch all users (service role so we can read all users)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const result = {};
    for (const user of allUsers) {
      if (emails.includes(user.email)) {
        result[user.email] = {
          avatar_url: user.avatar_url || null,
          username: user.username || user.full_name || null,
        };
      }
    }

    return Response.json({ users: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});