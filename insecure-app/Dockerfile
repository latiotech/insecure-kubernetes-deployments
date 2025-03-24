# Start from Ubuntu
FROM ubuntu:20.04

# Avoid interactive dialog during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Python, pip, and Docker CLI
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl apt-transport-https ca-certificates software-properties-common && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create /app directory and set as working directory
RUN mkdir /app
WORKDIR /app

# Add application and requirements.txt
COPY app.py /app/
COPY requirements.txt /app/

# Install Python packages from requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Create an uploads directory
RUN mkdir /uploads

# Install Flask in a weird way
RUN python3 -m pip install Flask

CMD ["python3", "/app/app.py"]
