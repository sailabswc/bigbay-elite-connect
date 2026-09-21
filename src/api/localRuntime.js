const STORAGE_PREFIX = 'bigbay_local_runtime';

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
};

const readStorage = (key, fallback) => {
  const storage = safeLocalStorage();
  if (!storage) {
    return clone(fallback);
  }
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (error) {
    console.warn(`Could not read ${key}:`, error);
    return clone(fallback);
  }
};

const writeStorage = (key, value) => {
  const storage = safeLocalStorage();
  if (!storage) {
    return;
  }
  storage.setItem(key, JSON.stringify(value));
};

const createRecordId = (prefix = 'record') => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;

const buildEntityStore = (entityName, initialValues = []) => {
  const storageKey = `${STORAGE_PREFIX}:${entityName}`;
  const listeners = new Set();

  const getRows = () => readStorage(storageKey, initialValues);

  const persist = (rows) => {
    writeStorage(storageKey, rows);
    for (const listener of listeners) {
      try {
        listener({ type: 'change', entity: entityName, data: clone(rows) });
      } catch (error) {
        console.error(`Entity listener failed for ${entityName}:`, error);
      }
    }
  };

  const sortRows = (rows, sortKey) => {
    if (!sortKey) {
      return rows;
    }
    const descending = sortKey.startsWith('-');
    const key = descending ? sortKey.slice(1) : sortKey;
    const sorted = [...rows].sort((a, b) => {
      const left = a?.[key] ?? '';
      const right = b?.[key] ?? '';
      const leftValue = typeof left === 'string' ? left.toLowerCase() : left;
      const rightValue = typeof right === 'string' ? right.toLowerCase() : right;
      if (leftValue === rightValue) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return descending ? rightValue - leftValue : leftValue - rightValue;
      }
      return descending ? (rightValue > leftValue ? 1 : -1) : (leftValue > rightValue ? 1 : -1);
    });
    return sorted;
  };

  const matchesCriteria = (entry, criteria = {}) => {
    return Object.entries(criteria).every(([key, expected]) => {
      const actual = entry?.[key];
      if (expected == null) return true;
      if (typeof expected === 'object' && !Array.isArray(expected) && expected !== null) {
        return actual === expected;
      }
      return actual === expected;
    });
  };

  const list = async (sortKey, limit) => {
    const rows = sortRows(getRows(), sortKey);
    return typeof limit === 'number' ? rows.slice(0, limit) : rows;
  };

  const get = async (id) => {
    const rows = getRows();
    return rows.find((row) => String(row.id) === String(id)) || null;
  };

  const filter = async (criteria = {}, sortKey, limit) => {
    const rows = getRows().filter((entry) => matchesCriteria(entry, criteria));
    const sorted = sortRows(rows, sortKey);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  };

  const create = async (data = {}) => {
    const rows = getRows();
    const record = {
      ...data,
      id: data.id || createRecordId(entityName.toLowerCase()),
      created_date: data.created_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const next = [...rows, record];
    persist(next);
    return clone(record);
  };

  const update = async (id, patch = {}) => {
    const rows = getRows();
    const index = rows.findIndex((row) => String(row.id) === String(id));
    if (index === -1) {
      throw new Error(`${entityName} record ${id} not found`);
    }
    const nextRow = { ...rows[index], ...patch, updated_at: new Date().toISOString() };
    const nextRows = rows.map((row) => (String(row.id) === String(id) ? nextRow : row));
    persist(nextRows);
    return clone(nextRow);
  };

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return { list, get, filter, create, update, subscribe };
};

const sampleUsers = [
  {
    id: 'user_admin',
    full_name: 'Ava Martin',
    email: 'admin@bigbayconnect.local',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    created_date: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_amber',
    full_name: 'Amber Ndlovu',
    email: 'amber@bigbayconnect.local',
    password: 'demo123',
    role: 'operations',
    status: 'active',
    created_date: '2024-02-03T00:00:00.000Z',
  },
  {
    id: 'user_jiro',
    full_name: 'Jiro Patel',
    email: 'jiro@bigbayconnect.local',
    password: 'demo123',
    role: 'support',
    status: 'active',
    created_date: '2024-03-15T00:00:00.000Z',
  },
];

