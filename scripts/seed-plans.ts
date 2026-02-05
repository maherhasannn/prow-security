import { db } from '../lib/db'
import { subscriptionPlans } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const plans = [
  {
    name: 'Free',
    type: 'free' as const,
    description: 'Get started with basic features',
    priceMonthly: 0,
    priceYearly: 0,
    maxSeats: 1,
    maxWorkspaces: 2,
    maxDocuments: 10,
    features: [
      'Basic AI assistance',
      'Document upload (10 max)',
      'Email support',
    ],
  },
  {
    name: 'Starter',
    type: 'starter' as const,
    description: 'For small teams getting started',
    priceMonthly: 2900, // $29.00
    priceYearly: 27900, // $279.00 (20% off)
    maxSeats: 5,
    maxWorkspaces: 10,
    maxDocuments: 100,
    features: [
      'Everything in Free',
      'Up to 5 team members',
      'Advanced AI models',
      'Priority email support',
      'QuickBooks integration',
    ],
  },
  {
    name: 'Professional',
    type: 'professional' as const,
    description: 'For growing organizations',
    priceMonthly: 7900, // $79.00
    priceYearly: 75900, // $759.00 (20% off)
    maxSeats: 20,
    maxWorkspaces: 50,
    maxDocuments: 500,
    features: [
      'Everything in Starter',
      'Up to 20 team members',
      'Unlimited workspaces',
      'Advanced analytics',
      'API access',
      'Priority support',
      'Custom integrations',
    ],
  },
  {
    name: 'Enterprise',
    type: 'enterprise' as const,
    description: 'For large organizations with custom needs',
    priceMonthly: 19900, // $199.00
    priceYearly: 190900, // $1,909.00 (20% off)
    maxSeats: -1, // Unlimited
    maxWorkspaces: -1, // Unlimited
    maxDocuments: -1, // Unlimited
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Unlimited documents',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
      'Custom AI training',
      'HIPAA BAA',
    ],
  },
]

async function seedPlans() {
  console.log('Seeding subscription plans...')

  for (const plan of plans) {
    // Check if plan already exists
    const [existing] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.type, plan.type))
      .limit(1)

    if (existing) {
      // Update existing plan
      await db
        .update(subscriptionPlans)
        .set({
          name: plan.name,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          maxSeats: plan.maxSeats,
          maxWorkspaces: plan.maxWorkspaces,
          maxDocuments: plan.maxDocuments,
          features: plan.features,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.type, plan.type))

      console.log(`Updated plan: ${plan.name}`)
    } else {
      // Insert new plan
      await db.insert(subscriptionPlans).values({
        name: plan.name,
        type: plan.type,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxSeats: plan.maxSeats,
        maxWorkspaces: plan.maxWorkspaces,
        maxDocuments: plan.maxDocuments,
        features: plan.features,
      })

      console.log(`Created plan: ${plan.name}`)
    }
  }

  console.log('Done seeding subscription plans!')
}

// Run the seed function
seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding plans:', error)
    process.exit(1)
  })
