#!/usr/bin/env python3

import socketio
import sys

def test_asgi_app_static_files():
    print("Testing socketio ASGIApp static files...")
    
    # Create a simple ASGI app to inspect
    sio = socketio.AsyncServer()
    app = socketio.ASGIApp(
        sio,
        static_files={
            '/test': 'test.html',
            '/api': {'filename': 'api.html', 'content_type': 'text/html'}
        }
    )
    
    print("ASGIApp created successfully")
    print("Has static_files:", hasattr(app, 'static_files'))
    
    if hasattr(app, 'static_files'):
        print("Static files content:", app.static_files)
        print("Static files type:", type(app.static_files))
        
        # Check if we can modify it
        print("Trying to modify static_files at runtime...")
        original_content = app.static_files.copy()
        app.static_files['/dynamic'] = 'dynamic.html'
        print("Modified static_files:", app.static_files)
        print("Runtime modification successful!")
        
        # Test another modification
        app.static_files['/another'] = {'filename': 'another.html', 'content_type': 'text/html'}
        print("Added complex entry:", app.static_files['/another'])
        
        # Delete an entry
        del app.static_files['/test']
        print("After deletion:", app.static_files)
        
    else:
        print("No static_files attribute found")
    
    # Check all attributes that might be related to static files
    print("\nAll attributes containing 'static':")
    static_attrs = [attr for attr in dir(app) if 'static' in attr.lower()]
    for attr in static_attrs:
        try:
            value = getattr(app, attr)
            print(f"  {attr}: {value}")
        except Exception as e:
            print(f"  {attr}: Error accessing - {e}")
    
    return app

if __name__ == "__main__":
    try:
        app = test_asgi_app_static_files()
        print("\nTest completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()