import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Returns a map of { email -> { avatar_url, username } } for a list of emails.
// PERF FIX: only fetch users whose emails are in the requested list (filter by email).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ users: {} });
    }

    // Cap at 20 emails to prevent abuse and reduce query size
    const safeEmails = emails.slice(0, 20);

    // Fetch only the users we need by filtering on email
    const result = {};
    await Promise.allSettled(
      safeEmails.map(async (email) => {
        try {
          const matches = await base44.asServiceRole.entities.User.filter({ email }, '', 1);
          const u = matches?.[0];
          if (u) {
            result[u.email] = {
              avatar_url: u.avatar_url || null,
              username: u.username || u.full_name || null,
            };
          }
        } catch {}
      })
    );

    return Response.json({ users: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});