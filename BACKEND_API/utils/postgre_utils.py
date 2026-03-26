# utils.postre_utils.py

from typing import List, Any, Optional

import psycopg2
from psycopg2.extensions import connection, cursor

from configuration import secrets
from utils.logger_utils import Logger

logger = Logger.get_logger("postgres")

# Synhtax for usage at line 223

class PostgreUtils:
    """
    PostgreSQL interaction class
    """

    _instance: Optional["PostgreUtils"] = None

    def __new__(cls) -> "PostgreUtils":
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super(PostgreUtils, cls).__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if hasattr(self, "conn"):
            return  # Prevent reinitialization in singleton

        self.host: str = secrets.postgre_host
        self.db_name: str = secrets.postgre_db
        self.user: str = secrets.postgre_user
        self.password: str = secrets.postgre_pswd
        self.port: int = secrets.postgre_port

        self.conn: connection = self.connect()

    def connect(self) -> connection:
        """
        PostgreSQL connector
        """
        try:
            conn = psycopg2.connect(
                host=self.host,
                database=self.db_name,
                user=self.user,
                password=self.password,
                port=self.port,
            )
            conn.autocommit = False
            logger.info("PostgreSQL connection established")
            return conn
        except Exception as e:
            logger.error(f"PostgreSQL connection failed: {e}")
            raise

    def get_ressource(self, ressource_name: str) -> List[Any]:
        """
        Generic GET resource placeholder
        """
        return []

    def post_ressource(self, ressource_name: str) -> List[Any]:
        """
        Generic POST resource placeholder
        """
        return []

    def add_user(self, user_name: str) -> str:
        """
        Add a user to the SQL database
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    INSERT INTO users (user_name, created_at)
                    VALUES (%s, NOW())
                """
                cur.execute(sql, (user_name,))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error inserting user: {e}")
            return "Failed"

    def delete_user(self, user_id: int) -> str:
        """
        Delete a user from the SQL database
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    DELETE FROM users
                    WHERE id = %s
                """
                cur.execute(sql, (user_id,))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error deleting user: {e}")
            return "Failed"

    def update_user(self, user_id: int, user_name: str) -> str:
        """
        Update a user in the SQL database
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    UPDATE users
                    SET user_name = %s
                    WHERE id = %s
                """
                cur.execute(sql, (user_name, user_id))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error updating user: {e}")
            return "Failed"

    def add_notes(self, message: str, author_id: int) -> str:
        """
        Add a note to the SQL database
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    INSERT INTO notes (message_content, created_at, updated_at, author)
                    VALUES (%s, NOW(), NOW(), %s)
                """
                cur.execute(sql, (message, author_id))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error inserting note: {e}")
            return "Failed"

    def delete_notes(self, notes_id: int) -> str:
        """
        Delete a note from the SQL database
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    DELETE FROM notes
                    WHERE id = %s
                """
                cur.execute(sql, (notes_id,))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error deleting note: {e}")
            return "Failed"

    def update_notes(self, message: str, author_id: int, notes_id: int) -> str:
        """
        Update a note only if author matches
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    UPDATE notes
                    SET message_content = %s,
                        updated_at = NOW()
                    WHERE id = %s
                      AND author = %s
                """
                cur.execute(sql, (message, notes_id, author_id))
                if cur.rowcount == 0:
                    raise ValueError("Note not found or author mismatch")
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error updating note: {e}")
            return "Failed"

    def initialisation_app_configuration(self) -> str:
        """
        Initial app configuration (run once)
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    INSERT INTO app_configuration (is_on_premise)
                    VALUES (TRUE)
                """
                cur.execute(sql)
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error creating app configuration: {e}")
            return "Failed"

    def update_app_configuration(self, on_premise: bool, home_name: str) -> str:
        """
        Update app configuration
        """
        try:
            with self.conn.cursor() as cur:
                sql = """
                    UPDATE app_configuration
                    SET home_name = %s,
                        is_on_premise = %s
                """
                cur.execute(sql, (home_name, on_premise))
            self.conn.commit()
            return "Success"
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error updating app configuration: {e}")
            return "Failed"


# How to use this utils ?

# from utils.postgre_utils import PostgreUtils

# db = PostgreUtils()
# db.add_user("Adrien")
