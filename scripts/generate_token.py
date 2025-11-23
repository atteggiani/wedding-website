#!/usr/bin/env python3
import os
import secrets
from supabase import create_client, Client

# -----------------------------
# Supabase settings
# -----------------------------
SUPABASE_URL = "https://bcyxjsqpvkywiuvaskvs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_API_KEY")
if not SUPABASE_KEY:
    raise ValueError("Please set SUPABASE_API_KEY env variable.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -----------------------------
# Token generation settings
# -----------------------------
ALPHABET = ''.join(c for c in 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789')
TOKEN_LENGTH = 5

# -----------------------------
# Helper functions
# -----------------------------
def load_existing_tokens():
    """Load all existing tokens from the guests table."""
    response = supabase.table("guests").select("token").execute()

    if response.data is None:
        raise Exception("Failed to fetch tokens from Supabase")

    return {row["token"] for row in response.data if row.get("token")}

def generate_unique_token(length=TOKEN_LENGTH):
    """Generate a unique token that does not exist in the database."""
    existing_tokens = load_existing_tokens()
    while True:
        token = ''.join(secrets.choice(ALPHABET) for _ in range(length))
        if token not in existing_tokens:
            return token

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    token = generate_unique_token()
    print(token)