const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// Mock inventory data for when database is not configured
const getMockInventoryData = () => [
    {
        id: 1,
        medicine_id_ndc: '00409-4676-01',
        generic_medicine_name: 'Propofol',
        brand_name: 'Diprivan',
        form_of_distribution: 'vial',
        currentOnHandUnits: 70,
        minimumStockLevel: 20,
        averageDailyUse: 2.5,
        lot_number: 'LOT2024A001',
        expiration_date: '2026-02-07',
        unitCost: 60,
        days_until_expiry: 20,
        is_anomaly: false,
        currently_backordered: false,
        date: new Date().toISOString()
    },
    {
        id: 2,
        medicine_id_ndc: '00409-1105-01',
        generic_medicine_name: 'Atropine',
        brand_name: 'AtroPen',
        form_of_distribution: 'vial',
        currentOnHandUnits: 30,
        minimumStockLevel: 10,
        averageDailyUse: 1.2,
        lot_number: 'LOT2024A002',
        expiration_date: '2026-01-31',
        unitCost: 20,
        days_until_expiry: 13,
        is_anomaly: true,
        currently_backordered: false,
        date: new Date().toISOString()
    },
    {
        id: 3,
        medicine_id_ndc: '00409-6629-01',
        generic_medicine_name: 'Succinylcholine',
        brand_name: 'Anectine',
        form_of_distribution: 'vial',
        currentOnHandUnits: 40,
        minimumStockLevel: 15,
        averageDailyUse: 1.8,
        lot_number: 'LOT2024C001',
        expiration_date: '2026-02-21',
        unitCost: 30,
        days_until_expiry: 34,
        is_anomaly: false,
        currently_backordered: false,
        date: new Date().toISOString()
    }
];

const getMockStats = () => ({
    totalItems: 3,
    lowStockCount: 0,
    backordered: 0,
    anomalies: 1
});

const getMockUsageTrends = () => [
    { week: 'W1', usage: 18 },
    { week: 'W2', usage: 22 },
    { week: 'W3', usage: 19 },
    { week: 'W4', usage: 25 },
    { week: 'W5', usage: 20 },
    { week: 'W6', usage: 18 },
    { week: 'W7', usage: 15 },
    { week: 'W8', usage: 22 },
];

const getMockUsageByDepartment = () => [
    { department: 'OR Suite', value: 67 },
    { department: 'ICU', value: 22 },
    { department: 'ER', value: 11 },
];

const getMockForecast = () => {
    const mockData = getMockInventoryData();
    if (mockData.length === 0) return null;
    
    const primaryMed = mockData[0];
    const predicted30DayUsage = Math.round(primaryMed.averageDailyUse * 30);
    const excessAtRisk = Math.max(primaryMed.currentOnHandUnits - predicted30DayUsage, 0);
    
    return {
        drugName: primaryMed.generic_medicine_name,
        ndcCode: primaryMed.medicine_id_ndc,
        currentStock: primaryMed.currentOnHandUnits,
        predicted30DayUsage,
        averageDailyUse: primaryMed.averageDailyUse,
        confidence: 0.85,
        excessAtRisk,
        recommendation: excessAtRisk > 0 
            ? `Reduce order by ${Math.round((excessAtRisk / primaryMed.currentOnHandUnits) * 100)}% to minimize waste`
            : `Maintain current stock levels`
    };
};

/**
 * GET /inventory
 * Get all inventory items with optional filtering and pagination
 * Query params:
 *  - search: Search term (searches generic_medicine_name, brand_name, medicine_id_ndc)
 *  - medicinId: Filter by NDC code
 *  - backordered: Filter by backorder status (true/false)
 *  - anomaly: Filter by anomaly status (true/false)
 *  - limit: Limit results (default: no limit)
 *  - offset: Offset for pagination (default: 0)
 *  - orderBy: Field to sort by (default: date)
 *  - ascending: Sort direction (default: false)
 */
router.get('/', async (req, res) => {
    try {
        const { 
            search, 
            medicineId,
            backordered,
            anomaly,
            limit, 
            offset = 0,
            orderBy = 'date',
            ascending = 'false'
        } = req.query;

        // Build filters
        const filters = {};
        if (medicineId) filters.medicine_id_ndc = medicineId;
        if (backordered) filters.currently_backordered = backordered === 'true';
        if (anomaly) filters.is_anomaly = anomaly === 'true';

        // Handle search
        if (search) {
            const items = await inventoryService.search(search);
            return res.json({
                success: true,
                count: items.length,
                data: items
            });
        }

        // Get all items with filters
        const result = await inventoryService.findAll(filters, {
            limit: limit ? parseInt(limit) : null,
            offset: parseInt(offset),
            orderBy,
            ascending: ascending === 'true'
        });

        res.json({
            success: true,
            count: result.data.length,
            total: result.count,
            hasMore: result.hasMore,
            data: result.data
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        const mockData = getMockInventoryData();
        res.json({
            success: true,
            count: mockData.length,
            total: mockData.length,
            hasMore: false,
            data: mockData
        });
    }
});

/**
 * GET /inventory/low-stock
 * Get items below stock threshold or backordered
 * Query params:
 *  - threshold: Quantity threshold (default: uses backorder status)
 */
router.get('/low-stock', async (req, res) => {
    try {
        const { threshold } = req.query;
        const items = await inventoryService.getLowStockItems(
            threshold ? parseInt(threshold) : null
        );

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            count: 0,
            data: []
        });
    }
});

