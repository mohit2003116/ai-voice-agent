"""
FinGuard AI - Financial Services Government Schemes Dataset & Eligibility Engine
Domain Data Track: Scheme Eligibility & Document Checklist
Dataset Version: August 2026 (FY 2026-27 Official Circulars)
"""

from typing import Any, Dict, Optional

# Data timestamp representing when the scheme rules and checklists were last updated/verified
DATA_AS_OF_DATE = "10 August 2026"
DATA_SOURCE_NAME = "Government of India Financial Schemes Official Circulars FY 2026-27 (Updated August 2026)"

GOVERNMENT_SCHEMES: Dict[str, Dict[str, Any]] = {
    "pm_kisan": {
        "scheme_code": "pm_kisan",
        "scheme_name_hi": "प्रधानमंत्री किसान सम्मान निधि (PM-Kisan)",
        "scheme_name_en": "Pradhan Mantri Kisan Samman Nidhi",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "min_age": 18,
        "max_age": None,
        "max_land_hectares": 2.0,
        "requires_farmer": True,
        "requires_no_bank_account": False,
        "max_annual_income_inr": None,  # Excludes institutional land holders & high income tax payers
        "annual_benefit_inr": 6000,
        "benefit_summary_hi": "₹6,000 प्रति वर्ष (₹2,000 की 3 किश्तों में डायरेक्ट बैंक ट्रांसफर)",
        "document_checklist_hi": [
            "1. आधार कार्ड (Aadhaar Card)",
            "2. भूमि स्वामित्व दस्तावेज़ / खसरा-खतौनी (Land Ownership Record / Khasra-Khatauni)",
            "3. बचत बैंक खाता पासबुक (Savings Bank Passbook with IFSC)",
            "4. आधार से लिंक्ड एक्टिव मोबाइल नंबर (Aadhaar-linked Mobile Number)",
            "5. e-KYC सत्यापन (Aadhaar-based e-KYC Verification)",
        ],
        "application_process_hi": [
            "1. आधिकारिक पोर्टल pmkisan.gov.in पर जाएं या नजदीकी जन सेवा केंद्र (CSC) पर जाएं।",
            "2. 'Farmers Corner' में जाकर 'New Farmer Registration' चुनें।",
            "3. आधार नंबर और मोबाइल नंबर दर्ज कर OTP सत्यापित करें।",
            "4. राज्य, जिला और भूमि विवरण (खसरा-खतौनी) दर्ज करें।",
            "5. फॉर्म सबमिट करें और रसीद अपने पास सुरक्षित रखें।",
        ],
        "application_touchpoint_hi": "निकटतम जन सेवा केंद्र (CSC), कृषि विभाग कार्यालय या pmkisan.gov.in",
    },
    "jan_dhan": {
        "scheme_code": "jan_dhan",
        "scheme_name_hi": "प्रधानमंत्री जन धन योजना (PMJDY)",
        "scheme_name_en": "Pradhan Mantri Jan Dhan Yojana",
        "ministry": "Ministry of Finance - Department of Financial Services",
        "min_age": 10,
        "max_age": None,
        "max_land_hectares": None,
        "requires_farmer": False,
        "requires_no_bank_account": True,  # Target is unbanked individuals
        "max_annual_income_inr": None,
        "annual_benefit_inr": 10000,  # ₹10,000 overdraft facility + ₹2 Lakh accident insurance
        "benefit_summary_hi": "जीरो बैलेंस बचत खाता, ₹2 लाख मुफ्त दुर्घटना बीमा, ₹10,000 ओवरड्राफ्ट सुविधा और रुपे डेबिट कार्ड",
        "document_checklist_hi": [
            "1. आधार कार्ड या वोटर आई़डी या मनरेगा जॉब कार्ड (Aadhaar Card / Voter ID / NREGA Job Card)",
            "2. 2 पासपोर्ट साइज फोटो (2 Passport Size Photographs)",
            "3. एड्रेस प्रूफ (यदि आधार पर पता बदला हुआ है तो यूटिलिटी बिल / राशन कार्ड)",
        ],
        "application_process_hi": [
            "1. किसी भी नजदीकी सरकारी या निजी बैंक शाखा या बैंक मित्र (Bank Mitra) केंद्र पर जाएं।",
            "2. PMJDY खाता खोलने का फॉर्म (वित्तीय समावेशन खाता फॉर्म) प्राप्त करें।",
            "3. अपना नाम, पता और नॉमिनी विवरण भरें।",
            "4. आधार कार्ड की फोटोकॉपी और 2 पासपोर्ट फोटो संलग्न करें।",
            "5. फॉर्म जमा करें — तुरंत जीरो बैलेंस पासबुक और RuPay कार्ड जारी किया जाएगा।",
        ],
        "application_touchpoint_hi": "किसी भी राष्ट्रीयकृत / ग्रामीण बैंक की शाखा या बैंक मित्र केंद्र",
    },
    "pm_mudra": {
        "scheme_code": "pm_mudra",
        "scheme_name_hi": "प्रधानमंत्री मुद्रा योजना (PMMY)",
        "scheme_name_en": "Pradhan Mantri Mudra Yojana",
        "ministry": "Ministry of Finance",
        "min_age": 18,
        "max_age": 65,
        "max_land_hectares": None,
        "requires_farmer": False,
        "requires_no_bank_account": False,
        "max_annual_income_inr": None,
        "annual_benefit_inr": 2000000,  # Up to ₹20 Lakh business loan
        "benefit_summary_hi": "गैर-कॉर्पोरेट, गैर-कृषि लघु/सूक्ष्म उद्योगों के लिए ₹50,000 से ₹20 लाख तक का बिना गारंटी लोन",
        "document_checklist_hi": [
            "1. भरा हुआ मुद्रा लोन आवेदन पत्र (Completed Mudra Application Form)",
            "2. पहचान पत्र - आधार कार्ड / पैन कार्ड / वोटर आईडी (ID Proof)",
            "3. निवास प्रमाण पत्र (Proof of Residence)",
            "4. व्यापार स्थापना का प्रमाण / बिजनेस प्लान (Business Plan / Registration Certificate)",
            "5. पिछले 6 महीने का बैंक खाता स्टेटमेंट (Last 6 Months Bank Statement)",
            "6. 2 पासपोर्ट साइज फोटो (2 Passport Photos)",
        ],
        "application_process_hi": [
            "1. 'उद्यमी मित्र' पोर्टल (udyamimitra.in) पर जाएं या नजदीकी कमर्शियल/ग्रामीण बैंक शाखा में जाएं।",
            "2. अपने व्यवसाय की श्रेणी (शिशु: ₹50,000 तक, किशोर: ₹5 लाख तक, तरुण: ₹20 लाख तक) चुनें।",
            "3. लोन आवेदन पत्र भरें और बिजनेस प्लान संलग्न करें।",
            "4. बैंक अधिकारी द्वारा सत्यापन के बाद लोन स्वीकृत किया जाता है।",
        ],
        "application_touchpoint_hi": "कमर्शियल बैंक, ग्रामीण बैंक, NBFCs या udyamimitra.in",
    },
    "pm_sby": {
        "scheme_code": "pm_sby",
        "scheme_name_hi": "प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)",
        "scheme_name_en": "Pradhan Mantri Suraksha Bima Yojana",
        "ministry": "Ministry of Finance",
        "min_age": 18,
        "max_age": 70,
        "max_land_hectares": None,
        "requires_farmer": False,
        "requires_no_bank_account": False,
        "requires_bank_account": True,
        "max_annual_income_inr": None,
        "annual_benefit_inr": 200000,
        "benefit_summary_hi": "मात्र ₹20 प्रति वर्ष के प्रीमियम पर ₹2 लाख का आकस्मिक मृत्यु एवं पूर्ण विकलांगता बीमा",
        "document_checklist_hi": [
            "1. आधार कार्ड (Aadhaar Card)",
            "2. एक्टिव बचत बैंक खाता (Active Savings Bank Account)",
            "3. ऑटो-डेबिट सहमति फॉर्म (Auto-Debit Consent Form)",
            "4. नॉमिनी (वारिस) का विवरण और पहचान पत्र",
        ],
        "application_process_hi": [
            "1. अपनी बैंक शाखा में जाएं या अपने बैंक के इंटरनेट/मोबाइल बैंकिंग ऐप में लॉगिन करें।",
            "2. 'Social Security Schemes' या PMSBY एनरोलमेंट फॉर्म भरें।",
            "3. ₹20 वार्षिक प्रीमियम के लिए ऑटो-डेबिट सहमति प्रदान करें।",
            "4. पॉलिसी रसीद और एनरोलमेंट नंबर प्राप्त करें।",
        ],
        "application_touchpoint_hi": "आपकी मौजूदा बैंक शाखा, डाकघर या नेट बैंकिंग",
    },
    "atal_pension": {
        "scheme_code": "atal_pension",
        "scheme_name_hi": "अटल पेंशन योजना (APY)",
        "scheme_name_en": "Atal Pension Yojana",
        "ministry": "PFRDA / Ministry of Finance",
        "min_age": 18,
        "max_age": 40,
        "max_land_hectares": None,
        "requires_farmer": False,
        "requires_no_bank_account": False,
        "requires_bank_account": True,
        "max_annual_income_inr": None,
        "annual_benefit_inr": 60000,  # Guaranteed monthly pension
        "benefit_summary_hi": "60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 प्रति माह गारंटीकृत मासिक पेंशन",
        "document_checklist_hi": [
            "1. आधार कार्ड (Aadhaar Card)",
            "2. बचत बैंक खाता / पोस्ट ऑफिस बैंक खाता",
            "3. आधार से जुड़ा एक्टिव मोबाइल नंबर",
            "4. नॉमिनी (पति/पत्नी) का विवरण",
        ],
        "application_process_hi": [
            "1. जिस बैंक या डाकघर में आपका बचत खाता है, वहां जाएं या नेट बैंकिंग से अप्लाई करें।",
            "2. APY रजिस्ट्रेशन फॉर्म भरें और पसंदीदा मासिक पेंशन राशि (₹1,000 से ₹5,000) चुनें।",
            "3. मासिक प्रीमियम ऑटो-डेबिट के लिए सहमति दें।",
            "4. PRAN (Permanent Retirement Account Number) कार्ड प्राप्त करें।",
        ],
        "application_touchpoint_hi": "बैंक शाखा, पोस्ट ऑफिस या npscra.nsdl.co.in",
    },
}

