const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// GET all inventory items
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let items;

        if (search) {
            items = await inventoryService.search(search);
        } else {
            items = await inventoryService.findAll();
        }

        res.json({ 
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
    }
});

// GET single inventory item by ID
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
        res.status(500).json({ success: false, error: 'Failed to fetch inventory item' });
    }
});

// POST create new inventory item
router.post('/', async (req, res) => {
    try {
        const itemData = req.body;
        const newItem = await inventoryService.create(itemData);
        
        res.status(201).json({ 
            success: true,
            data: newItem
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ success: false, error: 'Failed to create inventory item' });
    }
});

// PUT update inventory item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
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
        res.status(500).json({ success: false, error: 'Failed to update inventory item' });
    }
});
// DELETE inventory item
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
        res.status(500).json({ success: false, error: 'Failed to delete inventory item' });
    }
});

// GET inventory statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await inventoryService.getStatistics();
        res.json({ 
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
