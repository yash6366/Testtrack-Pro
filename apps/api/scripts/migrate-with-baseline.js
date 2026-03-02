import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function migrate() {
  try {
    console.log('Running database migrations...');
    
    // Try to run migrate deploy
    await execAsync('npx prisma migrate deploy', {
      env: process.env,
      cwd: process.cwd()
    });
    
    console.log('✓ Migrations applied successfully');
  } catch (error) {
    // Check if it's the P3005 error (database not empty)
    if (error.stderr && error.stderr.includes('P3005')) {
      console.log('Database has tables but no migration history. Using db push instead...');
      
      try {
        await execAsync('npx prisma db push --accept-data-loss --skip-generate', {
          env: process.env,
          cwd: process.cwd()
        });
        console.log('✓ Database synced successfully with db push');
      } catch (pushError) {
        console.error('Failed to sync database:', pushError.message);
        process.exit(1);
      }
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }
}

migrate();
