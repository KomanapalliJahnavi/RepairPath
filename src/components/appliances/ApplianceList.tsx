import React, { useState, useMemo } from 'react';
import { Search, Plus, Layers } from 'lucide-react';
import { Appliance } from '../../types';
import { ApplianceCard } from './ApplianceCard';
import { ApplianceDetailModal } from './ApplianceDetailModal';
import { ApplianceFormModal } from './ApplianceFormModal';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { useApp } from '../../context/AppContext';

interface ApplianceListProps {
  onOpenAddRepairForAppliance?: (applianceId: string) => void;
}

export const ApplianceList: React.FC<ApplianceListProps> = ({
  onOpenAddRepairForAppliance,
}) => {
  const { appliances, addAppliance, updateAppliance, selectedApplianceId, setSelectedApplianceId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'cost'>('name');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);

  // Active appliance for detail modal
  const activeDetailAppliance = useMemo(() => {
    if (!selectedApplianceId) return null;
    return appliances.find(a => a.id === selectedApplianceId) || null;
  }, [selectedApplianceId, appliances]);

  // Unique rooms
  const rooms = useMemo(() => {
    const set = new Set<string>();
    appliances.forEach(a => {
      if (a.locationRoom) set.add(a.locationRoom);
    });
    return ['all', ...Array.from(set)];
  }, [appliances]);

  // Filtered and sorted appliances
  const filteredAppliances = useMemo(() => {
    return appliances
      .filter(app => {
        const matchesQuery =
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.modelNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.serialNumber && app.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRoom = selectedRoom === 'all' || app.locationRoom === selectedRoom;
        const matchesStatus = selectedStatus === 'all' || app.conditionStatus === selectedStatus;

        return matchesQuery && matchesRoom && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'age') {
          const timeA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
          const timeB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
          return timeA - timeB;
        }
        if (sortBy === 'cost') return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        return 0;
      });
  }, [appliances, searchQuery, selectedRoom, selectedStatus, sortBy]);

  const handleEdit = (app: Appliance) => {
    setEditingAppliance(app);
    setIsFormOpen(true);
  };

  const handleSaveAppliance = (data: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAppliance) {
      updateAppliance(editingAppliance.id, data);
      setEditingAppliance(null);
    } else {
      addAppliance(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73766F]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by appliance, brand, model or serial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#DADBD3] rounded-md text-[#252923] placeholder-[#8F928B] focus:border-[#285B45] focus:ring-1 focus:ring-[#285B45] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#73766F] hover:text-[#252923]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and New Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#252923] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            aria-label="Filter by room"
          >
            {rooms.map(room => (
              <option key={room} value={room}>
                {room === 'all' ? 'All Rooms' : room}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#252923] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            aria-label="Filter by condition status"
          >
            <option value="all">All Statuses</option>
            <option value="optimal">Operational</option>
            <option value="attention_needed">Attention Needed</option>
            <option value="urgent_repair">Urgent Repair</option>
            <option value="retired">Retired</option>
          </select>

          {/* Sort Control */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium text-[#252923] bg-white border border-[#DADBD3] rounded-md focus:border-[#285B45] outline-none cursor-pointer"
            aria-label="Sort appliances"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="age">Sort: Age (Oldest First)</option>
            <option value="cost">Sort: Purchase Price (Highest First)</option>
          </select>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingAppliance(null);
              setIsFormOpen(true);
            }}
          >
            Register Appliance
          </Button>
        </div>
      </div>

      {/* Grid of appliances */}
      {filteredAppliances.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title={searchQuery || selectedRoom !== 'all' || selectedStatus !== 'all' ? 'No matching appliances found' : 'No appliances registered yet'}
          description={
            searchQuery || selectedRoom !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search terms or resetting filters to locate units in your registry.'
              : 'Add your primary home appliances with their serial numbers and purchase details to start tracking warranties and service history.'
          }
          actionLabel="Register Appliance"
          onAction={() => {
            setSearchQuery('');
            setSelectedRoom('all');
            setSelectedStatus('all');
            setEditingAppliance(null);
            setIsFormOpen(true);
          }}
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppliances.map(app => (
            <ApplianceCard
              key={app.id}
              appliance={app}
              onSelect={selected => setSelectedApplianceId(selected.id)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ApplianceDetailModal
        appliance={activeDetailAppliance}
        isOpen={!!activeDetailAppliance}
        onClose={() => setSelectedApplianceId(null)}
        onEdit={handleEdit}
        onOpenAddRepairForAppliance={onOpenAddRepairForAppliance}
      />

      {/* Form Modal */}
      <ApplianceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAppliance(null);
        }}
        onSubmit={handleSaveAppliance}
        initialData={editingAppliance}
      />
    </div>
  );
};
