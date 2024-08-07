/**
 * IMPORTANT:
 *
 * Validation regex only.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

// used in open accountant. replace old regex and use this if possible
export const EMAIL_REGEX_OA = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export const OA_CLIENT_NAME_REGEX = /^[a-zA-Z '.&-]+$/;

export const COMMA_SEPARATED_EMAIL_REGEX =
  /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.,]+$/;

export const PHONE_REGEX = /^[123456789][0-9]{9}$/;

export const EMAIL_OR_PHONE_REGEX =
  /^[123456789][0-9]{9}$|^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export const EMAIL_OR_PHONE_REGEX_OA =
  /^[123456789][0-9]{9}$|^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export const OA_ADDRESS_REGEX = /^[a-zA-Z0-9\s\-,./()'"#]+$/;

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
export const STRONG_PASSWORD_AXIS_REGEX =
  /^(?!.*[ ,;\\()<>:\]\\[."])(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_+={}|'?/-])(?=.{8,30})/;

export const OTP_REGEX = /^[0-9]{6}$/;
export const ALPHANUMERIC_SPACE_REGEX = /^[a-zA-Z0-9 ]+$/;
export const ACCOUNT_NUMBER_REGEX = /(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{6,25})$/;
export const ENACH_ACCOUNT_NUMBER_REGEX =
  /(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{9,30})$/;
export const IFSC_REGEX = /^[A-Za-z]{4}0[A-Z0-9a-z]{6}$/;
export const YES_BANK_ACCOUNT_NUMBER_REGEX = /^[0-9]{15}$/;

export const BUSINESS_PAN_REGEX =
  "^([a-zA-Z]){3}([CcHhFfAaTtBbLlJjGg]){1}([a-zA-Z]){1}([0-9]){4}([a-zA-Z]){1}$";

export const PERSONAL_PAN_REGEX =
  "^([a-zA-Z]){3}([Pp]){1}([a-zA-Z]){1}([0-9]){4}([a-zA-Z]){1}$";

export const AADHAAR_REGEX = "^[0-9]{12}$";

export const CONTACT_NAME_REGEX =
  /^[a-zA-Z0-9-@#$'.&]+(\s{0,1}[a-zA-Z0-9-@#$'.&])*$/;

export const NAME_REGEX = /^[a-zA-Z '.]+$/;

export const OA_FIRM_NAME_REGEX = /^[a-zA-Z '.&]+$/;

export const OA_AlphanumericWithPunctuation = /^[a-zA-Z '.&#]+$/;

export const NO_SPACE_AT_START_END = /^[^\s][a-zA-Z\s]+[^\s]$/;
export const NAME_REGEX_NO_SPACE_AT_START_END =
  /^(?:[^\s][a-zA-Z\s']+[^\s]|[^\s])$/;

export const NAME_REGEX_NO_SPECIAL_CHARACTERS = /^[a-zA-Z ']+$/;
export const ALLOWED_EVERYTHING_NO_SPACE_START = /^(?!\s)[\s\S]*$/;
export const KYC_NAME_REGEX_NO_SPECIAL_CHARACTERS = /^[a-zA-Z ]+$/;

export const NAME_REGEX_NO_SPECIAL_CHARACTERS_NO_SPACE = /^(?! +$)[a-zA-Z ']+$/;

export const NAME_WITH_NUMBER_REGEX_NO_SPECIAL_CHARACTERS_NO_SPACE =
  /^(?! +$)[a-zA-Z '0-9]+$/;

export const PAN_REGEX =
  /^([a-zA-Z]){3}([CcPpHhFfAaTtBbLlJjGg]){1}([a-zA-Z]){1}([0-9]){4}([a-zA-Z]){1}$/;

export const CIN_REGEX =
  /^([a-zA-Z]){1}([0-9]){5}([a-zA-Z]){2}([0-9]){4}([a-zA-Z]){3}([0-9]){6}?/;

export const CIN_LLPIN_REGEX =
  "^(([a-zA-Z]){1}([0-9]){5}([a-zA-Z]){2}([0-9]){4}([a-zA-Z]){3}([0-9]){6})|(([a-zA-Z]){3}-([0-9]){4}?)?";

export const GSTIN_REGEX =
  /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[A-Za-z]{1}[0-9A-Za-z]{1}$/;

export const BANK_ACCOUNT_NUMBER_REGEX = /(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{6,25})$/;
export const COMMON_ACCOUNT_NUMBER_REGEX = /^([a-zA-Z0-9]{6,25})$/;
export const UPI_REGEX = /^[\w.-]+@[\w]+$/;

export const VAT_TIN_REGEX =
  /^(?=.*\d)(?=.*[a-zA-Z])(?!.*[\W_\x7B-\xFF]).{8,15}$/;

export const SERVICE_TAX_REGEX =
  /^(?=.*\d)(?=.*[a-zA-Z])(?!.*[\W_\x7B-\xFF]).{8,15}$/;

export const COMPANY_TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export const ALPHANUMERIC_SPACE_ENTER_REGEX = /^[a-zA-Z0-9 \s]+$/;

export const URL_UNSECURED_REGEX =
  "(https?://)([\\da-z.-]+)(:[\\d]+)?.([a-z.:]{2,6})[/\\w .-]*/?";

export const URL_SECURED_REGEX =
  "(https?://)([\\da-z.-]+)(:[\\d]+)?.([a-z.:]{2,6})[/\\w .-]*/?";

export const AMOUNT_REGEX = /[0-9]+(\.[0-9][0-9]?)?/;
export const PIN_CODE_REGX = /^[1-9][0-9]{5}$/;
export const CARD_EXP_DATE_REGEX = /^(0[1-9]|1[0-2])[/]\/?([0-9]{2}|[0-9]{2})$/;
export const DEBIT_CARD_PIN_REGX = /^[0-9]{4}$/;
export const NUMBER_ONLY_REGEX = /^[0-9]*$/;

export const BIZXPRESS_USER_ID = /^[A-Za-z0-9._]*$/;
export const WEBSITE_REGEX =
  /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9-_]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
export const WEBSITE_URL_REGEX_GMB =
  /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/;
export const BUSINESS_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.\-&.'()\s]*$/;

export const COMPANY_WEBSITE =
  /^(?!-)(?:[a-zA-Z\d-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/;
export const FILE_FOLDER_NAME_REGEX = /^[A-Za-z0-9-_ ]*$/;

export const INTEGER_ONLY = /^[1-9][0-9]*$/;

export const O_CASH_NAMES =
  /^(?!.*[!@#$%^&*(),.?":{}|<>]{2})[a-zA-Z0-9!@#$%^&*(),.?":{}|<> -]+$/;
export const AMOUNT_WITHOUT_NEGATIVE_REGEX = /^\d+(\.\d+)?$/;
