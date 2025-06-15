import json
import os
import socket
import psycopg2
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import threading
import time

# Database connection with environment variables
def get_db_connection():
    try:
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'caretrax'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

# Store the latest weight data (for backward compatibility)
latest_weight = {"weight": 0, "timestamp": datetime.now().isoformat()}

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        try:
            if self.path == '/':
                self.handle_weight_data()
            elif self.path == '/api/drip-replacement':
                self.handle_drip_replacement()
            elif self.path == '/api/patient-status-update':
                self.handle_patient_status_update()
            elif self.path == '/api/emergency-override':
                self.handle_emergency_override()
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Error processing POST request: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        try:
            if self.path == '/weight':
                self.handle_get_weight()
            elif self.path == '/api/patients':
                self.handle_get_patients()
            elif self.path.startswith('/api/patient/'):
                patient_id = self.path.split('/')[-1]
                self.handle_get_patient(patient_id)
            elif self.path == '/api/alerts':
                self.handle_get_alerts()
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Error processing GET request: {e}")
            self.send_response(500)
            self.end_headers()

    def handle_weight_data(self):
        """Handle weight data from Arduino"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        global latest_weight
        latest_weight = {
            "weight": data.get("weight", 0),
            "timestamp": datetime.now().isoformat()
        }
        
        # Save to database
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                
                # Insert weight data
                cursor.execute(
                    "INSERT INTO weight_data (weight, timestamp, patient_id) VALUES (%s, %s, %s)",
                    (latest_weight["weight"], latest_weight["timestamp"], 'P-123456')  # Default to Taha Nasir
                )
                
                # Update patient status based on weight
                self.update_patient_status_from_weight(cursor, 'P-123456', latest_weight["weight"])
                
                conn.commit()
                cursor.close()
                print(f"📊 Weight saved: {latest_weight['weight']} ml at {latest_weight['timestamp']}")
                
            except Exception as e:
                print(f"❌ Database error: {e}")
                conn.rollback()
            finally:
                conn.close()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "success"}).encode())


    def update_patient_status_from_weight(self, cursor, patient_id, weight):
        """Update patient status based on current weight and drip volume"""
        try:
            # Get current drip volume
            cursor.execute("SELECT current_drip_volume FROM patients WHERE id = %s", (patient_id,))
            result = cursor.fetchone()
            
            if result:
                drip_volume_ml = result[0]
                drip_volume_kg = drip_volume_ml / 1000  # Convert ml to kg
                
                # Calculate remaining percentage
                remaining_percentage = max(0, min(500, (weight / drip_volume_kg) * 100))
                # Determine status
                if remaining_percentage <= 100:
                    status = 'critical'
                elif remaining_percentage <= 50:
                    status = 'warning'
                else:
                    status = 'normal'
                
                # Update patient record
                cursor.execute("""
                    UPDATE patients 
                    SET remaining_percentage = %s, status = %s, last_checked = %s 
                    WHERE id = %s
                """, (remaining_percentage, status, datetime.now(), patient_id))
                
                # Create alert if critical
                if status == 'critical':
                    cursor.execute("""
                        INSERT INTO alerts (patient_id, alert_type, message, timestamp, severity)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        patient_id,
                        'low_drip',
                        f'Insulin drip level critically low ({remaining_percentage:.1f}%)',
                        datetime.now(),
                        'critical'
                    ))
                
        except Exception as e:
            print(f"❌ Error updating patient status: {e}")

    def handle_drip_replacement(self):
        """Handle drip replacement by staff"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                
                patient_id = data['patientId']
                new_volume = data['newVolume']
                replaced_by = data.get('replacedBy', 'Staff')
                
                # End current drip record
                cursor.execute("""
                    UPDATE drip_records 
                    SET status = 'replaced', end_time = %s, replaced_by = %s
                    WHERE patient_id = %s AND status = 'active'
                """, (datetime.now(), replaced_by, patient_id))
                
                # Create new drip record
                cursor.execute("""
                    INSERT INTO drip_records (patient_id, drip_type, volume_ml, start_time, administered_by)
                    VALUES (%s, %s, %s, %s, %s)
                """, (patient_id, 'Insulin Drip', new_volume, datetime.now(), replaced_by))
                
                # Update patient record
                cursor.execute("""
                    UPDATE patients 
                    SET current_drip_volume = %s, remaining_percentage = 100, status = 'normal', last_checked = %s
                    WHERE id = %s
                """, (new_volume, datetime.now(), patient_id))
                
                # Log treatment record
                cursor.execute("""
                    INSERT INTO treatment_records (patient_id, treatment_type, timestamp, administered_by, notes)
                    VALUES (%s, %s, %s, %s, %s)
                """, (patient_id, 'Drip Replacement', datetime.now(), replaced_by, f'Replaced with {new_volume}ml drip'))
                
                conn.commit()
                cursor.close()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Drip replaced successfully"}).encode())
                
            except Exception as e:
                print(f"❌ Drip replacement error: {e}")
                conn.rollback()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            finally:
                conn.close()

    def handle_get_weight(self):
        """Get latest weight data"""
        response_data = {
            "weight": latest_weight["weight"],
            "timestamp": latest_weight["timestamp"]
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def handle_get_patients(self):
        """Get all patients with current status"""
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, name, room, remaining_percentage, last_checked, status, current_drip_volume
                    FROM patients
                    ORDER BY name
                """)
                
                patients = []
                for row in cursor.fetchall():
                    patients.append({
                        "id": row[0],
                        "name": row[1],
                        "room": row[2],
                        "remainingPercentage": float(row[3]) if row[3] else 0,
                        "lastChecked": row[4].strftime("%I:%M %p") if row[4] else "",
                        "status": row[5],
                        "currentDripVolume": row[6]
                    })
                
                cursor.close()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(patients).encode())
                
            except Exception as e:
                print(f"❌ Get patients error: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            finally:
                conn.close()

    def handle_patient_status_update(self):
        """Handle manual patient status updates"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                
                patient_id = data['patientId']
                new_status = data['status']
                updated_by = data.get('updatedBy', 'Staff')
                
                cursor.execute("""
                    UPDATE patients 
                    SET status = %s, last_checked = %s
                    WHERE id = %s
                """, (new_status, datetime.now(), patient_id))
                
                # Log the status change
                cursor.execute("""
                    INSERT INTO emergency_overrides (patient_id, staff_id, override_type, timestamp, reason)
                    VALUES (%s, %s, %s, %s, %s)
                """, (patient_id, updated_by, 'status_override', datetime.now(), f'Status changed to {new_status}'))
                
                conn.commit()
                cursor.close()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
                
            except Exception as e:
                print(f"❌ Status update error: {e}")
                conn.rollback()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            finally:
                conn.close()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"

def run_server():
    port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, RequestHandler)
    
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:{port}"
    
    print('🚀 CareTrax Enhanced Server Started!')
    print(f'📡 Server URL: {server_url}')
    print(f'📊 Weight Endpoint: {server_url}/weight')
    print(f'🔗 API Endpoints: {server_url}/api/*')
    print('=' * 50)
    print('🗄️ PostgreSQL Integration Active')
    print('📋 Features:')
    print('   ✅ Real-time weight monitoring')
    print('   ✅ Drip replacement logging')
    print('   ✅ Patient status management')
    print('   ✅ Emergency overrides')
    print('   ✅ Alert system')
    print('=' * 50)
    print('⏳ Ready to receive data...')
    print('Press Ctrl+C to stop the server')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")

if __name__ == '__main__':
    run_server()
