import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Live data sync engine.
//
// DEMO MODE (current): `nextValue` advances each figure with a realistic
// simulation so the board visibly ticks in real time during the pitch.
//
// GOING LIVE: replace the body of `readFromSource` with the Power BI REST API
// call. The rest of this function — the interval guard, the series history,
// the delta/trend calculation and the realtime write — stays exactly as is, and
// the app UI needs no changes at all.
//
//   POST https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/datasets/{datasetId}/executeQueries
//   Authorization: Bearer <Azure AD service-principal token>
//   body: { "queries": [{ "query": "EVALUATE SUMMARIZECOLUMNS(...)" }] }
//
// Credentials needed (Base44 dashboard -> Secrets):
//   POWERBI_TENANT_ID, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET,
//   POWERBI_WORKSPACE_ID, POWERBI_DATASET_ID

const MIN_INTERVAL_MS = 3000;
const SERIES_LENGTH = 30;

function nextValue(metric) {
  const v = Number(metric.value) || 0;
  switch (metric.key) {
    case "entries_sold": {
      const inc = Math.random() < 0.55 ? 1 + Math.floor(Math.random() * 4) : 0;
      return { value: Math.min(5000, v + inc), decimals: 0 };
    }
    case "revenue": {
      const inc = Math.random() < 0.6 ? 450 + Math.floor(Math.random() * 3200) : 0;
      return { value: v + inc, decimals: 0 };
    }
    case "swimmers_live": {
      const step = Math.random() < 0.3 ? 2 : 1;
      const dir = Math.random() < 0.5 ? 1 : -1;
      return { value: Math.max(0, Math.min(240, v + dir * step)), decimals: 0 };
    }
    case "water_temp": {
      return { value: Math.max(11, Math.min(20, v + (Math.random() - 0.5) * 0.24)), decimals: 1 };
    }
    case "avg_pace": {
      return { value: Math.max(60, Math.min(140, v + (Math.random() - 0.5) * 0.9)), decimals: 1 };
    }
    case "active_alerts": {
      const r = Math.random();
      const d = r < 0.25 ? 1 : r > 0.75 ? -1 : 0;
      return { value: Math.max(0, Math.min(9, v + d)), decimals: 0 };
    }
    case "signal_health": {
      return { value: Math.max(86, Math.min(100, v + (Math.random() - 0.5) * 2.4)), decimals: 0 };
    }
    default:
      return { value: v, decimals: 0 };
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await base44.asServiceRole.entities.LiveMetric.list('key', 50);
    if (!metrics.length) return Response.json({ metrics: [], source: 'simulated' });

    const now = Date.now();
    const newest = metrics.reduce((acc, m) => {
      const t = m.last_sync ? new Date(m.last_sync).getTime() : 0;
      return t > acc ? t : acc;
    }, 0);

    // Interval guard — several viewers polling at once must not double-advance the feed.
    if (now - newest < MIN_INTERVAL_MS) {
      return Response.json({ metrics, source: metrics[0].source || 'simulated', skipped: true });
    }

    const stampedAt = new Date(now).toISOString();

    const updated = await Promise.all(
      metrics.map(async (metric) => {
        const { value, decimals } = nextValue(metric);
        const rounded = Number(value.toFixed(decimals));
        const previous = Number(metric.value) || 0;
        const delta = Number((rounded - previous).toFixed(decimals));
        const series = [...(metric.series || []), rounded].slice(-SERIES_LENGTH);

        return base44.asServiceRole.entities.LiveMetric.update(metric.id, {
          value: rounded,
          delta,
          trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
          series,
          source: 'simulated',
          last_sync: stampedAt,
        });
      })
    );

    return Response.json({ metrics: updated, source: 'simulated', syncedAt: stampedAt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}