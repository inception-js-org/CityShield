export type Role = "ADMIN" | "OFFICER";
export type OfficerStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type PatrolStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "PAUSED";
export type BodycamStatus = "RECORDING" | "OFFLINE" | "PAUSED" | "ERROR";
export type SignalStrength = "STRONG" | "MEDIUM" | "WEAK" | "NONE";
export type ComplaintStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
export type ComplaintPriority = "HIGH" | "MEDIUM" | "LOW";
export type FIRStatus = "DRAFT" | "FILED" | "UNDER_INVESTIGATION" | "CLOSED" | "TRANSFERRED";
export type AlertType = "EMERGENCY" | "HOTSPOT" | "SYSTEM" | "FIR" | "PATROL" | "COMPLAINT";
export type ZoneType = "TRANSPORT" | "COMMERCIAL" | "MIXED" | "RESIDENTIAL" | "SLUM" | "INDUSTRIAL";

export interface PoliceOfficer {
  id: string;
  clerkUserId?: string;
  email: string;
  name?: string;
  rank?: string;
  badge?: string;
  phone?: string;
  role: Role;
  status: OfficerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  zoneId: string;
  name: string;
  coords: [number, number][];
  type: ZoneType;
  popDensity: number;
  crowdBase: number;
  lighting: number;
  cctvDensity: number;
  policeScore: number;
  patrolFreq: number;
  riskBase: number;
  crimeRates: Record<string, number>;
  riskScore?: number;
  lastUpdated: string;
  createdAt: string;
}

export interface Patrol {
  id: string;
  patrolNumber: string;
  status: PatrolStatus;
  bodycamStatus: BodycamStatus;
  signalStrength: SignalStrength;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  startTime: string;
  endTime?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  routeData?: any;
  checkpoints?: any[];
  completedCheckpoints: number;
  totalCheckpoints: number;
  zoneId?: string;
  zone?: Zone;
  leadOfficerId?: string;
  leadOfficer?: PoliceOfficer;
  officers: PoliceOfficer[];
  distanceCovered?: number;
  incidentsReported: number;
  createdAt: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  type: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  isAnonymous: boolean;
  handlerId?: string;
  handler?: PoliceOfficer;
  zoneId?: string;
  zone?: Zone;
  resolution?: string;
  resolvedAt?: string;
  linkedFirId?: string;
  linkedFir?: FIR;
  createdAt: string;
}

export interface FIR {
  id: string;
  firNumber: string;
  status: FIRStatus;
  incidentType: string;
  incidentDate: string;
  incidentTime?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  evidence?: any[];
  witnesses?: any[];
  complainantName: string;
  complainantPhone?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  accusedName?: string;
  accusedDescription?: string;
  registeredById: string;
  registeredBy: PoliceOfficer;
  assignedToId?: string;
  assignedTo?: PoliceOfficer;
  zoneId?: string;
  zone?: Zone;
  patrolId?: string;
  patrol?: Patrol;
  complaints?: Complaint[];
  investigationNotes?: string;
  closureReason?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  priority: ComplaintPriority;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  zoneId?: string;
  zone?: Zone;
  patrolId?: string;
  patrol?: Patrol;
  createdById?: string;
  createdBy?: PoliceOfficer;
  metadata?: any;
  createdAt: string;
}