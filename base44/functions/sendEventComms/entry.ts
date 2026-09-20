import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Escapes a value before it is interpolated into the HTML email body.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Collapses CR/LF so a value cannot inject additional mail headers.
function singleLine(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

// Sends an email update to every swimmer registered for an event.
// Admin-only. Bounded to 50 recipients per call. Reaches registered app users reliably.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only organisers may broadcast to an event's registrants.
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event_id, subject, message } = await req.json();
    if (!event_id || !subject || !message) {
      return Response.json({ error: 'event_id, subject and message are required' }, { status: 400 });
    }

    const event = await base44.asServiceRole.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const safeEventName = singleLine(event.name);
    const safeSubject = singleLine(subject);

    const registrations = await base44.asServiceRole.entities.Registration.filter({ event_id }, '-created_date', 200);
    const swimmerIds = [...new Set(registrations.map(r => r.swimmer_id).filter(Boolean))].slice(0, 50);

    const swimmers = await Promise.all(
      swimmerIds.map(id => base44.asServiceRole.entities.Swimmer.get(id).catch(() => null))
    );

    const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
      <div style="background:linear-gradient(135deg,#0b2a47,#12608f);color:#fff;padding:24px;border-radius:14px 14px 0 0">
        <h1 style="margin:0;font-size:20px">${escapeHtml(event.name)}</h1>
        <p style="margin:6px 0 0;opacity:.8;font-size:13px">Big Bay Events · Update</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;padding:24px">
        <h2 style="margin:0 0 12px;font-size:16px;color:#0b2a47">${escapeHtml(subject)}</h2>
        <div style="font-size:14px;line-height:1.6;color:#334155;white-space:pre-line">${escapeHtml(message)}</div>
        <p style="margin-top:24px;font-size:12px;color:#94a3b8">Sent by ${escapeHtml(user.full_name || 'Big Bay Events')} via the Big Bay Events OS.</p>
      </div>
    </div>`;

    let sent = 0;
    const failed = [];
    for (const sw of swimmers) {
      if (!sw?.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sw.email,
          subject: `[${safeEventName}] ${safeSubject}`,
          html,
          from_name: 'Big Bay Events',
        });
        sent += 1;
      } catch (e) {
        failed.push({ email: sw.email, error: e.message });
      }
    }

    return Response.json({
      success: true,
      event: event.name,
      recipients_found: swimmers.filter(s => s?.email).length,
      sent,
      failed_count: failed.length,
      failed: failed.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}