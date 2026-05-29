import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ExecutionRow {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  canvas_data: string | null;
}

// Store active connections
const clients = new Map<number, ReadableStreamDefaultController[]>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const executionId = parseInt(url.searchParams.get('id') || '0');

  if (!executionId) {
    return NextResponse.json({ error: 'Execution ID required' }, { status: 400 });
  }

  const db = getDb();
  const execution = db.prepare('SELECT * FROM dag_executions WHERE id = ?').get(executionId) as ExecutionRow | undefined;

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the list
      if (!clients.has(executionId)) {
        clients.set(executionId, []);
      }
      clients.get(executionId)!.push(controller);

      // Send initial data
      const data = {
        ...execution,
        canvas_data: execution.canvas_data ? JSON.parse(execution.canvas_data) : null
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const execClients = clients.get(executionId);
        if (execClients) {
          const idx = execClients.indexOf(controller);
          if (idx > -1) execClients.splice(idx, 1);
        }
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to broadcast updates to all connected clients
export function broadcastUpdate(executionId: number, data: unknown) {
  const execClients = clients.get(executionId);
  if (!execClients) return;

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;

  execClients.forEach(controller => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch {
      // Client disconnected, will be cleaned up on next abort
    }
  });
}
