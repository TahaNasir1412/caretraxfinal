-- CareTrax Database Setup Script
-- Run this script to set up the PostgreSQL database

-- Create database (run this as postgres superuser)
-- CREATE DATABASE caretrax;

-- Connect to caretrax database and run the following:

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('staff', 'patient')),
    department VARCHAR(100),
    role VARCHAR(100),
    patient_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room VARCHAR(10),
    admission_date DATE,
    current_drip_volume INTEGER DEFAULT 1000, -- in ml
    remaining_percentage FLOAT DEFAULT 100,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weight data table for sensor readings
CREATE TABLE IF NOT EXISTS weight_data (
    id SERIAL PRIMARY KEY,
    weight FLOAT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drip records table
CREATE TABLE IF NOT EXISTS drip_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id),
    drip_type VARCHAR(100) NOT NULL DEFAULT 'Insulin Drip',
    volume_ml INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'replaced')),
    administered_by VARCHAR(255),
    replaced_by VARCHAR(255),
    replacement_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatment history table
CREATE TABLE IF NOT EXISTS treatment_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id),
    treatment_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    weight_at_time FLOAT,
    status VARCHAR(20),
    administered_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing records table
CREATE TABLE IF NOT EXISTS billing_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id),
    date DATE NOT NULL,
    amount_pkr DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency overrides table
CREATE TABLE IF NOT EXISTS emergency_overrides (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id),
    staff_id VARCHAR(50),
    override_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO patients (id, name, room, admission_date, current_drip_volume) VALUES
('P-123456', 'Taha Nasir', '101', '2025-02-15', 1000),
('P-234567', 'Abdullah Farhat', '102', '2025-02-14', 1000),
('P-345678', 'Abdullah Iqbal', '103', '2025-02-13', 1000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample drip records
INSERT INTO drip_records (patient_id, drip_type, volume_ml, start_time, administered_by) VALUES
('P-123456', 'Insulin Drip', 1000, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Dr. Sarah Johnson'),
('P-234567', 'Insulin Drip', 1000, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Dr. Sarah Johnson'),
('P-345678', 'Insulin Drip', 1000, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'Dr. Michael Chen')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weight_data_timestamp ON weight_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weight_data_patient ON weight_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_drip_records_patient ON drip_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
