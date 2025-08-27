Token
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiODNhZC1jYzQ4LTQzMjctYWQ2YS0zMGY2ZTcyNzZiNjkiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJDb2FjaCBJbm5vdmFjaW9uIiwiaWF0IjoxNzU2MTYwNTQ3LCJleHAiOjE3NTg3NTI1NDd9.DWWiycWXZNNheXZN7dJ5LKaCtN8QybiP1mXhtmAM7Lc"

Fb Whatsapp Token
EAASNu2M79N0BPfLhnsYCHZBwCq5MyKMvZCLEOqtcJBsphUZBirXyoOuMLyvZANlY7EZBZBXlzR2OXFF9sYrqiTYGmYFfZBNXbWKIFZA41QRyYh2SPVuROUpic2c01iZAHnwSqqcflC6Km7XK7VAwZAcDKcqtG3gHF1BSe1wi8OlvHt6F5ETr8PmvKVZA0LGrpsZCtISYP7r8iDeODwUCUwsReKsZBHu97qC9MnEfE8ASPYpvr

Doctorid
cc431ddc-4c61-4f1b-ada5-40886b7563b1

PatientId
7ac564cc-c2b3-40ff-b92f-76b40da46582

curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdiODNhZC1jYzQ4LTQzMjctYWQ2YS0zMGY2ZTcyNzZiNjkiLCJ1c2VyVHlwZSI6ImRvY3RvciIsImVtYWlsIjoiYWx2YXJvLnZpbGxlbmFAZ21haWwuY29tIiwic3BlY2lhbGl6YXRpb24iOiJDb2FjaCBJbm5vdmFjaW9uIiwiaWF0IjoxNzU2MTYwNTQ3LCJleHAiOjE3NTg3NTI1NDd9.DWWiycWXZNNheXZN7dJ5LKaCtN8QybiP1mXhtmAM7Lc" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "cc431ddc-4c61-4f1b-ada5-40886b7563b1",
    "startDate": "2025-08-26T00:00:00.000Z",
    "endDate": "2025-08-28T23:59:59.999Z"
  }'