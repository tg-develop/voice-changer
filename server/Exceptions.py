import asyncio

class VoiceChangerIsNotSelectedException(Exception):
    def __str__(self):
        return repr("Voice Changer is not selected.")

class PretrainDownloadException(Exception):
    def __str__(self):
        return repr("Failed to download pretrain models.")

class DownloadVerificationException(Exception):
    def __init__(self, filename: str, got_hash: str, expected_hash: str) -> None:
        self.filename = filename
        self.got_hash = got_hash
        self.expected_hash = expected_hash

    def __str__(self):
        return repr(f"{self.filename} failed to pass hash verification check. Got {self.got_hash}, expected {self.expected_hash}")

class PipelineCreateException(Exception):
    def __str__(self):
        return repr("Failed to create Pipeline.")

class PipelineNotInitializedException(Exception):
    def __str__(self):
        return repr("Pipeline is not initialized.")

def handle_connection_reset(loop, context):
    """
    Custom exception handler to ignore connection reset errors.
    This prevents the console from being flooded with connection reset messages
    when clients disconnect unexpectedly.
    """
    # Ignore connection reset errors
    if 'exception' in context and isinstance(context['exception'], ConnectionResetError):
        return
    # Default handling for other exceptions
    loop.default_exception_handler(context)

def setup_event_loop():
    """
    Set up and return an asyncio event loop with connection reset handling.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.set_exception_handler(handle_connection_reset)
    return loop
