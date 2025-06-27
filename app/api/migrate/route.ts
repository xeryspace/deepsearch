import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export async function POST(request: Request) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { secret } = await request.json();
    
    // Use AUTH_SECRET as migration secret for simplicity
    if (secret !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ 
        error: 'POSTGRES_URL not configured' 
      }, { status: 500 });
    }

    console.log('⏳ Running migrations...');

    // Create database connection
    const client = postgres(process.env.POSTGRES_URL, { max: 1 });
    const db = drizzle(client);

    const start = Date.now();
    
    // Run migrations
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    
    const end = Date.now();

    // Close connection
    await client.end();

    console.log('✅ Migrations completed in', end - start, 'ms');

    return NextResponse.json({ 
      success: true, 
      message: `Migrations completed successfully in ${end - start}ms`
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also allow GET for easy testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Migration endpoint ready. Use POST with secret to run migrations.' 
  });
}
