export type MedicationLot = {
  lotNumber: string;
  quantity: number;
  expDate: string;
  unitCost: number;
};

export type Medication = {
  id: string;
  ndcCode: string;
  drugName: string;
  formType: string;
  totalQuantity: number;
  parLevel: number;
  avgDailyUsage: number;
  lots: MedicationLot[];
  alerts: {
    expiringSoon: boolean;
    fifoRisk: boolean;
    belowPar: boolean;
  };
  lastUpdated: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  createdAt: string;
};

export type ReportType = 'inventory' | 'expiration' | 'fifo' | 'forecast' | 'insights';

export type Report = {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  createdAt: string;
  generatedBy: string;
};
