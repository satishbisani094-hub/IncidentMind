import { getDb } from './client.js';
import { memoryService } from '../hindsight/memoryService.js';
import { IncidentRecord } from '../types/index.js';
import crypto from 'crypto';

export const seedIncidents: Partial<IncidentRecord>[] = [
  // Demo Seed Incident #1 (Payment API 503 Pool Exhaustion)
  {
    id: 'inc-seed-001',
    title: 'Payment API HTTP 503 service unavailable after release v2.4.1',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    service: 'Payment API',
    environment: 'production',
    errorMessage: 'HTTP 503 Service Unavailable: PoolTimedOutException connection pool size 10 exhausted',
    logExcerpt: `2026-09-15T08:14:22Z [ERROR] payment-worker-99: ConnectionPoolTimeoutException: Timeout waiting for connection from pool of max 10.
2026-09-15T08:14:25Z [WARN] api-gateway: Upstream Payment API returned HTTP 503.`,
    deploymentVersion: 'v2.4.1',
    description: 'Payment API returned 503 errors during morning spike post deployment v2.4.1.',
    rootCause: 'Database connection pool max size was defaulted to 10 in deployment v2.4.1 instead of 50, causing pool exhaustion under concurrency.',
    troubleshootingSteps: [
      'Checked gateway error rates (14% 503 errors)',
      'Inspected PostgreSQL connection metrics showing 10/10 active connections locked',
      'Identified config mismatch in db-pool.yaml'
    ],
    resolution: 'Increased database connection pool size from 10 to 50 in application deployment config and restarted Payment API pods.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-15T08:45:00Z',
    createdAt: '2026-09-15T08:14:00Z',
    updatedAt: '2026-09-15T08:45:00Z'
  },
  {
    id: 'inc-seed-002',
    title: 'Authentication Service HTTP 401 JWT validation failures',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Authentication Service',
    environment: 'production',
    errorMessage: 'JWTVerificationException: SignatureVerificationException invalid secret key signature',
    logExcerpt: `2026-09-12T11:02:11Z [ERROR] auth-svc-01: Invalid signature for key id auth-prod-2026.
2026-09-12T11:02:12Z [ERROR] auth-svc-02: RS256 key rotation secret key mismatched with Vault cache.`,
    deploymentVersion: 'v1.9.0',
    description: 'Users logged out across mobile and web clients due to JWT verification errors.',
    rootCause: 'Vault secret key rotation updated HMAC key without invalidating auth service local Redis key cache.',
    troubleshootingSteps: [
      'Checked Vault secret version',
      'Flushed stale Redis secret cache key auth:jwt:keys',
      'Triggered auth pod rolling restart'
    ],
    resolution: 'Flushed Redis JWT key cache and updated secret configuration synchronization hook.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-12T11:30:00Z',
    createdAt: '2026-09-12T11:00:00Z',
    updatedAt: '2026-09-12T11:30:00Z'
  },
  {
    id: 'inc-seed-003',
    title: 'Order Service high latency & DB deadlock on checkout transactions',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    service: 'Order Service',
    environment: 'production',
    errorMessage: 'PSQLException: ERROR: deadlock detected Process 4012 waits for ExclusiveLock on tuple',
    logExcerpt: `2026-09-10T14:22:01Z [ERROR] order-processor: PSQLException: ERROR: deadlock detected.
Detail: Process 4012 waits for ExclusiveLock on tuple (14,3) of relation inventory_items; Process 4015 waits for ShareLock.`,
    deploymentVersion: 'v3.1.0',
    description: 'Checkout failure rate spiked to 35% with SQL deadlocks during flash sale event.',
    rootCause: 'Unordered SQL UPDATE statements on inventory_items table in concurrent checkout transactions caused cyclic lock wait condition.',
    troubleshootingSteps: [
      'Analyzed PostgreSQL pg_stat_activity queries',
      'Identified out-of-order locking between order item IDs',
      'Applied explicit item ID sorting before acquiring row locks'
    ],
    resolution: 'Enforced ascending ID sorting on product locking queries inside order creation transaction block.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-10T15:10:00Z',
    createdAt: '2026-09-10T14:20:00Z',
    updatedAt: '2026-09-10T15:10:00Z'
  },
  {
    id: 'inc-seed-004',
    title: 'Notification Service RabbitMQ queue backlog & memory leak',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'Notification Service',
    environment: 'production',
    errorMessage: 'OutOfMemoryError: Java heap space - RabbitMQ consumer consumer-pool-4',
    logExcerpt: `2026-09-08T19:40:01Z [WARN] rabbitmq-node-1: Memory high watermark reached (14GB / 16GB).
2026-09-08T19:41:00Z [FATAL] notify-svc: java.lang.OutOfMemoryError: Java heap space.`,
    deploymentVersion: 'v1.4.2',
    description: 'Email and SMS delivery delayed by up to 45 minutes.',
    rootCause: 'Unacknowledged RabbitMQ messages accumulated in worker memory buffer due to auto-ack feature turned off without manual ack implementation.',
    troubleshootingSteps: [
      'Checked queue length (120,000 unacked messages)',
      'Restarted worker nodes with increased heap -Xmx4g',
      'Fixed channel prefetch count to 50'
    ],
    resolution: 'Configured manual message acknowledgment with prefetch count of 50 and increased heap size.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-08T20:30:00Z',
    createdAt: '2026-09-08T19:35:00Z',
    updatedAt: '2026-09-08T20:30:00Z'
  },
  {
    id: 'inc-seed-005',
    title: 'API Gateway HTTP 504 Gateway Timeout on upstream routing',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'API Gateway',
    environment: 'production',
    errorMessage: 'HTTP 504 Gateway Timeout: Upstream response timed out after 30000ms',
    logExcerpt: `2026-09-05T16:10:00Z [ERROR] envoy-gateway: upstream read error timeout.
2026-09-05T16:10:05Z [WARN] api-gateway: HTTP 504 returned to client 198.51.100.4.`,
    deploymentVersion: 'v4.0.2',
    description: 'External requests timing out on user profile and search endpoints.',
    rootCause: 'Envoy router proxy timeout was configured to 30s while upstream user-service DNS resolution hung on internal CoreDNS fallback.',
    troubleshootingSteps: [
      'Checked CoreDNS latency metrics',
      'Identified stale IPv6 DNS lookup attempts',
      'Disabled IPv6 upstream resolution in Envoy router config'
    ],
    resolution: 'Disabled IPv6 DNS resolution in Gateway proxy configuration and adjusted route timeout to 10s with fast failover.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-05T16:50:00Z',
    createdAt: '2026-09-05T16:05:00Z',
    updatedAt: '2026-09-05T16:50:00Z'
  },
  {
    id: 'inc-seed-006',
    title: 'Database Service disk space 98% full on primary DB node',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    service: 'Database Service',
    environment: 'production',
    errorMessage: 'StorageEngineError: No space left on device /var/lib/postgresql/data',
    logExcerpt: `2026-09-01T02:00:15Z [ALERT] node-exporter: Disk Space /dev/sda1 utilization 98.4%.
2026-09-01T02:05:00Z [ERROR] postgresql: WAL segment archive backlog 4500 files.`,
    deploymentVersion: 'v15.3',
    description: 'PostgreSQL primary node switched to read-only mode.',
    rootCause: 'WAL archive command failed silently due to S3 backup bucket permission change, filling local disk with unarchived WAL logs.',
    troubleshootingSteps: [
      'Inspected /var/lib/postgresql/data/pg_wal directory',
      'Restored S3 bucket PutObject permissions in IAM policy',
      'Triggered manual pg_archivecleanup'
    ],
    resolution: 'Fixed IAM policy for S3 WAL bucket, executed archive cleanup script, and purged old temp log files.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-01T03:15:00Z',
    createdAt: '2026-09-01T01:55:00Z',
    updatedAt: '2026-09-01T03:15:00Z'
  },
  {
    id: 'inc-seed-007',
    title: 'User Service Redis session cache cluster node failure',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'User Service',
    environment: 'production',
    errorMessage: 'RedisConnectionException: READONLY You can not write against a read only replica',
    logExcerpt: `2026-09-02T10:11:00Z [ERROR] user-svc: Cluster node 10.0.4.12 demoted to slave.
2026-09-02T10:11:02Z [ERROR] user-svc: RedisConnectionException: READONLY.`,
    deploymentVersion: 'v2.1.0',
    description: 'User profile updates failing with read-only error.',
    rootCause: 'Redis Cluster failover elected new master node but application connection pool failed to auto-refresh cluster topology.',
    troubleshootingSteps: [
      'Checked Redis cluster nodes status',
      'Updated Jedis/Lettuce client settings to enable enablePeriodicRefreshTopology'
    ],
    resolution: 'Enabled periodic topology refresh in Redis client settings and restarted application pods.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-09-02T10:40:00Z',
    createdAt: '2026-09-02T10:05:00Z',
    updatedAt: '2026-09-02T10:40:00Z'
  },
  {
    id: 'inc-seed-008',
    title: 'Payment API Stripe webhook signature validation timeout',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Payment API',
    environment: 'production',
    errorMessage: 'SignatureVerificationError: Invalid Stripe signature or timestamp drift > 300s',
    logExcerpt: `2026-08-28T14:00:10Z [ERROR] payment-webhook: Stripe signature verification failed. Timestamp drift 340s.`,
    deploymentVersion: 'v2.3.9',
    description: 'Payment confirmation webhooks failing causing delayed order fulfillments.',
    rootCause: 'NTP daemon drift on Payment API worker nodes caused local clock skew > 5 minutes.',
    troubleshootingSteps: [
      'Checked node system clock (chronyd status)',
      'Identified stopped chronyd service on worker node pool',
      'Synced clock using systemctl restart chronyd'
    ],
    resolution: 'Resynchronized server system clock via chronyd and automated NTP health checks in monitoring.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-28T14:25:00Z',
    createdAt: '2026-08-28T13:55:00Z',
    updatedAt: '2026-08-28T14:25:00Z'
  },
  {
    id: 'inc-seed-009',
    title: 'Authentication Service rate limiting false positive blocking users',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'Authentication Service',
    environment: 'production',
    errorMessage: 'HTTP 429 Too Many Requests: Client rate limit exceeded (100 req/min)',
    logExcerpt: `2026-08-25T09:12:00Z [WARN] rate-limiter: Client IP 10.0.0.1 rate limited (Cloudflare ingress IP).`,
    deploymentVersion: 'v1.8.4',
    description: 'All users behind Cloudflare proxy getting HTTP 429 status on login.',
    rootCause: 'Rate limiter evaluated Cloudflare reverse proxy IP (CF-Connecting-IP missing) instead of end-user IP.',
    troubleshootingSteps: [
      'Inspected nginx X-Forwarded-For configuration',
      'Identified missing set_real_ip_from Cloudflare IP ranges'
    ],
    resolution: 'Configured nginx proxy to extract CF-Connecting-IP for rate-limiting key generation.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-25T09:45:00Z',
    createdAt: '2026-08-25T09:05:00Z',
    updatedAt: '2026-08-25T09:45:00Z'
  },
  {
    id: 'inc-seed-010',
    title: 'Order Service Kafka consumer rebalance storm',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Order Service',
    environment: 'production',
    errorMessage: 'CommitFailedException: Commit cannot be completed since the group has already rebalanced',
    logExcerpt: `2026-08-20T18:00:22Z [ERROR] kafka-consumer-1: CommitFailedException: max.poll.interval.ms exceeded.`,
    deploymentVersion: 'v3.0.4',
    description: 'Order fulfillment event processing stalled in infinite consumer rebalance loop.',
    rootCause: 'Heavy invoice PDF generation inside Kafka consumer loop exceeded max.poll.interval.ms (300,000ms), triggering continuous consumer eviction.',
    troubleshootingSteps: [
      'Analyzed consumer poll interval duration',
      'Offloaded PDF generation to async thread pool',
      'Increased max.poll.interval.ms to 600,000ms'
    ],
    resolution: 'Offloaded heavy PDF processing to background worker threads and increased max.poll.interval.ms.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-20T19:00:00Z',
    createdAt: '2026-08-20T17:55:00Z',
    updatedAt: '2026-08-20T19:00:00Z'
  },
  {
    id: 'inc-seed-011',
    title: 'Notification Service SendGrid API rate limit threshold hit',
    severity: 'LOW',
    status: 'RESOLVED',
    service: 'Notification Service',
    environment: 'production',
    errorMessage: 'HTTP 429 SendGrid API: Rate limit 6000 requests per minute exceeded',
    logExcerpt: `2026-08-15T12:00:00Z [ERROR] sendgrid-client: HTTP 429 Too Many Requests.`,
    deploymentVersion: 'v1.3.0',
    description: 'Transactional email notifications failing during marketing campaign broadcast.',
    rootCause: 'Marketing email bulk job shared the same SendGrid API key and quota bucket as transactional emails.',
    troubleshootingSteps: [
      'Separated SendGrid API keys into sub-accounts',
      'Implemented exponential backoff with jitter on HTTP 429'
    ],
    resolution: 'Isolated SendGrid API keys between marketing and transactional queues, added exponential backoff retry policy.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-15T12:40:00Z',
    createdAt: '2026-08-15T11:55:00Z',
    updatedAt: '2026-08-15T12:40:00Z'
  },
  {
    id: 'inc-seed-012',
    title: 'Database Service connection leak on read replicas',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Database Service',
    environment: 'production',
    errorMessage: 'FATAL: sorry, too many clients already (max_connections=500)',
    logExcerpt: `2026-08-10T07:15:00Z [FATAL] postgres-read-02: FATAL: sorry, too many clients already.`,
    deploymentVersion: 'v15.2',
    description: 'Read operations failing across analytics dashboards.',
    rootCause: 'PgBouncer connection pooler crashed and application pods re-established direct unpooled connections to DB primary/replicas.',
    troubleshootingSteps: [
      'Restarted PgBouncer service daemon',
      'Configured application firewall to reject non-PgBouncer direct connections on port 5432'
    ],
    resolution: 'Restarted PgBouncer connection pooler and restricted database port 5432 ingress to PgBouncer host IPs.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-10T07:50:00Z',
    createdAt: '2026-08-10T07:00:00Z',
    updatedAt: '2026-08-10T07:50:00Z'
  },
  {
    id: 'inc-seed-013',
    title: 'API Gateway SSL certificate expiration on secondary endpoint domain',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    service: 'API Gateway',
    environment: 'production',
    errorMessage: 'SSL_ERROR_EXPIRED_CERTIFICATE: Certificate valid until 2026-08-04T00:00:00Z',
    logExcerpt: `2026-08-04T00:01:00Z [ERROR] envoy-ssl: TLS handshake failed for domain api-v2.company.com: Certificate expired.`,
    deploymentVersion: 'v4.0.0',
    description: 'All API requests to secondary domain blocked by browser TLS errors.',
    rootCause: 'Cert-manager ACME HTTP-01 challenge ingress route was blocked by newly deployed firewall rule.',
    troubleshootingSteps: [
      'Allowed ingress on /.well-known/acme-challenge/',
      'Manually renewed certificate via certbot renewal command'
    ],
    resolution: 'Unblocked ACME challenge route and re-issued Let\'s Encrypt TLS certificate via cert-manager.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-08-04T00:45:00Z',
    createdAt: '2026-08-04T00:02:00Z',
    updatedAt: '2026-08-04T00:45:00Z'
  },
  {
    id: 'inc-seed-014',
    title: 'User Service elasticsearch index mapping exception',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'User Service',
    environment: 'production',
    errorMessage: 'MapperParsingException: failed to parse field [metadata.created_at] of type [date]',
    logExcerpt: `2026-07-29T15:00:00Z [ERROR] es-indexer: MapperParsingException field created_at date format mismatched.`,
    deploymentVersion: 'v2.0.8',
    description: 'User directory search queries returning incomplete results.',
    rootCause: 'New deployment sent Unix timestamp in milliseconds instead of ISO-8601 string expected by Elasticsearch index template.',
    troubleshootingSteps: [
      'Updated Elasticsearch index mapping template to accept epoch_millis',
      'Reindexed user document index'
    ],
    resolution: 'Updated Elasticsearch mapping definition to support both ISO-8601 and epoch_millis timestamp formats.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-07-29T15:45:00Z',
    createdAt: '2026-07-29T14:50:00Z',
    updatedAt: '2026-07-29T15:45:00Z'
  },
  {
    id: 'inc-seed-015',
    title: 'Payment API PayPal IPN verification double-processing bug',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Payment API',
    environment: 'production',
    errorMessage: 'DuplicateTransactionException: Transaction ID paypal_tx_99812 already finalized',
    logExcerpt: `2026-07-20T11:20:00Z [ERROR] payment-paypal: Duplicate transaction record generated.`,
    deploymentVersion: 'v2.3.1',
    description: 'Customers charged twice on PayPal checkout.',
    rootCause: 'Idempotency lock key had a TTL of only 2 seconds, allowing concurrent PayPal webhooks to execute simultaneously.',
    troubleshootingSteps: [
      'Increased Redis idempotency lock key TTL to 60 seconds',
      'Issued refund for affected double-charge transactions'
    ],
    resolution: 'Increased Redis idempotency lock TTL from 2s to 60s and added database level unique constraint on payment transaction ref.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-07-20T12:30:00Z',
    createdAt: '2026-07-20T11:15:00Z',
    updatedAt: '2026-07-20T12:30:00Z'
  },
  {
    id: 'inc-seed-016',
    title: 'Authentication Service OAuth2 Google SSO callback failure',
    severity: 'HIGH',
    status: 'RESOLVED',
    service: 'Authentication Service',
    environment: 'production',
    errorMessage: 'OAuth2AuthenticationException: redirect_uri_mismatch for client_id 8812.apps.googleusercontent.com',
    logExcerpt: `2026-07-15T08:05:00Z [ERROR] auth-sso: Google OAuth callback error redirect_uri_mismatch.`,
    deploymentVersion: 'v1.8.0',
    description: 'Enterprise SSO login failing for Google Workspace users.',
    rootCause: 'Production HTTPS scheme was downgraded to HTTP in proxy headers, causing generated callback URL to use http:// instead of https://.',
    troubleshootingSteps: [
      'Checked X-Forwarded-Proto header configuration',
      'Added trust proxy true setting in Express app configuration'
    ],
    resolution: 'Enabled `app.set("trust proxy", true)` in Express application to correctly honor X-Forwarded-Proto headers.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-07-15T08:35:00Z',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-07-15T08:35:00Z'
  },
  {
    id: 'inc-seed-017',
    title: 'Order Service inventory lock timeout under load',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'Order Service',
    environment: 'production',
    errorMessage: 'RedlockTimeoutException: Unable to acquire Redis distributed lock inventory:item:8812',
    logExcerpt: `2026-07-08T17:40:00Z [ERROR] order-lock: RedlockTimeoutException: Lock wait duration > 1500ms.`,
    deploymentVersion: 'v3.0.0',
    description: 'Checkout abandoned cart errors during flash promotion.',
    rootCause: 'Redlock retry count was set to 3 with zero delay, giving up lock acquisition too quickly during high contention.',
    troubleshootingSteps: [
      'Adjusted Redlock retry count to 10 with 100ms exponential jitter delay'
    ],
    resolution: 'Updated Redis Redlock retry policy to 10 retries with randomized backoff delay.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-07-08T18:15:00Z',
    createdAt: '2026-07-08T17:30:00Z',
    updatedAt: '2026-07-08T18:15:00Z'
  },
  {
    id: 'inc-seed-018',
    title: 'Notification Service SMS provider Twilio 500 error spike',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    service: 'Notification Service',
    environment: 'production',
    errorMessage: 'TwilioRestException: [HTTP 500] Error 20001 Internal Server Error from Twilio',
    logExcerpt: `2026-07-01T13:00:00Z [WARN] notify-sms: Twilio API returning HTTP 500. Failover to Telesign triggered.`,
    deploymentVersion: 'v1.2.9',
    description: '2FA SMS code delivery failing for North American region.',
    rootCause: 'Twilio regional gateway outage in US-East region.',
    troubleshootingSteps: [
      'Switched SMS routing traffic to secondary vendor (Telesign) via feature flag'
    ],
    resolution: 'Toggled automated failover provider to Telesign until Twilio upstream restored service.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-07-01T13:30:00Z',
    createdAt: '2026-07-01T12:50:00Z',
    updatedAt: '2026-07-01T13:30:00Z'
  },
  {
    id: 'inc-seed-019',
    title: 'Database Service slow query execution on customer orders view',
    severity: 'LOW',
    status: 'RESOLVED',
    service: 'Database Service',
    environment: 'production',
    errorMessage: 'PostgresSlowQuery: Query execution time 14,200ms exceeded threshold 1000ms',
    logExcerpt: `2026-06-25T21:00:00Z [WARN] postgres-log: Sequential scan on orders table (12,000,000 rows).`,
    deploymentVersion: 'v15.1',
    description: 'Merchant dashboard order history page taking 15+ seconds to load.',
    rootCause: 'Missing composite index on (tenant_id, created_at DESC) after DB schema migration.',
    troubleshootingSteps: [
      'Ran EXPLAIN ANALYZE on slow query',
      'Created CONCURRENTLY index idx_orders_tenant_created'
    ],
    resolution: 'Created concurrent index `idx_orders_tenant_created` on `orders(tenant_id, created_at DESC)`.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-06-25T21:40:00Z',
    createdAt: '2026-06-25T20:50:00Z',
    updatedAt: '2026-06-25T21:40:00Z'
  },
  {
    id: 'inc-seed-020',
    title: 'API Gateway CORS preflight header rejection on modern browsers',
    severity: 'LOW',
    status: 'RESOLVED',
    service: 'API Gateway',
    environment: 'production',
    errorMessage: 'CORS policy violation: Access-Control-Allow-Origin header missing on OPTIONS preflight',
    logExcerpt: `2026-06-18T10:00:00Z [WARN] envoy-cors: OPTIONS request from https://app.company.com missing matching origin rule.`,
    deploymentVersion: 'v3.9.0',
    description: 'Web dashboard clients unable to make cross-origin API calls after domain change.',
    rootCause: 'New staging/prod frontend origin subdomains were missing in Gateway CORS allowed-origins list.',
    troubleshootingSteps: [
      'Updated gateway Envoy config map with wildcard match `https://*.company.com`'
    ],
    resolution: 'Updated Gateway CORS config to allow subdomains under `https://*.company.com` and reloaded proxy config.',
    outcome: 'SUCCESS',
    resolvedAt: '2026-06-18T10:25:00Z',
    createdAt: '2026-06-18T09:50:00Z',
    updatedAt: '2026-06-18T10:25:00Z'
  }
];