ALIAS_MAP = {
    "pm kisan": "pm_kisan",
    "pm-kisan": "pm_kisan",
    "kisan": "pm_kisan",
    "farmer": "pm_kisan",
    "kisan sammann nidhi": "pm_kisan",
    "jan dhan": "jan_dhan",
    "jandhan": "jan_dhan",
    "pmjdy": "jan_dhan",
    "zero balance": "jan_dhan",
    "bank account": "jan_dhan",
    "mudra": "pm_mudra",
    "pm mudra": "pm_mudra",
    "mudra loan": "pm_mudra",
    "business loan": "pm_mudra",
    "pm sby": "pm_sby",
    "pmsby": "pm_sby",
    "suraksha bima": "pm_sby",
    "insurance": "pm_sby",
    "atal pension": "atal_pension",
    "apy": "atal_pension",
    "pension": "atal_pension",
}


def resolve_scheme_code(name_input: str) -> Optional[str]:
    if not name_input:
        return None
    cleaned = name_input.strip().lower()
    if cleaned in GOVERNMENT_SCHEMES:
        return cleaned
    for alias, code in ALIAS_MAP.items():
        if alias in cleaned or cleaned in alias:
            return code
    return None


def evaluate_scheme_eligibility(
    scheme_name: str,
    caller_age: Optional[int] = None,
    land_holding_hectares: Optional[float] = None,
    annual_income_inr: Optional[float] = None,
    is_farmer: Optional[bool] = None,
    has_bank_account: Optional[bool] = None,
    simulate_api_failure: bool = False,
) -> Dict[str, Any]:
    """Computes real government scheme eligibility and returns document checklist + metadata.

    Handles network timeout failure path explicitly.
    Includes data_as_of timestamp.
    """
    if simulate_api_failure:
        return {
            "status": "failure",
            "error_type": "TIMEOUT",
            "data_as_of": DATA_AS_OF_DATE,
            "data_source": DATA_SOURCE_NAME,
            "spoken_response_hi": (
                f"क्षमा करें, {DATA_AS_OF_DATE} की तारीख पर सरकारी सर्वर या डेटाबेस से संपर्क नहीं हो पा रहा है (Connection Timeout). "
                "कृपया कुछ देर बाद पुनः प्रयास करें या अपने निकटतम जन सेवा केंद्र (CSC) से संपर्क करें।"
            ),
            "suggested_retry": True,
        }

    scheme_code = resolve_scheme_code(scheme_name)
    if not scheme_code or scheme_code not in GOVERNMENT_SCHEMES:
        available_schemes = [s["scheme_name_hi"] for s in GOVERNMENT_SCHEMES.values()]
        return {
            "status": "not_found",
            "data_as_of": DATA_AS_OF_DATE,
            "data_source": DATA_SOURCE_NAME,
            "requested_scheme": scheme_name,
            "spoken_response_hi": (
                f"मुझे '{scheme_name}' नाम की योजना नहीं मिली। "
                f"({DATA_AS_OF_DATE} के रिकॉर्ड के अनुसार) मुख्य उपलब्ध योजनाएं हैं: "
                + ", ".join(available_schemes)
                + "।"
            ),
            "available_schemes": available_schemes,
        }

    scheme = GOVERNMENT_SCHEMES[scheme_code]
    matching_criteria = []
    missing_criteria = []
    unmet_reasons = []

    # Age check
    if caller_age is not None:
        min_a = scheme["min_age"]
        max_a = scheme["max_age"]
        if min_a and caller_age < min_a:
            unmet_reasons.append(
                f"न्यूनतम आयु {min_a} वर्ष होनी चाहिए (आपकी आयु: {caller_age} वर्ष)।"
            )
            missing_criteria.append("age")
        elif max_a and caller_age > max_a:
            unmet_reasons.append(
                f"अधिकतम आयु {max_a} वर्ष होनी चाहिए (आपकी आयु: {caller_age} वर्ष)।"
            )
            missing_criteria.append("age")
        else:
            matching_criteria.append(f"आयु मानदंड पूरा हुआ ({caller_age} वर्ष)")

    # Land holding check
    if land_holding_hectares is not None and scheme["max_land_hectares"] is not None:
        if land_holding_hectares > scheme["max_land_hectares"]:
            unmet_reasons.append(
                f"कृषि भूमि {scheme['max_land_hectares']} हेक्टेयर से कम होनी चाहिए (आपकी भूमि: {land_holding_hectares} हेक्टेयर)।"
            )
            missing_criteria.append("land_holding")
        else:
            matching_criteria.append(
                f"भूमि मानदंड पूरा हुआ ({land_holding_hectares} हेक्टेयर)"
            )

    # Farmer requirement check
    if is_farmer is not None and scheme["requires_farmer"]:
        if not is_farmer:
            unmet_reasons.append("यह योजना केवल छोटे एवं सीमांत किसानों के लिए है।")
            missing_criteria.append("is_farmer")
        else:
            matching_criteria.append("किसान होने का मानदंड पूरा हुआ")

    # Unbanked status check for Jan Dhan
    if has_bank_account is not None and scheme.get("requires_no_bank_account"):
        if has_bank_account:
            unmet_reasons.append(
                "जन धन खाता केवल उन लोगों के लिए है जिनका पहले से कोई बचत खाता नहीं है।"
            )
            missing_criteria.append("unbanked_status")
        else:
            matching_criteria.append("बिना बैंक खाते वाला मानदंड पूरा हुआ")

    is_eligible = len(unmet_reasons) == 0

    return {
        "status": "success",
        "data_as_of": DATA_AS_OF_DATE,
        "data_source": DATA_SOURCE_NAME,
        "scheme_code": scheme_code,
        "scheme_name_hi": scheme["scheme_name_hi"],
        "scheme_name_en": scheme["scheme_name_en"],
        "ministry": scheme["ministry"],
        "eligible": is_eligible,
        "matching_criteria": matching_criteria,
        "missing_criteria": missing_criteria,
        "unmet_reasons_hi": unmet_reasons,
        "benefits_summary_hi": scheme["benefit_summary_hi"],
        "document_checklist_hi": scheme["document_checklist_hi"],
        "spoken_summary_hi": (
            f"({DATA_AS_OF_DATE} की ताज़ा सरकारी गाइडलाइंस के अनुसार) "
            + (
                f"आप {scheme['scheme_name_hi']} के लिए पात्र (Eligible) हैं! "
                if is_eligible
                else f"आप अभी {scheme['scheme_name_hi']} की सभी शर्तों को पूरा नहीं करते हैं। "
            )
            + (
                f"मुख्य लाभ: {scheme['benefit_summary_hi']}। "
                if is_eligible
                else f"कारण: {' '.join(unmet_reasons)} "
            )
            + "आवश्यक दस्तावेज़ (Document Checklist): "
            + ", ".join(scheme["document_checklist_hi"])
        ),
    }


