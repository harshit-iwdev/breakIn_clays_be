const sucessfull_message = {
    //AUTH
    LOGIN: 'Logged in successfully.',
    REGISTER: 'Your account has been created successfully.',
    LOGOUT: 'Logged out successfully.',
    FORGET_PASSWORD: 'We have sent you an email with password reset link. ',
    RESET_PASSWORD: 'Your password has been reset. ',
    VERIFY_EMAIL: 'Your account is now verified.',
    CHANGE_PASSWORD: 'Password Changed Successfully',
    RESEND_MAIL: 'Please verify your email before logging in. ',
    DEVICE_REGISTER: 'Device Register',
    USER_ACTIVE: 'User Active Successfully',
    USER_INACTIVE: 'User Inactive Successfully',
    ACCOUNT_DELETED: 'Account Deleted',
    UPDATE_PROFILE: 'Your profile has been successfully updated.',
    RESEND_MAIL: 'We have resend you a verification email link to your registred email',
    REFRESH:'your token is refreshed',
    DATA_FOUND:'Data found',
    CONTACT_EMAIL_SENT: 'We have send a mail for your query. thank you for contacting us .',
    DELETE_EMAIL_SENT: 'We have send a mail for your request. Pls use the One Time Password for further process.',
    VERIFY_EMAIL_SENT: 'We have send a mail for your request.',
  
    DATA_IMPORTED: 'Data imported successfully.',
  
    //USER
    USER_REGISTER: 'User has been created successfully.',
    USER_UPDATED: 'User has been updated successfully.',
    PREFERENCE_UPDATED: 'Preference has been updated successfully.',
    USER_DELETED: 'User has been deleted successfully.',
    USER_FOUND: 'User found.',
    USERTURST_ACTIVATED: 'User activated.',
    USER_DEACTIVATED: 'User deactivated.',
    SMS_SENT: 'An OTP has been sent to your mobile number . ',
    OTP_VERIFIED: 'OTP verified.',

    // NOTIFICATION_
    NOTIFICATION_DELETED: 'Notification deleted.',
    ALL_NOTIFICATION_DELETED: 'All notifications deleted.',
    ALL_NOTIFICATION_MARK: 'All notification marked as read. ',
    NOTIFICATION_STATUS: 'Notification status updated. ',
  
    //EVENT
    EVENT_CREATED: 'Event created successfully',
    EVENT_UPDATED: 'Event updated successfully',
    EVENT_DELETED: 'Event deleted successfully',
    EVENT_FOUND: 'Event found',
  
    //CATEGORY
    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',
    CATEGORY_FOUND: 'Category found',
    
    //GUN_DETAIL
    GUN_DETAIL_CREATED: 'Gun Detail created successfully',
    GUN_DETAIL_UPDATED: 'Gun Detail updated successfully',
    GUN_DETAIL_DELETED: 'Gun Detail deleted successfully',
    GUN_DETAIL_FOUND: 'Gun Detail found',

    //SPONSOR
    SPONSOR_CREATED: 'Sponsor created successfully',
    SPONSOR_UPDATED: 'Sponsor updated successfully',
    SPONSOR_DELETED: 'Sponsor deleted successfully',
    SPONSOR_FOUND: 'Sponsor found',

    //PATCH
    PATCH_CREATED: 'Patch created successfully',
    PATCH_UPDATED: 'Patch updated successfully',
    PATCH_DELETED: 'Patch deleted successfully',
    PATCH_FOUND: 'Patch found',
  

    //ADMIN_NOTIFICATION
    ADMIN_NOTIFICATION_CREATED: 'Admin Notification created successfully',
    ADMIN_NOTIFICATION_UPDATED: 'Admin Notification updated successfully',
    ADMIN_NOTIFICATION_DELETED: 'Admin Notification deleted successfully',
    ADMIN_NOTIFICATION_FOUND: 'Admin Notification found',


    //VIDEO
    VIDEO_CREATED: 'Video created successfully',
    VIDEO_UPDATED: 'Video updated successfully',
    VIDEO_DELETED: 'Video deleted successfully',
    VIDEO_FOUND: 'Video found',

    //INQUIRY
    INQUIRY_CREATED:'Inquiry created successfully',
    INQUIRY_FOUND:'Iquiry found',
  
    //SCORE
    SCORE_CREATED: 'Score added successfully',
    SCORE_UPDATED: 'Score updated successfully',
    SCORE_DELETED: 'Score deleted successfully',
    SCORE_FOUND: 'Score found',
  
    //FEEDBACK
    FEEDBACK_CREATED:'Feedback created successfully',
  
    //HELP
    HELP_CREATED:'Help issue created successfully',

    //ANALYSIS
    ANALYSIS_FOUND:'Analysis found.',

    //GUN
    GUN_CREATED: 'Gun added successfully',
    GUN_UPDATED: 'Gun updated successfully',
    GUN_DELETED: 'Gun deleted successfully',
    GUN_FOUND: 'Gun found',

    //REQUEST
    GUN_REQUEST_CREATED: 'Gun request added successfully',
    GUN_REQUEST_UPDATED: 'Gun request updated successfully',
    GUN_REQUEST_DELETED: 'Gun request deleted successfully',
    GUN_REQUEST_FOUND: 'Gun request found',
  
  };
  
  const error_message = {
    //Auth
    EMAIL_INVALID: 'Email address is invalid. Please enter a valid email.',
    EMAIL_ALREADY_REGISTERED: 'Email already exists. Please enter another email.',
    EMAIL_ALREADY_VERIFIED: 'Email already verified.',
    INVALID_EMAIL: "Oops! Look like that account doesn't exist, please enter a valid email. ",
    INCORRECT_PASSWORD: 'Incorrect email or password',
    SET_PASSWORD: 'Set a password for login.',
    INCORRECT_PIN: 'Incorrect email or pin',
    ACCOUNT_DEACTIVATED: 'Your account has been deactivated by the admin. Please contact support for assistance.',
    TOKEN_NOT_FOUND: 'Token not found',
    SESSION_EXPIRED: 'Your session has been logged out. Please sign in to continue.',
    PASSWORD_RESET_FAILED: 'Password reset attempt failed.',
    EMAIL_VERIFICATION_FAILED: 'Email verification failed',
    CHANGE_PASSWORD: 'Current password does not match. ',
    USER_NOT_FOUND: 'Oops! Look like that there is no user.',
    MOBILE_NUMBER_NOT_FOUND:'This number does not exist, Please Sign Up now.',
    FORGET_PASSWORD: 'Oops! The email you entered does not exist in our system',
    UPDATE_PROFILE: 'Oops! Look like that there is no user.',
    PASSWORD_NOT_MATCHED: "The password entered doesn't match",
    PASSWORD_MATCHED: 'The password entered matches the old password',
    UNAUTHORIZED: 'Please authenticate',
    UNAUTHORIZED_USER: 'unauthorised user',
    NOT_FOUND: 'No record found',
    MOBILE_ALREADY_REGISTERED: 'Mobile number already exists. Please enter another number.',
    INCORRECT_OTP: "the OTP you entered doesn't match . PLease try again",
    // AlREADY_LOGGED_IN :'You already logged in other device',
    DOMAIN_ALREADY_REGISTERED: 'Domain already exists. Please use another one.',
    PAYMENT_GATEWAY_ERROR: 'Something went wrong please try again. ',
    SOCIAL_TOKEN_REGISTERED: 'User already exists. Please use another social account or try loging in.',
  
    OTP_MISMATCHED: 'OTP does not match. Please try again',
    // NOTIFICATION
    NOTIFICATION_NOT_FOUND: 'Notification not found',
  
    //EVENT
    //EVENT
    EVENT_NOT_FOUND: 'No event found',

    //CATEGORY
    CATEGORY_NOT_FOUND: 'No category found',
  
    //GUN_DETAIL
    GUN_DETAIL_NOT_FOUND: 'No gun detail found',
  
    //SPONSOR
    SPONSOR_NOT_FOUND: 'No sponsor found',
    
    //PATCH
    PATCH_NOT_FOUND: 'No patch found',
  
    //ADMIN_NOTIFICATION
    ADMIN_NOTIFICATION_NOT_FOUND: 'No notification found',

    ALREADY_REQUESTED: "Already requested for account delete. ",
  };
  
  module.exports = {
    sucessfull_message,
    error_message,
  };