const sampleEvents = [
  {
    id: 'event_bay_open',
    name: 'Table Bay Ocean Sprint',
    slug: 'table-bay-ocean-sprint',
    swim_type: 'bay_swim',
    description: 'Cape Town channel swim with full rescue coverage and elite pacing support.',
    start_date: '2026-11-10T08:00:00.000Z',
    end_date: '2026-11-10T12:30:00.000Z',
    distance_km: 12,
    start_point: 'Camps Bay',
    end_point: 'Hout Bay',
    location: 'Cape Town',
    region: 'Western Cape',
    water_temp_c: 15,
    expected_conditions: 'Moderate swell with cold-water wind chop',
    entry_fee: 450,
    capacity: 80,
    registered_count: 64,
    sanctioned_by: 'CLDSA',
    status: 'live',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    safety_crew_required: 14,
    support_vessels: 5,
    minimum_age: 16,
  },
  {
    id: 'event_round_island',
    name: 'Cape Peninsula Round Island',
    slug: 'cape-peninsula-round-island',
    swim_type: 'round_island',
    description: 'A demanding island loop for advanced cold-water swimmers.',
    start_date: '2026-11-28T06:30:00.000Z',
    end_date: '2026-11-28T11:00:00.000Z',
    distance_km: 28,
    start_point: 'Muizenberg',
    end_point: 'Simonstown',
    location: 'False Bay',
    region: 'Western Cape',
    water_temp_c: 17,
    expected_conditions: 'Light chop and moderate current',
    entry_fee: 650,
    capacity: 120,
    registered_count: 92,
    sanctioned_by: 'CLDSA',
    status: 'screening',
    image_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206',
    safety_crew_required: 18,
    support_vessels: 6,
    minimum_age: 18,
  },
  {
    id: 'event_coastal_dash',
    name: 'St Helena Coastal Dash',
    slug: 'st-helena-coastal-dash',
    swim_type: 'coastal_dash',
    description: 'Short coastal event with family support and spectator beach zones.',
    start_date: '2026-12-04T09:00:00.000Z',
    end_date: '2026-12-04T13:00:00.000Z',
    distance_km: 6,
    start_point: 'St James',
    end_point: 'Fish Hoek',
    location: 'False Bay',
    region: 'Western Cape',
    water_temp_c: 16,
    expected_conditions: 'Clear water and light offshore breeze',
    entry_fee: 260,
    capacity: 60,
    registered_count: 54,
    sanctioned_by: 'CLDSA',
    status: 'open',
    image_url: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60',
    safety_crew_required: 8,
    support_vessels: 3,
    minimum_age: 14,
  },
];

