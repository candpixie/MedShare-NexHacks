import { Medication, UserProfile } from '../types';

// Mock medication data
export const mockMedications: Medication[] = [
  {
    id: '1',
    ndcCode: '00409-4676-01',
    drugName: 'Propofol 200mg/20mL',
    formType: 'vial',
    totalQuantity: 70,
    parLevel: 20,
    avgDailyUsage: 2.5,
    lots: [
      { lotNumber: 'LOT2024A001', quantity: 45, expDate: '2026-02-07', unitCost: 60 },
      { lotNumber: 'LOT2024B002', quantity: 25, expDate: '2026-03-15', unitCost: 62 },
    ],
    alerts: {
      expiringSoon: true,
      fifoRisk: false,
      belowPar: false,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    ndcCode: '00409-1105-01',
    drugName: 'Atropine 0.4mg/mL',
    formType: 'vial',
    totalQuantity: 30,
    parLevel: 10,
    avgDailyUsage: 1.2,
    lots: [{ lotNumber: 'LOT2024A002', quantity: 30, expDate: '2026-01-31', unitCost: 20 }],
    alerts: {
      expiringSoon: true,
      fifoRisk: true,
      belowPar: false,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    ndcCode: '00409-6629-01',
    drugName: 'Succinylcholine 20mg/mL',
    formType: 'vial',
    totalQuantity: 40,
    parLevel: 15,
    avgDailyUsage: 1.8,
    lots: [{ lotNumber: 'LOT2024C001', quantity: 40, expDate: '2026-02-21', unitCost: 30 }],
    alerts: {
      expiringSoon: true,
      fifoRisk: false,
      belowPar: false,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    ndcCode: '00409-1234-01',
    drugName: 'Fentanyl 100mcg/2mL',
    formType: 'vial',
    totalQuantity: 85,
    parLevel: 30,
    avgDailyUsage: 3.2,
    lots: [
      { lotNumber: 'LOT2024D001', quantity: 50, expDate: '2026-04-15', unitCost: 45 },
      { lotNumber: 'LOT2024D002', quantity: 35, expDate: '2026-05-20', unitCost: 47 },
    ],
    alerts: {
      expiringSoon: false,
      fifoRisk: false,
      belowPar: false,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '5',
    ndcCode: '00409-5678-01',
    drugName: 'Midazolam 5mg/mL',
    formType: 'vial',
    totalQuantity: 15,
    parLevel: 25,
    avgDailyUsage: 2.1,
    lots: [{ lotNumber: 'LOT2024E001', quantity: 15, expDate: '2026-03-10', unitCost: 35 }],
    alerts: {
      expiringSoon: false,
      fifoRisk: false,
      belowPar: true,
    },
    lastUpdated: new Date().toISOString(),
  },
];

// Mock user profile
export const mockUserProfile: UserProfile = {
  id: 'user-001',
  name: 'Dr. Sarah Johnson',
  email: 'sjohnson@metrogeneral.org',
  role: 'Pharmacy Director',
  hospitalId: 'MGH-2024-001',
  hospitalName: 'Metro General Hospital',
  department: 'Pharmacy Services',
  createdAt: '2024-01-15T08:00:00Z',
};
