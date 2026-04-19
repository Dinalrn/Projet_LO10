Here is our Backend architecture:

Coded in Python it worked based on a FastAPI API that redirect our front & HTTP access to our correct Python backend function.


Commande pour obtenir un token API
```{bash}
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "TON_USERNAME",
    "password": "TON_PASSWORD"
  }'
```

# Comeback exemple
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NDg4MjkzNH0.mOleP3bBelJs5sJJlPhmYyqCCSJeqlecZqovYjurtRs","token_type":"bearer"}
```

Command exemple
```{bash}
curl -X GET "http://localhost:8000/events/Troyes" \
  -H "Authorization: Bearer TON_TOKEN_ICI"
```

```{bash}
curl -X GET "http://localhost:8000/events/Troyes" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NDg4Njg0Nn0.DvW82wzZuM2x5o6Q2d6-wdW4QyOmyGHSFaXSvqNVLgw"
```

How to launch this service:
```{bash}
sudo docker-compose -f compose.dev.yaml up -d --build backend-api-service
```

LOCALISATION : ~/Projet_LO10/ARCHITECTURE/docker$
