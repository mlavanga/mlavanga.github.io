#!/bin/bash
set -e

PID_FILE=".next.pid"
LOG_FILE="next.log"
PORT=3000
DIR="v2"

start_server() {
    if [ -f "$PID_FILE" ]; then
        if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
            echo "⚠️  Next.js Server is already running (PID: $(cat $PID_FILE))"
            return
        else
            rm "$PID_FILE"
        fi
    fi

    echo "🚀 Starting Next.js server..."
    cd $DIR
    nohup npm run dev -- -p $PORT > "../$LOG_FILE" 2>&1 &
    echo $! > "../$PID_FILE"
    cd ..
    
    sleep 5
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "✅ Next.js Server started on http://localhost:$PORT"
        echo "📄 Logs: tail -f $LOG_FILE"
    else
        echo "❌ Server failed to start. Check $LOG_FILE"
        cat "$LOG_FILE"
        exit 1
    fi
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        echo "🛑 Stopping Next.js server (PID: $PID)..."
        kill $PID || echo "Process not found."
        rm "$PID_FILE"
    else
        echo "ℹ️  No Next.js server running."
    fi
}

case "$1" in
    start)   start_server ;;
    stop)    stop_server ;;
    restart) stop_server; sleep 1; start_server ;;
    logs)    tail -f "$LOG_FILE" ;;
    status)
        if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
            echo "✅ Running (PID: $(cat $PID_FILE))"
        else
            echo "❌ Not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status}"
        start_server # Default to start
        ;;
esac
