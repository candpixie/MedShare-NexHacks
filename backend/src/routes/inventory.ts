import { Router, Request, Response } from 'express';
import { mockMedications } from '../data/mockData';

const router = Router();

// Get all medications
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, alert } = req.query;
    let filtered = [...mockMedications];

    // Filter by search term
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.drugName.toLowerCase().includes(searchLower) ||
          med.ndcCode.includes(searchLower)
      );
    }

    // Filter by alert type
    if (alert && typeof alert === 'string') {
      filtered = filtered.filter((med) => {
        if (alert === 'expiring') return med.alerts.expiringSoon;
        if (alert === 'fifo') return med.alerts.fifoRisk;
        if (alert === 'belowPar') return med.alerts.belowPar;
        return true;
      });
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

// Get single medication by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const medication = mockMedications.find((m) => m.id === req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, error: 'Medication not found' });
    }
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch medication' });
  }
});

// Get inventory statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const stats = {
      totalItems: mockMedications.length,
      totalQuantity: mockMedications.reduce((sum, med) => sum + med.totalQuantity, 0),
      expiringSoon: mockMedications.filter((med) => med.alerts.expiringSoon).length,
      fifoAlerts: mockMedications.filter((med) => med.alerts.fifoRisk).length,
      belowPar: mockMedications.filter((med) => med.alerts.belowPar).length,
      totalValue: mockMedications.reduce((sum, med) => {
        const medValue = med.lots.reduce((lotSum, lot) => lotSum + lot.quantity * lot.unitCost, 0);
        return sum + medValue;
      }, 0),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;
