#!/bin/bash

# Start the dev server in the background
next dev &

# Get the process ID of the dev server
DEV_PID=$!

echo "Dev server started with PID: $DEV_PID"

# Wait for 15 minutes (900 seconds)
sleep 900

echo "Stopping dev server..."
# Kill the process
kill $DEV_PID 