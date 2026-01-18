import { motion } from 'motion/react';
import { Search, Filter, Download, AlertTriangle, Package, Loader, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type InventoryItem = {
  id: string;
  medicine_id_ndc: string;
  generic_medicine_name: string;
  brand_name?: string;
  currentOnHandUnits: number;
  minimumStockLevel: number;
  currently_backordered: boolean;
  is_anomaly: boolean;
  anomaly_reason?: string;
  date: string;
  lastUpdated?: string;
};

type RestockRecommendation = {
  id: string;
  medicine_id_ndc: string;
  generic_medicine_name: string;
  currentOnHandUnits: number;
  minimumStockLevel: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  recommendedQuantity: number;
};

type InventoryStats = {
  totalItems: number;
  lowStockCount: number;
  backordered: number;
  anomalies: number;
  totalValue?: number;
};

const getMockInventoryData = (): Medication[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US');
  };

  return [
    {
      id: '1',
      ndcCode: '00409-4676-01',
      drugName: 'Propofol 200mg/20mL',
      formType: 'Injectable',
      totalQuantity: 245,
      parLevel: 150,
      avgDailyUsage: 8,
      lots: [
        { lotNumber: 'LOT2024A001', quantity: 150, expDate: addDays(45), unitCost: 12.50 },
        { lotNumber: 'LOT2024A002', quantity: 95, expDate: addDays(120), unitCost: 12.50 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '2',
      ndcCode: '00074-3799-05',
      drugName: 'Fentanyl Citrate 100mcg/2mL',
      formType: 'Injectable',
      totalQuantity: 85,
      parLevel: 100,
      avgDailyUsage: 5,
      lots: [
        { lotNumber: 'LOT2023B458', quantity: 35, expDate: addDays(18), unitCost: 8.75 },
        { lotNumber: 'LOT2024C122', quantity: 50, expDate: addDays(95), unitCost: 8.75 },
      ],
      alerts: { expiringSoon: true, fifoRisk: false, belowPar: true },
      lastUpdated: today.toISOString(),
    },
    {
      id: '3',
      ndcCode: '00409-6648-02',
      drugName: 'Midazolam 5mg/mL',
      formType: 'Injectable',
      totalQuantity: 180,
      parLevel: 120,
      avgDailyUsage: 6,
      lots: [
        { lotNumber: 'LOT2024D789', quantity: 80, expDate: addDays(65), unitCost: 5.25 },
        { lotNumber: 'LOT2024D790', quantity: 100, expDate: addDays(42), unitCost: 5.25 },
      ],
      alerts: { expiringSoon: false, fifoRisk: true, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '4',
      ndcCode: '00143-9283-01',
      drugName: 'Morphine Sulfate 10mg/mL',
      formType: 'Injectable',
      totalQuantity: 320,
      parLevel: 200,
      avgDailyUsage: 12,
      lots: [
        { lotNumber: 'LOT2024E456', quantity: 150, expDate: addDays(88), unitCost: 6.50 },
        { lotNumber: 'LOT2024E457', quantity: 170, expDate: addDays(135), unitCost: 6.50 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '5',
      ndcCode: '55390-200-10',
      drugName: 'Hydromorphone 2mg/mL',
      formType: 'Injectable',
      totalQuantity: 145,
      parLevel: 100,
      avgDailyUsage: 4,
      lots: [
        { lotNumber: 'LOT2024F112', quantity: 70, expDate: addDays(22), unitCost: 9.25 },
        { lotNumber: 'LOT2024F113', quantity: 75, expDate: addDays(110), unitCost: 9.25 },
      ],
      alerts: { expiringSoon: true, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '6',
      ndcCode: '00186-1200-01',
      drugName: 'Rocuronium 50mg/5mL',
      formType: 'Injectable',
      totalQuantity: 65,
      parLevel: 80,
      avgDailyUsage: 3,
      lots: [
        { lotNumber: 'LOT2024G334', quantity: 65, expDate: addDays(55), unitCost: 15.00 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: true },
      lastUpdated: today.toISOString(),
    },
    {
      id: '7',
      ndcCode: '00409-1782-01',
      drugName: 'Succinylcholine 200mg/10mL',
      formType: 'Injectable',
      totalQuantity: 95,
      parLevel: 60,
      avgDailyUsage: 2,
      lots: [
        { lotNumber: 'LOT2024H556', quantity: 45, expDate: addDays(35), unitCost: 12.75 },
        { lotNumber: 'LOT2024H557', quantity: 50, expDate: addDays(90), unitCost: 12.75 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '8',
      ndcCode: '00409-6631-02',
      drugName: 'Epinephrine 1mg/mL',
      formType: 'Injectable',
      totalQuantity: 425,
      parLevel: 300,
      avgDailyUsage: 15,
      lots: [
        { lotNumber: 'LOT2024I778', quantity: 200, expDate: addDays(75), unitCost: 4.50 },
        { lotNumber: 'LOT2024I779', quantity: 225, expDate: addDays(140), unitCost: 4.50 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '9',
      ndcCode: '00409-4678-50',
      drugName: 'Norepinephrine 4mg/4mL',
      formType: 'Injectable',
      totalQuantity: 180,
      parLevel: 150,
      avgDailyUsage: 7,
      lots: [
        { lotNumber: 'LOT2024J990', quantity: 80, expDate: addDays(28), unitCost: 18.50 },
        { lotNumber: 'LOT2024J991', quantity: 100, expDate: addDays(95), unitCost: 18.50 },
      ],
      alerts: { expiringSoon: true, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '10',
      ndcCode: '63323-281-10',
      drugName: 'Atropine 0.4mg/mL',
      formType: 'Injectable',
      totalQuantity: 220,
      parLevel: 150,
      avgDailyUsage: 5,
      lots: [
        { lotNumber: 'LOT2024K112', quantity: 120, expDate: addDays(100), unitCost: 3.75 },
        { lotNumber: 'LOT2024K113', quantity: 100, expDate: addDays(158), unitCost: 3.75 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '11',
      ndcCode: '00409-1965-01',
      drugName: 'Lidocaine 2% 20mg/mL',
      formType: 'Injectable',
      totalQuantity: 340,
      parLevel: 250,
      avgDailyUsage: 10,
      lots: [
        { lotNumber: 'LOT2024L334', quantity: 150, expDate: addDays(62), unitCost: 2.25 },
        { lotNumber: 'LOT2024L335', quantity: 190, expDate: addDays(125), unitCost: 2.25 },
      ],
      alerts: { expiringSoon: false, fifoRisk: false, belowPar: false },
      lastUpdated: today.toISOString(),
    },
    {
      id: '12',
      ndcCode: '00409-6643-01',
      drugName: 'Ketamine 100mg/mL',
      formType: 'Injectable',
      totalQuantity: 75,
      parLevel: 90,
      avgDailyUsage: 3,
      lots: [
        { lotNumber: 'LOT2023M556', quantity: 40, expDate: addDays(15), unitCost: 22.50 },
        { lotNumber: 'LOT2024M557', quantity: 35, expDate: addDays(105), unitCost: 22.50 },
      ],
      alerts: { expiringSoon: true, fifoRisk: false, belowPar: true },
      lastUpdated: today.toISOString(),
    },
  ];
};

export function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lowStock' | 'backorder' | 'anomalies'>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [anomalyItems, setAnomalyItems] = useState<InventoryItem[]>([]);
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([]);
  const [showLowStockPanel, setShowLowStockPanel] = useState(false);
  const [showAnomaliesPanel, setShowAnomaliesPanel] = useState(false);
  const [showRestockPanel, setShowRestockPanel] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, items]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchInventory(),
        fetchStats(),
        fetchLowStockItems(),
        fetchAnomalies(),
        fetchRestockRecommendations()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/inventory', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Inventory response:', result);
      
      if (result.success) {
        setItems(result.data);
      } else {
        toast.error('Failed to load inventory', {
          description: result.error || 'Backend returned no data',
        });
      }
    } catch (error) {
      console.error('Inventory fetch error:', error);
      toast.error('Error loading inventory', {
        description: error instanceof Error ? error.message : 'Unable to connect to backend. Is the server running on port 3000?',
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/inventory/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/inventory/low-stock', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setLowStockItems(result.data);
      }
    } catch (error) {
      console.error('Low stock fetch error:', error);
      setLowStockItems([]);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/inventory/anomalies', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setAnomalyItems(result.data);
      }
    } catch (error) {
      console.error('Anomalies fetch error:', error);
      setAnomalyItems([]);
    }
  };

  const fetchRestockRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/inventory/restock-recommendations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setRestockRecommendations(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.generic_medicine_name.toLowerCase().includes(searchLower) ||
          item.brand_name?.toLowerCase().includes(searchLower) ||
          item.medicine_id_ndc.includes(searchLower)
      );
    }

    // Alert filter
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => {
        if (filterType === 'lowStock') return item.currentOnHandUnits < item.minimumStockLevel;
        if (filterType === 'backorder') return item.currently_backordered;
        if (filterType === 'anomalies') return item.is_anomaly;
        return true;
      });
    }

    setFilteredItems(filtered);
  };

  const handleUpdateStock = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/inventory/${itemId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOnHandUnits: newQuantity,
          updateReason: 'Updated via dashboard',
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Stock updated');
        fetchAllData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Failed to update stock', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Inventory Dashboard
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Real-time medication inventory management and analytics
          </p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border"
          style={{
            backgroundColor: 'rgba(2, 132, 199, 0.06)',
            borderColor: 'rgba(2, 132, 199, 0.15)',
            color: 'var(--med-blue)',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={fetchAllData}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Items</p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                  {stats.totalItems}
                </p>
              </div>
              <Package className="w-8 h-8 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Low Stock</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#dc2626' }}>
                  {lowStockItems.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Backordered</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#ea580c' }}>
                  {stats.backordered}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Anomalies</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#ca8a04' }}>
                  {anomalyItems.length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-20" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Alert Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden dark:bg-slate-900/70 dark:border-slate-700/40"
          whileHover={{ scale: 1.01 }}
        >
          <div
            className="px-6 py-4 border-b cursor-pointer hover:opacity-75 transition-opacity dark:border-slate-700"
            onClick={() => setShowLowStockPanel(!showLowStockPanel)}
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
              <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">
                Low Stock Items ({lowStockItems.length})
              </h3>
            </div>
          </div>
          {showLowStockPanel && (
            <div className="overflow-x-auto">
              {lowStockItems.length === 0 ? (
                <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No low stock items</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Medicine
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        On Hand
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Minimum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lowStockItems.slice(0, 10).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                              {item.generic_medicine_name}
                            </p>
                            <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                              {item.medicine_id_ndc}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span style={{ color: '#dc2626' }} className="font-semibold">
                            {item.currentOnHandUnits}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span style={{ color: 'var(--text-muted)' }}>
                            {item.minimumStockLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>

        {/* Anomalies Alert */}
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden dark:bg-slate-900/70 dark:border-slate-700/40"
          whileHover={{ scale: 1.01 }}
        >
          <div
            className="px-6 py-4 border-b cursor-pointer hover:opacity-75 transition-opacity dark:border-slate-700"
            onClick={() => setShowAnomaliesPanel(!showAnomaliesPanel)}
            style={{ backgroundColor: 'rgba(202, 138, 4, 0.05)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#ca8a04' }} />
              <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">
                Anomalies ({anomalyItems.length})
              </h3>
            </div>
          </div>
          {showAnomaliesPanel && (
            <div className="overflow-x-auto">
              {anomalyItems.length === 0 ? (
                <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No anomalies detected</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Medicine
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        On Hand
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {anomalyItems.slice(0, 10).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                              {item.generic_medicine_name}
                            </p>
                            <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                              {item.medicine_id_ndc}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                            {item.currentOnHandUnits}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: '#ca8a04' }} className="text-xs font-medium">
                            {item.anomaly_reason || 'Unusual pattern detected'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by medication name or NDC code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="all">All Items</option>
              <option value="lowStock">Low Stock</option>
              <option value="backorder">Backordered</option>
              <option value="anomalies">Anomalies</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredItems.length}</strong> of {items.length} items
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden dark:bg-slate-900/70 dark:border-slate-700/40">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Loader className="w-6 h-6 animate-spin" />
            <p>Loading inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No items found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Generic Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Brand Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    NDC Code
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    On Hand
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Minimum
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.generic_medicine_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {item.brand_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                      {item.medicine_id_ndc}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.currentOnHandUnits}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm" style={{ color: item.currentOnHandUnits < item.minimumStockLevel ? '#dc2626' : 'var(--text-muted)' }}>
                        {item.minimumStockLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {item.currently_backordered && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            Backordered
                          </span>
                        )}
                        {item.currentOnHandUnits < item.minimumStockLevel && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low
                          </span>
                        )}
                        {item.is_anomaly && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            Anomaly
                          </span>
                        )}
                        {!item.currently_backordered && item.currentOnHandUnits >= item.minimumStockLevel && !item.is_anomaly && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            OK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        className="px-3 py-1.5 rounded text-xs font-medium border"
                        style={{
                          backgroundColor: 'rgba(2, 132, 199, 0.06)',
                          borderColor: 'rgba(2, 132, 199, 0.15)',
                          color: 'var(--med-blue)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const newQty = prompt(`Update quantity for ${item.generic_medicine_name}:`, item.currentOnHandUnits.toString());
                          if (newQty !== null && !isNaN(parseInt(newQty))) {
                            handleUpdateStock(item.id, parseInt(newQty));
                          }
                        }}
                      >
                        Edit
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}