const sampleSwimmers = [
  { id: 'swimmer_01', full_name: 'Leah van der Merwe', email: 'leah@example.com', phone: '+27 21 555 0011', dob: '1995-08-12', gender: 'female', nationality: 'South African', city: 'Cape Town', weight_kg: 62, height_cm: 170, wetsuit: true, emergency_contacts: [], medical_conditions: 'None', medications: 'None', allergies: 'None', cold_water_experience_years: 5, previous_channel_swims: 3, longest_swim_km: 7, coldest_water_swum_c: 11, acclimatization_level: 'experienced', screening_status: 'cleared', screening_risk_score: 12, screening_risk_level: 'low', swim_pr_5km_minutes: 78, club: 'Atlantic Masters', user_id: 'user_amber', },
  { id: 'swimmer_02', full_name: 'Nico Smit', email: 'nico@example.com', phone: '+27 83 444 0022', dob: '1989-02-21', gender: 'male', nationality: 'South African', city: 'Hout Bay', weight_kg: 76, height_cm: 182, wetsuit: true, emergency_contacts: [], medical_conditions: 'Asthma', medications: 'Inhaler', allergies: 'None', cold_water_experience_years: 9, previous_channel_swims: 7, longest_swim_km: 16, coldest_water_swum_c: 10, acclimatization_level: 'elite', screening_status: 'cleared', screening_risk_score: 18, screening_risk_level: 'moderate', swim_pr_5km_minutes: 70, club: 'Cape Open Water', user_id: 'user_jiro', },
  { id: 'swimmer_03', full_name: 'Aisha Rahman', email: 'aisha@example.com', phone: '+27 72 389 0033', dob: '2001-06-09', gender: 'female', nationality: 'South African', city: 'Muizenberg', weight_kg: 58, height_cm: 167, wetsuit: false, emergency_contacts: [], medical_conditions: 'None', medications: 'None', allergies: 'Peanuts', cold_water_experience_years: 2, previous_channel_swims: 1, longest_swim_km: 4, coldest_water_swum_c: 13, acclimatization_level: 'beginner', screening_status: 'in_review', screening_risk_score: 52, screening_risk_level: 'high', swim_pr_5km_minutes: 95, club: 'Ocean Pulse', user_id: 'user_amber', },
  { id: 'swimmer_04', full_name: 'Dylan Brooks', email: 'dylan@example.com', phone: '+27 82 772 0044', dob: '1998-11-30', gender: 'male', nationality: 'South African', city: 'Fish Hoek', weight_kg: 81, height_cm: 185, wetsuit: true, emergency_contacts: [], medical_conditions: 'None', medications: 'None', allergies: 'None', cold_water_experience_years: 7, previous_channel_swims: 5, longest_swim_km: 14, coldest_water_swum_c: 9, acclimatization_level: 'intermediate', screening_status: 'conditional', screening_risk_score: 38, screening_risk_level: 'moderate', swim_pr_5km_minutes: 84, club: 'Bayside Crew', user_id: 'user_admin', },
];

const sampleRegistrations = [
  { id: 'reg_01', event_id: 'event_bay_open', swimmer_id: 'swimmer_01', status: 'checked_in', amount: 450, created_at: '2026-09-15T12:00:00.000Z' },
  { id: 'reg_02', event_id: 'event_bay_open', swimmer_id: 'swimmer_02', status: 'paid', amount: 450, created_at: '2026-09-17T11:00:00.000Z' },
  { id: 'reg_03', event_id: 'event_round_island', swimmer_id: 'swimmer_03', status: 'pending', amount: 650, created_at: '2026-09-18T10:00:00.000Z' },
  { id: 'reg_04', event_id: 'event_coastal_dash', swimmer_id: 'swimmer_04', status: 'cleared', amount: 260, created_at: '2026-09-19T14:00:00.000Z' },
  { id: 'reg_05', event_id: 'event_bay_open', swimmer_id: 'swimmer_04', status: 'paid', amount: 450, created_at: '2026-09-20T15:00:00.000Z' },
];

const sampleSafetyAlerts = [
  { id: 'alert_01', event_id: 'event_bay_open', swimmer_id: 'swimmer_03', type: 'medical', severity: 'urgent', message: 'Swimmer reporting dizziness after cold-water entry. Monitor for fatigue and hypothermia.', location_lat: -33.9236, location_lng: 18.4033, status: 'active', acknowledged_by: 'support', created_date: '2026-11-10T08:17:00.000Z', resolved_date: null, resolution: null },
  { id: 'alert_02', event_id: 'event_bay_open', swimmer_id: 'swimmer_01', type: 'equipment', severity: 'warning', message: 'Track buoy not visible in rougher chop; support vessel notified.', location_lat: -33.9170, location_lng: 18.4310, status: 'acknowledged', acknowledged_by: 'ops', created_date: '2026-11-10T08:42:00.000Z', resolved_date: '2026-11-10T08:49:00.000Z', resolution: 'Equipment swapped and corrected in the next support cycle.' },
  { id: 'alert_03', event_id: 'event_round_island', swimmer_id: null, type: 'weather', severity: 'critical', message: 'Wind shift exceeded forecast thresholds; safety briefing to be renewed.', location_lat: -34.0360, location_lng: 18.4380, status: 'active', acknowledged_by: 'lead_safety', created_date: '2026-11-28T06:20:00.000Z', resolved_date: null, resolution: null },
];

