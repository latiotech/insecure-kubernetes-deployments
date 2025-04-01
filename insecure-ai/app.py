import os
import tempfile
import zipfile
from flask import Flask, request, render_template, jsonify, url_for
from werkzeug.utils import secure_filename
import shutil
import threading
import time
import logging
import sys
import asyncio
from latio.core import full_agent_scan, partial_agent_scan
import markdown
import traceback
import gunicorn.app.base

# Set up logging before anything else
def setup_logging():
    try:
        # Create logs directory if it doesn't exist
        os.makedirs('/app/logs', exist_ok=True)
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.DEBUG)
        
        # Remove any existing handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Create formatters
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
        
        # File handler
        file_handler = logging.FileHandler('/app/logs/app.log')
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
        
        # Set up specific logger for our app
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.DEBUG)
        
        logger.info("Logging setup completed successfully")
        return logger
    except Exception as e:
        print(f"Error setting up logging: {str(e)}", file=sys.stderr)
        raise

# Initialize logging
logger = setup_logging()

# Add a custom exception handler for unhandled exceptions
def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
    else:
        logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))
sys.excepthook = handle_exception

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['APPLICATION_ROOT'] = '/ai'

# Configure url_for to use the correct prefix
def url_for_external(*args, **kwargs):
    url = url_for(*args, **kwargs)
    if app.config['APPLICATION_ROOT']:
        url = app.config['APPLICATION_ROOT'] + url
    return url

app.jinja_env.globals['url_for'] = url_for_external

# Gunicorn configuration
class GunicornConfig:
    def __init__(self):
        self.bind = "0.0.0.0:5000"
        self.workers = 4
        self.timeout = 120
        self.script_name = '/ai'

# Create gunicorn config object
gunicorn_config = GunicornConfig()

# Add error handler for Flask
@app.errorhandler(Exception)
def handle_error(error):
    error_msg = f"Flask error: {str(error)}\n{traceback.format_exc()}"
    logger.error(error_msg)
    return jsonify({'error': error_msg}), 500

# Add request logging middleware
@app.before_request
def log_request_info():
    logger.info('Request received: %s %s', request.method, request.url)
    logger.debug('Headers: %s', dict(request.headers))
    logger.debug('Form data: %s', dict(request.form))
    logger.debug('Files: %s', dict(request.files))
    logger.debug('Body: %s', request.get_data())

@app.after_request
def log_response_info(response):
    logger.debug('Response status: %s', response.status)
    logger.debug('Response headers: %s', dict(response.headers))
    logger.debug('Response body: %s', response.get_data())
    return response

# Add error logging for unhandled exceptions in threads
def thread_exception_handler(args):
    logger.error("Unhandled exception in thread: %s", args.exc_value, exc_info=(args.exc_type, args.exc_value, args.exc_traceback))
threading.excepthook = thread_exception_handler

ALLOWED_EXTENSIONS = {'zip'}

# Store analysis results
analysis_results = {}
analysis_status = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

async def analyze_directory(directory, analysis_id):
    try:
        analysis_status[analysis_id] = "running"
        logger.info(f"Starting analysis in directory: {directory}")
        
        # Check if directory exists and is accessible
        if not os.path.exists(directory):
            error_msg = f"Directory {directory} does not exist"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Log directory contents
        try:
            dir_contents = os.listdir(directory)
            logger.info(f"Directory contents: {dir_contents}")
        except Exception as e:
            logger.warning(f"Could not list directory contents: {e}")
        
        # Run the analysis using full_agent_scan
        try:
            logger.info("Starting full_agent_scan...")
            result = await full_agent_scan(directory, model='gpt-4o')
            logger.info("full_agent_scan completed successfully")
        except Exception as e:
            error_msg = f"Error during full_agent_scan: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Convert the result to a markdown string
        if isinstance(result, list):
            # Format each item as a markdown section
            result_str = "\n\n".join(f"## {item['title']}\n\n{item['description']}" for item in result)
        else:
            result_str = str(result)
        
        logger.info(f"Analysis completed successfully")
        analysis_results[analysis_id] = result_str
        analysis_status[analysis_id] = "completed"
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        analysis_results[analysis_id] = error_msg
        analysis_status[analysis_id] = "error"
    finally:
        # Clean up the temporary directory
        try:
            if os.path.exists(directory):
                shutil.rmtree(directory)
                logger.info(f"Cleaned up temporary directory: {directory}")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary directory: {e}")

