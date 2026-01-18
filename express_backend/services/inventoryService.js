const { supabase } = require('../config/supabase');
const { uploadCSVDynamic, detectTableSchema } = require('./dynamicCsvToDB');

class InventoryService {
  constructor() {
    this.tableName = 'inventory';
    this.schemaCache = null;
  }

  /**
   * Initialize schema cache for adaptive field handling
   */
  async initializeSchema() {
    try {
      if (!this.schemaCache) {
        const schema = await detectTableSchema(this.tableName);
        this.schemaCache = schema;
      }
      return this.schemaCache;
    } catch (error) {
      console.error('Error initializing schema:', error);
      throw error;
    }
  }

  /**
   * Get all inventory items with optional filters
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (limit, offset, orderBy)
   */
  async findAll(filters = {}, options = {}) {
    try {
      const { limit = null, offset = 0, orderBy = 'date', ascending = false } = options;

      let query = supabase.from(this.tableName).select('*');

      // Apply filters dynamically
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        data: data || [],
        count: count || 0,
        hasMore: limit ? count > offset + limit : false
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  /**
   * Get single inventory item by ID
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  /**
   * Find inventory by medicine ID (NDC code)
   */
  async findByMedicineId(medicineId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('medicine_id_ndc', medicineId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching by medicine ID:', error);
      throw error;
    }
  }

  /**
   * Search inventory by multiple fields
   * @param {string} searchTerm - Term to search
   * @param {Array} searchFields - Fields to search in
   */
  async search(searchTerm, searchFields = ['generic_medicine_name', 'brand_name', 'medicine_id_ndc']) {
    try {
      if (!searchTerm) {
        return [];
      }

      const orConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',');

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(orConditions);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }

  /**
   * Create new inventory record(s)
   * @param {Object|Array} inventoryData - Single item or array of items
   */
  async create(inventoryData) {
    try {
      // Handle both single item and bulk creation
      const items = Array.isArray(inventoryData) ? inventoryData : [inventoryData];

      const enrichedItems = items.map(item => ({
        ...item,
        time_of_entry: item.time_of_entry || new Date().toISOString(),
        date: item.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(enrichedItems)
        .select();

      if (error) throw error;
      return Array.isArray(inventoryData) ? data : data[0];
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory record
   * @param {string} id - Record ID
   * @param {Object} inventoryData - Fields to update
   */
  async update(id, inventoryData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...inventoryData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(id, currentOnHandUnits, updateReason = 'Manual update') {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          current_on_hand_units: currentOnHandUnits,
          stock_update_reason: updateReason,
          time_of_entry: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Bulk update stock for multiple items
   */
  async bulkUpdateStock(updates) {
    try {
      const promises = updates.map(({ id, currentOnHandUnits, updateReason }) =>
        this.updateStock(id, currentOnHandUnits, updateReason)
      );

      const results = await Promise.all(promises);
      return {
        success: true,
        updated: results.length,
        items: results
      };
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw error;
    }
  }

  /**
   * Delete inventory record
   */
  async delete(id) {
    try {
      const { error, status } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting inventory item:', error);
        return false;
      }
      return status === 204;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  /**
   * Bulk delete inventory records
   */
  async bulkDelete(ids) {
    try {
      const { error, status } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', ids);

      if (error) throw error;
      return {
        success: status === 204,
        deletedCount: ids.length
      };
    } catch (error) {
      console.error('Error bulk deleting inventory:', error);
      throw error;
    }
  }

  /**
   * Get low stock items (below restock level)
   */
  async getLowStockItems(threshold = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      if (threshold) {
        query = query.lt('current_on_hand_units', threshold);
      } else {
        // Get items that are backordered
        query = query.eq('currently_backordered', true);
      }

      const { data, error } = await query.order('current_on_hand_units', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  /**
   * Get items with anomalies
   */
  async getAnomalies(anomalyType = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('is_anomaly', true);

      if (anomalyType) {
        query = query.eq('anomaly_type', anomalyType);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*');

      if (error) throw error;

      const items = data || [];
      const backordered = items.filter(i => i.currently_backordered).length;
      const withAnomalies = items.filter(i => i.is_anomaly).length;
      const highVariability = items.filter(i => i.high_usage_variability).length;

      return {
        totalItems: items.length,
        totalCurrentOnHand: items.reduce((sum, i) => sum + (i.current_on_hand_units || 0), 0),
        totalValue: items.reduce((sum, i) => sum + ((i.current_on_hand_units || 0) * (i.price_per_unit_usd || 0)), 0),
        backordered,
        withAnomalies,
        highVariability,
        avgDailyUsage: (items.reduce((sum, i) => sum + (i.daily_usage_avg_units || 0), 0) / items.length).toFixed(2),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Import CSV to inventory table
   */
  async importFromCSV(filePath, options = {}) {
    try {
      console.log(`📥 Importing inventory from CSV: ${filePath}`);
      
      const result = await uploadCSVDynamic(filePath, this.tableName, {
        autoDetectSchema: true,
        batchSize: 100,
        ...options
      });

      return result;
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw error;
    }
  }

  /**
   * Get inventory by date range
   */
  async findByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching by date range:', error);
      throw error;
    }
  }

  /**
   * Get restock recommendations
   */
  async getRestockRecommendations() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('currently_backordered', true)
        .or('high_usage_variability.eq.true,is_anomaly.eq.true')
        .order('daily_usage_avg_units', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        recommendedAction: this.getRestockAction(item),
        urgency: this.getRestockUrgency(item)
      }));
    } catch (error) {
      console.error('Error getting restock recommendations:', error);
      throw error;
    }
  }

  /**
   * Helper: Determine restock action
   */
  getRestockAction(item) {
    if (item.currently_backordered) return 'URGENT_REORDER';
    if (item.high_usage_variability && item.daily_usage_avg_units > 10) return 'INCREASE_BUFFER';
    if (item.is_anomaly) return 'INVESTIGATE';
    if (item.current_on_hand_units < item.quantity_last_restock_units * 0.25) return 'REORDER';
    return 'MONITOR';
  }

  /**
   * Helper: Determine restock urgency (1-5, 5 being most urgent)
   */
  getRestockUrgency(item) {
    if (item.currently_backordered) return 5;
    if (item.current_on_hand_units === 0) return 5;
    if (item.high_usage_variability && item.is_anomaly) return 4;
    if (item.high_usage_variability || item.is_anomaly) return 3;
    if (item.current_on_hand_units < item.quantity_last_restock_units * 0.5) return 2;
    return 1;
  }
}

module.exports = new InventoryService();