const sampleTransactions = [
  { id: 'tx_01', type: 'registration', amount: 450, status: 'completed', paid_date: '2026-09-08T12:00:00.000Z', customer: 'Leah van der Merwe' },
  { id: 'tx_02', type: 'registration', amount: 450, status: 'completed', paid_date: '2026-09-10T12:00:00.000Z', customer: 'Nico Smit' },
  { id: 'tx_03', type: 'registration', amount: 650, status: 'pending', paid_date: '2026-09-12T12:00:00.000Z', customer: 'Aisha Rahman' },
  { id: 'tx_04', type: 'sponsorship', amount: 12000, status: 'completed', paid_date: '2026-09-22T12:00:00.000Z', customer: 'BlueWave Capital' },
  { id: 'tx_05', type: 'donation', amount: 1800, status: 'completed', paid_date: '2026-09-25T12:00:00.000Z', customer: 'Community Donations' },
  { id: 'tx_06', type: 'refund', amount: 150, status: 'completed', paid_date: '2026-09-27T12:00:00.000Z', customer: 'Withdrawal' },
];

const sampleSponsors = [
  { id: 'sponsor_01', name: 'BlueWave Capital', tier: 'title', contribution: 18000, active: true },
  { id: 'sponsor_02', name: 'Apex Marine', tier: 'gold', contribution: 9000, active: true },
  { id: 'sponsor_03', name: 'Northshore Health', tier: 'silver', contribution: 4500, active: true },
  { id: 'sponsor_04', name: 'CapeSight Media', tier: 'supporter', contribution: 2500, active: false },
];

const sampleSupportCrew = [
  { id: 'crew_01', name: 'Mila Dube', role: 'Lead Rescue', assigned_event_id: 'event_bay_open', status: 'on_water' },
  { id: 'crew_02', name: 'Tariq van Rensburg', role: 'Safety Boat', assigned_event_id: 'event_bay_open', status: 'ready' },
  { id: 'crew_03', name: 'Clive Nkosi', role: 'Medical Lead', assigned_event_id: 'event_round_island', status: 'pending' },
];

const sampleLiveTrack = [
  { id: 'track_01', swimmer_id: 'swimmer_01', event_id: 'event_bay_open', latitude: -33.9201, longitude: 18.4151, speed_kmh: 4.2, status: 'tracking' },
  { id: 'track_02', swimmer_id: 'swimmer_02', event_id: 'event_bay_open', latitude: -33.9181, longitude: 18.4209, speed_kmh: 3.9, status: 'tracking' },
];

const sampleLiveMetrics = [
  { id: 'metric_01', label: 'Active swimmers', value: 64, unit: 'count' },
  { id: 'metric_02', label: 'Avg. pace', value: 4.2, unit: 'km/h' },
  { id: 'metric_03', label: 'Safety alerts', value: 2, unit: 'count' },
];

const sampleChatRooms = [
  { id: 'room_01', name: 'Operations Desk', kind: 'group', topic: 'Live event coverage', member_ids: ['user_admin', 'user_amber', 'user_jiro'], member_names: ['Ava Martin', 'Amber Ndlovu', 'Jiro Patel'], last_message: 'All support boats are in position.', last_message_at: '2026-11-10T08:45:00.000Z', last_sender_id: 'user_amber', last_sender_name: 'Amber Ndlovu' },
  { id: 'room_02', name: 'Amber Ndlovu', kind: 'direct', member_ids: ['user_admin', 'user_amber'], member_names: ['Ava Martin', 'Amber Ndlovu'], last_message: 'Weather check complete.', last_message_at: '2026-11-10T08:32:00.000Z', last_sender_id: 'user_admin', last_sender_name: 'Ava Martin' },
];

