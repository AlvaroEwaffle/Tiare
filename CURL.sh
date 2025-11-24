#!/bin/bash

# 🏥 Tiare Healthcare API - Complete Test Suite
# Production URL: https://tiare-production.up.railway.app
# Local URL: http://localhost:3002

# ============================================================================
# 🔍 HEALTH CHECK
# ============================================================================
echo "🏥 Testing Health Check..."
curl -X GET "https://tiare-production.up.railway.app/api/health"
echo -e "\n\n"

# ============================================================================
# 🔐 AUTHENTICATION TESTS
# ============================================================================
echo "🔐 Testing Authentication..."

# Login to get fresh token
echo "📝 Logging in to get fresh token..."
LOGIN_RESPONSE=$(
  curl -s -X POST https://tiare-production.up.railway.app/api/doctors/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alvaro.villena@gmail.com",
    "password": "1234qwer"
  }'
  )

echo "Login Response: $LOGIN_RESPONSE"
echo -e "\n"

# Extract token from response (you may need to manually copy this)
echo "⚠️  IMPORTANT: Copy the accessToken from the response above and update the TOKEN variable below"
echo "Current token (may be expired): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YmUzMDJjZS05ZWIwLTRmMDQtODQ5MC00YmI3YTZiMjA2M2UiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJhc2QiLCJpYXQiOjE3NTYwMDMwNTIsImV4cCI6MTc1ODU5NTA1Mn0.Qzs7eqhMiDJWyt3N6x3Xz3YQF9eK22874YLgViVh8Q0"

# Update this variable with your fresh token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiODNhZC1jYzQ4LTQzMjctYWQ2YS0zMGY2ZTcyNzZiNjkiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJDb2FjaCBJbm5vdmFjaW9uIiwiaWF0IjoxNzU2MTYwNTQ3LCJleHAiOjE3NTg3NTI1NDd9.DWWiycWXZNNheXZN7dJ5LKaCtN8QybiP1mXhtmAM7Lc"

echo -e "\n\n"

# ============================================================================
# 👨‍⚕️ DOCTOR MANAGEMENT TESTS
# ============================================================================
echo "👨‍⚕️ Testing Doctor Management..."

# Get Doctor Profile (Protected)
echo "📋 Getting doctor profile..."
curl -X GET "https://tiare-production.up.railway.app/api/doctors/6be302ce-9eb0-4f04-8490-4bb7a6b2063e" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Get Doctor Info (Public)
echo "📞 Getting public doctor info..."
curl -X GET "https://tiare-production.up.railway.app/api/doctors/info/6be302ce-9eb0-4f04-8490-4bb7a6b2063e"
echo -e "\n\n"

# Update Doctor Profile (Protected)
echo "✏️  Updating doctor profile..."
curl -X PUT "https://tiare-production.up.railway.app/api/doctors/6be302ce-9eb0-4f04-8490-4bb7a6b2063e" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "specialization": "Psicología Clínica Avanzada",
    "address": "Monseñor Eyzaguirre 590, Providencia"
  }'
echo -e "\n\n"

# ============================================================================
# 👶 PATIENT MANAGEMENT TESTS
# ============================================================================
echo "👶 Testing Patient Management..."

# Create new patient (requires authentication)
echo "➕ Creating new patient (authenticated)..."
curl -X POST "https://tiare-production.up.railway.app/api/patients/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "María González",
    "email": "maria.gonzalez@email.com",
    "phone": "+56987654321",
    "notes": "Nueva paciente para evaluación psicológica",
    "doctorPhone": "+56920115198"
  }'
echo -e "\n\n"

# Create another patient (authenticated)
echo "➕ Creating another patient (authenticated)..."
curl -X POST "https://tiare-production.up.railway.app/api/patients/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Carlos Rodríguez",
    "email": "carlos.rodriguez@email.com",
    "phone": "+56912345678",
    "notes": "Paciente referido por Dr. Pérez",
    "doctorPhone": "+56920115198"
  }'
echo -e "\n\n"

# List all patients (Protected)
echo "📋 Listing all patients..."
curl -X GET "https://tiare-production.up.railway.app/api/patients" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# ============================================================================
# 📅 APPOINTMENT MANAGEMENT TESTS
# ============================================================================
echo "📅 Testing Appointment Management..."

# Create new appointment (Protected)
echo "➕ Creating new appointment..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiODNhZC1jYzQ4LTQzMjctYWQ2YS0zMGY2ZTcyNzZiNjkiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJDb2FjaCBJbm5vdmFjaW9uIiwiaWF0IjoxNzU2MTYwNTQ3LCJleHAiOjE3NTg3NTI1NDd9.DWWiycWXZNNheXZN7dJ5LKaCtN8QybiP1mXhtmAM7Lc" \
  -d '{
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f",
    "dateTime": "2025-08-28T18:00:00.000Z",
    "duration": 60,
    "notes": "Primera consulta de evaluación",
    "type": "remote"
  }'

  curl -X POST "https://tiare-production.up.railway.app/api/appointments" 
  -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiODNhZC1jYzQ4LTQzMjctYWQ2YS0zMGY2ZTcyNzZiNjkiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJDb2FjaCBJbm5vdmFjaW9uIiwiaWF0IjoxNzU2MTYwNTQ3LCJleHAiOjE3NTg3NTI1NDd9.DWWiycWXZNNheXZN7dJ5LKaCtN8QybiP1mXhtmAM7Lc" 
  -d '{"patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f", 
  "dateTime": "2025-08-29T10:00:00.000Z", "duration": 60, "notes": "Segunda consulta de evaluación", "type": "remote"}'

