import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * AI-driven open-water swimming safety screening.
 * Evaluates a swimmer's medical questionnaire + cold-water acclimatization profile
 * against published OWS hypothermia/cardiac risk research and returns a structured
 * risk assessment with a go/no-go decision and recommendations.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { swimmer, event, questionnaire } = body;

    if (!swimmer || !questionnaire) {
      return Response.json({ status: 'error', message: 'Missing swimmer profile or questionnaire' }, { status: 400 });
    }

    const waterTemp = event?.water_temp_c ?? 14;
    const distanceKm = event?.distance_km ?? 7.5;
    const swimType = event?.swim_type ?? 'channel_crossing';

    const schema = {
      type: 'object',
      properties: {
        risk_score: { type: 'number', description: '0-100 composite risk score' },
        risk_level: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
        hypothermia_risk: { type: 'string', enum: ['low', 'moderate', 'high', 'severe'] },
        cardiac_risk: { type: 'string', enum: ['low', 'moderate', 'high', 'severe'] },
        decision: { type: 'string', enum: ['cleared', 'conditional', 'deferred', 'declined'] },
        assessment: { type: 'string', description: '2-3 sentence clinical-style summary' },
        recommendations: { type: 'array', items: { type: 'string' }, description: 'Specific actionable mitigations' },
        conditions: { type: 'array', items: { type: 'string' }, description: 'Conditions that must be met for conditional clearance' },
        estimated_safe_exposure_minutes: { type: 'number', description: 'Estimated max safe cold-water exposure time' }
      },
      required: ['risk_score', 'risk_level', 'hypothermia_risk', 'cardiac_risk', 'decision', 'assessment', 'recommendations']
    };

    const prompt = `You are the chief medical & safety officer for Big Bay Events, a Western Cape open-water swimming and water-safety company that runs Robben Island crossings, False Bay swims, Atlantic Dash and Cape Point swims. You are evaluating a swimmer for clearance to participate in an upcoming event.

Use established open-water swimming medical knowledge:
- Cold water (<18C) significantly increases hypothermia risk, especially in lean athletes (low BMI / low body fat).
- Cardiac events are the leading cause of open-water swimming fatalities; any cardiac history, exertional chest pain, or fainting history is a major red flag.
- Acclimatization (repeated cold-water exposure in the prior 30 days) materially reduces cold-shock and hypothermia risk.
- Leaner swimmers, older swimmers, and those with less cold-water experience tolerate cold exposure far worse.
- Robben Island crossings: first-timers should ideally swim at >=14C; water commonly 12-16C.
- Longer distances and channel crossings carry proportionally higher exposure risk.

SWIMMER PROFILE:
- Name: ${swimmer.full_name}
- Age: ${swimmer.age ?? 'unknown'}
- Gender: ${swimmer.gender ?? 'unknown'}
- Weight: ${swimmer.weight_kg ?? 'unknown'} kg, Height: ${swimmer.height_cm ?? 'unknown'} cm
- Cold-water experience: ${swimmer.cold_water_experience_years ?? 0} years
- Previous channel swims: ${swimmer.previous_channel_swims ?? 0}
- Longest swim: ${swimmer.longest_swim_km ?? 0} km
- Coldest water swum: ${swimmer.coldest_water_swum_c ?? 'unknown'} C
- Acclimatization level (self-reported): ${swimmer.acclimatization_level ?? 'beginner'}
- Medical conditions: ${swimmer.medical_conditions || 'none reported'}
- Medications: ${swimmer.medications || 'none reported'}
- Wetsuit: ${swimmer.wetsuit ? 'yes' : 'no'}

EVENT:
- Name: ${event?.name ?? 'Open water swim'}
- Type: ${swimType}
- Distance: ${distanceKm} km
- Water temperature: ${waterTemp} C
- Location: ${event?.location ?? 'Cape Town'}

SCREENING QUESTIONNAIRE (true = condition present):
- Cardiac history: ${questionnaire.cardiac_history}
- Chest pain on exertion: ${questionnaire.chest_pain_exertion}
- Fainting history: ${questionnaire.fainting_history}
- Asthma: ${questionnaire.asthma}
- Diabetes: ${questionnaire.diabetes}
- Hypertension: ${questionnaire.hypertension}
- Recent illness (last 14 days): ${questionnaire.recent_illness}
- Cold-water shock history: ${questionnaire.cold_water_shock_history}
- Hypothermia history: ${questionnaire.hypothermia_history}
- Swims per month: ${questionnaire.swims_per_month ?? 0}
- Longest cold swim (minutes): ${questionnaire.longest_cold_swim_minutes ?? 0}
- Acclimatization sessions (last 30 days): ${questionnaire.acclimatization_sessions_30d ?? 0}
- Estimated BMI: ${questionnaire.bmi_estimate ?? 'unknown'}
- Resting heart rate: ${questionnaire.resting_hr ?? 'unknown'}

Produce a rigorous, conservative assessment. A cardiac history or exertional chest pain should almost always trigger "deferred" (require cardiology clearance) or "declined". Lean swimmers with low acclimatization in cold water should be "conditional" with mandatory wetsuit/acclimatization requirements. Be decisive but explain reasoning in the assessment. Recommendations must be specific and actionable. Respond in JSON matching the schema.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model: 'claude-sonnet-5'
    });

    return Response.json({ status: 'success', assessment: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}