from flask import Blueprint, request, jsonify
from app.services.tracking import create_tracking_response, get_tracking_info_tool

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Logistics Tracking API',
        'version': '1.0'
    })

@api_bp.route('/track', methods=['POST'])
def track_package():
    """Handle natural language tracking queries"""
    try:
        data = request.json
        if not data or 'query' not in data:
            return jsonify({
                'error': 'Missing query parameter',
                'example': {
                    'query': 'Track my package with number 1234567890'
                }
            }), 400

        user_query = data['query']
        raw_response, structured_response = create_tracking_response(user_query)

        return jsonify({
            'success': True,
            'query': user_query,
            'raw_response': raw_response,
            'structured_response': structured_response
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error'
        }), 500

@api_bp.route('/track/<tracking_number>', methods=['GET'])
def track_by_number(tracking_number):
    """Handle direct tracking number lookups"""
    try:
        # Get raw tracking info
        tracking_info = get_tracking_info_tool(tracking_number)
        
        # Get natural language response
        raw_response, structured_response = create_tracking_response(f"Track package {tracking_number}")
        
        return jsonify({
            'success': True,
            'tracking_number': tracking_number,
            'raw_info': tracking_info,
            'raw_response': raw_response,
            'structured_response': structured_response
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve tracking information'
        }), 500 