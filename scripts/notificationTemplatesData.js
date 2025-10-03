// Complete notification templates data for seeding
const notificationTemplates = [
  // AUTHENTICATION & USER MANAGEMENT (6 templates)
  {
    templateName: "user_welcome",
    subject: "Welcome to {{companyName}}, {{fullName}}!",
    body: "Hello {{fullName}}, welcome to {{companyName}}. Your account has been created successfully. Username: {{username}}",
    type: "email",
    triggerEvent: "user_registration",
    templateCategory: "authentication",
    priority: "high",
    tags: ["welcome", "user", "registration"],
    variables: {
      fullName: "User's full name",
      username: "User's username",
      companyName: "Organization name",
      email: "User's email address"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "user_login",
    subject: "Login Alert - {{fullName}}",
    body: "User {{fullName}} ({{username}}) logged in at {{currentTime}} from IP {{customer_ip_address}}",
    type: "system",
    triggerEvent: "user_login",
    templateCategory: "authentication",
    priority: "medium",
    tags: ["login", "security", "user"],
    variables: {
      fullName: "User's full name",
      username: "User's username",
      currentTime: "Current timestamp",
      customer_ip_address: "User's IP address"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "password_reset",
    subject: "Password Reset Request - {{companyName}}",
    body: "Hello {{fullName}}, you requested a password reset for your account {{username}} at {{currentTime}}",
    type: "email",
    triggerEvent: "password_reset",
    templateCategory: "authentication",
    priority: "high",
    tags: ["password", "reset", "security"],
    variables: {
      fullName: "User's full name",
      username: "User's username",
      currentTime: "Current timestamp",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "account_suspended",
    subject: "Account Suspended - {{companyName}}",
    body: "Your account {{username}} has been suspended. Contact support at {{supportEmail}} for assistance.",
    type: "email",
    triggerEvent: "account_suspended",
    templateCategory: "authentication",
    priority: "critical",
    tags: ["suspension", "account", "security"],
    variables: {
      username: "User's username",
      companyName: "Organization name",
      supportEmail: "Support email address"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "invitation_sent",
    subject: "Team Invitation - {{companyName}}",
    body: "You have been invited to join {{companyName}} as {{role}}. Please check your email for the invitation link.",
    type: "email",
    triggerEvent: "invitation_sent",
    templateCategory: "user_management",
    priority: "high",
    tags: ["invitation", "team", "user"],
    variables: {
      companyName: "Organization name",
      role: "User role",
      email: "User's email address"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "invitation_accepted",
    subject: "Invitation Accepted - {{fullName}}",
    body: "{{fullName}} ({{email}}) has accepted the invitation to join {{companyName}} as {{role}}",
    type: "system",
    triggerEvent: "invitation_accepted",
    templateCategory: "user_management",
    priority: "medium",
    tags: ["invitation", "accepted", "team"],
    variables: {
      fullName: "User's full name",
      email: "User's email address",
      companyName: "Organization name",
      role: "User role"
    },
    isSystemDefault: true,
    isActive: true
  },

  // ORDER MANAGEMENT (6 templates)
  {
    templateName: "order_created",
    subject: "New Order #{{orderNumber}} - {{companyName}}",
    body: "New order received: #{{orderNumber}} from {{billing.first_name}} {{billing.last_name}}. Total: {{currency}}{{total}}",
    type: "system",
    triggerEvent: "order_created",
    templateCategory: "order_management",
    priority: "high",
    tags: ["order", "new", "customer"],
    variables: {
      orderNumber: "Order number",
      billing_first_name: "Customer's first name",
      billing_last_name: "Customer's last name",
      currency: "Order currency",
      total: "Order total amount",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "order_status_updated",
    subject: "Order Status Updated - #{{orderNumber}}",
    body: "Order #{{orderNumber}} status has been updated to {{status}} at {{currentTime}}",
    type: "system",
    triggerEvent: "order_status_updated",
    templateCategory: "order_management",
    priority: "medium",
    tags: ["order", "status", "update"],
    variables: {
      orderNumber: "Order number",
      status: "New order status",
      currentTime: "Current timestamp"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "order_cancelled",
    subject: "Order Cancelled - #{{orderNumber}}",
    body: "Order #{{orderNumber}} has been cancelled. Customer: {{billing.first_name}} {{billing.last_name}}",
    type: "system",
    triggerEvent: "order_cancelled",
    templateCategory: "order_management",
    priority: "high",
    tags: ["order", "cancelled", "customer"],
    variables: {
      orderNumber: "Order number",
      billing_first_name: "Customer's first name",
      billing_last_name: "Customer's last name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "order_shipped",
    subject: "Order Shipped - #{{orderNumber}}",
    body: "Order #{{orderNumber}} has been shipped to {{shipping.first_name}} {{shipping.last_name}}",
    type: "system",
    triggerEvent: "order_shipped",
    templateCategory: "order_management",
    priority: "medium",
    tags: ["order", "shipped", "customer"],
    variables: {
      orderNumber: "Order number",
      shipping_first_name: "Shipping first name",
      shipping_last_name: "Shipping last name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "order_delivered",
    subject: "Order Delivered - #{{orderNumber}}",
    body: "Order #{{orderNumber}} has been delivered to {{shipping.address_1}}, {{shipping.city}}",
    type: "system",
    triggerEvent: "order_delivered",
    templateCategory: "order_management",
    priority: "medium",
    tags: ["order", "delivered", "customer"],
    variables: {
      orderNumber: "Order number",
      shipping_address_1: "Shipping address line 1",
      shipping_city: "Shipping city"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "refund_processed",
    subject: "Refund Processed - Order #{{orderNumber}}",
    body: "Refund of {{currency}}{{total}} has been processed for order #{{orderNumber}}",
    type: "system",
    triggerEvent: "refund_processed",
    templateCategory: "order_management",
    priority: "high",
    tags: ["order", "refund", "payment"],
    variables: {
      orderNumber: "Order number",
      currency: "Order currency",
      total: "Refund amount"
    },
    isSystemDefault: true,
    isActive: true
  },

  // SUBSCRIPTION & BILLING (6 templates)
  {
    templateName: "subscription_payment_success",
    subject: "Payment Successful - {{companyName}} Subscription",
    body: "Your subscription payment of {{currency}}{{amount}} has been processed successfully. Next billing date: {{nextBillingDate}}",
    type: "email",
    triggerEvent: "subscription_payment_success",
    templateCategory: "subscription_billing",
    priority: "high",
    tags: ["subscription", "payment", "success"],
    variables: {
      companyName: "Organization name",
      currency: "Payment currency",
      amount: "Payment amount",
      nextBillingDate: "Next billing date"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subscription_payment_failed",
    subject: "Payment Failed - {{companyName}} Subscription",
    body: "Your subscription payment of {{currency}}{{amount}} failed. Please update your payment method. Next retry: {{retryDate}}",
    type: "email",
    triggerEvent: "subscription_payment_failed",
    templateCategory: "subscription_billing",
    priority: "critical",
    tags: ["subscription", "payment", "failed"],
    variables: {
      companyName: "Organization name",
      currency: "Payment currency",
      amount: "Payment amount",
      retryDate: "Next retry date"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subscription_expiring",
    subject: "Subscription Expiring Soon - {{companyName}}",
    body: "Your {{companyName}} subscription will expire on {{expiryDate}}. Please renew to continue using our services.",
    type: "email",
    triggerEvent: "subscription_expiring",
    templateCategory: "subscription_billing",
    priority: "high",
    tags: ["subscription", "expiring", "renewal"],
    variables: {
      companyName: "Organization name",
      expiryDate: "Subscription expiry date"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subscription_expired",
    subject: "Subscription Expired - {{companyName}}",
    body: "Your {{companyName}} subscription has expired on {{expiryDate}}. Please renew to restore access to your account.",
    type: "email",
    triggerEvent: "subscription_expired",
    templateCategory: "subscription_billing",
    priority: "critical",
    tags: ["subscription", "expired", "renewal"],
    variables: {
      companyName: "Organization name",
      expiryDate: "Subscription expiry date"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subscription_cancelled",
    subject: "Subscription Cancelled - {{companyName}}",
    body: "Your {{companyName}} subscription has been cancelled. You will continue to have access until {{endDate}}.",
    type: "email",
    triggerEvent: "subscription_cancelled",
    templateCategory: "subscription_billing",
    priority: "high",
    tags: ["subscription", "cancelled", "access"],
    variables: {
      companyName: "Organization name",
      endDate: "Access end date"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subscription_renewed",
    subject: "Subscription Renewed - {{companyName}}",
    body: "Your {{companyName}} subscription has been renewed successfully. New expiry date: {{newExpiryDate}}",
    type: "email",
    triggerEvent: "subscription_renewed",
    templateCategory: "subscription_billing",
    priority: "high",
    tags: ["subscription", "renewed", "success"],
    variables: {
      companyName: "Organization name",
      newExpiryDate: "New expiry date"
    },
    isSystemDefault: true,
    isActive: true
  },

  // MARKETING & CAMPAIGNS (6 templates)
  {
    templateName: "email_campaign_sent",
    subject: "Email Campaign Sent - {{campaignName}}",
    body: "Email campaign '{{campaignName}}' has been sent to {{recipientCount}} recipients at {{currentTime}}",
    type: "system",
    triggerEvent: "email_campaign_sent",
    templateCategory: "marketing_campaigns",
    priority: "medium",
    tags: ["campaign", "email", "sent"],
    variables: {
      campaignName: "Campaign name",
      recipientCount: "Number of recipients",
      currentTime: "Current timestamp"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "email_campaign_failed",
    subject: "Email Campaign Failed - {{campaignName}}",
    body: "Email campaign '{{campaignName}}' failed to send. Error: {{errorMessage}}. Please check your email settings.",
    type: "system",
    triggerEvent: "email_campaign_failed",
    templateCategory: "marketing_campaigns",
    priority: "high",
    tags: ["campaign", "email", "failed"],
    variables: {
      campaignName: "Campaign name",
      errorMessage: "Error message"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "newsletter_sent",
    subject: "Newsletter Sent - {{newsletterTitle}}",
    body: "Newsletter '{{newsletterTitle}}' has been sent to {{subscriberCount}} subscribers",
    type: "system",
    triggerEvent: "newsletter_sent",
    templateCategory: "marketing_campaigns",
    priority: "medium",
    tags: ["newsletter", "sent", "subscribers"],
    variables: {
      newsletterTitle: "Newsletter title",
      subscriberCount: "Number of subscribers"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "promotional_offer_sent",
    subject: "Promotional Offer Sent - {{offerTitle}}",
    body: "Promotional offer '{{offerTitle}}' has been sent to {{customerCount}} customers. Discount: {{discountAmount}}",
    type: "system",
    triggerEvent: "promotional_offer_sent",
    templateCategory: "marketing_campaigns",
    priority: "medium",
    tags: ["promotion", "offer", "customers"],
    variables: {
      offerTitle: "Offer title",
      customerCount: "Number of customers",
      discountAmount: "Discount amount"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "abandoned_cart_reminder",
    subject: "Abandoned Cart Reminder - {{customerName}}",
    body: "Reminder sent to {{customerName}} about their abandoned cart with {{itemCount}} items worth {{totalAmount}}",
    type: "system",
    triggerEvent: "abandoned_cart_reminder",
    templateCategory: "marketing_campaigns",
    priority: "medium",
    tags: ["cart", "abandoned", "reminder"],
    variables: {
      customerName: "Customer name",
      itemCount: "Number of items",
      totalAmount: "Total amount"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "campaign_analytics_ready",
    subject: "Campaign Analytics Ready - {{campaignName}}",
    body: "Analytics for campaign '{{campaignName}}' are now available. Open rate: {{openRate}}%, Click rate: {{clickRate}}%",
    type: "system",
    triggerEvent: "campaign_analytics_ready",
    templateCategory: "marketing_campaigns",
    priority: "low",
    tags: ["campaign", "analytics", "metrics"],
    variables: {
      campaignName: "Campaign name",
      openRate: "Open rate percentage",
      clickRate: "Click rate percentage"
    },
    isSystemDefault: true,
    isActive: true
  },

  // CUSTOMER MANAGEMENT (4 templates)
  {
    templateName: "customer_registered",
    subject: "New Customer - {{first_name}} {{last_name}}",
    body: "New customer registered: {{first_name}} {{last_name}} ({{email}}). Customer ID: {{customerId}}",
    type: "system",
    triggerEvent: "customer_registered",
    templateCategory: "customer_management",
    priority: "medium",
    tags: ["customer", "new", "registration"],
    variables: {
      first_name: "Customer's first name",
      last_name: "Customer's last name",
      email: "Customer's email",
      customerId: "Customer ID"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "customer_updated",
    subject: "Customer Updated - {{first_name}} {{last_name}}",
    body: "Customer profile updated for {{first_name}} {{last_name}} ({{email}}) at {{currentTime}}",
    type: "system",
    triggerEvent: "customer_updated",
    templateCategory: "customer_management",
    priority: "low",
    tags: ["customer", "updated", "profile"],
    variables: {
      first_name: "Customer's first name",
      last_name: "Customer's last name",
      email: "Customer's email",
      currentTime: "Current timestamp"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "customer_sync_success",
    subject: "Customer Sync Success - {{first_name}} {{last_name}}",
    body: "Customer {{first_name}} {{last_name}} synced successfully to WooCommerce",
    type: "system",
    triggerEvent: "customer_sync_success",
    templateCategory: "customer_management",
    priority: "low",
    tags: ["customer", "sync", "success"],
    variables: {
      first_name: "Customer's first name",
      last_name: "Customer's last name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "customer_sync_failed",
    subject: "Customer Sync Failed - {{first_name}} {{last_name}}",
    body: "Failed to sync customer {{first_name}} {{last_name}} to WooCommerce. Error: {{syncError}}",
    type: "system",
    triggerEvent: "customer_sync_failed",
    templateCategory: "customer_management",
    priority: "high",
    tags: ["customer", "sync", "failed"],
    variables: {
      first_name: "Customer's first name",
      last_name: "Customer's last name",
      syncError: "Sync error message"
    },
    isSystemDefault: true,
    isActive: true
  },

  // INVENTORY MANAGEMENT (4 templates)
  {
    templateName: "product_created",
    subject: "New Product Added - {{productName}}",
    body: "New product added: {{productName}}. Description: {{description}}",
    type: "system",
    triggerEvent: "product_created",
    templateCategory: "inventory_management",
    priority: "medium",
    tags: ["product", "new", "inventory"],
    variables: {
      productName: "Product name",
      description: "Product description"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "low_stock_alert",
    subject: "Low Stock Alert - {{productName}}",
    body: "Product {{productName}} is running low on stock. Please restock soon.",
    type: "system",
    triggerEvent: "low_stock_alert",
    templateCategory: "inventory_management",
    priority: "high",
    tags: ["product", "stock", "alert"],
    variables: {
      productName: "Product name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "out_of_stock",
    subject: "Out of Stock - {{productName}}",
    body: "Product {{productName}} is now out of stock. Please restock immediately.",
    type: "system",
    triggerEvent: "out_of_stock",
    templateCategory: "inventory_management",
    priority: "critical",
    tags: ["product", "stock", "out"],
    variables: {
      productName: "Product name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "inventory_sync_status",
    subject: "Inventory Sync - {{syncStatus}}",
    body: "Inventory sync {{syncStatus}} at {{currentTime}}. {{syncError}}",
    type: "system",
    triggerEvent: "inventory_sync",
    templateCategory: "inventory_management",
    priority: "medium",
    tags: ["inventory", "sync", "status"],
    variables: {
      syncStatus: "Sync status",
      currentTime: "Current timestamp",
      syncError: "Sync error message (if any)"
    },
    isSystemDefault: true,
    isActive: true
  },

  // SYSTEM & MAINTENANCE (4 templates)
  {
    templateName: "system_maintenance",
    subject: "System Maintenance - {{companyName}}",
    body: "Scheduled maintenance will begin at {{currentTime}}. Expected duration: 2 hours.",
    type: "system",
    triggerEvent: "system_maintenance",
    templateCategory: "system_maintenance",
    priority: "high",
    tags: ["maintenance", "system", "scheduled"],
    variables: {
      currentTime: "Current timestamp",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "system_error",
    subject: "System Error Alert - {{companyName}}",
    body: "System error detected at {{currentTime}}. Please check system logs.",
    type: "system",
    triggerEvent: "system_error",
    templateCategory: "system_maintenance",
    priority: "critical",
    tags: ["error", "system", "alert"],
    variables: {
      currentTime: "Current timestamp",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "woocommerce_sync_success",
    subject: "WooCommerce Sync Success - {{storeName}}",
    body: "WooCommerce sync completed successfully for {{storeName}} at {{currentTime}}",
    type: "system",
    triggerEvent: "woocommerce_sync_success",
    templateCategory: "system_maintenance",
    priority: "low",
    tags: ["woocommerce", "sync", "success"],
    variables: {
      storeName: "Store name",
      currentTime: "Current timestamp"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "woocommerce_sync_failed",
    subject: "WooCommerce Sync Failed - {{storeName}}",
    body: "WooCommerce sync failed for {{storeName}} at {{currentTime}}. Error: {{syncError}}",
    type: "system",
    triggerEvent: "woocommerce_sync_failed",
    templateCategory: "system_maintenance",
    priority: "high",
    tags: ["woocommerce", "sync", "failed"],
    variables: {
      storeName: "Store name",
      currentTime: "Current timestamp",
      syncError: "Sync error message"
    },
    isSystemDefault: true,
    isActive: true
  },

  // CALL SCHEDULER NOTIFICATIONS (4 templates)
  {
    templateName: "call_scheduled",
    subject: "Call Scheduled: {{callTitle}} - {{companyName}}",
    body: "A call has been scheduled for {{callDate}} at {{callTime}}. Title: {{callTitle}}. Description: {{callDescription}}. Meeting Link: {{meetingLink}}",
    type: "email",
    triggerEvent: "call_scheduled",
    templateCategory: "communication",
    priority: "high",
    tags: ["call", "schedule", "meeting"],
    variables: {
      callTitle: "Call title",
      callDate: "Call date",
      callTime: "Call time",
      callDescription: "Call description",
      meetingLink: "Meeting link",
      companyName: "Organization name",
      organizerName: "Call organizer name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "call_invitation",
    subject: "You're Invited: {{callTitle}} - {{companyName}}",
    body: "{{organizerName}} has invited you to a call: {{callTitle}} on {{callDate}} at {{callTime}}. Description: {{callDescription}}. Join: {{meetingLink}}",
    type: "email",
    triggerEvent: "call_invitation",
    templateCategory: "communication",
    priority: "high",
    tags: ["call", "invitation", "meeting"],
    variables: {
      callTitle: "Call title",
      callDate: "Call date",
      callTime: "Call time",
      callDescription: "Call description",
      meetingLink: "Meeting link",
      companyName: "Organization name",
      organizerName: "Call organizer name",
      participantName: "Participant name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "call_reminder",
    subject: "Reminder: {{callTitle}} starts in 15 minutes",
    body: "Reminder: Your call '{{callTitle}}' is starting in 15 minutes. Join: {{meetingLink}}",
    type: "email",
    triggerEvent: "call_reminder",
    templateCategory: "communication",
    priority: "medium",
    tags: ["call", "reminder", "meeting"],
    variables: {
      callTitle: "Call title",
      meetingLink: "Meeting link",
      participantName: "Participant name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "call_cancelled",
    subject: "Call Cancelled: {{callTitle}} - {{companyName}}",
    body: "The call '{{callTitle}}' scheduled for {{callDate}} at {{callTime}} has been cancelled by {{organizerName}}.",
    type: "email",
    triggerEvent: "call_cancelled",
    templateCategory: "communication",
    priority: "medium",
    tags: ["call", "cancelled", "meeting"],
    variables: {
      callTitle: "Call title",
      callDate: "Call date",
      callTime: "Call time",
      organizerName: "Call organizer name",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },

  // TASK MANAGEMENT (8 templates)
  {
    templateName: "task_created",
    subject: "New Task Assigned: {{taskTitle}} - {{companyName}}",
    body: "A new task '{{taskTitle}}' has been created and assigned to you by {{createdByName}}. Due Date: {{dueDate}}. Priority: {{priority}}. Description: {{taskDescription}}",
    type: "email",
    triggerEvent: "task_created",
    templateCategory: "task_management",
    priority: "high",
    tags: ["task", "created", "assignment"],
    variables: {
      taskTitle: "Task title",
      taskDescription: "Task description",
      createdByName: "Name of user who created the task",
      assignedToName: "Name of user assigned to task",
      dueDate: "Task due date",
      priority: "Task priority (low/medium/high)",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_assigned",
    subject: "Task Assignment: {{taskTitle}} - {{companyName}}",
    body: "You have been assigned to a task '{{taskTitle}}' by {{assignedByName}}. Due Date: {{dueDate}}. Priority: {{priority}}. Please review and start working on it.",
    type: "email",
    triggerEvent: "task_assigned",
    templateCategory: "task_management",
    priority: "high",
    tags: ["task", "assigned", "assignment"],
    variables: {
      taskTitle: "Task title",
      assignedByName: "Name of user who assigned the task",
      assignedToName: "Name of user assigned to task",
      dueDate: "Task due date",
      priority: "Task priority (low/medium/high)",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_status_updated",
    subject: "Task Status Updated: {{taskTitle}} - {{newStatus}}",
    body: "Task '{{taskTitle}}' status has been updated to '{{newStatus}}' by {{updatedByName}}. Previous status: {{oldStatus}}. Due Date: {{dueDate}}",
    type: "email",
    triggerEvent: "task_status_updated",
    templateCategory: "task_management",
    priority: "medium",
    tags: ["task", "status", "update"],
    variables: {
      taskTitle: "Task title",
      newStatus: "New task status",
      oldStatus: "Previous task status",
      updatedByName: "Name of user who updated the task",
      dueDate: "Task due date",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_due_soon",
    subject: "Task Due Soon: {{taskTitle}} - {{companyName}}",
    body: "Reminder: Task '{{taskTitle}}' is due {{dueDate}}. Current status: {{taskStatus}}. Priority: {{priority}}. Please complete it on time.",
    type: "email",
    triggerEvent: "task_due_soon",
    templateCategory: "task_management",
    priority: "high",
    tags: ["task", "due", "reminder"],
    variables: {
      taskTitle: "Task title",
      dueDate: "Task due date",
      taskStatus: "Current task status",
      priority: "Task priority (low/medium/high)",
      assignedToName: "Name of user assigned to task",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_overdue",
    subject: "Task Overdue: {{taskTitle}} - {{companyName}}",
    body: "Alert: Task '{{taskTitle}}' is overdue. Due date was {{dueDate}}. Current status: {{taskStatus}}. Please complete it as soon as possible.",
    type: "email",
    triggerEvent: "task_overdue",
    templateCategory: "task_management",
    priority: "critical",
    tags: ["task", "overdue", "alert"],
    variables: {
      taskTitle: "Task title",
      dueDate: "Task due date",
      taskStatus: "Current task status",
      priority: "Task priority (low/medium/high)",
      assignedToName: "Name of user assigned to task",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "subtask_completed",
    subject: "Subtask Completed: {{subtaskTitle}} - {{taskTitle}}",
    body: "Subtask '{{subtaskTitle}}' for task '{{taskTitle}}' has been completed by {{completedByName}}. Task progress: {{progress}}%",
    type: "system",
    triggerEvent: "subtask_completed",
    templateCategory: "task_management",
    priority: "medium",
    tags: ["task", "subtask", "completed"],
    variables: {
      subtaskTitle: "Subtask title",
      taskTitle: "Parent task title",
      completedByName: "Name of user who completed subtask",
      progress: "Task progress percentage",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_comment_added",
    subject: "New Comment on Task: {{taskTitle}} - {{companyName}}",
    body: "{{commentedByName}} added a comment to task '{{taskTitle}}': \"{{commentText}}\". Please review the comment and respond if needed.",
    type: "email",
    triggerEvent: "task_comment_added",
    templateCategory: "task_management",
    priority: "medium",
    tags: ["task", "comment", "communication"],
    variables: {
      taskTitle: "Task title",
      commentedByName: "Name of user who added comment",
      commentText: "Comment text (truncated if long)",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  },
  {
    templateName: "task_attachment_uploaded",
    subject: "Attachment Uploaded to Task: {{taskTitle}} - {{companyName}}",
    body: "{{uploadedByName}} uploaded an attachment '{{fileName}}' to task '{{taskTitle}}'. File size: {{fileSize}}. Please review the attachment.",
    type: "system",
    triggerEvent: "task_attachment_uploaded",
    templateCategory: "task_management",
    priority: "low",
    tags: ["task", "attachment", "file"],
    variables: {
      taskTitle: "Task title",
      fileName: "Uploaded file name",
      fileSize: "File size",
      uploadedByName: "Name of user who uploaded file",
      companyName: "Organization name"
    },
    isSystemDefault: true,
    isActive: true
  }
];

module.exports = notificationTemplates;







