from app.core.llm import OllamaLLM
from app.core.kd100 import KD100Tracker
from app.utils.parser import parse_tracking_response
from langchain.tools import tool

# Initialize components
llm = OllamaLLM()
tracker = KD100Tracker("kDnRFSVRscyk5147", "770b5fda7e284fb8a8c938a780bbb54d")

# Create the prompt template
PROMPT_TEMPLATE = """You are a logistics tracking assistant using the KD100 tracking API. When given a tracking number, use the get_tracking_info_tool to look up the tracking information.

To look up tracking info:
1. Use the get_tracking_info_tool with the tracking number
2. Analyze the API response which includes:
   - Carrier information
   - Current status
   - Location details
   - Delivery updates
3. Provide a natural summary of the package status

Remember to:
- Only use the tool once per request
- Provide a clear, concise summary
- If no tracking number is provided, ask for one
- If there's an error response, explain it clearly to the user
- Format dates and times in a user-friendly way
- Always include the tracking number in backticks like this: `123456789`
- Format dates as YYYY-MM-DD HH:MM:SS

User Query: {input}"""

def get_tracking_info(tracking_number: str) -> dict:
    """Get real-time tracking information from KD100."""
    return tracker.get_tracking_info(tracking_number)

@tool
def get_tracking_info_tool(tracking_number: str) -> dict:
    """Retrieve tracking information for a given tracking number using KD100 API."""
    return get_tracking_info(tracking_number)

def create_tracking_response(user_input: str) -> tuple:
    """Create a tracking response from user input."""
    # Format the prompt
    prompt = PROMPT_TEMPLATE.format(input=user_input)
    
    # Get LLM response
    raw_response = llm(prompt)
    
    # Parse the response
    structured_response = parse_tracking_response(raw_response)
    
    return raw_response, structured_response 