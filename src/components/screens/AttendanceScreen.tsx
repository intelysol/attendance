import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Building,
  Navigation,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { geolocationService, generateUUID, LocationResult } from '../../services/geolocationService';
import { TodayAttendance, PunchEvent } from '../../types/attendance';

export const AttendanceScreen: React.FC = () => {
  const { employee } = useAuth();
  const { showToast, gpsScenario, setGpsScenario } = useApp();

  const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [punching, setPunching] = useState<boolean>(false);
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastPunchVerification, setLastPunchVerification] = useState<string | null>(null);

  const branch = employee?.branch;
  const shift = employee?.shift;

  // Load today's attendance state
  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTodayAttendance();
      setAttendance(data);
    } catch (err: unknown) {
      showToast('error', 'Attendance Sync Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  // Update current GPS coordinates based on selected scenario
  const refreshLocation = async () => {
    if (!branch) return;
    setGpsError(null);

    if (gpsScenario === 'device') {
      const res = await geolocationService.getCurrentPosition(branch);
      if (res.error) {
        setGpsError(res.error.message);
        setLocationResult(null);
      } else if (res.result) {
        setLocationResult(res.result);
      }
    } else {
      const res = geolocationService.simulatePosition(branch, gpsScenario);
      if (res.error) {
        setGpsError(res.error.message);
        setLocationResult(null);
      } else if (res.result) {
        setLocationResult(res.result);
      }
    }
  };

  useEffect(() => {
    refreshLocation();
  }, [gpsScenario, branch]);

  // Determine next action
  const hasCheckedIn = !!attendance?.firstIn;
  const hasCheckedOut = !!attendance?.lastOut;
  const nextPunchType = hasCheckedIn && !hasCheckedOut ? 'CHECK_OUT' : 'CHECK_IN';

  const handlePunch = async () => {
    if (!branch || !shift) return;

    setPunching(true);
    setGpsError(null);
    setLastPunchVerification(null);

    try {
      // 1. Obtain location
      let currentLoc: LocationResult | null = locationResult;
      if (!currentLoc) {
        if (gpsScenario === 'device') {
          const locRes = await geolocationService.getCurrentPosition(branch);
          if (locRes.error) {
            throw new Error(locRes.error.message);
          }
          currentLoc = locRes.result!;
        } else {
          const locRes = geolocationService.simulatePosition(branch, gpsScenario);
          if (locRes.error) {
            throw new Error(locRes.error.message);
          }
          currentLoc = locRes.result!;
        }
        setLocationResult(currentLoc);
      }

      // 2. Transmit to server with UUID Idempotency Key
      const idempotencyKey = generateUUID();
      const res = await apiClient.submitPunch({
        punchType: nextPunchType,
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
        accuracy: currentLoc.accuracy,
        timestamp: new Date().toISOString(),
        branchId: branch.id,
        idempotencyKey,
        deviceInfo: {
          platform: 'Mobile / Android 14',
          model: navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Device Browser',
          appVersion: '1.4.0',
        },
      });

      // 3. Update local state
      setAttendance(res.attendance);
      setLastPunchVerification(
        `Punch recorded & verified by Laravel HCM backend (${res.punch.distanceFromBranchMeters}m from branch). Idempotency Key: ${idempotencyKey.substring(0, 8)}...`
      );
      showToast('success', `${nextPunchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Verified!`, res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Punch submission failed.';
      setGpsError(msg);
      showToast('error', 'Punch Rejected by Server', msg);
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Branch & Shift Context Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-amber-600 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {branch?.name}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {branch?.address}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
            {branch?.code}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>Shift: {shift?.startTime} – {shift?.endTime}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Geofence: &lt;{branch?.geofenceRadiusMeters}m
          </span>
        </div>
      </div>

      {/* Interactive Geofence Map / Radar Visualizer */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        {/* Subtle decorative grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={17} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                GPS Geofence Radar
              </span>
            </div>
            <button
              onClick={refreshLocation}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg"
            >
              <RefreshCw size={11} />
              <span>Refresh GPS</span>
            </button>
          </div>

          {/* Visual Geofence Concentric Circles */}
          <div className="h-44 bg-slate-950/70 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
            {/* 150m Geofence Perimeter Circle */}
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-amber-500/50 flex items-center justify-center animate-pulse">
              {/* Inner 75m circle */}
              <div className="w-20 h-20 rounded-full border border-amber-500/20 flex items-center justify-center">
                {/* Branch Headquarters Center Pin */}
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-bold text-[10px]">
                  HQ
                </div>
              </div>
            </div>

            {/* User GPS Pin on Radar */}
            {locationResult && (
              <div
                className={`absolute transition-all duration-500 flex flex-col items-center z-20 ${
                  locationResult.isWithinGeofence ? 'text-emerald-400' : 'text-red-400'
                }`}
                style={{
                  top: locationResult.isWithinGeofence ? '42%' : '14%',
                  left: locationResult.isWithinGeofence ? '60%' : '78%',
                }}
              >
                <div className="relative">
                  <span
                    className={`w-3.5 h-3.5 rounded-full block shadow-md ${
                      locationResult.isWithinGeofence ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`absolute -inset-1 rounded-full animate-ping opacity-75 ${
                      locationResult.isWithinGeofence ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-bold mt-1 bg-slate-900/90 px-1.5 py-0.2 rounded border border-white/20 whitespace-nowrap">
                  You ({locationResult.distanceToBranchMeters}m)
                </span>
              </div>
            )}
          </div>

          {/* Telemetry Status Strip */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-medium">Distance from Branch</span>
              <p className="text-sm font-bold mt-0.5 tabular-nums text-white">
                {locationResult ? `${locationResult.distanceToBranchMeters} meters` : 'Determining...'}
              </p>
              <p
                className={`text-[10px] font-semibold mt-0.5 ${
                  locationResult?.isWithinGeofence ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {locationResult?.isWithinGeofence ? '✓ Inside Authorized Geofence' : '✕ Outside 150m Perimeter'}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-medium">GPS Accuracy</span>
              <p className="text-sm font-bold mt-0.5 tabular-nums text-white">
                {locationResult ? `±${locationResult.accuracy} meters` : 'Pending...'}
              </p>
              <p
                className={`text-[10px] font-semibold mt-0.5 ${
                  locationResult?.accuracyAcceptable ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {locationResult?.accuracyAcceptable ? '✓ Good Satellite Lock (<50m)' : '⚠ Poor Signal (>50m)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">Verification Alert:</span> {gpsError}
          </div>
        </div>
      )}

      {/* Success Verification Alert */}
      {lastPunchVerification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
          <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed text-[11px]">
            {lastPunchVerification}
          </div>
        </div>
      )}

      {/* Quick GPS Scenario Switcher for Mobile Testing */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Branch Verification Preset:</span>
          <span className="text-[11px] text-slate-500 font-mono">Silicon Valley HQ</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setGpsScenario('at_desk')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-left border transition-all ${
              gpsScenario === 'at_desk'
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🏢 At Desk (22m)
          </button>
          <button
            onClick={() => setGpsScenario('cafeteria')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-left border transition-all ${
              gpsScenario === 'cafeteria'
                ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ☕ Cafeteria (72m)
          </button>
          <button
            onClick={() => setGpsScenario('outside_geofence')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-left border transition-all ${
              gpsScenario === 'outside_geofence'
                ? 'bg-red-50 border-red-300 text-red-900 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🚗 Outside Campus (480m)
          </button>
          <button
            onClick={() => setGpsScenario('device')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium text-left border transition-all ${
              gpsScenario === 'device'
                ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🛰 Real Device GPS
          </button>
        </div>
      </div>

      {/* Primary Punch In / Out Button */}
      <button
        onClick={handlePunch}
        disabled={punching}
        className={`w-full min-h-[52px] text-white font-bold text-sm rounded-2xl shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
          nextPunchType === 'CHECK_IN'
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
        } disabled:opacity-70`}
      >
        {punching ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Verifying Geofence &amp; Idempotency...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Navigation size={18} />
            <span>{nextPunchType === 'CHECK_IN' ? 'Check In Now' : 'Check Out Now'}</span>
          </span>
        )}
      </button>

      {/* Today's Punch Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Today's Punch Log
        </h3>

        {attendance?.punches && attendance.punches.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {attendance.punches.map((punch, idx) => (
              <div key={punch.id || idx} className="relative flex items-start gap-3 pl-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    punch.type === 'CHECK_IN'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <CheckCircle size={13} />
                </div>
                <div className="flex-1 min-w-0 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {punch.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {new Date(punch.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {punch.remarks || `${punch.distanceFromBranchMeters}m from branch`} · ±{punch.accuracy}m GPS
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">
            No punch recorded today yet.
          </p>
        )}
      </div>
    </div>
  );
};