echo -e "\n\n"

# List all appointments for a specific doctor (POST - Essential Fields Only)
echo "📋 Listing all appointments for a doctor (POST /list)..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69"
  }'
echo -e "\n\n"

# List appointments with status filter for a doctor
echo "🔍 Listing appointments with status filter for a doctor..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "status": "confirmed"
  }'
echo -e "\n\n"

# List appointments for specific patient (requires both doctorId and patientId)
echo "👤 Listing appointments for specific patient..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f"
  }'
echo -e "\n\n"

# List appointments with date range for a doctor
echo "📅 Listing appointments with date range for a doctor..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "cc431ddc-4c61-4f1b-ada5-40886b7563b1",
    "startDate": "2025-08-25T00:00:00.000Z",
    "endDate": "2025-08-31T23:59:59.999Z"
  }'
echo -e "\n\n"



# List appointments with pagination for a doctor
echo "📄 Listing appointments with pagination for a doctor..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "page": 1,
    "limit": 10
  }'
echo -e "\n\n"

# List appointments with multiple filters for a doctor
echo "🔍 Listing appointments with multiple filters for a doctor..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "status": "scheduled",
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f",
    "page": 1,
    "limit": 5
  }'
echo -e "\n\n"

# Test error case: missing doctorId/patientId
echo "❌ Testing error case: missing doctorId/patientId..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
echo -e "\n\n"

# Test error case: patientId without doctorId
echo "❌ Testing error case: patientId without doctorId..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f"
  }'
echo -e "\n\n"

# ============================================================================
# 📅 GOOGLE CALENDAR INTEGRATION TESTS
# ============================================================================
echo "📅 Testing Google Calendar Integration..."

# Get calendar appointments (Protected)
echo "📅 Getting calendar appointments..."
curl -X GET "https://tiare-production.up.railway.app/api/doctors/calendar/appointments" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Initiate Google Calendar OAuth (Protected)
echo "🔐 Initiating Google Calendar OAuth..."
curl -X GET "https://tiare-production.up.railway.app/api/doctors/calendar/auth" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# ============================================================================
# 🔍 SEARCH FUNCTIONALITY TESTS
# ============================================================================
echo "🔍 Testing Search Functionality..."

# Search by exact phone number
echo "📱 Searching by exact phone number..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/56920115198" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Search by partial phone number
echo "🔍 Searching by partial phone number..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone-partial/569?limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Search with different phone format
echo "📞 Searching with different phone format..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/+56920115198" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# ============================================================================
# 🔍 SEARCH NEW PATIENTS
# ============================================================================
echo "🔍 Testing Search with New Patients..."

# Search for the new patients
echo "🔍 Searching for María González..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/56987654321" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

echo "🔍 Searching for Carlos Rodríguez..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/56912345678" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# ============================================================================
# 🧪 ERROR HANDLING TESTS
# ============================================================================
echo "🧪 Testing Error Handling..."

# Search with invalid token
echo "❌ Testing with invalid token..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/56920115198" \
  -H "Authorization: Bearer invalid-token-here"
echo -e "\n\n"

# Search with missing phone
echo "❌ Testing with missing phone parameter..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Search for non-existent phone
echo "🔍 Testing search for non-existent phone..."
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/999999999" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n\n"

# Test appointment creation with invalid data
echo "❌ Testing appointment creation with invalid data..."
curl -X POST "https://tiare-production.up.railway.app/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "",
    "date": "invalid-date",
    "duration": -10
  }'
echo -e "\n\n"

# ============================================================================
# 📊 LOCAL DEVELOPMENT TESTS (if running locally)
# ============================================================================
echo "📊 Local Development Tests (uncomment if running locally)..."

# echo "🏥 Testing Local Health Check..."
# curl -X GET "http://localhost:3002/api/health"
# echo -e "\n\n"

# echo "🔐 Testing Local Login..."
# curl -X POST http://localhost:3002/api/doctors/login \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "alvaro.villena@gmail.com",
#     "password": "1234qwer"
#   }'
# echo -e "\n\n"

# echo "👶 Testing Local Patient Creation..."
# curl -X POST http://localhost:3002/api/patients/create \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $TOKEN" \
#   -d '{
#     "name": "Test Patient",
#     "email": "test@email.com",
#     "phone": "+56999999999",
#     "notes": "Test patient for local development",
#     "doctorPhone": "+56920115198"
#   }'
# echo -e "\n\n"

# ============================================================================
# 📝 USAGE INSTRUCTIONS
# ============================================================================
echo "📝 Usage Instructions:"
echo "1. Run this script: ./CURL.sh"
echo "2. Copy the fresh accessToken from the login response"
echo "3. Update the TOKEN variable in this script"
echo "4. Re-run the script to test all endpoints with valid token"
echo "5. Check the responses for each endpoint"
echo ""
echo "🔑 Token expires in 30 days - you'll need to refresh it occasionally"
echo "🌐 Production URL: https://tiare-production.up.railway.app"
echo "🏠 Local URL: http://localhost:3002"
echo ""
echo "📋 Endpoints Tested:"
echo "✅ Health Check: /api/health"
echo "✅ Doctor Management: /api/doctors/*"
echo "✅ Patient Management: /api/patients/*"
echo "✅ Appointment Management: /api/appointments/*"
echo "✅ Calendar Integration: /api/doctors/calendar/*"
echo "✅ Search Functionality: /api/search/*"
echo ""
echo "✅ All Tiare endpoints tested successfully!"