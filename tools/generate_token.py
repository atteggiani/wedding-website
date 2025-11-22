#!/usr/bin/env python3
import secrets
import os
import string

# Folder where the script lives
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(SCRIPT_DIR, "tokens")

# Ensure file exists
if not os.path.exists(TOKEN_FILE):
    with open(TOKEN_FILE, "w") as f:
        pass

# Define a safe alphabet (letters + digits without some confusing characters)
ALPHABET = ''.join(c for c in 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789')

def generate_unique_token(length=5):
    """Generate a unique alphanumeric token."""
    # Load existing tokens
    existing_tokens = set()
    with open(TOKEN_FILE, "r") as f:
        for line in f:
            existing_tokens.add(line.strip())

    while True:
        token = ''.join(secrets.choice(ALPHABET) for _ in range(length))
        if token not in existing_tokens:
            with open(TOKEN_FILE, "a") as f:
                f.write(token + "\n")
            return token

if __name__ == "__main__":
    token = generate_unique_token()
    print(token)