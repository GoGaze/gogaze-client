# GoGaze Server API Documentation

## Overview
This Django-based server provides a media display system with real-time communication capabilities. The system supports media file uploads, video transcoding, and real-time device control via WebSockets.

## Architecture
- **Framework**: Django 4.2 with Django REST Framework
- **Real-time Communication**: Django Channels with WebSocket support
- **Background Processing**: Celery with Redis broker
- **Database**: postgres
- **Message Broker**: Redis
- **ASGI Server**: Daphne

## Services Used

### 1. Django REST Framework
- **Purpose**: RESTful API endpoints for media management
- **Configuration**: Default settings with ModelViewSet

### 2. Django Channels
- **Purpose**: WebSocket support for real-time device communication
- **Backend**: Redis Channel Layer
- **Configuration**: `channels_redis.core.RedisChannelLayer`

### 3. Celery
- **Purpose**: Background video transcoding tasks
- **Broker**: Redis (localhost:6379/0)
- **Result Backend**: Redis (localhost:6379/0)

### 4. Redis
- **Purpose**: Message broker for Celery and Channel Layer
- **Port**: 6379
- **Database**: 0 (Celery), Default (Channels)

## API Endpoints

### Base URL
```
http://localhost:8000/api/
```

### Media Files API

#### 1. List Media Files
- **Endpoint**: `GET /api/media/`
- **Description**: Retrieve all media files
- **Response**: Array of media file objects
- **Example Response**:
```json
[
  {
    "id": 1,
    "title": "Sample Video",
    "file": "/media/uploads/sample.webm",
    "processed_file": "/media/processed/sample_processed.mp4",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
]
```

#### 2. Create Media File
- **Endpoint**: `POST /api/media/`
- **Description**: Upload a new media file
- **Content-Type**: `multipart/form-data`
- **Required Fields**:
  - `title`: String (max 255 characters)
  - `file`: File upload
- **Example Request**:
```bash
curl -X POST http://localhost:8000/api/media/ \
  -F "title=My Video" \
  -F "file=@/path/to/video.mp4"
```

#### 3. Retrieve Media File
- **Endpoint**: `GET /api/media/{id}/`
- **Description**: Get specific media file details
- **Parameters**:
  - `id`: Media file ID (integer)

#### 4. Update Media File
- **Endpoint**: `PUT /api/media/{id}/` or `PATCH /api/media/{id}/`
- **Description**: Update media file information
- **Parameters**:
  - `id`: Media file ID (integer)

#### 5. Delete Media File
- **Endpoint**: `DELETE /api/media/{id}/`
- **Description**: Delete a media file
- **Parameters**:
  - `id`: Media file ID (integer)

#### 6. Play Media on Device
- **Endpoint**: `POST /api/media/{id}/play/`
- **Description**: Send play command to a specific device via WebSocket
- **Parameters**:
  - `id`: Media file ID (integer)
- **Request Body**:
```json
{
  "device_id": "device_001"
}
```
- **Response**:
```json
{
  "status": "play command sent to device_001"
}
```

#### 7. Stop Media on Device
- **Endpoint**: `POST /api/media/{id}/stop/`
- **Description**: Send stop command to a specific device via WebSocket
- **Parameters**:
  - `id`: Media file ID (integer)
- **Request Body**:
```json
{
  "device_id": "device_001"
}
```
- **Response**:
```json
{
  "status": "stop command sent to device_001"
}
```

## WebSocket Endpoints

### Real-time Device Communication
- **Endpoint**: `ws://localhost:8000/ws/display/{device_id}/`
- **Description**: WebSocket connection for real-time device control
- **Parameters**:
  - `device_id`: Unique device identifier (string)
- **Connection Flow**:
  1. Client connects to WebSocket endpoint
  2. Server adds client to device-specific group
  3. Server can send commands to all devices in the group

#### WebSocket Message Format

**Play Command:**
```json
{
  "type": "play",
  "url": "/media/processed/video_processed.mp4"
}
```

**Stop Command:**
```json
{
  "type": "stop"
}
```

## Data Models

