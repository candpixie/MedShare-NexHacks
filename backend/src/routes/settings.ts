import { Router, Request, Response } from 'express';
import { mockUserProfile } from '../data/mockData';

const router = Router();

// Get user profile and hospital info
router.get('/profile', (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: mockUserProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', (req: Request, res: Response) => {
  try {
    const { name, email, department } = req.body;
    
    const updatedProfile = {
      ...mockUserProfile,
      name: name || mockUserProfile.name,
      email: email || mockUserProfile.email,
      department: department || mockUserProfile.department,
    };

    res.json({ 
      success: true, 
      data: updatedProfile,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// Get hospital settings
router.get('/hospital', (req: Request, res: Response) => {
  try {
    const hospitalSettings = {
      hospitalId: mockUserProfile.hospitalId,
      hospitalName: mockUserProfile.hospitalName,
      address: '123 Medical Center Dr, Metro City, MC 12345',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      defaultParLevel: 20,
      expirationAlertDays: 30,
    };

    res.json({ success: true, data: hospitalSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospital settings' });
  }
});

export default router;
