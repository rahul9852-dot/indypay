// Device Mockup Components for realistic placeholders

export function MobileMockup({ label = "Mobile App Screenshot" }: { label?: string }) {
  return (
    <div className="w-64 h-[520px] bg-slate-900 rounded-[45px] p-2 shadow-2xl mx-auto">
      <div className="w-full h-full bg-white rounded-[38px] flex items-center justify-center overflow-hidden">
        <div className="text-center p-4">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 text-sm font-semibold">{label}</p>
          <p className="text-slate-300 text-xs mt-1">Replace with app image</p>
        </div>
      </div>
    </div>
  );
}

// Rotated mobile phone for landscape/desktop views
export function MobileLandscapeMockup({ label = "Dashboard Screenshot" }: { label?: string }) {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Taller and narrower phone mockup */}
      <div className="h-80 bg-slate-900 rounded-[32px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[26px] flex items-center justify-center overflow-hidden">
          <div className="text-center p-4">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400 text-sm font-semibold">{label}</p>
            <p className="text-slate-300 text-xs mt-1">Replace with screenshot</p>
          </div>
        </div>
      </div>
    </div>
  );
}
