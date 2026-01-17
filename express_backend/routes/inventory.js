const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const inventory = await db.collection('inventory').find({}).toArray();
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Get single inventory item by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const item = await db.collection('inventory').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Create new inventory item
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const newItem = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('inventory').insertOne(newItem);
        const insertedItem = await db.collection('inventory').findOne({ 
            _id: result.insertedId 
        });
        
        res.status(201).json(insertedItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Update inventory item
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { _id, createdAt, ...updateData } = req.body;
        
        const result = await db.collection('inventory').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    ...updateData,
                    updatedAt: new Date() 
                } 
            },
            { returnDocument: 'after' }
        );
        
        if (!result.value) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(result.value);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('inventory').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Search inventory by query
router.get('/search/:query', async (req, res) => {
    try {
        const db = getDB();
        const searchQuery = req.params.query;
        
        const items = await db.collection('inventory').find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } }
            ]
        }).toArray();
        
        res.json(items);
    } catch (error) {
        console.error('Error searching inventory:', error);
        res.status(500).json({ error: 'Failed to search inventory' });
    }
});

module.exports = router;
