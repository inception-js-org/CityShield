const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  
  return res.json();
}

// Zones
export const zonesAPI = {
  getAll: () => fetchAPI("/api/zones"),
  getById: (id: string) => fetchAPI(`/api/zones/${id}`),
  seed: () => fetchAPI("/api/zones/seed", { method: "POST" }),
  updateRiskScore: (id: string, score: number) => 
    fetchAPI(`/api/zones/${id}/risk-score?risk_score=${score}`, { method: "PATCH" }),
};

// Patrols
export const patrolsAPI = {
  getAll: (status?: string) => fetchAPI(`/api/patrols${status ? `?status=${status}` : ""}`),
  getActive: () => fetchAPI("/api/patrols/active"),
  getById: (id: string) => fetchAPI(`/api/patrols/${id}`),
  create: (data: any) => fetchAPI("/api/patrols", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/api/patrols/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  updateLocation: (id: string, lat: number, lng: number) => 
    fetchAPI(`/api/patrols/${id}/location`, { method: "POST", body: JSON.stringify({ latitude: lat, longitude: lng }) }),
  start: (id: string) => fetchAPI(`/api/patrols/${id}/start`, { method: "POST" }),
  end: (id: string) => fetchAPI(`/api/patrols/${id}/end`, { method: "POST" }),
  completeCheckpoint: (id: string) => fetchAPI(`/api/patrols/${id}/checkpoint`, { method: "POST" }),
};

// Complaints
export const complaintsAPI = {
  getAll: (filters?: { status?: string; priority?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.type) params.append("type", filters.type);
    return fetchAPI(`/api/complaints?${params.toString()}`);
  },
  getStats: () => fetchAPI("/api/complaints/stats"),
  getById: (id: string) => fetchAPI(`/api/complaints/${id}`),
  create: (data: any) => fetchAPI("/api/complaints", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/api/complaints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resolve: (id: string, resolution: string) => 
    fetchAPI(`/api/complaints/${id}/resolve?resolution=${encodeURIComponent(resolution)}`, { method: "POST" }),
  escalate: (id: string, officerId: string) => 
    fetchAPI(`/api/complaints/${id}/escalate?officer_id=${officerId}`, { method: "POST" }),
};

// FIRs
export const firsAPI = {
  getAll: (filters?: { status?: string; incidentType?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.incidentType) params.append("incidentType", filters.incidentType);
    return fetchAPI(`/api/firs?${params.toString()}`);
  },
  getStats: () => fetchAPI("/api/firs/stats"),
  getRecent: (limit?: number) => fetchAPI(`/api/firs/recent${limit ? `?limit=${limit}` : ""}`),
  getById: (id: string) => fetchAPI(`/api/firs/${id}`),
  create: (data: any) => fetchAPI("/api/firs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/api/firs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  assign: (id: string, officerId: string) => 
    fetchAPI(`/api/firs/${id}/assign?officer_id=${officerId}`, { method: "POST" }),
};

// Alerts
export const alertsAPI = {
  getAll: (filters?: { acknowledged?: boolean; type?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.acknowledged !== undefined) params.append("acknowledged", String(filters.acknowledged));
    if (filters?.type) params.append("type", filters.type);
    if (filters?.limit) params.append("limit", String(filters.limit));
    return fetchAPI(`/api/alerts?${params.toString()}`);
  },
  getUnacknowledged: () => fetchAPI("/api/alerts/unacknowledged"),
  getCounts: () => fetchAPI("/api/alerts/count"),
  create: (data: any) => fetchAPI("/api/alerts", { method: "POST", body: JSON.stringify(data) }),
  acknowledge: (id: string, officerId?: string) => 
    fetchAPI(`/api/alerts/${id}/acknowledge${officerId ? `?officer_id=${officerId}` : ""}`, { method: "POST" }),
  acknowledgeAll: () => fetchAPI("/api/alerts/acknowledge-all", { method: "POST" }),
  createEmergency: (message: string, patrolId?: string, zoneId?: string) => {
    const params = new URLSearchParams({ message });
    if (patrolId) params.append("patrol_id", patrolId);
    if (zoneId) params.append("zone_id", zoneId);
    return fetchAPI(`/api/alerts/emergency?${params.toString()}`, { method: "POST" });
  },
};

// Officers
export const officersAPI = {
  getAll: () => fetchAPI("/api/officers"),
  getById: (id: string) => fetchAPI(`/api/officers/${id}`),
  getAvailable: () => fetchAPI("/api/officers/available"),
  invite: (data: { 
    email: string; 
    name: string; 
    rank?: string; 
    badge?: string; 
    phone?: string 
  }) => fetchAPI("/api/officers/invite", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => 
    fetchAPI(`/api/officers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/api/officers/${id}`, { method: "DELETE" }),
};

// Hotspots & Crime Data
export const hotspotsAPI = {
  getData: () => fetchAPI("/api/hotspots/data"),
  getAllCoordinates: () => fetchAPI("/api/hotspots/all-coordinates"),
  getCrimes: () => fetchAPI("/api/hotspots/crimes"),
  getCrimesSummary: () => fetchAPI("/api/hotspots/crimes/summary"),
  getStats: () => fetchAPI("/api/hotspots/stats"),
};

// AI Predictions & Patrol Generation
export const predictionsAPI = {
  // Get crime predictions and patrol recommendations for a specific date
  getDayPredictions: (date: string, numPatrols?: number) => 
    fetchAPI(`/api/predictions/day/${date}${numPatrols ? `?num_patrols=${numPatrols}` : ""}`),
  
  // Generate AI-based patrols and save to database
  generatePatrols: (date: string, numPatrols: number = 10, autoAssign: boolean = false) =>
    fetchAPI(`/api/predictions/generate-patrols?date_str=${date}&num_patrols=${numPatrols}&auto_assign_officers=${autoAssign}`, {
      method: "POST"
    }),
  
  // Get 24-hour timeline for a specific zone
  getZoneTimeline: (zoneId: string, date?: string) =>
    fetchAPI(`/api/predictions/zone/${zoneId}/timeline${date ? `?date_str=${date}` : ""}`),
  
  // Compare model predictions
  compareModels: (zoneId: string, date: string, hour: number = 12) =>
    fetchAPI(`/api/predictions/compare-models?zone_id=${zoneId}&date_str=${date}&hour=${hour}`),
  
  // Get prediction engine stats
  getStats: () => fetchAPI("/api/predictions/stats"),
};