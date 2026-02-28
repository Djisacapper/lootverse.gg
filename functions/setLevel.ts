import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { level } = await req.json();
    
    await base44.auth.updateMe({ level });
    
    return Response.json({ success: true, level });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});