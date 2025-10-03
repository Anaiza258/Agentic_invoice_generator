# payments.py
from flask import Blueprint, request, jsonify
import hmac, hashlib, os
from supabase_client import create_customer
from dotenv import load_dotenv

load_dotenv()

payments_bp = Blueprint("payments", __name__)

LEMON_SECRET = os.getenv("LEMON_WEBHOOK_SECRET")

def verify_signature(payload, signature):
    """ Verify Lemon Squeezy webhook signature """
    computed = hmac.new(
        LEMON_SECRET.encode(),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(computed, signature)

@payments_bp.route("/webhook", methods=["POST"])
def webhook():
    """ Handle Lemon Squeezy webhooks """
    payload = request.data
    signature = request.headers.get("X-Signature", "")

    if not verify_signature(payload, signature):
        return jsonify({"error": "Invalid signature"}), 400

    data = request.json
    event_type = data.get("meta", {}).get("event_name")
    attributes = data.get("data", {}).get("attributes", {})

    email = attributes.get("user_email")
    status = attributes.get("status")        # active, cancelled, etc.
    license_key = attributes.get("license_key")
    plan = attributes.get("product_name")    # Pro / Premium

    if email and plan:
        create_customer(email, plan, status, license_key)

    return jsonify({"status": "success"}), 200
