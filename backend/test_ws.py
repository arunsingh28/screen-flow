import asyncio
import websockets
import sys

async def test_ws():
    uri = "ws://localhost:8000/api/v1/cv-processing/ws/test-user-id"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri, origin="http://localhost:5173") as websocket:
            print("Connected!")
            msg = await websocket.recv()
            print(f"Received: {msg}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
