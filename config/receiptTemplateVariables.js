const receiptTemplateVariables = {
  // WooCommerce Order Variables
  order: {
    orderNumber: { 
      fieldPath: 'order.number', 
      displayName: 'Order Number',
      category: 'order',
      required: true,
      fallback: 'N/A'
    },
    orderDate: { 
      fieldPath: 'order.date_created', 
      displayName: 'Order Date',
      category: 'order',
      required: true,
      fallback: new Date().toISOString()
    },
    customerName: { 
      fieldPath: 'order.billing.first_name', 
      displayName: 'Customer Name',
      category: 'customer',
      required: true,
      fallback: 'Customer'
    },
    customerEmail: { 
      fieldPath: 'order.billing.email', 
      displayName: 'Customer Email',
      category: 'customer',
      required: true,
      fallback: 'customer@example.com'
    },
    customerPhone: { 
      fieldPath: 'order.billing.phone', 
      displayName: 'Customer Phone',
      category: 'customer',
      required: false,
      fallback: ''
    },
    shippingAddress: { 
      fieldPath: 'order.shipping', 
      displayName: 'Shipping Address',
      category: 'shipping',
      required: false,
      fallback: {}
    },
    billingAddress: { 
      fieldPath: 'order.billing', 
      displayName: 'Billing Address',
      category: 'billing',
      required: true,
      fallback: {}
    },
    paymentMethod: { 
      fieldPath: 'order.payment_method_title', 
      displayName: 'Payment Method',
      category: 'payment',
      required: true,
      fallback: 'Credit Card'
    },
    transactionId: { 
      fieldPath: 'order.transaction_id', 
      displayName: 'Transaction ID',
      category: 'payment',
      required: false,
      fallback: ''
    },
    lineItems: { 
      fieldPath: 'order.line_items', 
      displayName: 'Line Items',
      category: 'order',
      required: true,
      fallback: []
    },
    subtotal: { 
      fieldPath: 'order.total', 
      displayName: 'Subtotal',
      category: 'financial',
      required: true,
      fallback: 0
    },
    totalTax: { 
      fieldPath: 'order.total_tax', 
      displayName: 'Total Tax',
      category: 'financial',
      required: false,
      fallback: 0
    },
    shippingTotal: { 
      fieldPath: 'order.shipping_total', 
      displayName: 'Shipping Total',
      category: 'financial',
      required: false,
      fallback: 0
    },
    discountTotal: { 
      fieldPath: 'order.discount_total', 
      displayName: 'Discount Total',
      category: 'financial',
      required: false,
      fallback: 0
    }
  },

  // Subscription Payment Variables
  subscription: {
    subscriptionId: { 
      fieldPath: 'subscription._id', 
      displayName: 'Subscription ID',
      category: 'subscription',
      required: true,
      fallback: 'N/A'
    },
    planName: { 
      fieldPath: 'subscription.plan.name', 
      displayName: 'Plan Name',
      category: 'subscription',
      required: true,
      fallback: 'Basic Plan'
    },
    planDescription: { 
      fieldPath: 'subscription.plan.description', 
      displayName: 'Plan Description',
      category: 'subscription',
      required: false,
      fallback: ''
    },
    billingInterval: { 
      fieldPath: 'subscription.billingInterval', 
      displayName: 'Billing Interval',
      category: 'subscription',
      required: true,
      fallback: 'monthly'
    },
    startDate: { 
      fieldPath: 'subscription.startDate', 
      displayName: 'Start Date',
      category: 'subscription',
      required: true,
      fallback: new Date().toISOString()
    },
    endDate: { 
      fieldPath: 'subscription.endDate', 
      displayName: 'End Date',
      category: 'subscription',
      required: false,
      fallback: ''
    },
    renewalDate: { 
      fieldPath: 'subscription.renewalDate', 
      displayName: 'Renewal Date',
      category: 'subscription',
      required: false,
      fallback: ''
    },
    organizationName: { 
      fieldPath: 'organization.name', 
      displayName: 'Organization Name',
      category: 'organization',
      required: true,
      fallback: 'Organization'
    },
    organizationEmail: { 
      fieldPath: 'organization.email', 
      displayName: 'Organization Email',
      category: 'organization',
      required: false,
      fallback: 'org@example.com'
    },
    paymentReference: { 
      fieldPath: 'payment.reference', 
      displayName: 'Payment Reference',
      category: 'payment',
      required: true,
      fallback: 'N/A'
    },
    paymentGateway: { 
      fieldPath: 'payment.gateway', 
      displayName: 'Payment Gateway',
      category: 'payment',
      required: true,
      fallback: 'Credit Card'
    },
    paymentStatus: { 
      fieldPath: 'payment.status', 
      displayName: 'Payment Status',
      category: 'payment',
      required: true,
      fallback: 'success'
    },
    amount: { 
      fieldPath: 'payment.amount', 
      displayName: 'Amount',
      category: 'financial',
      required: true,
      fallback: 0
    },
    currency: { 
      fieldPath: 'payment.currency', 
      displayName: 'Currency',
      category: 'financial',
      required: true,
      fallback: 'USD'
    }
  },

  // Common Variables (available for both scenarios)
  common: {
    receiptNumber: { 
      fieldPath: 'receipt.receiptNumber', 
      displayName: 'Receipt Number',
      category: 'receipt',
      required: true,
      fallback: 'REC-2024-0001'
    },
    transactionDate: { 
      fieldPath: 'receipt.transactionDate', 
      displayName: 'Transaction Date',
      category: 'receipt',
      required: true,
      fallback: new Date().toISOString()
    },
    totalAmount: { 
      fieldPath: 'receipt.totalAmount', 
      displayName: 'Total Amount',
      category: 'financial',
      required: true,
      fallback: 0
    },
    currency: { 
      fieldPath: 'receipt.currency', 
      displayName: 'Currency',
      category: 'financial',
      required: true,
      fallback: 'USD'
    },
    status: { 
      fieldPath: 'receipt.status', 
      displayName: 'Status',
      category: 'receipt',
      required: true,
      fallback: 'completed'
    }
  }
};

// Helper functions
const getAllVariables = () => {
  return {
    ...receiptTemplateVariables.order,
    ...receiptTemplateVariables.subscription,
    ...receiptTemplateVariables.common
  };
};

const getVariablesByCategory = (category) => {
  const allVars = getAllVariables();
  return Object.entries(allVars)
    .filter(([key, value]) => value.category === category)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

const getVariablesByScenario = (scenario) => {
  if (scenario === 'woocommerce_order') {
    return {
      ...receiptTemplateVariables.order,
      ...receiptTemplateVariables.common
    };
  } else if (scenario === 'subscription_payment') {
    return {
      ...receiptTemplateVariables.subscription,
      ...receiptTemplateVariables.common
    };
  }
  return getAllVariables();
};

const getVariableDefinition = (variableName) => {
  const allVars = getAllVariables();
  return allVars[variableName] || null;
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

const extractVariablesFromContent = (content) => {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const matches = content.match(variablePattern);
  return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
};

module.exports = {
  receiptTemplateVariables,
  getAllVariables,
  getVariablesByCategory,
  getVariablesByScenario,
  getVariableDefinition,
  getNestedValue,
  extractVariablesFromContent
};
