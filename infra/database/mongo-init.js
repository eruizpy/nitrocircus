// MongoDB initialization script for NitroCircus
// This script runs automatically when MongoDB container starts for the first time
// via MONGO_INITDB_DATABASE environment variable

db = db.getSiblingDB('nitrocircus');

// Create collections with schema validation
db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['project', 'title', 'description', 'type', 'assignedAgent', 'state', 'createdAt'],
      properties: {
        project: { bsonType: 'string' },
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        type: { enum: ['feat', 'fix', 'docs', 'ops', 'test'] },
        assignedAgent: { enum: ['pm', 'frontend', 'backend', 'devops'] },
        state: {
          enum: [
            'backlog',
            'planned',
            'assigned',
            'awaiting_start_approval',
            'in_progress',
            'blocked',
            'in_review',
            'done',
            'delivered'
          ]
        },
        githubIssueNumber: { bsonType: ['int', 'null'] },
        githubPRNumber: { bsonType: ['int', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'status', 'createdAt'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        status: { enum: ['active', 'paused', 'completed', 'archived'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('audit_log', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['event', 'actor', 'timestamp'],
      properties: {
        event: { bsonType: 'string' },
        actor: { bsonType: 'string' },
        taskId: { bsonType: ['string', 'null'] },
        projectId: { bsonType: ['string', 'null'] },
        metadata: { bsonType: 'object' },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for performance
db.tasks.createIndex({ project: 1, state: 1 });
db.tasks.createIndex({ assignedAgent: 1, state: 1 });
db.tasks.createIndex({ githubIssueNumber: 1 }, { unique: true, sparse: true });
db.tasks.createIndex({ createdAt: -1 });

db.projects.createIndex({ name: 1 }, { unique: true });
db.projects.createIndex({ status: 1 });

db.audit_log.createIndex({ timestamp: -1 });
db.audit_log.createIndex({ actor: 1, timestamp: -1 });
db.audit_log.createIndex({ taskId: 1 });

// Create TTL index for audit log (optional: keep logs for 90 days)
// Uncomment the line below to enable automatic log cleanup after 90 days
// db.audit_log.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

print('✓ Collections created with validation rules');
print('✓ Indexes created for optimal query performance');
print('✓ Database initialization complete');
