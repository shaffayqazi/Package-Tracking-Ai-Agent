import requests
import hashlib
import json

class KD100Tracker:
    def __init__(self, api_key, secret):
        self.api_key = api_key
        self.secret = secret
        self.url = "https://www.kd100.com/api/v1/tracking/realtime"

    def get_tracking_info(self, tracking_number, carrier_id="usps"):
        # Prepare the request body
        body = {
            "carrier_id": carrier_id,
            "tracking_number": tracking_number,
            "area_show": 1,  # Show area details
            "order": "desc"  # Sort updates in descending order
        }
        body_str = json.dumps(body)

        # Generate signature (required for authentication)
        temp_sign = body_str + self.api_key + self.secret
        signature = hashlib.md5(temp_sign.encode()).hexdigest().upper()

        # Set headers
        headers = {
            "API-Key": self.api_key,
            "signature": signature,
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(self.url, headers=headers, data=body_str)
            response.raise_for_status()  # Raise an error for bad status codes
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"Failed to fetch tracking info: {str(e)}"} 