const sampleChatMessages = [
  { id: 'msg_01', room_id: 'room_01', sender_id: 'user_admin', sender_name: 'Ava Martin', body: 'All support boats are in position.', created_date: '2026-11-10T08:45:00.000Z', room_member_ids: ['user_admin', 'user_amber', 'user_jiro'] },
  { id: 'msg_02', room_id: 'room_02', sender_id: 'user_admin', sender_name: 'Ava Martin', body: 'Weather check complete.', created_date: '2026-11-10T08:32:00.000Z', room_member_ids: ['user_admin', 'user_amber'] },
];

const appPublicSettings = {
  id: 'bigbay-elite-connect',
  public_settings: {
    appName: 'Big Bay Elite Connect',
    runtime: 'local',
    productionReady: true,
    headline: 'Enterprise-class event operations for open-water swim programs',
  },
};

const entities = {
  Event: buildEntityStore('Event', sampleEvents),
  Swimmer: buildEntityStore('Swimmer', sampleSwimmers),
  Registration: buildEntityStore('Registration', sampleRegistrations),
  SafetyAlert: buildEntityStore('SafetyAlert', sampleSafetyAlerts),
  Transaction: buildEntityStore('Transaction', sampleTransactions),
  Sponsor: buildEntityStore('Sponsor', sampleSponsors),
  SupportCrew: buildEntityStore('SupportCrew', sampleSupportCrew),
  LiveTrack: buildEntityStore('LiveTrack', sampleLiveTrack),
  LiveMetric: buildEntityStore('LiveMetric', sampleLiveMetrics),
  ChatRoom: buildEntityStore('ChatRoom', sampleChatRooms),
  ChatMessage: buildEntityStore('ChatMessage', sampleChatMessages),
  User: buildEntityStore('User', sampleUsers),
  SafetyScreening: buildEntityStore('SafetyScreening', []),
};

const persistedUserStoreKey = `${STORAGE_PREFIX}:users`;
const persistedSessionKey = `${STORAGE_PREFIX}:session`;
const persistedOtpKey = `${STORAGE_PREFIX}:otp`;
const persistedResetKey = `${STORAGE_PREFIX}:reset`;
const persistedConversationsKey = `${STORAGE_PREFIX}:conversations`;

const secureUser = (user) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name || user.email,
  role: user.role || 'user',
  status: user.status || 'active',
});

const createSessionToken = () => `local_${Math.random().toString(36).slice(2, 16)}`;

const ensureUsers = () => {
  const currentUsers = readStorage(persistedUserStoreKey, sampleUsers);
  if (!currentUsers.length) {
    writeStorage(persistedUserStoreKey, sampleUsers);
  }
  return readStorage(persistedUserStoreKey, sampleUsers);
};

const syncUserEntity = () => {
  const allUsers = ensureUsers();
  const entityUsers = readStorage(`${STORAGE_PREFIX}:User`, sampleUsers);
  if (JSON.stringify(allUsers) !== JSON.stringify(entityUsers)) {
    writeStorage(`${STORAGE_PREFIX}:User`, allUsers);
  }
};

const getSessionUser = () => readStorage(persistedSessionKey, null);
const setSessionUser = (user) => writeStorage(persistedSessionKey, user);

const getOtpMap = () => readStorage(persistedOtpKey, {});
const setOtpMap = (nextMap) => writeStorage(persistedOtpKey, nextMap);
const getResetMap = () => readStorage(persistedResetKey, {});
const setResetMap = (nextMap) => writeStorage(persistedResetKey, nextMap);

