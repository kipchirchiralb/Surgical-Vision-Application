import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WebContainer-compatible SQLite database configuration
const DB_PATH = path.join(__dirname, '../../surgical_vision.db');
let db = null;

// Initialize database connection and create tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database at:', DB_PATH);
    });

    // Create tables and insert sample data
    db.serialize(() => {
      // Patients table
      db.run(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          date_of_birth DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Scans table
      db.run(`
        CREATE TABLE IF NOT EXISTS scans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_name TEXT NOT NULL,
          scan_type TEXT NOT NULL,
          file_path TEXT,
          risk_level TEXT DEFAULT 'low',
          status TEXT DEFAULT 'pending',
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          uploaded_by TEXT DEFAULT 'Dr. Smith',
          notes TEXT
        )
      `);

      // Models table for 3D visualization data
      db.run(`
        CREATE TABLE IF NOT EXISTS models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scan_id INTEGER,
          model_data TEXT,
          layers TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (scan_id) REFERENCES scans (id)
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'surgeon',
          password_hash TEXT,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // NEW: Annotations table for persistent surgical annotations
      db.run(`
        CREATE TABLE IF NOT EXISTS scan_annotations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scan_id INTEGER NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          position_z REAL NOT NULL,
          note TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          created_by TEXT DEFAULT 'Dr. Smith',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (scan_id) REFERENCES scans (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating annotations table:', err);
          reject(err);
          return;
        }
        
        // Insert sample data and resolve when complete
        insertSampleData(() => {
          resolve();
        });
      });
    });
  });
}

function insertSampleData(callback) {
  // Check if data already exists
  db.get("SELECT COUNT(*) as count FROM scans", (err, row) => {
    if (err) {
      console.error('Error checking existing data:', err);
      callback();
      return;
    }

    if (row.count === 0) {
      console.log('Inserting sample data...');
      
      let completedOperations = 0;
      const totalOperations = 12; // Updated count for annotations
      
      function checkComplete() {
        completedOperations++;
        if (completedOperations >= totalOperations) {
          console.log('Sample data inserted successfully');
          callback();
        }
      }
      
      // Insert sample patients
      const patients = [
        ['John Doe', 'john.doe@email.com', '555-0101', '1975-03-15'],
        ['Jane Smith', 'jane.smith@email.com', '555-0102', '1982-07-22'],
        ['Robert Johnson', 'robert.j@email.com', '555-0103', '1968-11-08'],
        ['Maria Garcia', 'maria.garcia@email.com', '555-0104', '1990-01-30']
      ];

      patients.forEach(patient => {
        db.run(
          "INSERT INTO patients (name, email, phone, date_of_birth) VALUES (?, ?, ?, ?)",
          patient,
          function(err) {
            if (err) console.error('Error inserting patient:', err);
            checkComplete();
          }
        );
      });

      // Insert sample scans with varying risk levels and dates
      const scans = [
        ['John Doe', 'CT', 'high', 'completed', '2024-01-15 10:30:00', 'Cranial CT showing concerning mass near temporal lobe'],
        ['Jane Smith', 'MRI', 'low', 'completed', '2024-01-14 14:20:00', 'Routine MRI scan, no abnormalities detected'],
        ['Robert Johnson', 'CT', 'medium', 'pending', '2024-01-13 09:15:00', 'Chest CT with possible nodule requiring follow-up'],
        ['Maria Garcia', 'X-Ray', 'low', 'completed', '2024-01-12 16:45:00', 'Standard X-ray, normal findings'],
        ['John Doe', 'MRI', 'high', 'pending', '2024-01-11 11:00:00', 'Follow-up MRI for surgical planning'],
        ['Jane Smith', 'CT', 'medium', 'completed', '2024-01-10 13:30:00', 'Abdominal CT with minor findings']
      ];

      scans.forEach(scan => {
        db.run(
          "INSERT INTO scans (patient_name, scan_type, risk_level, status, date, notes) VALUES (?, ?, ?, ?, ?, ?)",
          scan,
          function(err) {
            if (err) console.error('Error inserting scan:', err);
            checkComplete();
          }
        );
      });

      // Insert sample users
      const users = [
        ['Dr. Smith', 'dr.smith@hospital.com', 'surgeon'],
        ['Dr. Johnson', 'dr.johnson@hospital.com', 'surgeon'],
        ['Nurse Williams', 'nurse.williams@hospital.com', 'nurse'],
        ['Admin User', 'admin@hospital.com', 'admin']
      ];

      users.forEach(user => {
        db.run(
          "INSERT INTO users (name, email, role) VALUES (?, ?, ?)",
          user,
          function(err) {
            if (err) console.error('Error inserting user:', err);
            checkComplete();
          }
        );
      });

      // Insert sample annotations for demonstration
      const sampleAnnotations = [
        [1, 0.8, 0.2, 0.5, 'Critical vessel proximity - exercise extreme caution', 'critical', 'Dr. Smith'],
        [1, -0.5, 0.8, 0.3, 'Tumor boundary clearly defined', 'info', 'Dr. Smith'],
        [2, 0.2, -0.3, 0.7, 'Normal tissue structure', 'info', 'Dr. Johnson'],
        [3, 1.1, 0.5, -0.2, 'Potential surgical approach point', 'warning', 'Dr. Smith']
      ];

      sampleAnnotations.forEach(annotation => {
        db.run(
          "INSERT INTO scan_annotations (scan_id, position_x, position_y, position_z, note, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
          annotation,
          function(err) {
            if (err) console.error('Error inserting annotation:', err);
            checkComplete();
          }
        );
      });
    } else {
      // Data already exists, just call the callback
      callback();
    }
  });
}

// Database query functions
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export {
  initializeDatabase,
  getDatabase,
  runQuery,
  getQuery,
  allQuery,
  closeDatabase
};