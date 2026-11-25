"""Errors the repo raises; main.py turns them into 404 and 422 replies."""


class NotFound(Exception):
    """A record that doesn't exist (404)."""


class Invalid(Exception):
    """A request that can't be carried out as sent (422)."""
