module.exports = {
  ROLES: {
    CUSTOMER: 'customer',
    DELIVERY: 'delivery',
    ADMIN: 'admin'
  },
  
  SERVICE_REQUEST_STATUS: {
    REQUESTED: 'requested',
    QUOTED: 'quoted',
    ACCEPTED: 'accepted',
    SCHEDULED: 'scheduled',
    PICKED_UP: 'picked_up',
    RECEIVED_SHOP: 'received_shop',
    IN_REPAIR: 'in_repair',
    READY_FOR_PAYMENT: 'ready_for_payment',
    PAYMENT_RECEIVED: 'payment_received',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    COMPLETED: 'completed'
  },
  
  ITEM_CATEGORIES: {
    WATCH: 'watch',
    CLOCK: 'clock',
    TIMEPIECE: 'timepiece',
    SMART_WEARABLE: 'smart_wearable',
    CUSTOM: 'custom'
  },
  
  MEDIA_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    VOICE: 'voice'
  },
  
  UPLOADER_TYPES: {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    TECH: 'tech',
    DELIVERY: 'delivery'
  },
  
  OTP_PURPOSES: {
    CUSTOMER_LOGIN: 'customer_login',
    DELIVERY_LOGIN: 'delivery_login',
    ADMIN_INVITE: 'admin_invite'
  },
  
  NOTIFICATION_TYPES: {
    SMS: 'sms'
  }
};
