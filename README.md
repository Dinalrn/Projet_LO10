Simple Micro Service Architecture

Backend : Python
Frontend : NextJS
Database : PostgreSQL

Architecture : Docker compose
Production : Docker swarm

Service : API, PostgreSQL, Adminer, NextJs web app.

To launch the the Docker network go to ARCHITECTURE/docker/README.md for documentation.

To access the API web interface go to :
http://localhost:8000

To access the Vercel frontend go to : 
http://localhost:3000/pages

To access the Database use adminer via :
http://localhost:8080

The secrets are given inside the docker-compose file in ARCHITECTURE/docker/compose.dev.yaml
=> The server name is the docker service name.

This is a template feel free to adapt it to your need; 
Some simple advise to start, create a .env file to enter secrets and open them inside the BACKEND_API/configuration.py file.

For the frontend I advise you to browse the Vercel template to copy one for a good start. 

For production uses the prod.Dockerfile for the frontend and not the dev.Dockerfile.


---

Here’s a clean, **concise English version** of your project that you can reuse as a prompt or presentation base, plus a **logical development roadmap** (very useful for interviews or planning).

---

# 🧠 WannaGo – Project Overview (English Prompt Version)

**WannaGo** is a microservices-based web/mobile application that helps users discover and plan activities (concerts, sports, cultural events, etc.) based on their preferences, location, social network, and external data sources. (For the moment based in France principaly)

The platform aggregates events from multiple APIs, enriches them (weather, popularity), and provides **personalized recommendations**.

---

## 🔑 Core Features

### 1. User Management (User Service)

* Authentication (JWT-based): sign up, login, logout, password management
* User profile: personal info, location, preferences
* Interests: activity types, mobility radius, weather preferences
* Social features: friends, shared activities
* History: viewed events, participations, reviews

---

### 2. Event Aggregation (Event Service)

* Fetch events from external APIs (Ticketmaster, OpenAgenda, etc.)
* Normalize data into a unified format
* Remove duplicates
* Multi-source aggregation
* Filtering (distance, date, category, price)
* Caching system for performance

---

### 3. Event Discovery & Visualization

* Interactive map (OpenStreetMap)
* Geolocation-based search
* Event list with sorting (distance, date, popularity)
* Pagination

---

### 4. Event Details

* Full event information (date, location, price, description, image)
* Weather forecast integration
* Distance from user
* Participation & sharing features
* Friends attending

---

### 5. Participation System

* Join / leave events
* View participants
* See friends attending

---

### 6. Reviews & Ratings

* Users can rate and review events
* Display average ratings and feedback

---

### 7. Recommendation Engine

Personalized suggestions based on:

* User preferences
* History
* Friends’ activity
* Distance
* Weather

Simple scoring example:

```
score = preferences + friends + weather + proximity
```

---

### 8. Weather Integration

* Current and forecast weather (OpenWeather API)
* Used for:

  * Display
  * Recommendation adjustments

---

### 9. API Gateway

* Central entry point for frontend
* Orchestrates microservices:

  * User Service
  * Event Service
  * Recommendation Service

Main endpoints:

* `/events`
* `/recommendations`
* `/users`
* `/login`
* `/friends`
* `/participation`
* `/review`

List of API i wanna use :
For cultural events
Ticketmaster (already implemented)
Data.culture.gouv.fr 
OpenAgenda API 
DATAtourisme

Weather :
OpenWeather

Maps:
OpenStreetMap


---

### 10. Social Features

* Friends activity feed
* Event sharing
* Group suggestions

---

### 11. Advanced Features (Bonus)

* AI (OpenAI):

  * Event summarization
  * Smart recommendations
  * Chatbot (“What to do this weekend?”)
* Notifications
* Trending analysis

---

### 12. Public API

* Expose event data for partners (tourism, Airbnb, etc.)
* REST API (JSON format)

---

### 13. Technical Architecture

* Microservices architecture
* Reverse proxy
* Caching (events, weather)
* Logging & monitoring (interceptors)
* REST APIs

---

# 🛠️ Suggested Development Roadmap (VERY IMPORTANT)

Here’s the **smart order** to build this project (this is what recruiters love to see 👇):

---

## 🥇 Phase 1 – Foundations (MVP Core)

👉 Goal: *Have a working app quickly*

1. **User Service (basic)**

   * Signup / Login (JWT)
   * Basic profile

2. **Event Aggregator (simple)**

   * Connect to ONE API (e.g. Ticketmaster)
   * Normalize data
   * Store events

3. **Basic API Gateway**

   * `/events`
   * `/login`

4. **Simple Event List (no map yet)**

   * Display events
   * Basic filtering (date, category)

---

## 🥈 Phase 2 – Usable Product

👉 Goal: *Make it actually useful*

5. **Geolocation + distance filtering**
6. **Interactive Map (OpenStreetMap)**
7. **Event Details Page**
8. **Participation system**

   * Join / leave event

---

## 🥉 Phase 3 – Social Layer

👉 Goal: *Add engagement*

9. Friends system
10. See friends’ events
11. Event sharing

---

## 🏅 Phase 4 – Intelligence

👉 Goal: *Make it smart*

12. Recommendation engine (simple scoring first)
13. Weather integration
14. Improve recommendations with weather

---

## 🚀 Phase 5 – Optimization & Scale

👉 Goal: *Make it production-ready*

15. Caching (events + weather)
16. Multi-API aggregation
17. Deduplication logic
18. Pagination & performance


---

# 💡 Key Insight (for interviews)

If you need a **strong one-liner explanation**:

> *“WannaGo is a microservices-based event discovery platform that aggregates multi-source data and provides personalized, context-aware recommendations using user preferences, geolocation, social signals, and weather conditions.”*

---

What has been done for the moment, using a python Template, i created a coerent backend using jwt autentification and wich already receive's data via an external API named Ticket master so phase 1 would be nearly complete.


# TODO :
Add a redis cash service to keep in front memory events (not only in the backend api),
weather implementation, recomandation algorithm, center map arround france

