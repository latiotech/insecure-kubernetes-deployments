# Code Security Analyzer

A Flask web application that allows users to analyze their code for security issues using the `latio` package.

## Features

- Paste code directly into the web interface
- Upload code as a ZIP file
- Real-time code analysis using `latio`
- Modern, responsive UI with syntax highlighting

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- `latio` package installed globally

## Installation

1. Clone this repository or download the files
2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask application:
   ```bash
   python app.py
   ```
2. Open your web browser and navigate to `http://localhost:5000`
3. Either paste your code into the text editor or upload a ZIP file containing your code
4. Click "Analyze Code" to run the security analysis
5. View the results in the results section below

## Security Considerations

- The application uses temporary directories for file processing
- File uploads are limited to 16MB
- Only ZIP files are accepted for upload
- All uploaded files are processed in isolated temporary directories
- The application runs in debug mode for development purposes

## License

MIT License 