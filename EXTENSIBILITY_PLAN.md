# Extensibility Plan for Integration System

## Current State (Minimal - Working Now)
- ✅ 1 user = 1 integration (simple lookup)
- ✅ Basic routing to integration processors
- ✅ No breaking changes to existing payment logic

## Future Extensions (Add When Needed)

### Extension 1: Multiple Integrations Per User
**When to add:** When you need one user to have multiple integrations

**Changes needed:**
1. Update `getUserIntegration()` → `getUserIntegrations()` (returns array)
2. Add routing logic to select which integration to use
3. Migration: No schema change needed (already supports multiple rows per user)

**Code change:**
```typescript
// Current: Returns single integration
async getUserIntegration(userId: string): Promise<string>

// Extended: Returns multiple integrations
async getUserIntegrations(userId: string): Promise<UserIntegrationMappingEntity[]>
```

### Extension 2: Private vs Shared Integrations
**When to add:** When you need to mark integrations as private (only for specific user) or shared (for multiple users)

**Changes needed:**
1. Add `isPrivate` column to `user_integration_mappings` table
2. Update routing logic:
   - If user has private integrations → use those
   - If no private integrations → use shared integrations (where isPrivate = false)
3. Migration: Add column with default value

**Schema change:**
```sql
ALTER TABLE user_integration_mappings 
ADD COLUMN "isPrivate" boolean DEFAULT false;
```

**Routing logic:**
```typescript
// 1. Check for private integrations first
const privateIntegrations = await getPrivateIntegrations(userId);
if (privateIntegrations.length > 0) {
  return routeFromPrivateIntegrations(privateIntegrations);
}

// 2. Fallback to shared integrations
const sharedIntegrations = await getSharedIntegrations();
return routeFromSharedIntegrations(sharedIntegrations);
```

### Extension 3: Routing Strategies
**When to add:** When you need round-robin, amount-based, priority-based routing

**Changes needed:**
1. Add `routingStrategy` column to `user_integration_mappings` table
2. Add routing config table (optional, for global config)
3. Create routing strategy services (round-robin, amount-based, etc.)
4. Update router service to use strategies

**Schema change:**
```sql
ALTER TABLE user_integration_mappings 
ADD COLUMN "routingStrategy" varchar(50); -- 'ROUND_ROBIN', 'AMOUNT_BASED', etc.
```

**Code structure:**
```typescript
// Router service checks strategy and routes accordingly
switch (mapping.routingStrategy) {
  case 'ROUND_ROBIN':
    return roundRobinStrategy.select(integrations);
  case 'AMOUNT_BASED':
    return amountBasedStrategy.select(integrations, amount);
  // ...
}
```

### Extension 4: Usage Statistics
**When to add:** When you need to track how much each integration is used

**Changes needed:**
1. Create `integration_usage_stats` table
2. Add stats service to record transactions
3. Update payment service to record stats after each transaction

**Schema:**
```sql
CREATE TABLE integration_usage_stats (
  id varchar PRIMARY KEY,
  integrationCode varchar(50),
  userId varchar, -- null for global stats
  date date,
  transactionCount int,
  totalAmount decimal(15,2),
  successCount int,
  failedCount int
);
```

## Migration Strategy

### Phase 1: Current (Minimal) ✅
- Simple 1:1 mapping
- Works for current needs

### Phase 2: Add Private/Shared (When Needed)
- Add `isPrivate` column
- Update service to check private first, then shared
- **No breaking changes** - existing code still works

### Phase 3: Add Multiple Integrations (When Needed)
- Change `getUserIntegration()` to `getUserIntegrations()`
- Add routing logic
- **Backward compatible** - can add default behavior for single integration

### Phase 4: Add Routing Strategies (When Needed)
- Add `routingStrategy` column
- Add strategy services
- **Backward compatible** - default to first integration if no strategy

### Phase 5: Add Usage Stats (When Needed)
- Add stats table
- Add stats service
- **No breaking changes** - just additional tracking

## Key Design Principles

1. **Backward Compatible**: Each extension doesn't break existing code
2. **Additive Only**: New columns have defaults, new services are optional
3. **Gradual Migration**: Can add features one at a time
4. **Database First**: Schema changes are additive (add columns, don't remove)

## Example: How It Will Work in Future

```typescript
// Future flow with all features:
async createPayInTransaction(dto, user) {
  // 1. Get user's integrations (multiple possible)
  const mappings = await integrationMappingService.getUserIntegrations(user.id);
  
  // 2. Separate private vs shared
  const privateMappings = mappings.filter(m => m.isPrivate);
  const sharedMappings = mappings.filter(m => !m.isPrivate);
  
  // 3. Route based on strategy
  let selectedIntegration;
  if (privateMappings.length > 0) {
    // Use private integration with routing strategy
    selectedIntegration = await routeIntegration(
      privateMappings, 
      privateMappings[0].routingStrategy,
      dto.amount
    );
  } else {
    // Use shared integration pool
    selectedIntegration = await routeIntegration(
      sharedMappings,
      'ROUND_ROBIN', // default for shared
      dto.amount
    );
  }
  
  // 4. Process payment
  const result = await integrationPayinRouterService.routePayin(
    selectedIntegration.integrationCode,
    dto,
    user
  );
  
  // 5. Record stats
  await integrationStatsService.recordTransaction(
    selectedIntegration.integrationCode,
    user.id,
    dto.amount,
    result.status
  );
  
  return result;
}
```

## Recommendation

**Current approach is good!** It's:
- ✅ Minimal and working
- ✅ Extensible (can add features without breaking)
- ✅ Database structure supports future needs (multiple rows per user)
- ✅ Service layer can be extended incrementally

**When to extend:**
- Add private/shared when you have the first case of it
- Add routing strategies when you have multiple integrations per user
- Add stats when you need to track usage

The beauty of this approach is you can add features one at a time as needed, without rewriting everything.
