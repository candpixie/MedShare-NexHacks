const express = require('express');
const router = express.Router();

// Mock user profile data
const mockProfile = {
  id: 'USR001',
  name: 'Dr. Sarah Martinez',
  email: 'sarah.martinez@metrogeneral.org',
  role: 'Pharmacy Director',
  hospitalId: 'HOSP-MGH-2024',
  hospitalName: 'Metro General Hospital',
  department: 'Pharmacy Services',
  createdAt: '2024-01-15T08:00:00Z',
};

// Mock hospital settings data
const mockHospitalSettings = {
  hospitalId: 'HOSP-MGH-2024',
  hospitalName: 'Metro General Hospital',
  defaultParLevel: 100,
  expirationAlertDays: 30,
};

/**
 * GET /settings/profile
 * Get user profile information
 */
router.get('/profile', async (req, res) => {
  try {
    // In a real app, you would fetch from database based on authenticated user
    res.json({
      success: true,
      data: mockProfile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /settings/hospital
 * Get hospital settings
 */
router.get('/hospital', async (req, res) => {
  try {
    // In a real app, you would fetch from database based on hospital ID
    res.json({
      success: true,
      data: mockHospitalSettings,
    });
  } catch (error) {
    console.error('Error fetching hospital settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /settings/profile
 * Update user profile
 * Body: { name, email, department }
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        error: 'name, email, and department are required',
      });
    }

    // In a real app, you would update the database
    const updatedProfile = {
      ...mockProfile,
      name,
      email,
      department,
    };

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /settings/hospital
 * Update hospital settings
 * Body: { defaultParLevel, expirationAlertDays }
 */
router.put('/hospital', async (req, res) => {
  try {
    const { defaultParLevel, expirationAlertDays } = req.body;

    // In a real app, you would update the database
    const updatedSettings = {
      ...mockHospitalSettings,
      ...(defaultParLevel && { defaultParLevel }),
      ...(expirationAlertDays && { expirationAlertDays }),
    };

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Hospital settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating hospital settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
