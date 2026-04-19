# configuration.py 

import os

"""
Specific variables configuration file
"""

# programm settings class
class settings : 
    allowed_origins_list = ["*"]
    auth_username = "admin"
    auth_password = "admin"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    ALGORITHM = "HS256"

    # envent api route Ticketmaster
    TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY")
    BASE_URL = "https://app.ticketmaster.com/discovery/v1/events.json"

# env secret class
class secrets :
    postgre_pswd = "postgres" # passé tout en os.getenv()
    postgre_user = "postgres" # passé tout en os.getenv()
    postgre_db = "application_database" # passé tout en os.getenv()
    postgre_host = "postgres-service" # passé tout en os.getenv()
    postgre_port = 5432

    JWT_SECRET_KEY = "SUPER_SECRET"


