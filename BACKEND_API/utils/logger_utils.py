# utils/logger_utils.py

import logging
import sys
from logging import Logger as BaseLogger


class Logger:
    _loggers = {}

    @classmethod
    def get_logger(
        cls,
        name: str = "homecloud",
        level: int = logging.INFO
    ) -> BaseLogger:
        """
        Create or return a configured logger instance.
        Prevents duplicated handlers.
        """

        if name in cls._loggers:
            return cls._loggers[name]

        logger = logging.getLogger(name)
        logger.setLevel(level)

        # Avoid duplicate logs
        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)

            formatter = logging.Formatter(
                fmt="%(asctime)s | %(levelname)s | %(name)s | %(filename)s:%(lineno)d | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )

            handler.setFormatter(formatter)
            logger.addHandler(handler)

        logger.propagate = False
        cls._loggers[name] = logger
        return logger
