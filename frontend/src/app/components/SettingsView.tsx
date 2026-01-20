import { motion } from 'motion/react';
import { User, Building2, Mail, Briefcase, Calendar, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/config/api';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  createdAt: string;
};

type HospitalSettings = {
  hospitalId: string;
  hospitalName: string;
  address: string;
  phone: string;
  timezone: string;
  defaultParLevel: number;
  expirationAlertDays: number;
};

const getMockProfileData = (): UserProfile => {
  return {
    id: 'USR001',
    name: 'Dr. Sarah Martinez',
    email: 'sarah.martinez@metrogeneral.org',
    role: 'Pharmacy Director',
    hospitalId: 'HOSP-MGH-2024',
    hospitalName: 'Metro General Hospital',
    department: 'Pharmacy Services',
    createdAt: '2024-01-15T08:00:00Z',
  };
};

const getMockHospitalData = (): HospitalSettings => {
  return {
    hospitalId: 'HOSP-MGH-2024',
    hospitalName: 'Metro General Hospital',
    address: '123 Healthcare Drive, Medical District, CA 90210',
    phone: '+1 (555) 123-4567',
    timezone: 'America/Los_Angeles (PST)',
    defaultParLevel: 100,
    expirationAlertDays: 30,
  };
};

export function SettingsView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hospital, setHospital] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [profileRes, hospitalRes] = await Promise.all([
        fetch(API_ENDPOINTS.settingsProfile),
        fetch(API_ENDPOINTS.settingsHospital),
      ]);

      const profileData = await profileRes.json();
      const hospitalData = await hospitalRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
        setFormData({
          name: profileData.data.name,
          email: profileData.data.email,
          department: profileData.data.department,
        });
      }

      if (hospitalData.success) {
        setHospital(hospitalData.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use mock data for demo
      const mockProfile = getMockProfileData();
      const mockHospital = getMockHospitalData();
      
      setProfile(mockProfile);
      setHospital(mockHospital);
      setFormData({
        name: mockProfile.name,
        email: mockProfile.email,
        department: mockProfile.department,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.settingsProfile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile({ ...profile, ...formData } as UserProfile);
        toast.success('Settings saved', {
          description: 'Your profile has been updated successfully.',
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Save failed', {
        description: error instanceof Error ? error.message : 'Unable to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOld = async () => {
    setSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.settingsProfile, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        toast.success('Profile updated', {
          description: 'Your profile has been updated successfully',
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Simulate successful save for demo
      if (profile) {
        setProfile({
          ...profile,
          name: formData.name,
          email: formData.email,
          department: formData.department,
        });
        toast.success('Profile updated', {
          description: 'Your profile changes have been saved (demo mode)',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage your profile and hospital information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
          style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)' }}>
              <User className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              User Profile
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Department
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Role
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                {profile?.role}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Member Since
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-4 h-4" />
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </div>
            </div>

            <motion.button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
              style={{ background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>

        {/* Hospital Information Card */}
        <motion.div
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 dark:bg-slate-900/70 dark:border-slate-700/40"
          style={{ boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Hospital Information
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Hospital ID
              </label>
              <div className="px-4 py-3 rounded-xl border border-sky-200 bg-sky-50/50 text-sm font-mono dark:bg-sky-900/20 dark:border-sky-700/30" style={{ color: 'var(--med-blue)' }}>
                {hospital?.hospitalId}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Hospital Name
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-primary)' }}>
                {hospital?.hospitalName}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Address
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                {hospital?.address}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Phone
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                {hospital?.phone}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  Default Par Level
                </label>
                <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                  {hospital?.defaultParLevel}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                  Alert Days
                </label>
                <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                  {hospital?.expirationAlertDays} days
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                Timezone
              </label>
              <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dark:bg-slate-800/50 dark:border-slate-700" style={{ color: 'var(--text-muted)' }}>
                {hospital?.timezone}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div
        className="bg-sky-50/50 backdrop-blur-xl rounded-2xl border border-sky-200/50 p-6 dark:bg-sky-900/10 dark:border-sky-700/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--med-blue)' }} />
          <div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              About Your Account
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Your profile is linked to {hospital?.hospitalName}. Hospital settings are managed by system administrators. 
              For changes to hospital information or permissions, please contact your IT department.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
