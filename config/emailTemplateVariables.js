const CUSTOMER_FIELD_VARIABLES = {
  // Personal Information
  personal: {
    first_name: {
      fieldPath: 'first_name',
      displayName: 'First Name',
      category: 'personal',
      required: false,
      fallback: 'Valued Customer'
    },
    last_name: {
      fieldPath: 'last_name', 
      displayName: 'Last Name',
      category: 'personal',
      required: false,
      fallback: ''
    },
    email: {
      fieldPath: 'email',
      displayName: 'Email Address',
      category: 'personal',
      required: true,
      fallback: null
    },
    username: {
      fieldPath: 'username',
      displayName: 'Username',
      category: 'personal',
      required: false,
      fallback: 'User'
    }
  },
  
  // Billing Information
  billing: {
    billing_first_name: {
      fieldPath: 'billing.first_name',
      displayName: 'Billing First Name',
      category: 'billing',
      required: false,
      fallback: 'Valued Customer'
    },
    billing_last_name: {
      fieldPath: 'billing.last_name',
      displayName: 'Billing Last Name', 
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_company: {
      fieldPath: 'billing.company',
      displayName: 'Billing Company',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_address_1: {
      fieldPath: 'billing.address_1',
      displayName: 'Billing Address Line 1',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_city: {
      fieldPath: 'billing.city',
      displayName: 'Billing City',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_state: {
      fieldPath: 'billing.state',
      displayName: 'Billing State',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_country: {
      fieldPath: 'billing.country',
      displayName: 'Billing Country',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_postcode: {
      fieldPath: 'billing.postcode',
      displayName: 'Billing Postal Code',
      category: 'billing',
      required: false,
      fallback: ''
    },
    billing_phone: {
      fieldPath: 'billing.phone',
      displayName: 'Billing Phone',
      category: 'billing',
      required: false,
      fallback: ''
    }
  },
  
  // Shipping Information
  shipping: {
    shipping_first_name: {
      fieldPath: 'shipping.first_name',
      displayName: 'Shipping First Name',
      category: 'shipping',
      required: false,
      fallback: 'Valued Customer'
    },
    shipping_last_name: {
      fieldPath: 'shipping.last_name',
      displayName: 'Shipping Last Name',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_company: {
      fieldPath: 'shipping.company',
      displayName: 'Shipping Company',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_address_1: {
      fieldPath: 'shipping.address_1',
      displayName: 'Shipping Address Line 1',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_city: {
      fieldPath: 'shipping.city',
      displayName: 'Shipping City',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_state: {
      fieldPath: 'shipping.state',
      displayName: 'Shipping State',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_country: {
      fieldPath: 'shipping.country',
      displayName: 'Shipping Country',
      category: 'shipping',
      required: false,
      fallback: ''
    },
    shipping_postcode: {
      fieldPath: 'shipping.postcode',
      displayName: 'Shipping Postal Code',
      category: 'shipping',
      required: false,
      fallback: ''
    }
  },
  
  // Account Information
  account: {
    customer_id: {
      fieldPath: 'customer_id',
      displayName: 'Customer ID',
      category: 'account',
      required: false,
      fallback: 'N/A'
    },
    date_created: {
      fieldPath: 'date_created',
      displayName: 'Account Created Date',
      category: 'account',
      required: false,
      fallback: 'N/A'
    },
    is_paying_customer: {
      fieldPath: 'is_paying_customer',
      displayName: 'Paying Customer Status',
      category: 'account',
      required: false,
      fallback: 'No'
    }
  },

  // Order Information
  order: {
    order_id: {
      fieldPath: 'order.id',
      displayName: 'Order ID',
      category: 'order',
      required: false,
      fallback: 'N/A'
    },
    order_number: {
      fieldPath: 'order.number',
      displayName: 'Order Number',
      category: 'order',
      required: false,
      fallback: 'N/A'
    },
    order_status: {
      fieldPath: 'order.status',
      displayName: 'Order Status',
      category: 'order',
      required: false,
      fallback: 'Unknown'
    },
    order_date: {
      fieldPath: 'order.date_created',
      displayName: 'Order Date',
      category: 'order',
      required: false,
      fallback: 'N/A'
    },
    order_total: {
      fieldPath: 'order.total',
      displayName: 'Order Total',
      category: 'order',
      required: false,
      fallback: '$0.00'
    },
    order_currency: {
      fieldPath: 'order.currency',
      displayName: 'Order Currency',
      category: 'order',
      required: false,
      fallback: 'USD'
    },
    order_subtotal: {
      fieldPath: 'order.subtotal',
      displayName: 'Order Subtotal',
      category: 'order',
      required: false,
      fallback: '$0.00'
    },
    order_tax: {
      fieldPath: 'order.total_tax',
      displayName: 'Order Tax',
      category: 'order',
      required: false,
      fallback: '$0.00'
    },
    order_shipping: {
      fieldPath: 'order.shipping_total',
      displayName: 'Shipping Cost',
      category: 'order',
      required: false,
      fallback: '$0.00'
    },
    order_discount: {
      fieldPath: 'order.discount_total',
      displayName: 'Discount Amount',
      category: 'order',
      required: false,
      fallback: '$0.00'
    },
    payment_method: {
      fieldPath: 'order.payment_method_title',
      displayName: 'Payment Method',
      category: 'order',
      required: false,
      fallback: 'N/A'
    },
    transaction_id: {
      fieldPath: 'order.transaction_id',
      displayName: 'Transaction ID',
      category: 'order',
      required: false,
      fallback: 'N/A'
    }
  },

  // Order Billing Information
  order_billing: {
    order_billing_first_name: {
      fieldPath: 'order.billing.first_name',
      displayName: 'Order Billing First Name',
      category: 'order_billing',
      required: false,
      fallback: 'Valued Customer'
    },
    order_billing_last_name: {
      fieldPath: 'order.billing.last_name',
      displayName: 'Order Billing Last Name',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_company: {
      fieldPath: 'order.billing.company',
      displayName: 'Order Billing Company',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_address: {
      fieldPath: 'order.billing.address_1',
      displayName: 'Order Billing Address',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_city: {
      fieldPath: 'order.billing.city',
      displayName: 'Order Billing City',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_state: {
      fieldPath: 'order.billing.state',
      displayName: 'Order Billing State',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_country: {
      fieldPath: 'order.billing.country',
      displayName: 'Order Billing Country',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_postcode: {
      fieldPath: 'order.billing.postcode',
      displayName: 'Order Billing Postal Code',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_phone: {
      fieldPath: 'order.billing.phone',
      displayName: 'Order Billing Phone',
      category: 'order_billing',
      required: false,
      fallback: ''
    },
    order_billing_email: {
      fieldPath: 'order.billing.email',
      displayName: 'Order Billing Email',
      category: 'order_billing',
      required: false,
      fallback: ''
    }
  },

  // Order Shipping Information
  order_shipping: {
    order_shipping_first_name: {
      fieldPath: 'order.shipping.first_name',
      displayName: 'Order Shipping First Name',
      category: 'order_shipping',
      required: false,
      fallback: 'Valued Customer'
    },
    order_shipping_last_name: {
      fieldPath: 'order.shipping.last_name',
      displayName: 'Order Shipping Last Name',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_company: {
      fieldPath: 'order.shipping.company',
      displayName: 'Order Shipping Company',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_address: {
      fieldPath: 'order.shipping.address_1',
      displayName: 'Order Shipping Address',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_city: {
      fieldPath: 'order.shipping.city',
      displayName: 'Order Shipping City',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_state: {
      fieldPath: 'order.shipping.state',
      displayName: 'Order Shipping State',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_country: {
      fieldPath: 'order.shipping.country',
      displayName: 'Order Shipping Country',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_postcode: {
      fieldPath: 'order.shipping.postcode',
      displayName: 'Order Shipping Postal Code',
      category: 'order_shipping',
      required: false,
      fallback: ''
    },
    order_shipping_phone: {
      fieldPath: 'order.shipping.phone',
      displayName: 'Order Shipping Phone',
      category: 'order_shipping',
      required: false,
      fallback: ''
    }
  },

  // Product Information (from order line items)
  product: {
    product_name: {
      fieldPath: 'order.line_items.0.name',
      displayName: 'Product Name',
      category: 'product',
      required: false,
      fallback: 'Product'
    },
    product_quantity: {
      fieldPath: 'order.line_items.0.quantity',
      displayName: 'Product Quantity',
      category: 'product',
      required: false,
      fallback: '1'
    },
    product_price: {
      fieldPath: 'order.line_items.0.price',
      displayName: 'Product Price',
      category: 'product',
      required: false,
      fallback: '$0.00'
    },
    product_total: {
      fieldPath: 'order.line_items.0.total',
      displayName: 'Product Total',
      category: 'product',
      required: false,
      fallback: '$0.00'
    },
    product_sku: {
      fieldPath: 'order.line_items.0.product_id',
      displayName: 'Product SKU',
      category: 'product',
      required: false,
      fallback: 'N/A'
    },
    product_description: {
      fieldPath: 'order.line_items.0.name',
      displayName: 'Product Description',
      category: 'product',
      required: false,
      fallback: 'Product'
    }
  }
};

// Helper function to get all variables
const getAllVariables = () => {
  const allVars = {};
  Object.values(CUSTOMER_FIELD_VARIABLES).forEach(category => {
    Object.assign(allVars, category);
  });
  return allVars;
};

// Helper function to get variables by category
const getVariablesByCategory = (category) => {
  return CUSTOMER_FIELD_VARIABLES[category] || {};
};

// Helper function to get variable definition
const getVariableDefinition = (variableName) => {
  const allVars = getAllVariables();
  return allVars[variableName];
};

// Helper function to get nested object values using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Helper function to extract variables from template content
const extractVariablesFromContent = (content) => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
};

module.exports = {
  CUSTOMER_FIELD_VARIABLES,
  getAllVariables,
  getVariablesByCategory,
  getVariableDefinition,
  getNestedValue,
  extractVariablesFromContent
};
