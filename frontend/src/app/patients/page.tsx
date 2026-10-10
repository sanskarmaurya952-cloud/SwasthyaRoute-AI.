'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Patient, AssessmentResult } from '@/types';
import { RiskBadge } from '@/components/common/RiskBadge';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Users,
  Search,
  Plus,
  Stethoscope,
  Calendar,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
} from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pts, asts] = await Promise.all([
          api.getPatients(),
          api.getAssessments(),
        ]);
        setPatients(pts);
        setAssessments(asts);
      } catch (err) {
        console.error('Failed to load patient records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPatients = patients.filter((p) => {
    return (
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.village.toLowerCase().includes(search.toLowerCase()) ||
      p.demo_identifier.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12304A]">Patient Health Records</h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              {patients.length} Registered Demo Profiles
            </span>
          </div>
          <p className="text-xs text-[#536779] mt-0.5">
            Frontline demographic records, pre-existing chronic conditions, and past triage history
          </p>
        </div>

        <Link
          href="/assess"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#087F8C] hover:bg-[#066670] text-white font-semibold text-xs rounded-lg transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>

      <SafetyBanner compact />

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient name, village, or demo ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F8C]"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const patientAssessments = assessments.filter(
              (a) => a.patient_id === patient.id || a.patient_name === patient.full_name
            );
            const isExpanded = expandedPatientId === patient.id;

            return (
              <div
                key={patient.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                <div
                  onClick={() => setExpandedPatientId(isExpanded ? null : patient.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#536779] bg-slate-100 px-2 py-0.5 rounded">
                        {patient.demo_identifier}
                      </span>
                      <h3 className="font-bold text-sm text-[#12304A]">
                        {patient.full_name}
                      </h3>
                      <span className="text-xs text-[#536779]">
                        • {patient.age} yrs • {patient.sex}
                      </span>
                      {patient.pregnancy_status && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                          PREGNANT (ANC)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#536779] flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#087F8C]" />
                        {patient.village}
                      </span>
                      {patient.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone_number}
                        </span>
                      )}
                      <span>
                        History: {patient.existing_conditions.length > 0 ? patient.existing_conditions.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-xs text-[#536779] bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                      {patientAssessments.length} Assessments
                    </span>

                    <Link
                      href={`/assess?name=${encodeURIComponent(patient.full_name)}&age=${patient.age}&village=${encodeURIComponent(patient.village)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-[#087F8C] hover:bg-[#066670] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Assess</span>
                    </Link>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Assessment History */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-4 sm:p-5 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-[#12304A] uppercase tracking-wider">
                      Assessment & Triage History
                    </h4>

                    {patientAssessments.length > 0 ? (
                      <div className="space-y-2">
                        {patientAssessments.map((ast) => (
                          <div
                            key={ast.id}
                            className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-[#12304A]">
                                {new Date(ast.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <RiskBadge risk={ast.risk_category} size="sm" />
                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  {ast.recommended_care_level}
                                </span>
                              </div>
                            </div>

                            <p className="text-[#536779]">
                              <strong>Symptoms:</strong> {ast.symptoms.join(', ')}
                            </p>

                            <div className="text-[11px] text-[#536779] flex items-center gap-3 flex-wrap bg-slate-50 p-2 rounded">
                              <span>SpO₂: <strong>{ast.vitals?.spo2 ? `${ast.vitals.spo2}%` : 'N/A'}</strong></span>
                              <span>Pulse: <strong>{ast.vitals?.heart_rate ? `${ast.vitals.heart_rate} bpm` : 'N/A'}</strong></span>
                              <span>Temp: <strong>{ast.vitals?.temperature ? `${ast.vitals.temperature}°F` : 'N/A'}</strong></span>
                              <span>Resp Rate: <strong>{ast.vitals?.respiratory_rate ? `${ast.vitals.respiratory_rate} bpm` : 'N/A'}</strong></span>
                            </div>

                            <p className="text-[11px] text-slate-700 font-medium">
                              <strong>Action:</strong> {ast.recommended_action}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        No previous triage assessments found for this patient.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-[#536779]">
            No patient records match your search.
          </div>
        )}
      </div>
    </div>
  );
}
