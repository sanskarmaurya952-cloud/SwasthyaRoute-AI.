'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Facility, FacilityType } from '@/types';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Building2,
  Search,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  Activity,
  Bed,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

const FACILITY_TYPES = [
  'All',
  'District Hospital',
  'Community Health Centre',
  'Primary Health Centre',
  'Sub-Health Centre',
  'Medical College',
];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [oxygenOnly, setOxygenOnly] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFacilities = async () => {
    try {
      const data = await api.getFacilities();
      setFacilities(data);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const filtered = facilities.filter((f) => {
    const matchesType = typeFilter === 'All' || f.facility_type.includes(typeFilter);
    const matchesEmergency = !emergencyOnly || f.emergency_capability;
    const matchesOxygen = !oxygenOnly || f.oxygen_available;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.village_or_block.toLowerCase().includes(search.toLowerCase()) ||
      f.specialists_available.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    return matchesType && matchesEmergency && matchesOxygen && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12304A]">Healthcare Facility Directory</h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              Demo District Network
            </span>
          </div>
          <p className="text-xs text-[#536779] mt-0.5">
            Directory of Sub-centres, PHCs, CHCs, and District Hospitals with capability tags
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchFacilities();
          }}
          className="p-2 text-slate-500 hover:text-[#12304A] hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#087F8C]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <SafetyBanner compact />

      {/* Directory Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
        <span className="font-bold">⚠️ Demonstration Data:</span>
        <span>
          Facility records, distances, and contact numbers are illustrative sample data for hackathon demonstration. Real deployment requires synchronization with District Health Information System (DHIS2/HMIS).
        </span>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {FACILITY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  typeFilter === t
                    ? 'bg-[#12304A] text-white'
                    : 'bg-slate-100 text-[#536779] hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quick Capability Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEmergencyOnly(!emergencyOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                emergencyOnly
                  ? 'bg-red-100 text-red-800 border-red-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              24/7 Emergency Only
            </button>

            <button
              onClick={() => setOxygenOnly(!oxygenOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                oxygenOnly
                  ? 'bg-teal-100 text-teal-800 border-teal-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Oxygen Supported
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search facility by name, location, or available specialist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F8C]"
          />
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#087F8C]/60 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#087F8C] bg-[#EAF4F8] px-2.5 py-0.5 rounded border border-[#087F8C]/20">
                    {fac.facility_type}
                  </span>
                  <span className="text-xs font-bold text-[#12304A]">
                    {fac.distance_km_demo} km (~{fac.est_travel_time_demo})
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#12304A]">{fac.name}</h3>

                <div className="space-y-1 text-xs text-[#536779]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#087F8C]" />
                    <span>{fac.village_or_block}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.contact_phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.operating_hours}</span>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      fac.emergency_capability
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fac.emergency_capability ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    24/7 Emergency
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      fac.oxygen_available
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fac.oxygen_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Oxygen Manifold
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      fac.icu_beds_available
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fac.icu_beds_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    ICU Facility
                  </span>
                </div>

                {/* Specialists */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#12304A] block mb-1">
                    Available Specialists & Staff:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {fac.specialists_available.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-[#536779] flex items-center justify-between">
                <span>Demo Record ID: {fac.id}</span>
                <span className="text-[#087F8C] font-semibold">Verified Sample Tier</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-[#536779]">
            No healthcare facilities found matching the filters.
          </div>
        )}
      </div>
    </div>
  );
}
