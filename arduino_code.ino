#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "HX711.h"

// HX711 setup (DOUT, SCK)
HX711 scale(D5, D4);
float calibration_factor = -1154295.00;
float weight;

// WiFi credentials
const char* ssid = "Ali";
const char* password = "faaas123";

// Railway Server URL (CHANGED FROM LOCAL IP)
const char* serverURL = "https://caretraxserver.up.railway.app";

bool isStopped = false;
String inputString = "";

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("Connected to: ");
    Serial.println(ssid);
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Sending data to: ");
    Serial.println(serverURL);
  } else {
    Serial.println("\nWiFi NOT connected");
  }

  // Initialize HX711
  scale.set_scale();
  scale.tare();
  Serial.println("Scale initialized");
  Serial.println("Type 'stop' to pause measurements, 'start' to resume");
}

void loop() {
  // Check for serial input
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    inputString += inChar;
    if (inChar == '\n') {
      inputString.trim();
      if (inputString.equalsIgnoreCase("stop")) {
        isStopped = true;
        Serial.println("⏸️ Measurement stopped.");
      } else if (inputString.equalsIgnoreCase("start")) {
        isStopped = false;
        Serial.println("▶️ Measurement resumed.");
      }
      inputString = "";
    }
  }

  if (!isStopped) {
    // Measure weight
    scale.set_scale();
    scale.tare();
    scale.set_scale(calibration_factor);
    weight = scale.get_units(5);

    Serial.print("📊 Measured Weight: ");
    Serial.print(weight);
    Serial.println(" KG");

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;
      
      // Use HTTPS for Railway (CHANGED FROM HTTP)
      http.begin(client, serverURL);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"weight\":" + String(weight, 3) + "}";
      int httpResponseCode = http.POST(payload);

      if (httpResponseCode > 0) {
        Serial.print("✅ Data sent successfully to Railway. Response: ");
        Serial.println(httpResponseCode);
        String response = http.getString();
        Serial.print("📡 Server response: ");
        Serial.println(response);
      } else {
        Serial.print("❌ Error sending data: ");
        Serial.println(http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    } else {
      Serial.println("📶 WiFi not connected. Data not sent.");
      // Try to reconnect
      WiFi.begin(ssid, password);
    }

    delay(2000); // Send data every 2 seconds (increased from 200ms)
  }
  
  delay(100); // Small delay for serial input checking
}
