#!/bin/bash

# Login and get token
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

# 1. A.P.M.C. Market Jain
echo "Registering A.P.M.C. Market Jain..."
curl -s -X POST http://localhost:4000/api/v1/temples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEMPLE",
    "name": "A.P.M.C. Market Jain",
    "city": "Navi Mumbai",
    "state": "Maharashtra",
    "pincode": "400703",
    "addressLine": "APMC Market, Sector 19, Vashi",
    "sect": "Shwetambar",
    "dharamshalaPhone": "9322500770",
    "hasBhojanshala": true,
    "district": "Mumbai Suburban"
  }'
echo -e "\n"

# 2. Shri Shantinath Jain Derasar
echo "Registering Shri Shantinath Jain Derasar..."
curl -s -X POST http://localhost:4000/api/v1/temples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEMPLE",
    "name": "Shri Shantinath Jain Derasar",
    "city": "Alibag",
    "state": "Maharashtra",
    "pincode": "402402",
    "addressLine": "Bazaar Road",
    "sect": "Shwetambar",
    "dharamshalaPhone": "9096447436, 9665435277",
    "hasBhojanshala": true,
    "district": "Raigad"
  }'
echo -e "\n"

# 3. Kailash Mandir
echo "Registering Kailash Mandir..."
curl -s -X POST http://localhost:4000/api/v1/temples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEMPLE",
    "name": "Kailash Mandir",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "410506",
    "addressLine": "Somatane Phata, Talegaon",
    "sect": "Shwetambar",
    "dharamshalaPhone": "9049301870, 9822661095",
    "hasBhojanshala": false,
    "district": "Pune"
  }'
echo -e "\n"

# 15. Sambhavnath Jain Shwetambar
echo "Registering Sambhavnath Jain Shwetambar..."
curl -s -X POST http://localhost:4000/api/v1/temples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEMPLE",
    "name": "Sambhavnath Jain Shwetambar",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "pincode": "416002",
    "addressLine": "5-D, Gujari, Sambhavnath Chowk, Bane Doctor Ke Baju",
    "sect": "Shwetambar",
    "dharamshalaPhone": "9420007902",
    "hasBhojanshala": false,
    "district": "Kolhapur"
  }'
echo -e "\n"

# 20. Shri Mahaveer Swami Jain Shwetambar
echo "Registering Shri Mahaveer Swami Jain Shwetambar..."
curl -s -X POST http://localhost:4000/api/v1/temples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEMPLE",
    "name": "Shri Mahaveer Swami Jain Shwetambar",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "pincode": "416201",
    "addressLine": "Kolhapur–Panhala Main Road, Mohan–Panhala",
    "sect": "Shwetambar",
    "dharamshalaPhone": "9730279485",
    "hasBhojanshala": false,
    "district": "Kolhapur"
  }'
echo -e "\n"

