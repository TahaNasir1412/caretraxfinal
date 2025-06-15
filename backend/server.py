import json
import os
import socket
import psycopg2
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
import jwt
import bcrypt
from urllib.parse import urlparse, parse_qs
import threading

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'caretrax'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password'),
        port=os.getenv('DB_PORT', '5432')
    )

# Initialize database tables
def init_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            address TEXT,
            user_type VARCHAR(20) NOT NULL,
            department VARCHAR(100),
            role VARCHAR(100),
            patient_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Patients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            room VARCHAR(10),
            admission_date DATE,
            remaining_percentage FLOAT,
            last_checked TIMESTAMP,
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Weight data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weight_data (
            id SERIAL PRIMARY KEY,
            weight FLOAT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            patient_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Treatment records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS treatment_records (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            type VARCHAR(100) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            weight FLOAT,
            status VARCHAR(20),
            administered_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Billing records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS billing_records (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            amount VARCHAR(50) NOT NULL,
            description TEXT,
            status VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Emergency overrides table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emergency_overrides (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            staff_id VARCHAR(50),
            timestamp TIMESTAMP NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Drip Management Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drip_management (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            flow_rate FLOAT,
            substance VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Drip Replacement Log Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drip_replacement_log (
            id SERIAL PRIMARY KEY,
            patient_id VARCHAR(50) NOT NULL,
            old_drip_id INT NOT NULL,
            new_drip_id INT NOT NULL,
            replacement_time TIMESTAMP NOT NULL,
            reason TEXT,
            staff_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()

# Store the latest weight data (for backward compatibility)
latest_weight = {"weight": 0, "timestamp": datetime.now().isoformat()}

# Dictionary to store connected clients for real-time updates
connected_clients = {}

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
                # Original weight endpoint for Arduino
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
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO weight_data (weight, timestamp) VALUES (%s, %s)",
                    (latest_weight["weight"], latest_weight["timestamp"])
                )
                conn.commit()
                cursor.close()
                conn.close()
                
                print(f"📊 Received weight: {latest_weight['weight']} ml at {latest_weight['timestamp']}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
                
            elif self.path == '/api/auth/login':
                self.handle_login()
            elif self.path == '/api/auth/register':
                self.handle_register()
            elif self.path.startswith('/api/drip'):
                self.handle_drip_request()
            elif self.path.startswith('/api/patient'):
                self.handle_patient_request()
            elif self.path.startswith('/api/'):
                self.handle_api_request()
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Error processing POST request: {e}")
            self.send_response(500)
            self.end_headers()

    def do_GET(self):
        try:
            if self.path == '/weight':
                # Original weight endpoint
                response_data = {
                    "weight": latest_weight["weight"],
                    "timestamp": latest_weight["timestamp"]
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode())
            elif self.path == '/stream':
                self.handle_stream()
            elif self.path.startswith('/api/drip'):
                self.handle_drip_request()
            elif self.path.startswith('/api/patient'):
                self.handle_patient_request()
            elif self.path.startswith('/api/'):
                self.handle_api_request()
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Error processing GET request: {e}")
            self.send_response(500)
            self.end_headers()

    def handle_login(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email, password_hash, user_type FROM users WHERE email = %s AND user_type = %s",
            (data['email'], data['userType'])
        )
        user = cursor.fetchone()
        
        if user and bcrypt.checkpw(data['password'].encode('utf-8'), user[3].encode('utf-8')):
            # Generate JWT token
            token = jwt.encode({
                'user_id': user[0],
                'email': user[2],
                'user_type': user[4]
            }, 'your-secret-key', algorithm='HS256')
            
            response_data = {
                "success": True,
                "token": token,
                "user": {
                    "id": user[0],
                    "name": user[1],
                    "email": user[2],
                    "user_type": user[4]
                }
            }
            self.send_response(200)
        elif user is None:
            response_data = {"success": False, "needsAccount": True}
            self.send_response(404)
        else:
            response_data = {"success": False}
            self.send_response(401)
        
        cursor.close()
        conn.close()
        
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def handle_register(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (name, email, password_hash, phone, address, user_type, department, role, patient_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                data['name'],
                data['email'],
                password_hash,
                data['phone'],
                data['address'],
                data['userType'],
                data.get('department'),
                data.get('role'),
                data.get('patientId')
            ))
            conn.commit()
            
            response_data = {"success": True}
            self.send_response(200)
        except psycopg2.IntegrityError:
            response_data = {"success": False, "error": "Email already exists"}
            self.send_response(400)
        
        cursor.close()
        conn.close()
        
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def handle_api_request(self):
        # Handle other API endpoints for database operations
        # This would include endpoints for patients, treatments, billing, etc.
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "API endpoint"}).encode())

    def handle_drip_request(self):
        url_parts = urlparse(self.path)
        query_params = parse_qs(url_parts.query)
        patient_id = query_params.get('patient_id', [None])[0]

        if self.path.startswith('/api/drip/start') and self.command == 'POST':
            self.start_drip(patient_id)
        elif self.path.startswith('/api/drip/stop') and self.command == 'POST':
            self.stop_drip(patient_id)
        elif self.path.startswith('/api/drip/replace') and self.command == 'POST':
            self.replace_drip(patient_id)
        elif self.path.startswith('/api/drip/status') and self.command == 'GET':
            self.get_drip_status(patient_id)
        else:
            self.send_response(400)
            self.end_headers()

    def handle_patient_request(self):
        if self.path.startswith('/api/patient/status') and self.command == 'POST':
            self.update_patient_status()
        else:
            self.send_response(400)
            self.end_headers()

    def start_drip(self, patient_id):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO drip_management (patient_id, start_time, flow_rate, substance)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (patient_id, data['startTime'], data['flowRate'], data['substance']))

            drip_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()

            response_data = {"success": True, "drip_id": drip_id}
            self.send_response(200)
        except Exception as e:
            print(f"Error starting drip: {e}")
            response_data = {"success": False, "error": str(e)}
            self.send_response(500)

        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def stop_drip(self, patient_id):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE drip_management
                SET end_time = %s, status = 'completed'
                WHERE patient_id = %s AND id = %s AND status = 'active'
            ''', (data['endTime'], patient_id, data['drip_id']))

            conn.commit()
            cursor.close()
            conn.close()

            response_data = {"success": True}
            self.send_response(200)
        except Exception as e:
            print(f"Error stopping drip: {e}")
            response_data = {"success": False, "error": str(e)}
            self.send_response(500)

        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def replace_drip(self, patient_id):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Stop the old drip
            cursor.execute('''
                UPDATE drip_management
                SET end_time = %s, status = 'replaced'
                WHERE patient_id = %s AND id = %s AND status = 'active'
            ''', (data['replacementTime'], patient_id, data['old_drip_id']))

            # Start the new drip
            cursor.execute('''
                INSERT INTO drip_management (patient_id, start_time, flow_rate, substance)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (patient_id, data['replacementTime'], data['flowRate'], data['substance']))
            new_drip_id = cursor.fetchone()[0]

            # Log the replacement
            cursor.execute('''
                INSERT INTO drip_replacement_log (patient_id, old_drip_id, new_drip_id, replacement_time, reason, staff_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (patient_id, data['old_drip_id'], new_drip_id, data['replacementTime'], data['reason'], data['staff_id']))

            conn.commit()
            cursor.close()
            conn.close()

            response_data = {"success": True, "new_drip_id": new_drip_id}
            self.send_response(200)
        except Exception as e:
            print(f"Error replacing drip: {e}")
            response_data = {"success": False, "error": str(e)}
            self.send_response(500)

        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def get_drip_status(self, patient_id):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, start_time, end_time, flow_rate, substance, status
                FROM drip_management
                WHERE patient_id = %s AND status = 'active'
            ''', (patient_id,))
            drip = cursor.fetchone()
            cursor.close()
            conn.close()

            if drip:
                drip_data = {
                    "id": drip[0],
                    "start_time": str(drip[1]),
                    "end_time": str(drip[2]),
                    "flow_rate": drip[3],
                    "substance": drip[4],
                    "status": drip[5]
                }
                response_data = {"success": True, "drip": drip_data}
            else:
                response_data = {"success": True, "drip": None}
            self.send_response(200)
        except Exception as e:
            print(f"Error getting drip status: {e}")
            response_data = {"success": False, "error": str(e)}
            self.send_response(500)

        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def update_patient_status(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        patient_id = data.get('patient_id')
        status = data.get('status')

        if not patient_id or not status:
            self.send_response(400)
            self.end_headers()
            return

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE patients
                SET status = %s
                WHERE id = %s
            ''', (status, patient_id))
            conn.commit()
            cursor.close()
            conn.close()

            self.broadcast_status_update(patient_id, status)

            response_data = {"success": True}
            self.send_response(200)
        except Exception as e:
            print(f"Error updating patient status: {e}")
            response_data = {"success": False, "error": str(e)}
            self.send_response(500)

        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def handle_stream(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        client_address = self.client_address[0]
        connected_clients[client_address] = self.wfile

        try:
            while True:
                # Keep the connection alive
                import time
                time.sleep(1)
        except BrokenPipeError:
            print(f"Client {client_address} disconnected")
        finally:
            if client_address in connected_clients:
                del connected_clients[client_address]

    def broadcast_status_update(self, patient_id, status):
        message = json.dumps({"patient_id": patient_id, "status": status})
        for client in connected_clients.values():
            try:
                client.write(f"data: {message}\n\n".encode())
                client.flush()
            except BrokenPipeError:
                print("Client disconnected, removing from broadcast list")
                # Clean up disconnected clients in handle_stream instead
            except Exception as e:
                print(f"Error broadcasting to client: {e}")

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
    # Initialize database
    init_database()
    
    port = int(os.environ.get('PORT', 8000))
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, RequestHandler)
    
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:{port}"
    
    print('🚀 CareTrax Server Started!')
    print(f'📡 Your Server URL: {server_url}')
    print(f'📊 Weight Endpoint: {server_url}/weight')
    print(f'🔐 API Endpoints: {server_url}/api/*')
    print('=' * 50)
    print('📋 SHARE THIS IP WITH YOUR FRIEND:')
    print(f'   Arduino Server IP: {local_ip}')
    print('=' * 50)
    print('⏳ Waiting for data from Arduino...')
    print('🗄️ PostgreSQL database initialized')
    print('Press Ctrl+C to stop the server')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")

if __name__ == '__main__':
    run_server()