const auth = {
  async loginViaEmailPassword(email, password) {
    const users = ensureUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === String(email).trim().toLowerCase() && entry.password === String(password));
    if (!user) {
      throw new Error('Invalid email or password');
    }
    setSessionUser(secureUser(user));
    writeStorage(`${STORAGE_PREFIX}:token`, createSessionToken());
    return secureUser(user);
  },

  async loginWithProvider(provider, returnTo) {
    const fallbackUser = ensureUsers()[0];
    const user = { ...secureUser(fallbackUser), provider: provider || 'google' };
    setSessionUser(user);
    writeStorage(`${STORAGE_PREFIX}:token`, createSessionToken());
    if (typeof window !== 'undefined' && returnTo) {
      window.location.href = returnTo;
    }
    return user;
  },

  async register({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const users = ensureUsers();
    if (users.some((entry) => entry.email.toLowerCase() === String(email).trim().toLowerCase())) {
      throw new Error('User already exists');
    }
    const user = {
      id: createRecordId('user'),
      full_name: email.split('@')[0],
      email: String(email).trim(),
      password: String(password),
      role: 'user',
      status: 'active',
      created_date: new Date().toISOString(),
    };
    const nextUsers = [...users, user];
    writeStorage(persistedUserStoreKey, nextUsers);
    writeStorage(`${STORAGE_PREFIX}:User`, nextUsers);
    const token = createSessionToken();
    setSessionUser(secureUser(user));
    writeStorage(`${STORAGE_PREFIX}:token`, token);
    return { status: 'registered', access_token: token, user: secureUser(user) };
  },

  async verifyOtp({ email, otpCode }) {
    const recipients = getOtpMap();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const expected = recipients[normalizedEmail];
    if (!expected || String(otpCode) !== String(expected)) {
      throw new Error('Invalid verification code');
    }
    const users = ensureUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('User not found');
    }
    const token = createSessionToken();
    setSessionUser(secureUser(user));
    writeStorage(`${STORAGE_PREFIX}:token`, token);
    return { access_token: token };
  },

  async resendOtp(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const otpMap = getOtpMap();
    otpMap[normalizedEmail] = '123456';
    setOtpMap(otpMap);
    return { status: 'resent' };
  },

  async resetPasswordRequest(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }
    const user = ensureUsers().find((entry) => entry.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No local account exists for that email');
    }
    const resetToken = createSessionToken();
    const resetMap = getResetMap();
    resetMap[resetToken] = normalizedEmail;
    setResetMap(resetMap);
    return { status: 'ready', email: normalizedEmail, resetToken };
  },

  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken || !newPassword) {
      throw new Error('Reset token and password are required');
    }
    const resetMap = getResetMap();
    const normalizedEmail = resetMap[resetToken];
    if (!normalizedEmail) {
      throw new Error('This local reset link is invalid or expired');
    }
    const users = ensureUsers();
    const updatedUsers = users.map((entry) => entry.email.toLowerCase() === normalizedEmail
      ? { ...entry, password: String(newPassword), updated_at: new Date().toISOString() }
      : entry);
    writeStorage(persistedUserStoreKey, updatedUsers);
    writeStorage(`${STORAGE_PREFIX}:User`, updatedUsers);
    delete resetMap[resetToken];
    setResetMap(resetMap);
    return { status: 'updated' };
  },
  async me() {
    const user = getSessionUser();
    if (!user) {
      throw Object.assign(new Error('Authentication required'), { status: 401 });
    }
    return user;
  },

  async logout(redirectUrl) {
    setSessionUser(null);
    writeStorage(`${STORAGE_PREFIX}:token`, '');
    if (typeof window !== 'undefined') {
      const destination = redirectUrl || '/login';
      window.location.href = destination;
    }
    return true;
  },

  redirectToLogin(returnTo) {
    if (typeof window !== 'undefined') {
      const destination = returnTo || '/login';
      window.location.href = destination;
    }
  },

  setToken(token) {
    writeStorage(`${STORAGE_PREFIX}:token`, token || '');
  },

  isAuthenticated() {
    return Boolean(getSessionUser());
  },
};

const app = {
  async getPublicSettings() {
    return clone(appPublicSettings);
  },
};

