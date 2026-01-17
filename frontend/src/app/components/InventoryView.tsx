import { motion } from 'motion/react';
import { Search, Filter, Download, AlertTriangle, Package } from 'lucide-react';
import { useState, useEffect } from 'react';

type MedicationLot = {
  lotNumber: string;
  quantity: number;
  expDate: string;
  unitCost: number;
};

type Medication = {
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

const getDaysUntil = (dateString: string) => {
  const target = new Date(dateString);
  const today = new Date();
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function InventoryView() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'fifo' | 'belowPar'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, medications]);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/inventory');
      const result = await response.json();
      if (result.success) {
        setMedications(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...medications];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.drugName.toLowerCase().includes(searchLower) ||
          med.ndcCode.includes(searchLower)
      );
    }

    // Alert filter
    if (filterType !== 'all') {
      filtered = filtered.filter((med) => {
        if (filterType === 'expiring') return med.alerts.expiringSoon;
        if (filterType === 'fifo') return med.alerts.fifoRisk;
        if (filterType === 'belowPar') return med.alerts.belowPar;
        return true;
      });
    }

    setFilteredMeds(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Full Inventory
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Complete list of all medications in stock
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
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" />
          Export List
        </motion.button>
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
              <option value="expiring">Expiring Soon</option>
              <option value="fifo">FIFO Alerts</option>
              <option value="belowPar">Below Par Level</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredMeds.length}</strong> of {medications.length} items
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-hidden dark:bg-slate-900/70 dark:border-slate-700/40">
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            Loading inventory...
          </div>
        ) : filteredMeds.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No medications found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Medication
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    NDC Code
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Quantity
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Par Level
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Lots
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Alerts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeds.map((med) => (
                  <motion.tr
                    key={med.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {med.drugName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {med.formType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                      {med.ndcCode}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {med.totalQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm" style={{ color: med.totalQuantity < med.parLevel ? 'var(--danger-rose)' : 'var(--text-muted)' }}>
                        {med.parLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {med.lots.map((lot) => (
                          <div key={lot.lotNumber} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {lot.lotNumber}: {lot.quantity} units (Exp: {getDaysUntil(lot.expDate)}d)
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {med.alerts.expiringSoon && (
                          <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning-amber)' }}>
                            Expiring
                          </span>
                        )}
                        {med.alerts.fifoRisk && (
                          <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'rgba(225, 29, 72, 0.1)', color: 'var(--danger-rose)' }}>
                            FIFO
                          </span>
                        )}
                        {med.alerts.belowPar && (
                          <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'rgba(225, 29, 72, 0.1)', color: 'var(--danger-rose)' }}>
                            Below Par
                          </span>
                        )}
                      </div>
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
