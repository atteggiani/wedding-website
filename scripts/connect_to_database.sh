#!/bin/bash
# Connect to the database using psql

read -s -p "Password: " PASSWORD
psql postgresql://postgres:${PASSWORD}@db.bcyxjsqpvkywiuvaskvs.supabase.co:5432/postgres