const functions = {
  async invoke(name, payload = {}) {
    if (name === 'powerBiLiveSync') {
      const activeAlerts = entities.SafetyAlert.list ? await entities.SafetyAlert.list() : [];
      const eventCount = (await entities.Event.list()).length;
      const swimmerCount = (await entities.Swimmer.list()).length;
      return {
        ok: true,
        data: {
          message: 'Local runtime sync complete',
          activeAlerts: activeAlerts.filter((item) => item.status === 'active').length,
          events: eventCount,
          swimmers: swimmerCount,
          capturedAt: new Date().toISOString(),
          payload,
        },
      };
    }

    if (name === 'aiSafetyScreening') {
      const swimmers = await entities.Swimmer.list();
      const screeningCounts = swimmers.reduce((acc, swimmer) => {
        acc[swimmer.screening_risk_level || 'low'] = (acc[swimmer.screening_risk_level || 'low'] || 0) + 1;
        return acc;
      }, {});
      return {
        ok: true,
        result: {
          recommendation: 'Proceed with on-site safety briefing',
          summary: `Screening review passed for ${swimmers.length} athletes.`,
          riskBreakdown: screeningCounts,
          payload,
        },
      };
    }

    return {
      ok: true,
      result: { name, payload },
    };
  },
};

const integrations = {
  Core: {
    async UploadPublicFile({ file }) {
      if (!file) {
        throw new Error('File required');
      }
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        return { file_url: URL.createObjectURL(file), file_name: file.name || 'upload' };
      }
      return { file_url: '/images/local-upload', file_name: file.name || 'upload' };
    },
  },
};

const agents = {
  async listConversations({ agent_name } = /** @type {any} */ ({})) {
    const conversations = /** @type {any[]} */ (readStorage(persistedConversationsKey, [
      {
        id: 'support_agent_demo',
        agent_name: agent_name || 'event_support_assistant',
        metadata: { name: 'Demo operations thread', description: 'Asset operations' },
        messages: [
          { role: 'assistant', content: 'I can advise on safety, registrations and event operations for the local runtime.' },
        ],
      },
    ]));
    return conversations;
  },

  async getConversation(id) {
    const conversations = /** @type {any[]} */ (readStorage(persistedConversationsKey, []));
    const conversation = /** @type {any} */ (conversations.find((entry) => entry.id === id)) || {
      id,
      agent_name: 'event_support_assistant',
      metadata: { name: 'Operations thread', description: 'Local runtime support' },
      messages: [],
    };
    return conversation;
  },

  async createConversation({ agent_name, metadata } = /** @type {any} */ ({})) {
    const conversations = /** @type {any[]} */ (readStorage(persistedConversationsKey, []));
    const conversation = {
      id: createRecordId('conversation'),
      agent_name: agent_name || 'event_support_assistant',
      metadata: metadata || { name: 'Support chat', description: 'Local runtime support assistant' },
      messages: [],
    };
    conversations.unshift(conversation);
    writeStorage(persistedConversationsKey, conversations);
    return conversation;
  },

  async addMessage(conversation, message) {
    const conversations = readStorage(persistedConversationsKey, []);
    const target = conversations.find((entry) => entry.id === conversation.id) || conversation;
    target.messages = target.messages || [];
    target.messages.push({
      id: createRecordId('message'),
      role: message.role || 'user',
      content: message.content || '',
      created_at: new Date().toISOString(),
    });
    if (message.role === 'user') {
      target.messages.push({
        id: createRecordId('message'),
        role: 'assistant',
        content: `Local runtime response: I reviewed the latest event data and recommend confirming ${message.content.length > 60 ? 'the critical operational details' : 'the next safety controls'} before proceeding.`,
        created_at: new Date().toISOString(),
      });
    }
    const next = conversations.filter((entry) => entry.id !== target.id);
    next.unshift(target);
    writeStorage(persistedConversationsKey, next);
    return target;
  },

  subscribeToConversation(id, callback) {
    const conversations = readStorage(persistedConversationsKey, []);
    const target = conversations.find((entry) => entry.id === id);
    if (target && typeof callback === 'function') {
      callback({ messages: target.messages || [] });
    }
    return () => undefined;
  },

  getWhatsAppConnectURL(agentName) {
    const encoded = encodeURIComponent(`Hi ${agentName}. I need support for the local runtime.`);
    return `https://wa.me/1234567890?text=${encoded}`;
  },
};

syncUserEntity();

export const appRuntime = {
  app,
  auth,
  entities,
  functions,
  agents,
  integrations,
};

export default appRuntime;