export async function runSeed() {
  console.log('🌱 Starting IncidentMind Seed Process...');
  const db = await getDb();

  // Clear existing records
  await db.run(`DELETE FROM agent_analyses`);
  await db.run(`DELETE FROM hindsight_memories`);
  await db.run(`DELETE FROM incidents`);

  console.log(`Clearing existing records... Done.`);

  for (const item of seedIncidents) {
    const record: IncidentRecord = {
      id: item.id || `inc-${crypto.randomUUID()}`,
      title: item.title || 'Untitled Incident',
      severity: item.severity || 'MEDIUM',
      status: item.status || 'RESOLVED',
      service: item.service || 'General Service',
      environment: item.environment || 'production',
      errorMessage: item.errorMessage || 'No error message',
      logExcerpt: item.logExcerpt || '',
      deploymentVersion: item.deploymentVersion || 'v1.0.0',
      description: item.description || '',
      rootCause: item.rootCause || '',
      troubleshootingSteps: item.troubleshootingSteps || [],
      resolution: item.resolution || '',
      outcome: item.outcome || 'SUCCESS',
      resolvedAt: item.resolvedAt || new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    };

    // Insert Incident into DB
    await db.run(
      `INSERT INTO incidents (
        id, title, severity, status, service, environment, errorMessage, logExcerpt, deploymentVersion, description, rootCause, troubleshootingSteps, resolution, outcome, resolvedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.title,
        record.severity,
        record.status,
        record.service,
        record.environment,
        record.errorMessage,
        record.logExcerpt,
        record.deploymentVersion,
        record.description,
        record.rootCause,
        JSON.stringify(record.troubleshootingSteps),
        record.resolution,
        record.outcome,
        record.resolvedAt,
        record.createdAt,
        record.updatedAt
      ]
    );

    // RETAIN in Hindsight Memory
    if (record.status === 'RESOLVED') {
      await memoryService.retainIncident(record);
    }
  }

  console.log(`✅ Successfully seeded ${seedIncidents.length} realistic production incidents into Database and Hindsight Memory!`);
}

// Allow direct execution
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed().catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}
