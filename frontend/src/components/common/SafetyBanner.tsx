import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const SafetyBanner: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EAF4F8] border border-[#087F8C]/20 rounded-md text-xs text-[#12304A]">
        <ShieldCheck className="w-4 h-4 text-[#087F8C] shrink-0" />
        <span>
          <strong>Clinical Safety Protocol:</strong> Prototype decision support for frontline workers. Follow approved NHM guidelines.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#EAF4F8] border-l-4 border-[#087F8C] p-3 rounded-r-md text-xs text-[#12304A] flex items-start gap-2.5">
      <Info className="w-4 h-4 text-[#087F8C] mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-[#12304A]">Frontline Clinical Decision Support (Prototype)</p>
        <p className="text-[#536779] mt-0.5">
          This system uses deterministic clinical red-flag rules to assist ASHA and frontline health workers in triage and referral decisions. It is not an autonomous diagnostic device. Always follow official MoHFW protocols and escalate to a Medical Officer immediately when emergency danger signs appear.
        </p>
      </div>
    </div>
  );
};
