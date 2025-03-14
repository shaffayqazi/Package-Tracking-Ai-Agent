import re
from datetime import datetime

def parse_tracking_response(response: str) -> dict:
    """Parse the LLM response using regex and string processing to extract structured information."""
    # Initialize structured data
    tracking_data = {
        "tracking_number": None,
        "carrier": {
            "name": None,
            "full_name": None
        },
        "status": {
            "current": None,
            "timestamp": None,
            "location": None
        },
        "delivery": {
            "estimated_date": None,
            "delivered_date": None,
            "location": None
        },
        "updates": [],
        "raw_response": response
    }
    
    # Extract tracking number using regex
    tracking_match = re.search(r'`([A-Za-z0-9]+)`', response)
    if tracking_match:
        tracking_data["tracking_number"] = tracking_match.group(1)
    
    # Extract carrier information
    if "USPS" in response:
        tracking_data["carrier"]["name"] = "USPS"
        tracking_data["carrier"]["full_name"] = "United States Postal Service"
    
    # Extract dates and status using regex
    date_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'
    dates = re.finditer(date_pattern, response)
    date_positions = [(m.group(1), m.start()) for m in dates]
    
    # Sort dates by position in text
    date_positions.sort(key=lambda x: x[1])
    
    # Extract status information
    status_keywords = {
        "delivered": "Delivered",
        "in transit": "In Transit",
        "out for delivery": "Out for Delivery",
        "processing": "Processing"
    }
    
    # Split response into sentences
    sentences = [s.strip() for s in response.split('.') if s.strip()]
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        
        # Look for status updates
        for keyword, status in status_keywords.items():
            if keyword in sentence_lower:
                tracking_data["status"]["current"] = status
                # Associate with nearest date
                for date_str, _ in date_positions:
                    try:
                        date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                        if keyword == "delivered":
                            tracking_data["delivery"]["delivered_date"] = date.isoformat()
                        tracking_data["status"]["timestamp"] = date.isoformat()
                        break
                    except ValueError:
                        continue
        
        # Look for location information
        # Simple location extraction based on common patterns
        location_patterns = [
            r'in ([A-Za-z\s]+),\s*([A-Z]{2})',  # City, State
            r'to ([A-Za-z\s]+),\s*([A-Z]{2})',   # to City, State
            r'at ([A-Za-z\s]+),\s*([A-Z]{2})'    # at City, State
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, sentence)
            if location_match:
                location = f"{location_match.group(1)}, {location_match.group(2)}"
                if "delivered" in sentence_lower:
                    tracking_data["delivery"]["location"] = location
                else:
                    tracking_data["status"]["location"] = location
                break
    
    return tracking_data 