def run_async_analysis(directory, analysis_id):
    try:
        logger.info(f"Starting async analysis for ID: {analysis_id}")
        asyncio.run(analyze_directory(directory, analysis_id))
    except Exception as e:
        error_msg = f"Error in async analysis thread: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        analysis_results[analysis_id] = error_msg
        analysis_status[analysis_id] = "error"

@app.route('/')
def index():
    logger.info("Serving index page")
    return render_template('index.html', url_for=url_for_external)

@app.route('/analyze', methods=['POST'])
def analyze():
    analysis_id = str(time.time())
    analysis_status[analysis_id] = "starting"
    
    try:
        logger.info(f"Received analyze request with ID: {analysis_id}")
        logger.debug(f"Request form data: {request.form}")
        logger.debug(f"Request files: {request.files}")
        
        if 'code' in request.form:
            # Create a temporary directory for the code
            temp_dir = tempfile.mkdtemp()
            logger.info(f"Created temporary directory: {temp_dir}")
            try:
                # Write the code to a file
                code_file = os.path.join(temp_dir, 'code.py')
                with open(code_file, 'w') as f:
                    f.write(request.form['code'])
                logger.info(f"Wrote code to {code_file}")
                
                # Start analysis in a separate thread
                thread = threading.Thread(target=run_async_analysis, args=(temp_dir, analysis_id))
                thread.start()
                logger.info(f"Started analysis thread for ID: {analysis_id}")
                
                return jsonify({'analysis_id': analysis_id})
            except Exception as e:
                error_msg = f"Error processing code: {str(e)}\n{traceback.format_exc()}"
                logger.error(error_msg)
                return jsonify({'error': error_msg}), 500
        
        elif 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if file and allowed_file(file.filename):
                # Create a temporary directory for the uploaded files
                temp_dir = tempfile.mkdtemp()
                logger.info(f"Created temporary directory: {temp_dir}")
                try:
                    # Save the uploaded file
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(temp_dir, filename)
                    file.save(filepath)
                    logger.info(f"Saved uploaded file to: {filepath}")
                    
                    # Extract the zip file
                    with zipfile.ZipFile(filepath, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                    logger.info("Extracted zip file contents")
                    
                    # Start analysis in a separate thread
                    thread = threading.Thread(target=run_async_analysis, args=(temp_dir, analysis_id))
                    thread.start()
                    logger.info(f"Started analysis thread for ID: {analysis_id}")
                    
                    return jsonify({'analysis_id': analysis_id})
                except Exception as e:
                    error_msg = f"Error processing file: {str(e)}\n{traceback.format_exc()}"
                    logger.error(error_msg)
                    return jsonify({'error': error_msg}), 500
            
            return jsonify({'error': 'Invalid file type'}), 400
        
        return jsonify({'error': 'No code or file provided'}), 400
    except Exception as e:
        error_msg = f"Unexpected error in analyze endpoint: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

@app.route('/status/<analysis_id>')
def get_status(analysis_id):
    logger.debug(f"Status check for analysis ID: {analysis_id}")
    if analysis_id not in analysis_status:
        logger.warning(f"Analysis ID not found: {analysis_id}")
        return jsonify({'error': 'Analysis ID not found'}), 404
    
    status = analysis_status[analysis_id]
    result = analysis_results.get(analysis_id) if status in ['completed', 'error'] else None
    
    logger.debug(f"Status for {analysis_id}: {status}")
    return jsonify({
        'status': status,
        'result': result
    })

@app.route('/view/<analysis_id>')
def view_result(analysis_id):
    logger.debug(f"View request for analysis ID: {analysis_id}")
    if analysis_id not in analysis_status:
        logger.warning(f"Analysis ID not found: {analysis_id}")
        return "Analysis not found", 404
    
    status = analysis_status[analysis_id]
    if status not in ['completed', 'error']:
        logger.info(f"Analysis {analysis_id} is still running")
        return "Analysis is still running", 400
    
    result = analysis_results.get(analysis_id)
    if not result:
        logger.warning(f"No results available for analysis ID: {analysis_id}")
        return "No results available", 404
    
    # Convert markdown to HTML
    html_content = markdown.markdown(result, extensions=['fenced_code', 'tables'])
    
    return render_template('view.html', content=html_content)

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(host='0.0.0.0', port=5000, debug=True) 