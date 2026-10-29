import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Lock,
  LogOut,
  Edit2,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const ProfileScreen: React.FC = () => {
  const { employee, updateProfile, logout, changePassword } = useAuth();
  const { showToast, openModal } = useApp();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactNumber, setContactNumber] = useState(employee?.contactNumber || '');
  const [emergencyContact, setEmergencyContact] = useState(employee?.emergencyContact || '');
  const [saving, setSaving] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await updateProfile({
        contactNumber: contactNumber.trim(),
        emergencyContact: emergencyContact.trim(),
      });
      showToast('success', 'Profile Updated', 'Contact information saved successfully.');
      setIsEditingContact(false);
    } catch (err: unknown) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('error', 'Missing Fields', 'Please fill in both password fields.');
      return;
    }
    setChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('success', 'Password Changed', 'Your account credentials have been updated.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      showToast('error', 'Change Password Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('info', 'Logged Out', 'You have been securely signed out of Intelysol HCM.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-2 border-amber-300 shadow-md mb-3">
          {employee?.avatarUrl ? (
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xl">
              {employee?.name.charAt(0) || 'E'}
            </div>
          )}
        </div>

        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {employee?.name}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {employee?.designation}
        </p>

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {employee?.employeeCode}
          </span>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {employee?.employmentStatus}
          </span>
        </div>
      </div>

      {/* Immutable Corporate Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Enterprise Assignment
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Lock size={11} />
            HR Read-Only
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Department</span>
            <span className="font-semibold text-slate-800">{employee?.department}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Branch Campus</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
              {employee?.branch.name}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Work Shift</span>
            <span className="font-semibold text-slate-800">{employee?.shift.name}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Reporting Manager</span>
            <span className="font-semibold text-slate-800">{employee?.managerName}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Date of Joining</span>
            <span className="font-semibold text-slate-800">{employee?.joiningDate}</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500">Official Work Email</span>
            <span className="font-semibold text-slate-800">{employee?.workEmail}</span>
          </div>
        </div>
      </div>

      {/* Editable Contact Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Contact Information
          </h3>
          {!isEditingContact ? (
            <button
              onClick={() => setIsEditingContact(true)}
              className="text-xs text-amber-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveContact}
                disabled={saving}
                className="p-1 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200"
                title="Save Changes"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setIsEditingContact(false)}
                className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1">
              Mobile Contact Number
            </label>
            {isEditingContact ? (
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            ) : (
              <p className="font-semibold text-slate-800">{employee?.contactNumber}</p>
            )}
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1">
              Emergency Contact &amp; Relation
            </label>
            {isEditingContact ? (
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            ) : (
              <p className="font-semibold text-slate-800">{employee?.emergencyContact}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Security & Actions */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full min-h-[46px] bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between px-4 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <KeyRound size={16} className="text-amber-600" />
            <span>Change Account Password</span>
          </div>
          <span className="text-slate-400 text-xs">Update</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full min-h-[46px] bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-2xl border border-red-200/80 shadow-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
        >
          <LogOut size={16} />
          <span>Sign Out of Employee Session</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="w-full min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center"
              >
                {changingPass ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
