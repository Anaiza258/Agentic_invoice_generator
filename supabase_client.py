# supabase_client.py
import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_customer(email: str, plan: str, status: str, license_key: str = None):
    """
    Save customer details into Supabase
    """
    response = supabase.table("customers").insert({
        "email": email,
        "plan": plan,
        "status": status,
        "license_key": license_key
    }).execute()
    return response
