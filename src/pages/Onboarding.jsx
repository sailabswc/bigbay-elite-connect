import React, { useState, useEffect } from "react";
import { appRuntime } from "@/api/localRuntime";
import { UserPlus, Waves, HeartPulse, Brain, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import RiskBadge from "@/components/RiskBadge";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";

const STEPS = [
  { key: "event", label: "Choose Swim", icon: Waves },
  { key: "profile", label: "Your Profile", icon: UserPlus },
  { key: "medical", label: "Medical Screening", icon: HeartPulse },
  { key: "ai", label: "AI Assessment", icon: Brain },
  { key: "payment", label: "Confirm & Pay", icon: CreditCard },
];

const emptyProfile = {
  full_name: "", email: "", phone: "", dob: "", gender: "male", city: "",
  weight_kg: "", height_cm: "", wetsuit: false,
  cold_water_experience_years: 0, previous_channel_swims: 0, longest_swim_km: 0, coldest_water_swum_c: "",
  acclimatization_level: "beginner", medical_conditions: "", medications: "",
  ec_name: "", ec_relationship: "", ec_phone: "", ec_email: "",
};

const emptyQuestionnaire = {
  cardiac_history: false, chest_pain_exertion: false, fainting_history: false,
  asthma: false, diabetes: false, hypertension: false, recent_illness: false,
  cold_water_shock_history: false, hypothermia_history: false,
  swims_per_month: 0, longest_cold_swim_minutes: 0, acclimatization_sessions_30d: 0,
  resting_hr: 0,
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [questionnaire, setQuestionnaire] = useState(emptyQuestionnaire);
  const [assessment, setAssessment] = useState(null);
  const [assessing, setAssessing] = useState(false);
  const [swimmerId, setSwimmerId] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ev = await appRuntime.entities.Event.list("start_date");
        setEvents(ev.filter(e => e.status === "open" || e.status === "screening"));
      } catch (e) { console.error(e); }
    })();
  }, []);

  const updateProfile = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const updateQ = (k, v) => setQuestionnaire(q => ({ ...q, [k]: v }));

  const canNext = () => {
    if (step === 0) return !!selectedEvent;
    if (step === 1) return profile.full_name && profile.email && profile.dob && profile.ec_name && profile.ec_phone;
    if (step === 2) return true;
    if (step === 3) return !!assessment;
    return true;
  };

  const runAssessment = async () => {
    setAssessing(true);
    setAssessment(null);
    try {
      const bmi = profile.weight_kg && profile.height_cm ? +(profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) : undefined;
      const swimmerPayload = {
        ...profile,
        age: profile.dob ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined,
      };
      const qPayload = { ...questionnaire, bmi_estimate: bmi };
      const res = await appRuntime.functions.invoke("aiSafetyScreening", {
        swimmer: swimmerPayload, event: selectedEvent, questionnaire: qPayload
      });
      const data = res.data?.assessment || res.data;
      setAssessment(data);

      // persist swimmer + screening
      const swimmerRec = await appRuntime.entities.Swimmer.create({
        full_name: profile.full_name, email: profile.email, phone: profile.phone, dob: profile.dob,
        gender: profile.gender, city: profile.city, weight_kg: +profile.weight_kg || undefined,
        height_cm: +profile.height_cm || undefined, wetsuit: profile.wetsuit,
        cold_water_experience_years: +profile.cold_water_experience_years || 0,
        previous_channel_swims: +profile.previous_channel_swims || 0,
        longest_swim_km: +profile.longest_swim_km || 0,
        coldest_water_swum_c: +profile.coldest_water_swum_c || undefined,
        acclimatization_level: profile.acclimatization_level,
        medical_conditions: profile.medical_conditions || "None",
        medications: profile.medications || "None",
        emergency_contacts: [{
          name: profile.ec_name, relationship: profile.ec_relationship, phone: profile.ec_phone,
          email: profile.ec_email, notify_start: true, notify_finish: true, notify_alert: true
        }],
        screening_status: data.decision === "cleared" ? "cleared" : data.decision === "conditional" ? "conditional" : "deferred",
        screening_risk_score: data.risk_score, screening_risk_level: data.risk_level,
      });
      setSwimmerId(swimmerRec.id);
      await appRuntime.entities.SafetyScreening.create({
        swimmer_id: swimmerRec.id, event_id: selectedEvent.id,
        questionnaire: qPayload, risk_score: data.risk_score, risk_level: data.risk_level,
        hypothermia_risk: data.hypothermia_risk, cardiac_risk: data.cardiac_risk,
        ai_assessment: data.assessment, recommendations: data.recommendations || [],
        conditions: data.conditions || [], decision: data.decision, screened_date: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      setAssessment({ error: e.message || "Assessment failed" });
    } finally {
      setAssessing(false);
    }
  };

  const completePayment = async () => {
    try {
      await appRuntime.entities.Registration.create({
        event_id: selectedEvent.id, swimmer_id: swimmerId,
        status: assessment?.decision === "cleared" ? "paid" : "conditional",
        payment_status: "paid", amount: selectedEvent.entry_fee,
        registered_date: new Date().toISOString(),
        wave: profile.wetsuit ? "wetsuit" : (profile.acclimatization_level === "elite" ? "elite" : "open"),
        waiver_accepted: true, emergency_consent: true,
      });
      await appRuntime.entities.Transaction.create({
        reference: `TXN-${Date.now()}`, type: "entry_fee", event_id: selectedEvent.id,
        swimmer_id: swimmerId, amount: selectedEvent.entry_fee, currency: "ZAR",
        status: "completed", method: "stripe", paid_date: new Date().toISOString(),
      });
      setPaid(true);
    } catch (e) { console.error(e); }
  };

  const reset = () => {
    setStep(0); setSelectedEvent(null); setProfile(emptyProfile);
    setQuestionnaire(emptyQuestionnaire); setAssessment(null); setSwimmerId(null); setPaid(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader title="Swimmer Onboarding" subtitle="AI-assisted registration, medical screening and clearance for Big Bay open-water swims." icon={UserPlus} />

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto scrollbar-thin pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1.5 min-w-[68px]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "ocean-gradient text-white shadow-lg scale-110" : done ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full mx-1 ${i < step ? "bg-emerald-400" : "bg-border"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
        {/* STEP 0: event */}
        {step === 0 && (
          <div>
            <h3 className="font-heading font-semibold mb-1">Choose your swim</h3>
            <p className="text-sm text-muted-foreground mb-4">Select an open event to register for.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {events.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e)} className={`text-left rounded-xl border-2 overflow-hidden transition-all ${selectedEvent?.id === e.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                  <div className="h-24 relative">
                    <img src={e.image_url} alt={e.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white text-sm font-semibold">{e.name}</div>
                  </div>
                  <div className="p-3 text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">{e.distance_km} km · {e.water_temp_c}°C · {formatDate(e.start_date)}</span>
                    <span className="font-bold text-primary">{formatCurrency(e.entry_fee)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: profile */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-heading font-semibold">Your profile</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input value={profile.full_name} onChange={e => updateProfile("full_name", e.target.value)} placeholder="Jane Swimmer" /></div>
              <div><Label>Email *</Label><Input type="email" value={profile.email} onChange={e => updateProfile("email", e.target.value)} placeholder="jane@email.com" /></div>
              <div><Label>Phone</Label><Input value={profile.phone} onChange={e => updateProfile("phone", e.target.value)} placeholder="+27 …" /></div>
              <div><Label>Date of Birth *</Label><Input type="date" value={profile.dob} onChange={e => updateProfile("dob", e.target.value)} /></div>
              <div><Label>Gender</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={profile.gender} onChange={e => updateProfile("gender", e.target.value)}>
                  <option value="male">Male</option><option value="female">Female</option>
                  <option value="non_binary">Non-binary</option><option value="prefer_not">Prefer not to say</option>
                </select>
              </div>
              <div><Label>City</Label><Input value={profile.city} onChange={e => updateProfile("city", e.target.value)} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" value={profile.weight_kg} onChange={e => updateProfile("weight_kg", e.target.value)} /></div>
              <div><Label>Height (cm)</Label><Input type="number" value={profile.height_cm} onChange={e => updateProfile("height_cm", e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Cold-water exp (years)</Label><Input type="number" value={profile.cold_water_experience_years} onChange={e => updateProfile("cold_water_experience_years", e.target.value)} /></div>
              <div><Label>Previous channel swims</Label><Input type="number" value={profile.previous_channel_swims} onChange={e => updateProfile("previous_channel_swims", e.target.value)} /></div>
              <div><Label>Longest swim (km)</Label><Input type="number" value={profile.longest_swim_km} onChange={e => updateProfile("longest_swim_km", e.target.value)} /></div>
              <div><Label>Coldest water swum (°C)</Label><Input type="number" value={profile.coldest_water_swum_c} onChange={e => updateProfile("coldest_water_swum_c", e.target.value)} /></div>
              <div><Label>Acclimatization level</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={profile.acclimatization_level} onChange={e => updateProfile("acclimatization_level", e.target.value)}>
                  <option value="none">None</option><option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option><option value="experienced">Experienced</option><option value="elite">Elite</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-1.5">
                <Checkbox id="wet" checked={profile.wetsuit} onCheckedChange={v => updateProfile("wetsuit", v)} />
                <Label htmlFor="wet">Will wear wetsuit</Label>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Medical conditions</Label><Textarea value={profile.medical_conditions} onChange={e => updateProfile("medical_conditions", e.target.value)} placeholder="None" rows={2} /></div>
              <div><Label>Medications</Label><Textarea value={profile.medications} onChange={e => updateProfile("medications", e.target.value)} placeholder="None" rows={2} /></div>
            </div>
            <div className="pt-3 border-t border-border">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-accent" /> Emergency Contact</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={profile.ec_name} onChange={e => updateProfile("ec_name", e.target.value)} /></div>
                <div><Label>Relationship</Label><Input value={profile.ec_relationship} onChange={e => updateProfile("ec_relationship", e.target.value)} /></div>
                <div><Label>Phone *</Label><Input value={profile.ec_phone} onChange={e => updateProfile("ec_phone", e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={profile.ec_email} onChange={e => updateProfile("ec_email", e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: medical questionnaire */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-heading font-semibold">Medical & cold-water screening</h3>
            <p className="text-sm text-muted-foreground">Honest answers power an accurate AI risk assessment. This mirrors the screening used by CLDSA observers and marathon swim medical officers.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["cardiac_history", "Any cardiac / heart history?"],
                ["chest_pain_exertion", "Chest pain during exertion?"],
                ["fainting_history", "History of fainting?"],
                ["asthma", "Asthma?"],
                ["diabetes", "Diabetes?"],
                ["hypertension", "Hypertension?"],
                ["recent_illness", "Illness in last 14 days?"],
                ["cold_water_shock_history", "Cold-water shock history?"],
                ["hypothermia_history", "Previous hypothermia incident?"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer">
                  <Checkbox checked={questionnaire[key]} onCheckedChange={v => updateQ(key, v)} />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div><Label>Swims per month</Label><Input type="number" value={questionnaire.swims_per_month} onChange={e => updateQ("swims_per_month", +e.target.value)} /></div>
              <div><Label>Longest cold swim (minutes)</Label><Input type="number" value={questionnaire.longest_cold_swim_minutes} onChange={e => updateQ("longest_cold_swim_minutes", +e.target.value)} /></div>
              <div><Label>Acclimatization sessions (last 30 days)</Label><Input type="number" value={questionnaire.acclimatization_sessions_30d} onChange={e => updateQ("acclimatization_sessions_30d", +e.target.value)} /></div>
              <div><Label>Resting heart rate (bpm)</Label><Input type="number" value={questionnaire.resting_hr} onChange={e => updateQ("resting_hr", +e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* STEP 3: AI assessment */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> AI Safety Assessment</h3>
                <p className="text-sm text-muted-foreground">Powered by cold-water swimming medical research.</p>
              </div>
              {!assessment && !assessing && (
                <Button onClick={runAssessment} className="bg-primary"><Sparkles className="w-4 h-4 mr-1" /> Run Assessment</Button>
              )}
            </div>

            {assessing && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing your cold-water & cardiac risk profile…</p>
              </div>
            )}

            {assessment && !assessment.error && (
              <div className="space-y-4">
                <div className={`rounded-2xl p-5 border-2 ${assessment.decision === "cleared" ? "border-emerald-300 bg-emerald-50" : assessment.decision === "conditional" ? "border-amber-300 bg-amber-50" : assessment.decision === "deferred" ? "border-orange-300 bg-orange-50" : "border-red-300 bg-red-50"}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {assessment.decision === "cleared" ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
                      <span className="text-xl font-heading font-bold capitalize">{assessment.decision}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={assessment.risk_level} />
                      <span className="text-2xl font-heading font-bold">{assessment.risk_score}<span className="text-sm text-muted-foreground">/100</span></span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{assessment.assessment}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl bg-white/60 p-3">
                      <div className="text-xs text-muted-foreground uppercase">Hypothermia risk</div>
                      <div className="mt-1"><RiskBadge level={assessment.hypothermia_risk} /></div>
                    </div>
                    <div className="rounded-xl bg-white/60 p-3">
                      <div className="text-xs text-muted-foreground uppercase">Cardiac risk</div>
                      <div className="mt-1"><RiskBadge level={assessment.cardiac_risk} /></div>
                    </div>
                  </div>
                  {assessment.estimated_safe_exposure_minutes != null && (
                    <div className="mt-3 text-xs text-muted-foreground">Est. safe cold-water exposure: <b className="text-foreground">{assessment.estimated_safe_exposure_minutes} min</b></div>
                  )}
                </div>

                {assessment.recommendations?.length > 0 && (
                  <div className="rounded-xl border border-border p-4">
                    <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1.5">
                      {assessment.recommendations.map((r, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{r}</li>)}
                    </ul>
                  </div>
                )}
                {assessment.conditions?.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <h4 className="text-sm font-semibold mb-2 text-amber-700">Conditions for clearance</h4>
                    <ul className="space-y-1.5">
                      {assessment.conditions.map((c, i) => <li key={i} className="text-sm text-amber-800 flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {assessment?.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{assessment.error}</div>
            )}
          </div>
        )}

        {/* STEP 4: payment */}
        {step === 4 && (
          <div>
            {paid ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-heading font-bold">You're registered! 🎉</h3>
                <p className="text-muted-foreground mt-1">Confirmation sent to {profile.email}. Your emergency contact will receive live tracking & alert notifications.</p>
                <Button onClick={reset} className="mt-6 bg-primary">Register another swimmer</Button>
              </div>
            ) : (
              <div className="space-y-5">
                <h3 className="font-heading font-semibold">Confirm & pay</h3>
                <div className="rounded-2xl border border-border p-5 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Event</span><span className="font-medium">{selectedEvent?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Swimmer</span><span className="font-medium">{profile.full_name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Screening</span><RiskBadge level={assessment?.risk_level} /></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Decision</span><span className="font-medium capitalize">{assessment?.decision}</span></div>
                  <div className="border-t border-border pt-3 flex justify-between"><span className="font-semibold">Entry fee</span><span className="font-heading font-bold text-xl">{formatCurrency(selectedEvent?.entry_fee)}</span></div>
                </div>
                {assessment?.decision === "declined" ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unfortunately this swim is not recommended for you at this time. See the AI assessment for guidance.</div>
                ) : (
                  <Button onClick={completePayment} className="w-full bg-primary h-12 text-base"><CreditCard className="w-5 h-5 mr-2" /> Pay {formatCurrency(selectedEvent?.entry_fee)} & Complete Registration</Button>
                )}
                <p className="text-xs text-muted-foreground text-center">Secure payment via Stripe · You'll receive a tracking link for your emergency contact.</p>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        {!paid && (
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-border">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
            {step < STEPS.length - 1 && (
              <Button disabled={!canNext()} onClick={() => setStep(s => s + 1)} className="bg-primary">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}