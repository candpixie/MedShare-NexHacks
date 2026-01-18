const { supabase } = require('../config/supabase');

class InventoryService {
  // Get all inventory items
  async findAll() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get inventory by ID
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('inventory')
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

  // Search inventory
  async search(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }

  // Create inventory item
  async create(inventoryData) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          ...inventoryData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Update inventory item
  async update(id, inventoryData) {
    try {
      const { data, error } = await supabase
        .from('inventory')
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

  // Delete inventory item
  async delete(id) {
    try {
      const { error, status } = await supabase
        .from('inventory')
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

  // Get inventory statistics
  async getStatistics() {
    try {
      const items = await this.findAll();
      return {
        totalItems: items.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}

module.exports = new InventoryService();