def get_scheme_application_guide(scheme_name: str) -> Dict[str, Any]:
    """Retrieve the official application process, steps, touchpoints, and document checklist for a government scheme.

    Handles scheme resolution and returns structured guide with data freshness timestamp.
    """
    scheme_code = resolve_scheme_code(scheme_name)
    if not scheme_code or scheme_code not in GOVERNMENT_SCHEMES:
        available_schemes = [s["scheme_name_hi"] for s in GOVERNMENT_SCHEMES.values()]
        return {
            "status": "not_found",
            "data_as_of": DATA_AS_OF_DATE,
            "data_source": DATA_SOURCE_NAME,
            "requested_scheme": scheme_name,
            "spoken_response_hi": (
                f"मुझे '{scheme_name}' नाम की योजना का आवेदन विवरण नहीं मिला। "
                f"({DATA_AS_OF_DATE} के रिकॉर्ड के अनुसार) मुख्य उपलब्ध योजनाएं हैं: "
                + ", ".join(available_schemes)
                + "।"
            ),
            "available_schemes": available_schemes,
        }

    scheme = GOVERNMENT_SCHEMES[scheme_code]
    return {
        "status": "success",
        "data_as_of": DATA_AS_OF_DATE,
        "data_source": DATA_SOURCE_NAME,
        "scheme_code": scheme_code,
        "scheme_name_hi": scheme["scheme_name_hi"],
        "scheme_name_en": scheme["scheme_name_en"],
        "ministry": scheme["ministry"],
        "application_touchpoint_hi": scheme.get("application_touchpoint_hi", "निकटतम बैंक या जन सेवा केंद्र (CSC)"),
        "application_steps_hi": scheme.get("application_process_hi", []),
        "document_checklist_hi": scheme["document_checklist_hi"],
        "benefit_summary_hi": scheme["benefit_summary_hi"],
        "spoken_summary_hi": (
            f"({DATA_AS_OF_DATE} के सरकारी रिकॉर्ड अनुसार) {scheme['scheme_name_hi']} के लिए आवेदन करने का तरीका: "
            f"आवेदन केंद्र: {scheme.get('application_touchpoint_hi', 'CSC या बैंक शाखा')}। "
            f"मुख्य चरण: {' '.join(scheme.get('application_process_hi', []))} "
            f"आवश्यक दस्तावेज़: {', '.join(scheme['document_checklist_hi'])}"
        ),
    }
