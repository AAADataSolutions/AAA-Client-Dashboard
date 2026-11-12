import React from 'react';
import { Search, Hotel, MapPin, CheckCircle2 } from 'lucide-react';
import { PropertyCatalogItem } from './types';

interface ExistingPropertySectionProps {
  filterQuery: string;
  setFilterQuery: (val: string) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  setError: (err: string | null) => void;
  isLoadingProps: boolean;
  filteredDropdownOptions: PropertyCatalogItem[];
  selectedProperty: PropertyCatalogItem | undefined;
  formData: {
    target_date: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function ExistingPropertySection({
  filterQuery,
  setFilterQuery,
  selectedPropertyId,
  setSelectedPropertyId,
  setError,
  isLoadingProps,
  filteredDropdownOptions,
  selectedProperty,
  formData,
  setFormData,
}: ExistingPropertySectionProps) {
  return (
    <div className="space-y-4">
      {/* Filter Search Input */}
      <div>
        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
          Select Property from AAA Database <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Type to filter properties by name, city, or address..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#252733] hover:bg-slate-50 dark:hover:bg-[#1f2029] text-slate-500 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* The Dropdown Element */}
        <div className="relative">
          <select
            value={selectedPropertyId}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value);
              setError(null);
            }}
            aria-label="Select property from AAA Database"
            className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">
              {isLoadingProps
                ? 'Loading database properties...'
                : filteredDropdownOptions.length === 0
                ? 'No unassigned properties found'
                : `— Select a Property (${filteredDropdownOptions.length} available) —`}
            </option>
            {filteredDropdownOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.city}, {p.state} ({p.address})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Property Preview Card */}
      {selectedProperty ? (
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Hotel className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  {selectedProperty.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Ready to Onboard</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Main Phone:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {selectedProperty.main_phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Contact Person / GM:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                {selectedProperty.contact_person_name || selectedProperty.general_manager_name || '—'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
          <span>Please choose a property from the dropdown above to view its details.</span>
        </div>
      )}

      {/* Target Date & Notes for Existing Property */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-[#222430]">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            Target Go-Live Date (Optional)
          </label>
          <input
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            Initial Scoping Notes (Optional)
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. 24 DIDs, port from AT&T, analog lines"
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
