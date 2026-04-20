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

    # Ticketmaster
    TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY")
    TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

    # OpenAgenda (https://api.openagenda.com/v2)
    OPENAGENDA_API_KEY = os.getenv("OPENAGENDA_API_KEY")
    OPENAGENDA_BASE_URL = "https://api.openagenda.com/v2"

    # DataTourisme REST API (https://api.datatourisme.fr/v1)
    # Auth via X-API-Key header.  Key obtained at https://info.datatourisme.fr/utiliser-les-donnees
    DATATOURISME_TOKEN = os.getenv("DATATOURISME_TOKEN")
    DATATOURISME_BASE_URL = "https://api.datatourisme.fr/v1"

    # data.culture.gouv.fr – Agenda Culturel dataset via Opendatasoft
    DATAGOUV_CULTURE_URL = "https://data.culture.gouv.fr/api/records/1.0/search"
    DATAGOUV_CULTURE_DATASET = "agenda-culturel-odp"

    # OpenWeatherMap – free tier (2.5)
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# env secret class
class secrets :
    postgre_pswd = "postgres" # passé tout en os.getenv()
    postgre_user = "postgres" # passé tout en os.getenv()
    postgre_db = "application_database" # passé tout en os.getenv()
    postgre_host = "postgres-service" # passé tout en os.getenv()
    postgre_port = 5432

    JWT_SECRET_KEY = "SUPER_SECRET"


