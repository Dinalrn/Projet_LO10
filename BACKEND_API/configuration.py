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
    TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v1/events.json"

    # OpenAgenda (https://api.openagenda.com/v2)
    OPENAGENDA_API_KEY = os.getenv("OPENAGENDA_API_KEY")
    OPENAGENDA_BASE_URL = "https://api.openagenda.com/v2"

    # DataTourisme – local flux via diffuseur.datatourisme.fr
    # The URL below uses your account token to download your configured flux.
    # Log in to https://diffuseur.datatourisme.fr to verify/adjust the exact download URL.
    DATATOURISME_TOKEN = os.getenv("DATATOURISME_TOKEN")
    DATATOURISME_FLUX_URL = "https://diffuseur.datatourisme.fr/api/flux/1899215d-a6c7-4360-9792-df62177e5b3c"

    # data.culture.gouv.fr – Agenda Culturel dataset via Opendatasoft
    DATAGOUV_CULTURE_URL = "https://data.culture.gouv.fr/api/records/1.0/search"
    DATAGOUV_CULTURE_DATASET = "agenda-culturel-odp"

# env secret class
class secrets :
    postgre_pswd = "postgres" # passé tout en os.getenv()
    postgre_user = "postgres" # passé tout en os.getenv()
    postgre_db = "application_database" # passé tout en os.getenv()
    postgre_host = "postgres-service" # passé tout en os.getenv()
    postgre_port = 5432

    JWT_SECRET_KEY = "SUPER_SECRET"