### MediaFile Model
```python
class MediaFile(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    processed_file = models.FileField(upload_to='processed/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

**Fields**:
- `id`: Auto-generated primary key
- `title`: Media file title (max 255 characters)
- `file`: Original uploaded file
- `processed_file`: Transcoded/processed file (nullable)
- `uploaded_at`: Upload timestamp

## Background Tasks

### Video Transcoding
- **Task**: `transcode_video`
- **Trigger**: Automatically triggered when a new video file is uploaded
- **Purpose**: Convert uploaded videos to optimized format for display devices
- **Supported Formats**: .mp4, .mov, .avi, .mkv, .webm
- **Output**: H.264 encoded MP4 with AAC audio
- **FFmpeg Settings**:
  - Video Codec: libx264
  - Preset: fast
  - CRF: 23
  - Audio Codec: aac
  - Audio Bitrate: 128k

## File Storage

### Media Files
- **Upload Directory**: `/media/uploads/`
- **Processed Directory**: `/media/processed/`
- **Static Files**: `/staticfiles/`
- **Admin Files**: `/staticfiles/admin/`

## Configuration

### Environment Variables
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (default: False)

### Database
- **Engine**: PostgreSQL
- **Default Database**: `gogaze_db`
- **Default User**: `postgres`
- **Default Host**: `localhost`
- **Default Port**: `5432`

### Redis Configuration
- **Host**: 127.0.0.1
- **Port**: 6379
- **Channel Layer Database**: Default
- **Celery Database**: 0

## Installation & Setup

### Prerequisites
- Python 3.8+
- PostgreSQL server
- Redis server
- FFmpeg (for video transcoding)

### Dependencies
```
Django==4.2
djangorestframework==3.14
channels==4.0
channels-redis==4.1
celery==5.3
redis==5.0
daphne==4.0
psycopg2-binary==2.9.7
python-decouple==3.8
```

### Setup Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Create PostgreSQL database
createdb gogaze_db

# Copy environment file and configure
cp env.example .env
# Edit .env file with your database credentials

# Run migrations
python manage.py migrate

# Start Redis server
redis-server

# Start Celery worker
celery -A goGaze_main worker --loglevel=info

# Start Django server
python manage.py runserver
```

### Environment Configuration
Create a `.env` file with the following variables:
```bash
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Configuration
DB_NAME=gogaze_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

## Error Handling

### API Errors
- **400 Bad Request**: Missing required fields (e.g., device_id for play command)
- **404 Not Found**: Media file not found
- **500 Internal Server Error**: Server-side processing errors

### WebSocket Errors
- **Connection Refused**: Device ID not provided or invalid
- **Group Send Failed**: Redis connection issues

## Usage Examples

### 1. Upload and Process Video
```bash
# Upload video
curl -X POST http://localhost:8000/api/media/ \
  -F "title=My Video" \
  -F "file=@video.webm"

# Check processing status
curl http://localhost:8000/api/media/1/
```

### 2. Play Video on Device
```bash
# Send play command
curl -X POST http://localhost:8000/api/media/1/play/ \
  -H "Content-Type: application/json" \
  -d '{"device_id": "display_001"}'
```

### 3. Stop Video on Device
```bash
# Send stop command
curl -X POST http://localhost:8000/api/media/1/stop/ \
  -H "Content-Type: application/json" \
  -d '{"device_id": "display_001"}'
```

### 4. WebSocket Connection (JavaScript)
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/display/device_001/');

socket.onopen = function(event) {
    console.log('Connected to device');
};

socket.onmessage = function(event) {
    const command = JSON.parse(event.data);
    if (command.type === 'play') {
        // Play the video
        videoElement.src = command.url;
        videoElement.play();
    } else if (command.type === 'stop') {
        // Stop the video
        videoElement.pause();
        videoElement.currentTime = 0;
    }
};
```

## Security Considerations

- **File Upload**: No file type validation implemented (should be added)
- **Authentication**: No authentication/authorization implemented
- **CORS**: No CORS configuration (add if needed for web clients)
- **Rate Limiting**: No rate limiting implemented

## Performance Notes

- **Video Processing**: Transcoding runs in background to avoid blocking API
- **WebSocket Groups**: Each device has its own group for targeted messaging
- **File Storage**: Local file storage (consider cloud storage for production)
- **Database**: PostgreSQL configured for production-ready deployment

## Monitoring & Logging

- **Celery Tasks**: Check Celery logs for transcoding status
- **WebSocket Connections**: Monitor active connections
- **File Processing**: Check processed files in `/media/processed/`

## Future Enhancements

1. **Authentication**: Add user authentication and authorization
2. **Playlist Management**: Add playlist creation and management
3. **Device Management**: Add device registration and status tracking
4. **File Validation**: Add file type and size validation
5. **Cloud Storage**: Integrate with cloud storage providers
6. **API Versioning**: Implement API versioning strategy
7. **Rate Limiting**: Add rate limiting for API endpoints
8. **Health Checks**: Add health check endpoints

