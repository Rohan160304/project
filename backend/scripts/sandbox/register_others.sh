#!/bin/bash

echo "Logging in to get Super Admin token..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919999900000", "password": "ChangeMe@108", "device": {"os": "mac", "browser": "curl"}}')

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response was: $RESPONSE"
  exit 1
fi

echo "Logged in successfully."

echo "Registering Jain Center..."
curl -s -X POST http://localhost:4000/api/v1/jain-centers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "JAIN_CENTER",
    "name": "Global Jain Center",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "addressLine": "123 Jain Center Road",
    "sect": "Digambar",
    "emergencyContact": "9876543210",
    "district": "Mumbai City",
    "hasBhojanshala": false
  }'
echo -e "\n"

echo "Registering Dharamshala..."
curl -s -X POST http://localhost:4000/api/v1/dharamshalas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DHARAMSHALA",
    "name": "Shree Tirth Dharamshala",
    "city": "Palitana",
    "state": "Gujarat",
    "pincode": "364270",
    "addressLine": "Taleti Road",
    "sect": "Shwetambar",
    "emergencyContact": "9123456780",
    "district": "Bhavnagar",
    "hasBhojanshala": true,
    "bhojanshalaMealType": "JAIN_DIET"
  }'
echo -e "\n"

echo "Registering Community Page..."
curl -s -X POST http://localhost:4000/api/v1/community-pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jain Youth Community",
    "about": "A community for Jain youths across the world.",
    "ownerUserIds": ["cmsr55iq0016h2qebavfwbog7"],
    "communityVisibility": "PUBLIC",
    "geoVisibility": "Global",
    "joinApprovalMode": "AUTO",
    "orgType": "Community"
  }'
echo -e "\n"