/**
 * GET /inventory/anomalies
 * Get items with anomalies
 * Query params:
 *  - type: Anomaly type to filter (optional)
 */
router.get('/anomalies', async (req, res) => {
    try {
        const { type } = req.query;
        const items = await inventoryService.getAnomalies(type || null);

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /inventory/restock-recommendations
 * Get smart restock recommendations with urgency levels
 */
router.get('/restock-recommendations', async (req, res) => {
    try {
        const recommendations = await inventoryService.getRestockRecommendations();

        res.json({
            success: true,
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            count: 0,
            data: []
        });
    }
});

/**
 * GET /inventory/stats
 * Get comprehensive inventory statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await inventoryService.getStatistics();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            data: getMockStats()
        });
    }
});

/**
 * GET /inventory/usage-trends
 * Get weekly usage trends for medications
 */
router.get('/usage-trends', async (req, res) => {
    try {
        // In a real app, this would query usage history from database
        // For now, return mock data
        console.log('ℹ️  Returning mock usage trends data');
        res.json({
            success: true,
            data: getMockUsageTrends()
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            data: getMockUsageTrends()
        });
    }
});

/**
 * GET /inventory/usage-by-department
 * Get medication usage breakdown by department
 */
router.get('/usage-by-department', async (req, res) => {
    try {
        // In a real app, this would query department usage from database
        console.log('ℹ️  Returning mock department usage data');
        res.json({
            success: true,
            data: getMockUsageByDepartment()
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            data: getMockUsageByDepartment()
        });
    }
});

/**
 * GET /inventory/forecast
 * Get 30-day demand forecast for primary medication
 */
router.get('/forecast', async (req, res) => {
    try {
        // In a real app, this would use ML/AI to predict demand
        console.log('ℹ️  Returning mock forecast data');
        res.json({
            success: true,
            data: getMockForecast()
        });
    } catch (error) {
        console.log('ℹ️  Database not available, using mock data');
        res.json({
            success: true,
            data: getMockForecast()
        });
    }
});

/**
 * GET /inventory/medicine/:medicineId
 * Get all inventory records for a specific medicine (NDC code)
 */
router.get('/medicine/:medicineId', async (req, res) => {
    try {
        const { medicineId } = req.params;
        const items = await inventoryService.findByMedicineId(medicineId);

        if (!items || items.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No records found for this medicine' 
            });
        }

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Error fetching medicine inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /inventory/date-range
 * Get inventory items within a date range
 * Query params:
 *  - startDate: Start date (YYYY-MM-DD)
 *  - endDate: End date (YYYY-MM-DD)
 */
router.get('/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }

        const items = await inventoryService.findByDateRange(startDate, endDate);

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Error fetching by date range:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /inventory/:id
 * Get single inventory item by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await inventoryService.findById(id);

        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /inventory
 * Create new inventory item(s)
 * Body: Single object or array of objects
 */
router.post('/', async (req, res) => {
    try {
        const itemData = req.body;

        if (!itemData || (Array.isArray(itemData) && itemData.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body'
            });
        }

        const result = await inventoryService.create(itemData);

        res.status(201).json({
            success: true,
            count: Array.isArray(itemData) ? itemData.length : 1,
            data: result
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /inventory/bulk-create
 * Bulk create inventory items from CSV
 */
router.post('/bulk-create', async (req, res) => {
    try {
        const items = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body must be a non-empty array'
            });
        }

        const result = await inventoryService.create(items);

        res.status(201).json({
            success: true,
            created: Array.isArray(result) ? result.length : 1,
            data: result
        });
    } catch (error) {
        console.error('Error bulk creating inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /inventory/:id
 * Update inventory item
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No update data provided'
            });
        }

        const updatedItem = await inventoryService.update(id, updateData);

        if (!updatedItem) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /inventory/:id/stock
 * Update stock quantity with reason tracking
 * Body: { currentOnHandUnits: number, updateReason?: string }
 */
router.put('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentOnHandUnits, updateReason } = req.body;

        if (currentOnHandUnits === undefined || currentOnHandUnits === null) {
            return res.status(400).json({
                success: false,
                error: 'currentOnHandUnits is required'
            });
        }

        const updatedItem = await inventoryService.updateStock(
            id,
            currentOnHandUnits,
            updateReason || 'Manual update'
        );

        if (!updatedItem) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /inventory/bulk-stock-update
 * Bulk update stock for multiple items
 * Body: [{ id: string, currentOnHandUnits: number, updateReason?: string }]
 */
router.post('/bulk-stock-update', async (req, res) => {
    try {
        const updates = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body must be a non-empty array'
            });
        }

        const result = await inventoryService.bulkUpdateStock(updates);

        res.json({
            success: result.success,
            updated: result.updated,
            data: result.items
        });
    } catch (error) {
        console.error('Error bulk updating stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /inventory/:id
 * Delete inventory item
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await inventoryService.delete(id);

        if (!success) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /inventory/bulk-delete
 * Bulk delete inventory items
 * Body: { ids: string[] }
 */
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'ids must be a non-empty array'
            });
        }

        const result = await inventoryService.bulkDelete(ids);

        res.json({
            success: result.success,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error bulk deleting inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
