/**
 * Migrate from JSON files to SQLite database
 * One-time migration script
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const models = require('./models');

// JSON file paths
const dataDir = path.join(__dirname, 'data');
const backupDir = path.join(__dirname, 'data-backup');

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting JSON to SQLite migration...\n');
  
  const stats = {
    projects: { total: 0, migrated: 0, errors: 0 },
    executions: { total: 0, migrated: 0, errors: 0 },
    events: { total: 0, migrated: 0, errors: 0 }
  };
  
  try {
    // Verify database connection
    const connectionTest = await db.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }
    console.log('✅ Database connection verified\n');
    
    // Migrate projects
    console.log('📦 Migrating projects...');
    const projectsResult = await migrateProjects();
    stats.projects = projectsResult;
    
    // Migrate executions
    console.log('\n⚙️  Migrating executions...');
    const executionsResult = await migrateExecutions();
    stats.executions = executionsResult;
    
    // Migrate events
    console.log('\n📊 Migrating events...');
    const eventsResult = await migrateEvents();
    stats.events = eventsResult;
    
    // Create backup
    console.log('\n💾 Creating backup of JSON files...');
    await createBackup();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nProjects:   ${stats.projects.migrated}/${stats.projects.total} migrated (${stats.projects.errors} errors)`);
    console.log(`Executions: ${stats.executions.migrated}/${stats.executions.total} migrated (${stats.executions.errors} errors)`);
    console.log(`Events:     ${stats.events.migrated}/${stats.events.total} migrated (${stats.events.errors} errors)`);
    console.log(`\nBackup saved to: ${backupDir}`);
    console.log('\n✨ You can now start the server with database mode enabled!');
    
    return stats;
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * Migrate projects from JSON to database
 */
async function migrateProjects() {
  const stats = { total: 0, migrated: 0, errors: 0 };
  
  try {
    const projectsFile = path.join(dataDir, 'projects.json');
    
    if (!fs.existsSync(projectsFile)) {
      console.log('⚠️  No projects.json found, skipping...');
      return stats;
    }
    
    const data = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    const projects = Object.values(data);
    stats.total = projects.length;
    
    for (const project of projects) {
      try {
        // Check if project already exists
        const existing = await models.projects.get(project.id);
        
        if (existing) {
          console.log(`  ⏭️  Project ${project.id} already exists, skipping...`);
          stats.migrated++;
          continue;
        }
        
        // Insert project
        await models.projects.create(project);
        stats.migrated++;
        console.log(`  ✅ Migrated project: ${project.name} (${project.id})`);
        
      } catch (error) {
        stats.errors++;
        console.error(`  ❌ Error migrating project ${project.id}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error reading projects.json:', error.message);
  }
  
  return stats;
}

/**
 * Migrate executions from JSON to database
 */
async function migrateExecutions() {
  const stats = { total: 0, migrated: 0, errors: 0 };
  
  try {
    const executionsFile = path.join(dataDir, 'executions.json');
    
    if (!fs.existsSync(executionsFile)) {
      console.log('⚠️  No executions.json found, skipping...');
      return stats;
    }
    
    const data = JSON.parse(fs.readFileSync(executionsFile, 'utf8'));
    const executions = Object.values(data);
    stats.total = executions.length;
    
    for (const execution of executions) {
      try {
        // Check if execution already exists
        const existing = await models.executions.get(execution.id);
        
        if (existing) {
          console.log(`  ⏭️  Execution ${execution.id} already exists, skipping...`);
          stats.migrated++;
          continue;
        }
        
        // Insert execution
        await models.executions.create(execution);
        stats.migrated++;
        console.log(`  ✅ Migrated execution: ${execution.workflowId} (${execution.id})`);
        
      } catch (error) {
        stats.errors++;
        console.error(`  ❌ Error migrating execution ${execution.id}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error reading executions.json:', error.message);
  }
  
  return stats;
}

/**
 * Migrate events from JSON to database
 */
async function migrateEvents() {
  const stats = { total: 0, migrated: 0, errors: 0 };
  
  try {
    const eventsFile = path.join(dataDir, 'events.json');
    
    if (!fs.existsSync(eventsFile)) {
      console.log('⚠️  No events.json found, skipping...');
      return stats;
    }
    
    const data = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    
    // Events might be stored as array or object
    const events = Array.isArray(data) ? data : Object.values(data);
    stats.total = events.length;
    
    for (const event of events) {
      try {
        // Check if event already exists
        const existing = await models.events.get(event.id);
        
        if (existing) {
          console.log(`  ⏭️  Event ${event.id} already exists, skipping...`);
          stats.migrated++;
          continue;
        }
        
        // Insert event
        await models.events.create(event);
        stats.migrated++;
        
        if (stats.migrated % 10 === 0) {
          console.log(`  ✅ Migrated ${stats.migrated}/${stats.total} events...`);
        }
        
      } catch (error) {
        stats.errors++;
        console.error(`  ❌ Error migrating event ${event.id}:`, error.message);
      }
    }
    
    console.log(`  ✅ Migrated all ${stats.migrated} events`);
    
  } catch (error) {
    console.error('Error reading events.json:', error.message);
  }
  
  return stats;
}

/**
 * Create backup of JSON files
 */
async function createBackup() {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const files = ['projects.json', 'executions.json', 'events.json'];
    
    for (const file of files) {
      const sourcePath = path.join(dataDir, file);
      
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, `${timestamp}-${file}`);
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`  ✅ Backed up ${file}`);
      }
    }
    
  } catch (error) {
    console.error('Error creating backup:', error.message);
  }
}

/**
 * Verify migration
 */
async function verify() {
  console.log('\n🔍 Verifying migration...\n');
  
  const projectCount = (await models.projects.list()).length;
  const executionCount = (await models.executions.list()).length;
  const eventCount = (await models.events.list({ limit: 10000 })).length;
  
  console.log(`Database contains:`);
  console.log(`  - ${projectCount} projects`);
  console.log(`  - ${executionCount} executions`);
  console.log(`  - ${eventCount} events`);
  
  return { projectCount, executionCount, eventCount };
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => verify())
    .then(() => {
      console.log('\n✅ Migration and verification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate, verify };
