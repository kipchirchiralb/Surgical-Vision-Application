import express from 'express';
import { allQuery, runQuery, getQuery } from '../config/db.js';
import { getRiskAssessment } from '../controllers/scanController.js';

// Export a function that accepts the upload middleware
export default function(upload) {
  const router = express.Router();

  // GET /api/scans - Retrieve all scans
  router.get('/scans', async (req, res) => {
    try {
      console.log('📊 Fetching all scans...');
      const scans = await allQuery(`
        SELECT 
          id,
          patient_name,
          scan_type,
          risk_level,
          status,
          date,
          uploaded_by,
          notes
        FROM scans 
        ORDER BY date DESC
      `);
      
      console.log(`✅ Found ${scans.length} scans`);
      res.json(scans);
    } catch (error) {
      console.error('❌ Error fetching scans:', error);
      res.status(500).json({ error: 'Failed to fetch scans' });
    }
  });

  // GET /api/scans/:id - Retrieve specific scan
  router.get('/scans/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`📊 Fetching scan with ID: ${id}`);
      
      const scan = await getQuery(`
        SELECT 
          id,
          patient_name,
          scan_type,
          risk_level,
          status,
          date,
          uploaded_by,
          notes,
          file_path
        FROM scans 
        WHERE id = ?
      `, [id]);
      
      if (!scan) {
        console.log(`❌ Scan not found: ${id}`);
        return res.status(404).json({ error: 'Scan not found' });
      }
      
      console.log(`✅ Found scan: ${scan.patient_name} - ${scan.scan_type}`);
      res.json(scan);
    } catch (error) {
      console.error('❌ Error fetching scan:', error);
      res.status(500).json({ error: 'Failed to fetch scan' });
    }
  });

  // POST /api/scans - Upload new scan (with multer middleware applied specifically here)
  router.post('/scans', upload.single('scan'), async (req, res) => {
    try {
      console.log('📤 Processing scan upload...');
      console.log('Request body:', req.body);
      console.log('File info:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');

      const { patientName, scanType } = req.body;
      const file = req.file;

      // Validate required fields
      if (!patientName || !scanType) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ error: 'Patient name and scan type are required' });
      }

      if (!file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: 'Scan file is required' });
      }

      console.log(`📋 Processing upload for patient: ${patientName}, scan type: ${scanType}`);

      // Get AI risk assessment
      console.log('🤖 Running AI risk assessment...');
      const riskAssessment = getRiskAssessment(scanType, file);
      console.log('✅ AI assessment complete:', riskAssessment.level);
      
      // Store file info (in WebContainer, we store metadata only)
      const filePath = `uploads/${Date.now()}_${file.originalname}`;
      
      // Insert scan record
      console.log('💾 Saving scan to database...');
      const result = await runQuery(`
        INSERT INTO scans (patient_name, scan_type, risk_level, status, file_path, notes) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        patientName,
        scanType,
        riskAssessment.level,
        'completed', // Set as completed for demo
        filePath,
        riskAssessment.details
      ]);

      console.log(`✅ Scan saved with ID: ${result.id}`);

      res.status(201).json({
        message: 'Scan uploaded successfully',
        scanId: result.id,
        riskAssessment: riskAssessment,
        scan: {
          id: result.id,
          patient_name: patientName,
          scan_type: scanType,
          risk_level: riskAssessment.level,
          status: 'completed',
          date: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error uploading scan:', error);
      res.status(500).json({ 
        error: 'Failed to upload scan',
        details: error.message 
      });
    }
  });

  // GET /api/users - Retrieve all users (admin only)
  router.get('/users', async (req, res) => {
    try {
      console.log('👥 Fetching all users...');
      const users = await allQuery(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.last_login,
          u.created_at,
          COUNT(s.id) as scans_count
        FROM users u
        LEFT JOIN scans s ON s.uploaded_by = u.name
        GROUP BY u.id, u.name, u.email, u.role, u.last_login, u.created_at
        ORDER BY u.name
      `);
      
      console.log(`✅ Found ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /api/stats - Get dashboard statistics
  router.get('/stats', async (req, res) => {
    try {
      console.log('📈 Calculating dashboard statistics...');
      const stats = {};
      
      // Total scans
      stats.totalScans = await getQuery('SELECT COUNT(*) as count FROM scans');
      
      // High risk cases
      stats.highRiskCases = await getQuery(
        'SELECT COUNT(*) as count FROM scans WHERE risk_level = ?', 
        ['high']
      );
      
      // Recent scans (this month)
      stats.recentScans = await getQuery(`
        SELECT COUNT(*) as count FROM scans 
        WHERE date >= date('now', 'start of month')
      `);
      
      // Active patients
      stats.activePatients = await getQuery(
        'SELECT COUNT(DISTINCT patient_name) as count FROM scans'
      );
      
      const result = {
        totalScans: stats.totalScans.count,
        highRiskCases: stats.highRiskCases.count,
        recentScans: stats.recentScans.count,
        activePatients: stats.activePatients.count
      };
      
      console.log('✅ Statistics calculated:', result);
      res.json(result);
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // POST /api/scans/:id/status - Update scan status
  router.post('/scans/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log(`📝 Updating scan ${id} status to: ${status}`);
      
      if (!['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      await runQuery(
        'UPDATE scans SET status = ? WHERE id = ?',
        [status, id]
      );
      
      console.log(`✅ Status updated for scan ${id}`);
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('❌ Error updating scan status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // DELETE /api/scans/:id - Delete scan
  router.delete('/scans/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Deleting scan: ${id}`);
      
      const result = await runQuery('DELETE FROM scans WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        console.log(`❌ Scan not found: ${id}`);
        return res.status(404).json({ error: 'Scan not found' });
      }
      
      console.log(`✅ Scan deleted: ${id}`);
      res.json({ message: 'Scan deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting scan:', error);
      res.status(500).json({ error: 'Failed to delete scan' });
    }
  });

  // POST /api/annotations - Save annotation (future feature)
  router.post('/annotations', async (req, res) => {
    try {
      const { scanId, position, note, type } = req.body;
      
      console.log(`📝 Saving annotation for scan ${scanId}:`, { position, note, type });
      
      // Future: Save to annotations table
      // For now, just acknowledge the request
      res.status(201).json({
        message: 'Annotation saved successfully',
        id: `ann-${Date.now()}`,
        scanId,
        position,
        note,
        type
      });
    } catch (error) {
      console.error('❌ Error saving annotation:', error);
      res.status(500).json({ error: 'Failed to save annotation' });
    }
  });

  // GET /api/annotations/:scanId - Get annotations for scan (future feature)
  router.get('/annotations/:scanId', async (req, res) => {
    try {
      const { scanId } = req.params;
      
      console.log(`📊 Fetching annotations for scan: ${scanId}`);
      
      // Future: Fetch from annotations table
      // For now, return empty array
      res.json([]);
    } catch (error) {
      console.error('❌ Error fetching annotations:', error);
      res.status(500).json({ error: 'Failed to fetch annotations' });
    }
  });

  return router;
}